<template>
  <section class="chart-section">
    <div
      class="chart-section-units"
      :class="{ expanded: unitsExpanded }"
      v-if="activeLegendUnits.length"
      @click="toggleUnits"
    >
      <div class="chart-unit-toggler">
        <font-awesome-icon
          :icon="unitsExpanded ? 'fa-solid fa-caret-left' : 'fa-solid fa-caret-right'"
        />
      </div>

      <div
        class="chart-unit"
        v-for="(unitGroup, index) in activeLegendUnits"
        :key="`unit-${unitGroup.unit}-${index}`"
      >
        <div class="chart-unit-zones" v-if="unitGroup.zones.length">
          <div class="chart-unit-symbol" v-if="unitGroup.unit">
            <span class="expanded-text" v-if="unitGroup.title">{{ unitGroup.title }} (</span>
            {{ unitGroup.unit }}
            <span class="expanded-text" v-if="unitGroup.title">)</span>
          </div>
          <div
            class="chart-unit-zone"
            v-for="(zone, zIndex) in [...unitGroup.zones].reverse()"
            :key="`zone-${index}-${zIndex}`"
            :style="{ backgroundColor: zone.color }"
          >
            <div class="expanded-text">
              <span class="chart-unit-zone-label">{{ zone.label }}: </span>
              <span class="chart-unit-zone-range" v-if="zone.range">{{ zone.range }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="chart-section-chart">
      <div class="chart-wrapper">
        <Chart ref="chartRef" constructor-type="stockChart" :options="chartOptions" />
      </div>
      <p v-for="(hint, hintIndex) in scaleHints" :key="hintIndex" class="chart-scale-hint">
        {{ hint }}
      </p>

      <div class="custom-legend">
        <span
          v-for="item in visibleLegend"
          :key="item.key"
          :class="['legend-item', { active: item.key === activeLegendKey }]"
          @click="onLegendClick(item.key)"
        >
          {{ $t(item.labelKey) }}
        </span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch, computed, nextTick, onMounted, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import Highcharts from "highcharts";
import stockInit from "highcharts/modules/stock";
import { Chart } from "highcharts-vue";
import unitsettings from "../../../measurements";
import { MEASUREMENT_GROUPS, MEASUREMENT_GROUP_LOOKUP } from "../../../measurements/groups";
import { settings } from "@config";
import { useMap } from "@/composables/useMap";
import { getPeriodBounds } from "@/utils/date";
import { applyReadableScale, formatScaleValue } from "@/utils/chart/readableScale";
import { canonicalMeasurementId, measurementValue } from "@/measurements/aliases";

stockInit(Highcharts);

Highcharts.setOptions({
  accessibility: { enabled: false },
});

const props = defineProps({
  log: { type: Array, default: () => [] },
  logRevision: { type: [String, Number], default: "" },
  geoAddresses: { type: Object, default: () => ({}) },
  showGeoInTooltip: { type: Boolean, default: false },
  addressForTimestamp: { type: Function, default: null },
});

const emit = defineEmits(["activeLegendChange"]);
const safeLog = computed(() => (Array.isArray(props.log) ? props.log : []));

const route = useRoute();
const router = useRouter();
const { t: tr, locale } = useI18n();
const mapState = useMap();

const chartRef = ref(null);

const GROUPS = MEASUREMENT_GROUPS;

// Словарь для быстрого поиска группы по параметру
const GROUPS_LOOKUP = MEASUREMENT_GROUP_LOOKUP;

// Кэшируем результаты сборки единиц измерения для легенды, чтобы не выполнять
// тяжелую группировку при каждом реактивном обновлении
const legendUnitsCache = new Map();
const legendUnitsCacheOrder = [];
const LEGEND_CACHE_LIMIT = 32;
const clearLegendCache = () => {
  legendUnitsCache.clear();
  legendUnitsCacheOrder.length = 0;
};

const UNITS_FOUND = ref(new Set());

function isMapUnitAvailableInData(unit, ids) {
  const cur = String(unit || "").toLowerCase();
  if (!cur || !ids?.size) return false;
  if (ids.has(cur)) return true;
  const groupKey = GROUPS_LOOKUP[cur];
  if (groupKey) return GROUPS[groupKey].members.some((m) => ids.has(m));
  return false;
}

watch(() => locale.value, clearLegendCache);
watch(() => Array.from(UNITS_FOUND.value).sort().join("|"), clearLegendCache);

// Временное окно просмотра для realtime режима (1 час)
const REALTIME_VIEW_TIMELINE_MS = 60 * 60 * 1000;

const chartSeries = ref([]);
const yScalesByUnit = ref(new Map());

// Цветовые зоны отформатированные для Highcharts
const HIGHCHARTS_COLOR_ZONES = Object.fromEntries(
  Object.entries(unitsettings).map(([k, v]) => {
    if (!v.zones) return [k.toLowerCase(), []];
    const highchartsZones = v.zones.map((zone) => ({ value: zone.valueMax, color: zone.color }));
    return [k.toLowerCase(), highchartsZones];
  })
);

// Строит список видимых элементов легенды на основе найденных в данных единиц измерения
// Теперь показываем ВСЕ категории, независимо от здоровья
const visibleLegend = computed(() => {
  const legend = [];

  // Добавляем группы, если есть хотя бы один член
  Object.entries(GROUPS).forEach(([key, { members, labelKey }]) => {
    if (members.some((m) => UNITS_FOUND.value.has(m))) {
      legend.push({ key, labelKey, single: false });
    }
  });

  // Добавляем одиночные параметры (не в группах, не aqi)
  const groupedIds = new Set(Object.values(GROUPS).flatMap((g) => g.members));
  UNITS_FOUND.value.forEach((id) => {
    if (!groupedIds.has(id) && id !== "aqi") {
      const settings = unitsettings[id];
      const labelKey =
        settings?.namelong?.[locale.value] ||
        settings?.nameshort?.[locale.value] ||
        id.toUpperCase();
      legend.push({ key: id, labelKey, single: true });
    }
  });

  return legend;
});

// Определяет активный ключ легенды на основе текущего типа единицы измерения
const activeLegendKey = computed(() => {
  const cur = String(mapState.currentUnit.value || "").toLowerCase();
  const currentGroup = GROUPS_LOOKUP[cur];
  if (currentGroup && visibleLegend.value.some((x) => x.key === currentGroup)) return currentGroup;

  if (!currentGroup && UNITS_FOUND.value.has(cur) && visibleLegend.value.some((x) => x.key === cur)) {
    return cur;
  }

  return visibleLegend.value[0]?.key || null;
});

watch(
  activeLegendKey,
  (key) => {
    emit("activeLegendChange", key);
  },
  { immediate: true }
);

const isRealtime = computed(() => mapState.timelineMode.value === "realtime");

// Получаем экземпляр Highcharts для работы с графиком
const chart = computed(() => chartRef.value?.chart);

const unitsExpanded = ref(false);

const toggleUnits = () => {
  unitsExpanded.value = !unitsExpanded.value;
};

// Флаг для предотвращения конкурирующих обновлений графика
const isUpdatingChart = ref(false);

// Вычисляем уникальные единицы измерения для осей Y
const uniqueUnits = computed(() => [...new Set(chartSeries.value.map((s) => s.unit))]);

// Создаем маппинг единиц измерения на индексы осей
const unitToAxisMapping = computed(() =>
  Object.fromEntries(uniqueUnits.value.map((unit, index) => [unit, index]))
);

// Подготавливаем серии с назначенными осями Y
const preparedSeries = computed(() =>
  chartSeries.value.map((series) => ({
    ...series,
    yAxis: unitToAxisMapping.value[series.unit] ?? 0,
  }))
);

const cssColor = (color) => {
  if (!color || typeof document === "undefined") return color;
  const match = String(color).match(/^var\((--[\w-]+)\)$/);
  if (!match) return color;
  const resolved = getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim();
  return resolved || color;
}

const spikeOutlineSeries = (item, scale) => {
  if (!scale || !item.custom?.readableScale || !item.data?.length) return null;
  const above = item.data.map((point) => {
    const real = Array.isArray(point) ? null : point?.custom?.realY;
    return typeof real === "number" && real > scale.knee;
  });
  if (!above.some(Boolean)) return null;

  return {
    id: `${item.id}__outline`,
    type: item.type || "spline",
    name: "",
    unit: item.unit,
    yAxis: item.yAxis,
    color: "#ffffff",
    lineWidth: 4.5,
    zIndex: 1,
    enableMouseTracking: false,
    showInLegend: false,
    showInNavigator: false,
    marker: { enabled: false },
    dataLabels: { enabled: false },
    dataGrouping: { enabled: false },
    states: { inactive: { opacity: 1 }, hover: { enabled: false } },
    data: item.data.map((point, index) => {
      const x = Array.isArray(point) ? point[0] : point.x;
      const y = Array.isArray(point) ? point[1] : point.y;
      const near = above[index] || above[index - 1] || above[index + 1];
      if (!near || y == null) return [x, null];
      return [x, y];
    }),
  };
}

const parseRgb = (hex) => {
  const match = String(hex || "").match(/^#([\da-f]{6})$/i);
  const n = match ? parseInt(match[1], 16) : 0xfd4c1f;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const peakBandPaint = (hex) => {
  const [r, g, b] = parseRgb(hex);
  const rgba = (alpha) => `rgba(${r}, ${g}, ${b}, ${alpha})`;
  return {
    linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
    stops: [
      [0, rgba(0.32)],
      [0.42, rgba(0.16)],
      [1, rgba(0.03)],
    ],
  };
}

const breakCaption = (scale) => {
  const detailTicks = scale.ticks.filter((tick) => tick <= scale.knee + 1e-6);
  const value = detailTicks.length ? detailTicks[detailTicks.length - 1] : scale.knee;
  return formatScaleValue(value);
}

const axisOptionsFor = (unit, scale) => {
  const labelFormatter = function () {
    if (!scale) {
      const text = this.axis.defaultLabelFormatter.call(this);
      return unit ? `${text} ${unit}` : `${text}`;
    }
    return `${formatScaleValue(scale.fromDisplay(this.value))} ${unit}`.trim();
  };

  if (!scale) {
    return {
      title: false,
      opposite: true,
      visible: true,
      min: null,
      max: null,
      startOnTick: true,
      endOnTick: true,
      tickPositions: null,
      plotLines: [],
      plotBands: [],
      labels: { formatter: labelFormatter },
      custom: { unit, readableScale: false },
    };
  }

  const breakColor = cssColor(scale.peakColor) || cssColor("var(--measure-red)") || "#fd4c1f";
  const breakValue = breakCaption(scale);

  return {
    title: false,
    opposite: true,
    visible: true,
    min: 0,
    max: 1,
    minPadding: 0,
    maxPadding: 0,
    startOnTick: false,
    endOnTick: false,
    alignTicks: false,
    tickPositions: scale.ticks.map((tick) => scale.toDisplay(tick)),
    labels: { formatter: labelFormatter },
    plotLines: [
      {
        id: "readable-scale-break",
        value: scale.detailShare,
        color: breakColor,
        dashStyle: "Dash",
        width: 1.5,
        zIndex: 4,
        label: {
          useHTML: true,
          text: `<span class="chart-scale-break-label">${tr("chart.scaleBreak", {
            value: breakValue,
            unit,
          })}</span>`,
          align: "center",
          x: 0,
          y: 18,
        },
      },
    ],
    plotBands: [
      {
        id: "readable-scale-band",
        from: scale.detailShare,
        to: 1,
        color: peakBandPaint(breakColor),
        zIndex: 0,
        label: {
          useHTML: true,
          text: `<span class="chart-scale-above-label" style="color:${breakColor}">${tr(
            "chart.scaleAbove",
            { value: breakValue, unit }
          )}</span>`,
          align: "left",
          verticalAlign: "top",
          x: 8,
          y: 18,
        },
      },
    ],
    custom: { unit, readableScale: true },
  };
}

const mainYAxes = (chartInstance) =>
  (chartInstance.yAxis || []).filter((axis) => axis.options?.id !== "navigator-y-axis");

const syncYAxes = (chartInstance, units) => {
  if (!chartInstance?.addAxis) return;
  units.forEach((unit, index) => {
    const options = axisOptionsFor(unit, yScalesByUnit.value.get(unit) || null);
    const axis = mainYAxes(chartInstance)[index];
    if (axis) {
      axis.update(options, false);
    } else {
      chartInstance.addAxis(options, false, false);
    }
  });
};

const trimYAxes = (chartInstance, units) => {
  if (!chartInstance?.yAxis) return;
  const keep = Math.max(units.length, 1);
  const removable = chartInstance.yAxis.filter((axis) => axis.options?.id !== "navigator-y-axis");
  for (let index = removable.length - 1; index >= keep; index -= 1) {
    removable[index].remove(false);
  }
};

// Конфигурация осей Y
const yAxisConfig = computed(() =>
  uniqueUnits.value.map((unit) => axisOptionsFor(unit, yScalesByUnit.value.get(unit) || null))
);

const scaleHints = computed(() => {
  const hints = [];
  yScalesByUnit.value.forEach((scale, unit) => {
    hints.push(
      tr("chart.scaleCompressed", {
        value: breakCaption(scale),
        unit,
      })
    );
  });
  return hints;
});

const activeLegendUnits = computed(() => {
  const legendKey = activeLegendKey.value;
  if (!legendKey) return [];

  const unitsSignature = Array.from(UNITS_FOUND.value).sort().join("|");
  const cacheKey = `${legendKey}|${locale.value}|${unitsSignature}`;
  if (legendUnitsCache.has(cacheKey)) {
    return legendUnitsCache.get(cacheKey);
  }

  const collected = new Map();

  if (GROUPS[legendKey]) {
    GROUPS[legendKey].members.forEach((memberId) => {
      if (!UNITS_FOUND.value.has(memberId)) return;
      const settingsEntry = unitsettings[memberId];
      if (!settingsEntry) return;
      const unitSymbol = settingsEntry.unit || "";
      if (!collected.has(unitSymbol)) {
        collected.set(unitSymbol, []);
      }
      const unitZones = (settingsEntry.zones || []).map((zone, index, arr) => {
        const label =
          typeof zone.label === "string"
            ? zone.label
            : zone.label?.[locale.value] ?? zone.label?.en ?? "";
        let range = "";
        if (zone.valueMax !== undefined && zone.valueMax !== null) {
          range = `${tr("scales.upto")} ${zone.valueMax}`;
        } else {
          const prev = arr[index - 1];
          if (prev && prev.valueMax !== undefined && prev.valueMax !== null) {
            range = `${tr("scales.above")} ${prev.valueMax}`;
          } else {
            range = tr("scales.above");
          }
        }
        return {
          color: zone.color || "var(--color-dark)",
          label,
          range,
        };
      });

      const title =
        settingsEntry.nameshort?.[locale.value] ||
        settingsEntry.name?.[locale.value] ||
        settingsEntry.label ||
        memberId.toUpperCase();

      collected.get(unitSymbol).push({
        id: memberId,
        title,
        unit: unitSymbol,
        zones: unitZones,
      });
    });
  } else {
    const settingsEntry = unitsettings[legendKey.toLowerCase()];
    if (!settingsEntry) return [];
    const unitSymbol = settingsEntry.unit || "";
    collected.set(unitSymbol, [
      {
        id: legendKey,
        title:
          settingsEntry.nameshort?.[locale.value] ||
          settingsEntry.name?.[locale.value] ||
          settingsEntry.label ||
          legendKey.toUpperCase(),
        unit: unitSymbol,
        zones: (settingsEntry.zones || []).map((zone, index, arr) => {
          const label =
            typeof zone.label === "string"
              ? zone.label
              : zone.label?.[locale.value] ?? zone.label?.en ?? "";
          let range = "";
          if (zone.valueMax !== undefined && zone.valueMax !== null) {
            range = `${tr("scales.upto")} ${zone.valueMax}`;
          } else {
            const prev = arr[index - 1];
            if (prev && prev.valueMax !== undefined && prev.valueMax !== null) {
              range = `${tr("scales.above")} ${prev.valueMax}`;
            } else {
              range = tr("scales.above");
            }
          }
          return {
            color: zone.color || "var(--color-dark)",
            label,
            range,
          };
        }),
      },
    ]);
  }

  const result = entriesGroupedByUnit(collected);

  legendUnitsCache.set(cacheKey, result);
  legendUnitsCacheOrder.push(cacheKey);
  if (legendUnitsCacheOrder.length > LEGEND_CACHE_LIMIT) {
    const oldestKey = legendUnitsCacheOrder.shift();
    if (oldestKey) {
      legendUnitsCache.delete(oldestKey);
    }
  }

  return result;
});

function entriesGroupedByUnit(collectedMap) {
  const result = [];

  collectedMap.forEach((entries, unitSymbol) => {
    if (!entries.length) return;

    const firstEntry = entries[0];

    const zonesSignature = JSON.stringify(
      firstEntry.zones.map((z) => ({
        color: z.color,
        rangeLabel: z.label,
      }))
    );

    const hasIdenticalZones = entries.every((entry) => {
      const entrySig = JSON.stringify(
        entry.zones.map((z) => ({
          color: z.color,
          rangeLabel: z.label,
        }))
      );
      return entrySig === zonesSignature;
    });

    let zones;

    const zoneGroups = new Map();

    entries.forEach((entry) => {
      entry.zones.forEach((zone) => {
        const key = `${zone.label}__${zone.color}`;
        if (!zoneGroups.has(key)) {
          zoneGroups.set(key, {
            color: zone.color,
            label: zone.label,
            ranges: [],
          });
        }
        const rangeVal = zone.range && zone.range.trim();
        if (rangeVal && rangeVal.length > 0 && !zoneGroups.get(key).ranges.includes(rangeVal)) {
          zoneGroups.get(key).ranges.push(rangeVal);
        }
      });
    });

    zones = Array.from(zoneGroups.values()).map((item) => ({
      color: item.color,
      label: item.label,
      range: item.ranges.join(" / "),
    }));

    const hasMergedRanges = zones.some((z) => z.range.includes(" / "));

    const groupTitle = hasMergedRanges
      ? entries.map((e) => e.title).join(" / ")
      : entries.length === 1
      ? entries[0].title
      : entries.map((e) => e.title).join(" / ");

    result.push({
      unit: unitSymbol,
      title: groupTitle,

      zones,
    });
  });

  return result;
}

// Конфигурация оси X
const xAxisConfig = computed(() => {
  // Определяем формат лейблов в зависимости от режима
  let labelFormat = "{value: %H:%M}";
  if (!isRealtime.value) {
    // Для remote режима используем более подходящий формат для длительных периодов
    labelFormat = "{value: %d.%m %H:%M}";
  }

  return {
    type: "datetime",
    labels: { format: labelFormat },
    ordinal: false, // Убираем ordinal для правильного отображения длительных периодов
  };
});

// Live tooltip context — Highcharts may keep an old formatter; read at hover time.
const tooltipContext = {
  showGeo: false,
  addressFn: null,
};

watchEffect(() => {
  tooltipContext.showGeo = props.showGeoInTooltip;
  tooltipContext.addressFn = props.addressForTimestamp;
});

const tooltipValue = (point) => {
  const source = point.point || point;
  const real = source.custom?.realY ?? source.options?.custom?.realY;
  return real != null && Number.isFinite(real) ? real : point.y;
}

// Скачок часто одна точка. Курсор на линии рядом с ней ближе по X к соседнему
// низкому значению, и тултип показывает его вместо пика.
const readingNearSpike = (point) => {
  const source = point.point || point;
  const direct = tooltipValue(point);
  const series = source.series;
  const x = source.x;
  if (!series?.points || x == null || !Number.isFinite(direct)) {
    return { y: direct, x };
  }

  const windowMs = 10 * 60 * 1000;
  let peak = null;
  for (const candidate of series.points) {
    if (candidate?.x == null || candidate.isNull) continue;
    if (Math.abs(candidate.x - x) > windowMs) continue;
    const real = candidate.custom?.realY;
    if (real == null || !Number.isFinite(real)) continue;
    if (!peak || real > peak.y) peak = { y: real, x: candidate.x };
  }

  if (peak && peak.y > direct * 4 && peak.y - direct > 30) return peak;
  return { y: direct, x };
}

// Конфигурация тултипа
const tooltipConfig = computed(() => ({
  shared: true,
  valueDecimals: 2,
  xDateFormat: "%Y-%m-%d %H:%M:%S",
  formatter() {
    const rows = this.points.map((point) => ({
      point,
      reading: readingNearSpike(point),
    }));
    const header = rows.reduce(
      (best, row) => (row.reading.y > best.y ? row.reading : best),
      { y: -Infinity, x: this.x }
    );
    const xStr = new Date(header.x ?? this.x).toLocaleString();
    const lines = rows.map(
      ({ point, reading }) =>
        `<span style="color:${point.color}">●</span> ${
          point.series.userOptions.fullLabel || point.series.name
        }: <b>${Number(reading.y).toFixed(2)}</b>`
    );
    let html = `<b>${xStr}</b><br/>${lines.join("<br/>")}`;
    if (tooltipContext.showGeo && typeof tooltipContext.addressFn === "function") {
      const addr = tooltipContext.addressFn(this.x);
      if (addr) {
        html += `<br/><span style="opacity:0.85;font-size:0.92em">${addr}</span>`;
      }
    }
    return html;
  },
}));

watch(
  () => [props.showGeoInTooltip, props.geoAddresses],
  () => {
    const hc = chartRef.value?.chart;
    if (hc) {
      hc.update({ tooltip: tooltipConfig.value }, false);
    }
  },
  { deep: true }
);

// Основная конфигурация графика
const chartOptions = computed(() => ({
  chart: {
    type: "spline",
    height: 400,
    spacingTop: yScalesByUnit.value.size ? 26 : 10,
    events: {
      render() {
        hideNavigatorPeakLabels(this);
      },
    },
  },
  rangeSelector: { enabled: false },
  scrollbar: { enabled: false },
  legend: { enabled: false },
  title: { text: "" },
  time: {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    useUTC: false,
  },
  xAxis: xAxisConfig.value,
  yAxis: yAxisConfig.value,
  tooltip: tooltipConfig.value,
  navigator: {
    xAxis: {
      type: "datetime",
      labels: {
        format: "{value: %d.%m %H:%M}",
        dateTimeLabelFormats: {
          millisecond: "%H:%M:%S.%L",
          second: "%H:%M:%S",
          minute: "%H:%M",
          hour: "%H:%M",
          day: "%d.%m",
          week: "%d.%m",
          month: "%m.%Y",
          year: "%Y",
        },
      },
      ordinal: false,
    },
    enabled: true,
    height: 40,
    adaptToUpdatedData: true,
    series: {
      dataLabels: { enabled: false },
    },
  },
  plotOptions: {
    series: {
      showInNavigator: true,
      dataGrouping: {
        enabled: false,
      },
      // Оптимизация для больших данных
      turboThreshold: 0, // Отключаем turbo режим для точного отображения
    },
  },
  series: preparedSeries.value,
  credits: { enabled: false },
  // Дополнительные оптимизации
  boost: {
    enabled: false, // Отключаем boost для точного отображения
  },
}));

/**
 * Обновление графика с поддержкой realtime и remote режимов
 *
 * Realtime режим (определяется по mapState.currentProvider.value):
 * - Инкрементальное обновление: добавляет только новые точки данных
 * - Сохраняет состояние видимости серий
 * - Автоматически обновляет временную шкалу
 * - Удаляет серии, которых больше нет в данных
 *
 * Remote режим:
 * - Полное обновление графика через applySeriesDiffToChart
 * - Обновляет chartSeries.value для реактивности
 * - Для realtime режима также обновляет временную шкалу
 *
 * @param {Array} log - Данные лога сенсора
 * @param {string} legendKey - Ключ легенды (если null, используется activeLegendKey или первый доступный)
 */
const seriesPointX = (point) => {
  return Array.isArray(point) ? point?.[0] : point?.x;
}

const presentSeries = (log, legendKey) => {
  const built = buildSeriesArray(log, legendKey).sort((a, b) => a.name.localeCompare(b.name));
  const { series, scales } =
    legendKey === "climate" ? { series: built, scales: new Map() } : applyReadableScale(built);
  const units = [...new Set(series.map((item) => item.unit || ""))];
  const axisIndex = Object.fromEntries(units.map((unit, index) => [unit, index]));
  const painted = series.map((item) => {
    const next = {
      ...item,
      yAxis: axisIndex[item.unit || ""] ?? 0,
      lineWidth: item.custom?.readableScale ? 2.5 : item.lineWidth || 2,
      zones: (item.zones || []).map((zone) => ({ ...zone, color: cssColor(zone.color) })),
    };
    if (item.custom?.readableScale) next.zIndex = 2;
    return next;
  });
  return {
    units,
    scales,
    series: painted.flatMap((item) => {
      const outline = spikeOutlineSeries(item, scales.get(item.unit || ""));
      return outline ? [outline, item] : [item];
    }),
  };
}

const updateChart = async (log, legendKey = null) => {
  if (!chartRef.value || !Array.isArray(log) || log.length === 0) return;

  // Предотвращаем конкурирующие обновления
  if (isUpdatingChart.value) return;
  isUpdatingChart.value = true;

  const timelineMode = mapState.timelineMode.value;

  try {
    const currentLegendKey = legendKey || activeLegendKey.value || visibleLegend.value[0]?.key;
    if (!currentLegendKey) return;

    if (!chart.value) return;

    const presented = presentSeries(log, currentLegendKey);
    yScalesByUnit.value = presented.scales;
    const raw = presented.series;
    const chartWasScaled = (chart.value.series || []).some(
      (series) => series.options?.custom?.readableScale
    );
    syncYAxes(chart.value, presented.units);

    if (isRealtime.value && presented.scales.size === 0 && !chartWasScaled) {
      // Realtime без выброса: добавляем только новые точки
      chartSeries.value = raw;

      // Сохраняем состояние видимости серий
      const prevVis = {};
      chart.value.series.forEach((s) => {
        if (s.options) {
          prevVis[s.options.id] = s.visible;
        }
      });

      // Удаляем серии, которых больше нет
      chart.value.series.slice().forEach((s) => {
        if (s.options && !raw.find((ns) => ns.id === s.options.id)) {
          s.remove(false);
        }
      });

      let maxTime = 0;
      raw.forEach((ns) => {
        const existing = chart.value.get(ns.id);
        if (existing) {
          existing.update(
            {
              name: ns.name,
              zones: ns.zones,
              dataGrouping: ns.dataGrouping,
              yAxis: ns.yAxis ?? 0,
              custom: ns.custom || { readableScale: false },
            },
            false
          );
          if (typeof prevVis[ns.id] === "boolean") {
            existing.setVisible(prevVis[ns.id], false);
          }

          const lastX = existing.data.at(-1)?.x ?? -Infinity;
          const newPoints = ns.data.filter((p) => p[0] > lastX);

          if (existing.data.length === 0) {
            existing.setData(ns.data, false, false, false);
            maxTime = Math.max(maxTime, ns.data.at(-1)?.[0] || 0);
          } else if (newPoints.length > 0) {
            newPoints.forEach((p) => {
              existing.addPoint(p, false, false);
              maxTime = Math.max(maxTime, p[0]);
            });
          } else if (ns.data.length !== existing.data.length) {
            existing.setData(ns.data, false, false, false);
            maxTime = Math.max(maxTime, ns.data.at(-1)?.[0] || 0);
          }
        } else {
          chart.value.addSeries({ ...ns, visible: true }, false);
          const pts = chart.value.get(ns.id).data;
          maxTime = Math.max(maxTime, pts.at(-1)?.x || 0);
        }
      });

      // Обновляем временную шкалу для realtime
      if (maxTime) {
        chart.value.xAxis[0].setExtremes(
          maxTime - REALTIME_VIEW_TIMELINE_MS,
          maxTime,
          false,
          false
        );
      }

      chart.value.redraw(false);
      trimYAxes(chart.value, presented.units);
    } else {
      // День / неделя / месяц, либо realtime с выбросом: полная перерисовка
      // в шкале с изломом, чтобы старые точки не остались в старом масштабе.
      applySeriesDiffToChart(chart.value, raw);
      trimYAxes(chart.value, presented.units);
      chartSeries.value = raw;

      if (isRealtime.value) {
        let maxTime = 0;
        raw.forEach((ns) => {
          const x = seriesPointX(ns.data[ns.data.length - 1]);
          if (x > maxTime) maxTime = x;
        });
        if (maxTime && chart.value.xAxis?.[0]) {
          chart.value.xAxis[0].setExtremes(
            maxTime - REALTIME_VIEW_TIMELINE_MS,
            maxTime,
            false,
            false
          );
        }
        chart.value.redraw(false);
      }

      // Принудительно устанавливаем границы периода только для завершенных периодов
      // Для незаконченных периодов позволяем графику автоматически расширяться
      if (timelineMode === "day" || timelineMode === "week" || timelineMode === "month") {
        const currentDate = mapState.currentDate.value;
        const [y, m, d] = String(currentDate).split("-").map(Number);
        const today = new Date();
        const selectedDate = new Date(y, m - 1, d);

        let periodStart, periodEnd;
        let isPeriodComplete = false;

        if (timelineMode === "day") {
          // День: начало дня
          periodStart = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();

          // Проверяем, является ли выбранная дата сегодняшним днем
          const isToday = selectedDate.toDateString() === today.toDateString();
          if (isToday) {
            // Для незаконченного дня не устанавливаем верхнюю границу
            // График будет автоматически расширяться при добавлении новых данных
            isPeriodComplete = false;
          } else {
            // Для завершенного дня устанавливаем конец дня
            periodEnd = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
            isPeriodComplete = true;
          }
        } else if (timelineMode === "week") {
          // Неделя: 7 дней от выбранной даты
          const weekEnd = new Date(y, m - 1, d, 23, 59, 59, 999);
          const weekStart = new Date(weekEnd);
          weekStart.setDate(weekEnd.getDate() - 6);
          weekStart.setHours(0, 0, 0, 0);

          periodStart = weekStart.getTime();

          // Проверяем, попадает ли сегодняшний день в этот период
          const weekEndDate = weekEnd.getTime();
          if (today.getTime() <= weekEndDate) {
            // Если период еще не закончился, не устанавливаем верхнюю границу
            isPeriodComplete = false;
          } else {
            periodEnd = weekEnd.getTime();
            isPeriodComplete = true;
          }
        } else if (timelineMode === "month") {
          // Месяц: 30 дней от выбранной даты
          const monthEnd = new Date(y, m - 1, d, 23, 59, 59, 999);
          const monthStart = new Date(monthEnd);
          monthStart.setDate(monthEnd.getDate() - 29);
          monthStart.setHours(0, 0, 0, 0);

          periodStart = monthStart.getTime();

          // Проверяем, попадает ли сегодняшний день в этот период
          const monthEndDate = monthEnd.getTime();
          if (today.getTime() <= monthEndDate) {
            // Если период еще не закончился, не устанавливаем верхнюю границу
            isPeriodComplete = false;
          } else {
            periodEnd = monthEnd.getTime();
            isPeriodComplete = true;
          }
        }

        // Устанавливаем границы оси X только для завершенных периодов
        // Для незаконченных периодов устанавливаем только нижнюю границу,
        // верхняя граница (null) позволит графику автоматически расширяться при добавлении данных
        if (isPeriodComplete && periodEnd !== undefined) {
          chart.value.xAxis[0].setExtremes(periodStart, periodEnd, false, false);
        } else {
          // Для незаконченных периодов устанавливаем только нижнюю границу (periodStart)
          // Верхняя граница = null позволит Highcharts автоматически расширять график
          // при добавлении новых данных, не обрезая их
          chart.value.xAxis[0].setExtremes(periodStart, null, false, false);
        }

        // Обновляем навигатор после установки границ основной оси
        // Навигатор должен показывать только данные за выбранный период
        if (chart.value.navigator && chart.value.navigator.xAxis) {
          const navigatorXAxis = chart.value.navigator.xAxis;
          // Устанавливаем границы навигатора, чтобы он показывал только выбранный период
          // Для завершенных периодов - весь период, для незавершенных - от начала периода до конца данных
          if (isPeriodComplete && periodEnd !== undefined) {
            navigatorXAxis.setExtremes(periodStart, periodEnd, false, false);
          } else {
            // Для незавершенных периодов находим максимальное время из данных
            const allDataTimes = chart.value.series
              .flatMap((s) => (s.data || []).map((p) => p.x))
              .filter((x) => x != null && x >= periodStart);

            if (allDataTimes.length > 0) {
              const dataMax = Math.max(...allDataTimes);
              navigatorXAxis.setExtremes(periodStart, dataMax, false, false);
            } else {
              navigatorXAxis.setExtremes(periodStart, null, false, false);
            }
          }
        }

        // Перерисовываем график
        chart.value.redraw(false);
      }
    }
  } finally {
    isUpdatingChart.value = false;
  }
};

// Cache series per (legendKey, logSignature) to speed up tab switches
const seriesCache = new Map();
function getLogSignature(log, revision = "") {
  if (!Array.isArray(log) || log.length === 0) return `0-0-${revision}`;
  const lastTs = log[log.length - 1]?.timestamp || 0;
  const rev = revision === "" || revision == null ? "" : String(revision);
  if (!rev) return `${log.length}-${lastTs}`;
  return `${log.length}-${lastTs}-${rev}`;
}

/**
 * Строит массив серий Highcharts для выбранной группы легенды или отдельного параметра
 * - Для группы: показывает всех присутствующих участников (пунктирные линии для вторичных), один основной (сплошная, отображается в легенде)
 * - Для отдельного параметра: показывает только его
 * - Показывает только линии для параметров, фактически присутствующих в текущем логе
 * - В режиме realtime растягивает каждую серию до последнего часового окна, добавляя виртуальную точку при необходимости
 * @param {Array} log - Массив логов сенсора
 * @param {string} legendKey - Ключ легенды
 * @returns {Array} Массив серий Highcharts
 */
function buildSeriesArray(log, legendKey) {
  // Try cache first
  const cacheKey = `${legendKey}|${mapState.timelineMode.value}|${
    mapState.currentDate.value
  }|${getLogSignature(log, props.logRevision)}`;
  const cached = seriesCache.get(cacheKey);
  if (cached) return cached;

  const shouldRestrictByPeriod = !isRealtime.value;
  let periodStartMs = null;
  let periodEndMs = null;
  if (shouldRestrictByPeriod) {
    const bounds = getPeriodBounds(mapState.currentDate.value, mapState.timelineMode.value);
    periodStartMs = bounds.start * 1000;
    periodEndMs = bounds.end ? bounds.end * 1000 : null;
  }

  const groupMainSeries = {}; // Первая серия в каждой группе (показывается в легенде)
  const seriesCollection = new Map(); // Коллекция всех серий
  // Порог разрыва между точками — если интервал больше, линия будет оборвана
  const gapThresholdMs = getGapThresholdMs(mapState.timelineMode.value);

  for (const { timestamp, data } of log) {
    if (!timestamp || !data) continue;
    const timestampMs = String(timestamp).length === 10 ? timestamp * 1000 : timestamp;
    if (shouldRestrictByPeriod) {
      if (timestampMs < periodStartMs) continue;
      if (periodEndMs && timestampMs > periodEndMs) continue;
    }

    for (const [paramKey, paramValue] of Object.entries(data)) {
      const rawId = paramKey.toLowerCase();
      if (
        rawId === "radiation" &&
        Object.keys(data).some((key) => key.toLowerCase() === "gc")
      ) {
        continue;
      }
      const paramId = canonicalMeasurementId(rawId);
      const paramGroup = GROUPS_LOOKUP[paramId];
      const paramSettings = unitsettings[paramId] || {};

      // Проверяем, нужно ли обрабатывать этот параметр для текущей вкладки легенды:
      // - Для групп: обрабатываем только если выбранная легенда соответствует группе параметра
      // - Для одиночных параметров: обрабатываем только если выбранная легенда соответствует самому параметру
      const shouldProcess =
        (paramGroup && paramGroup === legendKey) || (!paramGroup && paramId === legendKey);

      if (shouldProcess) {
        // Создаем серию если её еще нет
        if (!seriesCollection.has(paramId)) {
          const shortName = paramSettings.nameshort?.[locale.value] || paramId.toUpperCase();

          // Всегда используем сплайн для всех периодов
          const chartType = "spline";

          const seriesConfig = {
            id: paramId,
            type: chartType,
            unit: paramSettings.unit || "",
            name: paramGroup ? tr(GROUPS[paramGroup].labelKey) : shortName,
            shortName,
            fullLabel: paramSettings.namelong?.[locale.value] || shortName,
            data: [],
            zones: HIGHCHARTS_COLOR_ZONES[paramId] || [],
            dataGrouping: { enabled: false },
            // Запоминаем последнюю временную метку, чтобы обнаруживать большие разрывы
            lastTimestamp: null,
          };

          if (paramGroup) {
            // Для групп: определяем основной и связанные серии
            if (!groupMainSeries[paramGroup]) {
              groupMainSeries[paramGroup] = paramId;
            }
            const mainSeriesId = groupMainSeries[paramGroup];
            const isMainSeries = paramId === mainSeriesId;

            seriesConfig.showInLegend = isMainSeries;
            seriesConfig.linkedTo = isMainSeries ? undefined : mainSeriesId;
            seriesConfig.dashStyle = isMainSeries ? "Solid" : "ShortDot";
          } else {
            // Для одиночных параметров
            seriesConfig.showInLegend = true;
          }

          seriesCollection.set(paramId, seriesConfig);
        }

        const seriesEntry = seriesCollection.get(paramId);
        const numericValue = Number(measurementValue(rawId, paramValue));

        if (
          gapThresholdMs &&
          seriesEntry.lastTimestamp !== null &&
          timestampMs - seriesEntry.lastTimestamp > gapThresholdMs
        ) {
          const gapPointTs = seriesEntry.lastTimestamp + 1;
          seriesEntry.data.push([gapPointTs, null]);
        }

        // Добавляем точку данных
        seriesEntry.data.push([timestampMs, isNaN(numericValue) ? null : numericValue]);
        seriesEntry.lastTimestamp = timestampMs;
      }
    }
  }

  // Обрабатываем каждую серию: дедуплицируем данные и настраиваем отображение
  const processedSeries = Array.from(seriesCollection.values()).map((series) => {
    const { data, lastTimestamp, ...seriesMeta } = series;
    // Убираем дубликаты по времени и сортируем
    let dataPoints = Array.from(
      new Map(data.map(([timestamp, value]) => [timestamp, value])).entries()
    ).sort((a, b) => a[0] - b[0]);

    // Умная фильтрация для Week и Month
    const timelineMode = mapState.timelineMode.value;

    // Дополнительная оптимизация для очень больших данных (отключена - вызывает ошибку Highcharts #18)
    // if (dataPoints.length > 10000) {
    //   // Для очень больших данных используем более агрессивную фильтрацию
    //   const step = Math.ceil(dataPoints.length / 5000);
    //   dataPoints = dataPoints.filter((_, index) => index % step === 0);
    // }

    if (timelineMode === "week" || timelineMode === "month") {
      // УМНОЕ ОГРАНИЧЕНИЕ ТОЧЕК ДЛЯ WEEK И MONTH ГРАФИКОВ
      // =================================================
      // Для длительных периодов (неделя/месяц) применяем умное ограничение точек:
      //
      // 1. Находим экстремумы (больше/меньше 70% от среднего)
      // 2. Ограничиваем общее количество точек до 3000
      // 3. Остальное заполняем регулярными точками:
      //    - Week: каждые 3 часа
      //    - Month: каждые 8 часов
      //
      // Это позволяет:
      // - Сохранить все важные пики и впадины
      // - Значительно улучшить производительность
      // - Показать общую тенденцию через регулярные точки

      const MAX_POINTS = 3000;
      const importantPoints = new Set();

      // 1. Добавляем первую и последнюю точки (приоритет)
      if (dataPoints.length > 0) {
        importantPoints.add(0);
        importantPoints.add(dataPoints.length - 1);
      }

      // 2. Находим экстремумы (больше/меньше 70% от среднего)
      const values = dataPoints.map(([timestamp, value]) => value);
      const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
      const threshold = avgValue * 0.7; // 70% от среднего

      dataPoints.forEach(([timestamp, value], index) => {
        if (Math.abs(value - avgValue) > threshold) {
          importantPoints.add(index);
        }
      });

      // 3. Добавляем регулярные точки
      dataPoints.forEach(([timestamp, value], index) => {
        const time = new Date(timestamp);
        const hours = time.getHours();

        if (timelineMode === "week") {
          // Week: каждые 3 часа (0, 3, 6, 9, 12, 15, 18, 21)
          if (hours % 3 === 0) {
            importantPoints.add(index);
          }
        } else if (timelineMode === "month") {
          // Month: каждые 8 часов (0, 8, 16)
          if (hours % 8 === 0) {
            importantPoints.add(index);
          }
        }
      });

      // 4. Если точек все еще много, добавляем равномерно распределенные
      if (importantPoints.size > MAX_POINTS) {
        const step = Math.floor(dataPoints.length / MAX_POINTS);
        for (let i = 0; i < dataPoints.length; i += step) {
          importantPoints.add(i);
        }
      }

      // 5. Фильтруем данные, сохраняя важные точки
      dataPoints = dataPoints.filter((_, index) => importantPoints.has(index));
    } else {
      // Для дня: стандартная фильтрация
      if (dataPoints.length > settings.SERIES_MAX_VISIBLE) {
        dataPoints = dataPoints.filter((_, index) => index % 2 === 0);
      }
    }

    // В realtime режиме добавляем виртуальную точку в начале для правильного отображения
    if (isRealtime.value && dataPoints.length) {
      const lastTimestamp = dataPoints[dataPoints.length - 1][0];
      const timelineStart = lastTimestamp - REALTIME_VIEW_TIMELINE_MS;

      if (dataPoints[0][0] > timelineStart) {
        dataPoints = [[timelineStart, dataPoints[0][1]], ...dataPoints];
      }
    }

    // Определяем dataGrouping в зависимости от количества данных и периода
    let dataGroupingConfig;
    if (isRealtime.value) {
      dataGroupingConfig = { enabled: false };
    } else {
      const timelineMode = mapState.timelineMode.value;

      // Для Week и Month отключаем dataGrouping чтобы сохранить все пики
      if (timelineMode === "week" || timelineMode === "month") {
        // Отключаем группировку для сохранения всех деталей и пиков
        dataGroupingConfig = { enabled: false };
      } else {
        // Для дня: стандартная группировка
        if (dataPoints.length > settings.SERIES_MAX_VISIBLE) {
          dataGroupingConfig = {
            enabled: true,
            approximation: "high",
            units: [
              ["minute", [5]],
              ["hour", [1]],
            ],
          };
        } else {
          dataGroupingConfig = {
            enabled: true,
            units: [["minute", [5]]],
          };
        }
      }
    }

    return {
      ...seriesMeta,
      data: dataPoints,
    };
  });

  // Сортируем серии по имени и кэшируем результат
  const sortedSeries = processedSeries.sort((a, b) => a.name.localeCompare(b.name));
  seriesCache.set(cacheKey, sortedSeries);
  return sortedSeries;
}

/**
 * Применяет массив серий к существующему экземпляру диаграммы с минимальным перерисовыванием
 * @param {Object} chart - Экземпляр диаграммы Highcharts
 * @param {Array} nextSeries - Массив новых серий
 */
const hideNavigatorPeakLabels = (chartInstance) => {
  const navSeries = chartInstance?.navigator?.series || [];
  navSeries.forEach((series) => {
    (series.points || []).forEach((point) => {
      if (point.dataLabel) point.dataLabel.hide();
    });
  });
}

function applySeriesDiffToChart(chartInstance, newSeries) {
  if (!chartInstance) return;
  const raw = newSeries.sort((a, b) => a.name.localeCompare(b.name));

  // Remember visibility state
  const prevVis = {};
  (chartInstance.series || []).forEach((s) => {
    if (s && s.options) prevVis[s.options.id] = s.visible;
  });

  // Remove series that are no longer present
  (chartInstance.series || []).slice().forEach((s) => {
    if (s && s.options && !raw.find((ns) => ns.id === s.options.id)) {
      s.remove(false);
    }
  });

  // Add/update series
  raw.forEach((ns) => {
    const existing = chartInstance.get(ns.id);
    if (existing) {
      existing.update(
        {
          name: ns.name,
          ...(ns.color ? { color: ns.color } : {}),
          zones: ns.zones,
          lineWidth: ns.lineWidth || 2,
          ...(ns.zIndex == null ? {} : { zIndex: ns.zIndex }),
          enableMouseTracking: ns.enableMouseTracking !== false,
          showInNavigator: ns.showInNavigator !== false,
          dataGrouping: ns.dataGrouping,
          yAxis: ns.yAxis ?? 0,
          custom: ns.custom || { readableScale: false },
          dataLabels: ns.dataLabels || { enabled: false },
        },
        false
      );
      existing.setData(ns.data, false, false, false);
      if (typeof prevVis[ns.id] === "boolean") existing.setVisible(prevVis[ns.id], false);
    } else {
      chartInstance.addSeries({ ...ns, visible: true }, false);
    }
  });

  chartInstance.redraw(false);
}

// Возвращает допустимую длину разрыва между точками для текущего режима таймлайна
function getGapThresholdMs(mode) {
  switch (mode) {
    case "day":
    case "week":
      return 15 * 60 * 60 * 1000; // 15 часов
    case "month":
      return 24 * 60 * 60 * 1000; // 24 часа
    default:
      return null;
  }
}

/**
 * Мгновенно очищает график Highcharts
 * Удаляет все серии без анимации для быстрого переключения режимов
 */
function clearChartInstantly() {
  const chart = chartRef.value?.chart;
  if (!chart || !chart.series) return;

  seriesCache.clear();
  chartSeries.value = [];
  yScalesByUnit.value = new Map();

  try {
    // Временно отключаем все анимации
    const originalAnimation = chart.options.chart?.animation;
    chart.update(
      {
        chart: { animation: false },
      },
      false
    );

    // Сначала очищаем данные всех серий для мгновенного эффекта
    chart.series.forEach((series) => {
      if (series && series.data && series.data.length > 0) {
        // Для больших серий используем более агрессивную очистку
        if (series.data.length > 1000) {
          series.points.forEach((point) => {
            if (point && point.remove) {
              point.remove(false);
            }
          });
        }
        series.setData([], false, false, false);
      }
    });

    // Затем удаляем все серии без анимации
    while (chart.series && chart.series.length > 0) {
      const series = chart.series[0];
      if (series && series.remove) {
        series.remove(false);
      } else {
        break; // Предотвращаем бесконечный цикл
      }
    }

    // Drop realtime 1h zoom so day/week axes can be set fresh
    if (chart.xAxis?.[0]) {
      chart.xAxis[0].setExtremes(null, null, false, false);
    }
    if (chart.navigator?.xAxis) {
      chart.navigator.xAxis.setExtremes(null, null, false, false);
    }

    chart.redraw(false);

    if (originalAnimation !== undefined) {
      chart.update(
        {
          chart: { animation: originalAnimation },
        },
        false
      );
    }
  } catch (error) {
    console.warn("Error clearing chart:", error);
    chart.redraw(false);
  }
}

/**
 * Обрабатывает клик по элементу легенды
 * @param {string} legendKey - Ключ элемента легенды
 */
function onLegendClick(legendKey) {
  if (legendKey === activeLegendKey.value) return;
  let targetType;
  if (GROUPS[legendKey]) {
    // For groups, take the first available member from the group
    targetType = GROUPS[legendKey].members.find((m) => UNITS_FOUND.value.has(m));
  } else {
    // For single parameters, use the key directly
    targetType = legendKey;
  }
  // Update URL and composable for deep-linking
  mapState.setMapSettings(route, router, { type: targetType });
}

// Основной watcher для обновления графика при изменении данных, легенды или периода
watch(
  [
    () => safeLog.value,
    () => props.logRevision,
    () => activeLegendKey.value,
    () => mapState.timelineMode.value,
    () => mapState.currentDate.value,
  ],
  async (
    [log, logRevision, legendKey, timelineMode, currentDate],
    [oldLog, oldLogRevision, oldLegendKey, oldTimelineMode, oldCurrentDate]
  ) => {
    if (!chartRef.value || isUpdatingChart.value) return;

    // Мгновенно очищаем график при переключении режимов таймлайна, даты или легенды
    if (
      timelineMode !== oldTimelineMode ||
      currentDate !== oldCurrentDate ||
      legendKey !== oldLegendKey ||
      logRevision !== oldLogRevision
    ) {
      clearChartInstantly();
      if (timelineMode !== oldTimelineMode || logRevision !== oldLogRevision) {
        seriesCache.clear();
      }
    }

    if (!Array.isArray(log) || log.length === 0) return;

    // Ждем пока UNITS_FOUND заполнится данными
    if (UNITS_FOUND.value.size === 0) return;

    await updateChart(log, legendKey);
  },
  { immediate: true }
);

// Realtime обновления при добавлении новых данных
watch(
  [() => safeLog.value.length, () => props.logRevision],
  async ([newLen, logRevision], [oldLen, oldLogRevision]) => {
    if (!isRealtime.value || !chartRef.value || isUpdatingChart.value) return;
    const lengthIncreased = newLen > oldLen;
    const revisionChanged = logRevision !== oldLogRevision;
    if (!lengthIncreased && !revisionChanged) return;

    if (revisionChanged) seriesCache.clear();
    await updateChart(safeLog.value);
  }
);

// Watcher для принудительного обновления при изменении режима таймлайна
watch(
  () => mapState.timelineMode.value,
  async (newMode, oldMode) => {
    if (newMode !== oldMode && chartRef.value && safeLog.value.length > 0) {
      // Очищаем кэш серий при смене режима таймлайна
      seriesCache.clear();

      // Принудительно обновляем график при смене режима таймлайна
      await updateChart(safeLog.value, activeLegendKey.value);
    }
  }
);

// Обновление найденных единиц измерения и графика при изменении данных
watch(
  () => safeLog.value,
  (newLog) => {
    if (!newLog.length) {
      UNITS_FOUND.value = new Set();
      seriesCache.clear();
      if (chartRef.value) clearChartInstantly();
      return;
    }

    const newUnits = new Set();
    for (const point of newLog) {
      if (!point.data) continue;
      const hasGc = Object.keys(point.data).some((id) => id.toLowerCase() === "gc");
      Object.keys(point.data).forEach((id) => {
        const rawId = id.toLowerCase();
        if (rawId === "radiation" && hasGc) return;
        newUnits.add(canonicalMeasurementId(rawId));
      });
    }
    UNITS_FOUND.value = newUnits;

    if (!isRealtime.value) {
      updateChart(newLog);
    }
  },
  { immediate: true }
);

// If current unit is not available in this sensor, switch to the first available one
watch(
  () => Array.from(UNITS_FOUND.value),
  (idsArr) => {
    if (!idsArr || idsArr.length === 0) return;
    const ids = new Set(idsArr);
    const cur = mapState.currentUnit.value;

    // Если есть данные и график еще не отрисован, принудительно обновляем
    if (safeLog.value.length > 0 && chartRef.value && !isUpdatingChart.value) {
      updateChart(safeLog.value);
    }

    // Check if current unit is available
    const curAvailable = isMapUnitAvailableInData(cur, ids);
    if (curAvailable) return;

    // Find first available parameter by checking groups in order
    let next = null;
    for (const [groupKey, groupInfo] of Object.entries(GROUPS)) {
      const firstAvailable = groupInfo.members.find((member) => ids.has(member));
      if (firstAvailable) {
        next = firstAvailable;
        break;
      }
    }

    // If no group member found, use the first available parameter
    if (!next) {
      next = idsArr[0];
    }

    if (next) {
      mapState.setMapSettings(route, router, { type: next });
    }
  },
  { immediate: true }
);

// Принудительная инициализация графика при маунте
onMounted(async () => {
  await nextTick();

  if (
    safeLog.value.length > 0 &&
    chartRef.value &&
    UNITS_FOUND.value.size > 0 &&
    !isUpdatingChart.value
  ) {
    updateChart(safeLog.value);
  }
});
</script>

<style>
.custom-legend {
  font-weight: 900;
  user-select: none;
  /* margin-bottom: calc(var(--gap) * 3); */
  text-align: center;
}
.legend-item {
  color: var(--color-dark);
  cursor: pointer;
  transition: color 0.2s;
  opacity: 0.5;
}
.legend-item:not(:last-child) {
  margin-right: calc(var(--gap) * 2);
}
.legend-item.active {
  opacity: 1;
  text-decoration: underline;
  cursor: default;
}
.legend-item:hover:not(.active) {
  opacity: 0.3;
}

@media screen and (max-width: 420px) {
  .custom-legend {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
  }
}

.chart-section {
  position: relative;
  padding-left: 30px;
}

.chart-section-units {
  width: 30px;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 2rem;
  overflow-wrap: break-word;
  z-index: 1;
  background: #f2f2f2;
  padding: 2px;
  box-sizing: border-box;
  font-size: calc(var(--font-size) * 0.8);
  font-weight: bold;
  cursor: pointer;
  border-radius: 0.2rem;
  overflow: hidden;
}

.chart-unit-symbol {
  text-align: center;
}

.chart-unit-zones {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chart-unit-zone {
  flex: 1 1 0;
  min-height: 32px;
  display: flex;
  align-items: center;
  color: var(--color-light);
  padding: 4px;
}

.chart-section-units .expanded-text {
  display: none;
}

.chart-section-units.expanded div.expanded-text {
  display: block;
}

.chart-section-units.expanded span.expanded-text {
  display: inline-block;
}

.chart-section-units.expanded {
  width: auto;
}

.chart-unit {
  position: relative;
  height: 100%;
}

.chart-unit:not(:last-child) {
  margin-bottom: var(--gap);
}

.chart-unit-toggler {
  text-align: center;
}

.chart-section-units.expanded .chart-unit-toggler {
  text-align: right;
}

.chart-wrapper {
  position: relative;
}

.chart-scale-above-label,
.chart-scale-break-label {
  display: inline-block;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
}

.chart-scale-above-label {
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.94);
  outline: 1px solid currentColor;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.35;
}

.chart-scale-break-label {
  color: #8a8a8a;
}

.chart-scale-hint {
  margin: 0.45rem 0 0 0.6rem;
  padding: 0.35rem 0.6rem;
  text-align: center;
  font-size: 0.78rem;
  line-height: 1.4;
  color: #1c1c1c;
  background: var(--color-light-gray);
  border-radius: var(--radius-sm);
}
</style>
