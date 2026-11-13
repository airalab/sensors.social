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
              <span class="chart-unit-zone-label">
                {{ zone.label }}<template v-if="zone.range">: </template>
              </span>
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
      <!-- One panel under the chart: what is measured, and how it is shown when there is a choice. -->
      <div class="chart-controls">
        <div class="chart-tabs" role="tablist" :aria-label="$t('chart.measurement')">
          <button
            v-for="item in visibleLegend"
            :key="item.key"
            type="button"
            role="tab"
            :aria-selected="item.key === activeLegendKey"
            :class="['chart-tab', { active: item.key === activeLegendKey }]"
            @click="onLegendClick(item.key)"
          >
            <svg
              v-if="LEGEND_ICONS[item.key]"
              class="chart-tab__icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
              v-html="LEGEND_ICONS[item.key]"
            ></svg>
            <span>{{ $t(item.labelKey) }}</span>
          </button>
        </div>
        <div v-if="humidityNote" class="chart-view">
          <span class="chart-view__label">{{ $t("chart.view") }}</span>
          <div class="chart-view__switch" role="radiogroup" :aria-label="$t('chart.view')">
            <button
              type="button"
              role="radio"
              :aria-checked="humidityCorrectionOn"
              :class="{ active: humidityCorrectionOn }"
              @click="setHumidityCorrection(true)"
            >
              {{ $t("chart.humidityCorrected") }}
            </button>
            <button
              type="button"
              role="radio"
              :aria-checked="!humidityCorrectionOn"
              :class="{ active: !humidityCorrectionOn }"
              @click="setHumidityCorrection(false)"
            >
              {{ $t("chart.humidityRaw") }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="humidityNote" class="chart-humidity-note" role="status">
        <svg class="chart-humidity-note__icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="11" x2="12" y2="17"></line>
          <circle cx="12" cy="7.5" r="0.6"></circle>
        </svg>
        <div>
          <p>
            <b>{{ $t("chart.humidityLead", { rh: humidityNote.maxRh }) }}</b>
            {{ $t(humidityCorrectionOn ? "chart.humidityOnText" : "chart.humidityOffText") }}
          </p>
          <button
            type="button"
            class="chart-humidity-note__link"
            @click="setHumidityCorrection(!humidityCorrectionOn)"
          >
            {{ $t(humidityCorrectionOn ? "chart.humidityShowRaw" : "chart.humidityShowCorrected") }}
          </button>
        </div>
      </div>
      <p v-for="(hint, hintIndex) in scaleHints" :key="hintIndex" class="chart-scale-hint">
        {{ hint }}
      </p>
      <p v-if="unitsettings[activeLegendKey]?.scaleNote" class="chart-scale-hint">
        {{
          unitsettings[activeLegendKey].scaleNote[locale] ||
          unitsettings[activeLegendKey].scaleNote.en
        }}
      </p>
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
import { HUMID_RH, correctForHumidity, pickKappa } from "@/utils/humidityCorrection";

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

// Line icons for the measurement tabs (24×24, stroke = currentColor); a tab without one shows its name only.
const LEGEND_ICONS = {
  dust: '<circle cx="6" cy="7" r="1.6"/><circle cx="13" cy="5" r="1.2"/><circle cx="18" cy="9" r="1.8"/><circle cx="9" cy="13" r="2"/><circle cx="16" cy="16" r="1.4"/><circle cx="6" cy="19" r="1.2"/><circle cx="12" cy="20" r="0.9"/>',
  noise:
    '<path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18.5 6.5a7.5 7.5 0 0 1 0 11"/>',
  climate:
    '<path d="M9 14.5V5a2.5 2.5 0 0 1 5 0v9.5a4 4 0 1 1-5 0z"/><line x1="11.5" y1="9" x2="11.5" y2="16"/><path d="M19 4.5c1.2 1.6 2 2.8 2 3.8a2 2 0 0 1-4 0c0-1 .8-2.2 2-3.8z"/>',
  pressure:
    '<circle cx="12" cy="12" r="9.5"/><line x1="6.2" y1="9" x2="7.4" y2="9.6"/><line x1="12" y1="5.2" x2="12" y2="6.5"/><line x1="17.8" y1="9" x2="16.6" y2="9.6"/><line x1="12" y1="12" x2="15.2" y2="8"/><circle cx="12" cy="12" r="1.1"/><path d="M7.5 16.5c1.5-.9 3-.9 4.5 0s3 .9 4.5 0"/>',
};

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
// Set when the dust chart covers a humid period: { maxRh }. Shows the raw / corrected switch.
const humidityNote = ref(null);
// Default of the switch: true = corrected for humidity, false = raw readings. Sergei, 13.11.2026:
// in humid periods the chart opens corrected; raw readings are one tap away and stay in storage.
const HUMIDITY_CORRECTION_DEFAULT = true;
const readHumidityChoice = () => {
  try {
    const saved = localStorage.getItem("humidityCorrection");
    if (saved === "on") return true;
    if (saved === "off") return false;
  } catch {
    /* private mode */
  }
  return HUMIDITY_CORRECTION_DEFAULT;
};
const humidityCorrectionOn = ref(readHumidityChoice());
const setHumidityCorrection = (on) => {
  humidityCorrectionOn.value = on;
  try {
    localStorage.setItem("humidityCorrection", on ? "on" : "off");
  } catch {
    /* private mode */
  }
  updateChart(safeLog.value, activeLegendKey.value);
};

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
            range: settingsEntry.zoneLabelsAreRanges ? "" : range,
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
  const humid = legendKey === "dust" ? built.find((item) => item.custom?.humidity) : null;
  humidityNote.value = humid?.custom.humidity || null;
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
/**
 * Humid periods on the dust tab: PM2.5 and PM10 corrected for humidity (κ-Köhler, Crilley et al.
 * 2018), on the lines' own timestamps, when the switch under the chart is on. The switch appears
 * only when the period had humid air (RH ≥ HUMID_RH), where optical sensors also count the water
 * the particles soak up. RH ≥ 95% leaves a gap: the formula diverges there.
 * Returns { maxRh } for a humid period (whether or not the correction is applied), else null.
 */
function applyHumidityCorrection(log, series, startMs, endMs, apply) {
  const corrected = { pm10: new Map(), pm25: new Map() };
  let maxRh = 0;
  for (const { timestamp, data } of log) {
    if (!timestamp || !data) continue;
    const ts = String(timestamp).length === 10 ? timestamp * 1000 : timestamp;
    if (startMs !== null && ts < startMs) continue;
    if (endMs && ts > endMs) continue;
    const values = {};
    for (const [key, raw] of Object.entries(data)) {
      const id = canonicalMeasurementId(key.toLowerCase());
      if (id === "pm10" || id === "pm25" || id === "humidity") {
        values[id] = Number(measurementValue(key.toLowerCase(), raw));
      }
    }
    if (!Number.isFinite(values.humidity)) continue;
    if (values.humidity > maxRh) maxRh = values.humidity;
    const kappa = pickKappa(values.pm10, values.pm25);
    for (const id of ["pm10", "pm25"]) {
      if (!Number.isFinite(values[id])) continue;
      const value = correctForHumidity(values[id], values.humidity, kappa);
      corrected[id].set(ts, value === null ? null : Math.round(value * 10) / 10);
    }
  }
  if (maxRh < HUMID_RH) return null;

  const info = { maxRh: Math.round(maxRh) };
  for (const item of series) {
    if (item.id !== "pm10" && item.id !== "pm25") continue;
    item.custom = { ...(item.custom || {}), humidity: info };
    if (!apply) continue;
    item.data = item.data.map(([ts, value]) => [
      ts,
      value === null || !corrected[item.id].has(ts) ? null : corrected[item.id].get(ts),
    ]);
  }
  return info;
}

function buildSeriesArray(log, legendKey) {
  // Try cache first
  const cacheKey = `${legendKey}|${mapState.timelineMode.value}|${
    mapState.currentDate.value
  }|${getLogSignature(log, props.logRevision)}|rh:${humidityCorrectionOn.value}`;
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

  if (legendKey === "dust") {
    applyHumidityCorrection(
      log,
      processedSeries,
      shouldRestrictByPeriod ? periodStartMs : null,
      periodEndMs,
      humidityCorrectionOn.value
    );
  }

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
        if (["count_rate_cps", "dose_rate_error_pct", "count_rate_error_pct"].includes(rawId))
          return;
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
  margin: 0.6rem 0 0 0.6rem;
  padding: 0.6rem 0.9rem;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #262626;
  background: #f2f2ef;
  border-radius: 12px;
}

/* Measurement tabs and, when the period offers it, the raw / corrected switch: one panel. */
.chart-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin: calc(var(--gap) * 0.75) 0 0 0.6rem;
  padding: 8px;
  border: 1px solid #d9d9d4;
  border-radius: 16px;
  background: #f7f7f5;
}

.chart-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.chart-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 16px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: #262626;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
}

.chart-tab:hover:not(.active) {
  background: #ebebe6;
}

.chart-tab.active {
  background: #141414;
  color: #fff;
  font-weight: 700;
  cursor: default;
}

.chart-tab__icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.chart-view {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chart-view__label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

.chart-view__switch {
  display: flex;
  padding: 3px;
  border-radius: 12px;
  background: #e6e6e1;
}

.chart-view__switch button {
  min-height: 38px;
  padding: 0 14px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #262626;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.chart-view__switch button.active {
  background: #0058c7;
  color: #fff;
  font-weight: 700;
}

.chart-humidity-note {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin: calc(var(--gap) * 0.75) 0 0 0.6rem;
  padding: 14px 16px;
  border: 1px solid #9cc3f5;
  border-radius: 14px;
  background: #eef5ff;
  color: #0d2440;
}

.chart-humidity-note p {
  margin: 0 0 6px;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
}

.chart-humidity-note b {
  font-weight: 700;
}

.chart-humidity-note__icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  margin-top: 2px;
  fill: none;
  stroke: #0058c7;
  stroke-width: 2;
}

.chart-humidity-note__link {
  padding: 0;
  border: 0;
  background: none;
  color: #0058c7;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}

/* Phone: tabs in a 2×2 grid, the switch as a full-width second row of the same panel. */
@media (max-width: 560px) {
  .chart-tabs {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }

  .chart-view {
    width: 100%;
  }

  .chart-view__label {
    display: none;
  }

  .chart-view__switch {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }

  .chart-view__switch button {
    min-height: 44px;
    padding: 4px 8px;
    line-height: 1.2;
  }
}
</style>
