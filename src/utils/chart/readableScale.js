/**
 * Шкала с изломом для суточных графиков.
 * Обычные значения остаются линейными и занимают большую часть высоты,
 * а редкий выброс сжимается в верхнюю полосу — пик виден, но не сплющивает день.
 */

const DETAIL_SHARE = 0.74;
const SPIKE_TOP = 0.92;
const MAX_SPIKE_FRACTION = 0.6;
const MIN_RANGE_RATIO = 4;

export function formatScaleValue(value) {
  if (!Number.isFinite(value)) return "";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 100) return String(Math.round(value));
  if (abs >= 10) {
    const rounded = Math.round(value);
    if (Math.abs(value - rounded) <= Math.max(0.05, abs * 0.01)) return String(rounded);
    return String(Math.round(value * 10) / 10);
  }
  if (abs >= 1) {
    const tenths = Math.round(value * 10) / 10;
    return Number.isInteger(tenths) ? String(tenths) : tenths.toFixed(1);
  }
  return (Math.round(value * 100) / 100).toFixed(2);
}

function niceStep(span, targetCount) {
  if (!(span > 0)) return 1;
  const rough = span / Math.max(targetCount, 1);
  const pow = 10 ** Math.floor(Math.log10(rough));
  const fraction = rough / pow;
  const nice = fraction >= 7.5 ? 10 : fraction >= 3.5 ? 5 : fraction >= 1.5 ? 2 : 1;
  return nice * pow;
}

function buildTicks(axisMin, knee) {
  const span = knee - axisMin;
  const step = niceStep(span, 4);
  const epsilon = step * 1e-6;
  const ticks = [];
  let value = Math.ceil((axisMin - epsilon) / step) * step;
  if (!Number.isFinite(value)) value = axisMin;

  for (; value <= knee + epsilon; value += step) {
    if (value < axisMin - epsilon) continue;
    ticks.push(Number(value.toFixed(6)));
  }

  if (!ticks.length || ticks[0] - axisMin > step * 0.35) ticks.unshift(axisMin);

  const minGap = span * 0.09;
  const compact = [];
  ticks.forEach((tick) => {
    if (!compact.length || tick - compact[compact.length - 1] >= minGap) compact.push(tick);
  });

  return compact;
}

function isSpikeGap(lo, hi, min, max, fractionAbove) {
  // Доля сверху может быть и половиной дня: сенсор часами сидит на потолке,
  // а спокойные часы всё равно нужно читать. Отсекает не доля, а сам отрыв.
  if (!(fractionAbove > 0 && fractionAbove <= MAX_SPIKE_FRACTION)) return false;
  const full = max - min;
  const gap = hi - lo;
  if (!(full > 0)) return false;
  // Дырка должна быть крупной относительно всего, что ниже, а не просто шумом.
  const body = Math.max(lo - min, full * 0.02);
  if (gap < body * 1.5) return false;
  const ratio = full / body;
  if (ratio < MIN_RANGE_RATIO) return false;
  // Редкий пик может быть всего в 4 раза выше дня. Если наверху половина точек,
  // этого мало: иначе обычный PM10 уедет в полосу только потому, что он выше PM2.5.
  if (fractionAbove > 0.12 && ratio < 8) return false;
  return true;
}

/**
 * @param {number[]} values
 * @returns {null | {
 *   axisMin: number,
 *   knee: number,
 *   max: number,
 *   detailShare: number,
 *   spikeTop: number,
 *   ticks: number[],
 *   toDisplay: (value: number) => number,
 *   fromDisplay: (value: number) => number,
 * }}
 */
export function findReadableScale(values) {
  const nums = [];
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) nums.push(value);
  }
  if (nums.length < 8) return null;

  nums.sort((a, b) => a - b);
  const dataMin = nums[0];
  const dataMax = nums[nums.length - 1];
  const full = dataMax - dataMin;
  if (!(full > 0)) return null;

  // Берём самую высокую «полку» под выбросом: вторичные скачки остаются
  // в линейной части, сжимается только то, что всё ещё в разы выше.
  let normalMax = null;
  for (let i = 1; i < nums.length; i++) {
    const lo = nums[i - 1];
    const hi = nums[i];
    const fractionAbove = (nums.length - i) / nums.length;
    if (!isSpikeGap(lo, hi, dataMin, dataMax, fractionAbove)) continue;
    if (normalMax == null || lo > normalMax) normalMax = lo;
  }
  // Плавный подъём не оставляет дырки между точками, хотя пик всё равно
  // в разы выше обычного дня. Тогда полка — верх типичных значений.
  if (normalMax == null) {
    const shelfIndex = Math.min(nums.length - 2, Math.floor((nums.length - 1) * 0.9));
    const shelf = nums[shelfIndex];
    const body = Math.max(shelf - dataMin, full * 0.02);
    const maxShelf = dataMin + full / MIN_RANGE_RATIO;
    if (shelf < maxShelf && dataMax - shelf >= body * 1.5) {
      const shelfCap = Math.min(shelf + body * 0.75, maxShelf);
      let cursor = shelf;
      for (let i = shelfIndex; i < nums.length; i++) {
        if (nums[i] > shelfCap) break;
        cursor = nums[i];
      }
      if (dataMax > cursor) normalMax = cursor;
    }
  }
  if (normalMax == null) return null;

  const firstSpike = nums.find((value) => value > normalMax);
  if (firstSpike == null || !(dataMax > firstSpike - 1e-9)) return null;

  const bodySpan = Math.max(normalMax - dataMin, full * 0.02);
  let knee = normalMax + bodySpan * 0.12;
  knee = Math.min(knee, normalMax + (firstSpike - normalMax) * 0.35);
  if (!(dataMax > knee)) return null;

  let axisMin = dataMin;
  if (dataMin > 0) {
    axisMin = dataMin < bodySpan * 0.25 ? 0 : dataMin - bodySpan * 0.06;
  }

  const maxKnee = axisMin + (dataMax - axisMin) / MIN_RANGE_RATIO;
  if (knee > maxKnee) knee = maxKnee;
  if (!(knee > normalMax) || !(dataMax > knee)) return null;

  const detail = knee - axisMin;
  if (!(detail > 0) || (dataMax - axisMin) / detail < MIN_RANGE_RATIO - 1e-6) return null;

  return createScale(axisMin, knee, dataMax);
}

function createScale(axisMin, knee, max) {
  const detail = knee - axisMin;
  const spike = max - knee;

  const toDisplay = (value) => {
    if (value <= knee) return ((value - axisMin) / detail) * DETAIL_SHARE;
    return DETAIL_SHARE + ((value - knee) / spike) * (SPIKE_TOP - DETAIL_SHARE);
  };

  const fromDisplay = (display) => {
    if (display <= DETAIL_SHARE) return axisMin + (display / DETAIL_SHARE) * detail;
    const t = (display - DETAIL_SHARE) / (SPIKE_TOP - DETAIL_SHARE);
    return knee + t * spike;
  };

  return {
    axisMin,
    knee,
    max,
    detailShare: DETAIL_SHARE,
    spikeTop: SPIKE_TOP,
    ticks: buildTicks(axisMin, knee),
    toDisplay,
    fromDisplay,
  };
}

function seriesPointY(point) {
  if (Array.isArray(point)) return point[1];
  return point?.y;
}

/** Цвет зоны шкалы, в которую попадает реальное значение. */
export function colorForZoneValue(zones, value) {
  if (!Array.isArray(zones) || !zones.length || !Number.isFinite(value)) return null;
  for (const zone of zones) {
    if (zone.value == null || value <= zone.value) return zone.color ?? null;
  }
  return zones[zones.length - 1].color ?? null;
}

/**
 * Пороги зон переводятся в координаты сжатой шкалы.
 * Цвет линии остаётся цветом реального значения, в том числе выше пунктира.
 */
export function zonesForReadableScale(zones, scale) {
  const source = Array.isArray(zones) ? zones : [];
  return source.map((zone) =>
    zone.value == null ? { ...zone } : { ...zone, value: scale.toDisplay(zone.value) }
  );
}

/**
 * Копирует серии и, если в единицах есть одиночный выброс, переводит Y в шкалу с изломом.
 * Реальное значение остаётся в custom.realY для тултипа.
 * @param {Array} seriesList
 */
export function applyReadableScale(seriesList) {
  const byUnit = new Map();
  seriesList.forEach((series) => {
    const unit = series.unit || "";
    if (!byUnit.has(unit)) byUnit.set(unit, []);
    byUnit.get(unit).push(series);
  });

  const scales = new Map();
  byUnit.forEach((list, unit) => {
    const values = [];
    list.forEach((series) => {
      series.data.forEach((point) => {
        const y = seriesPointY(point);
        if (typeof y === "number" && Number.isFinite(y)) values.push(y);
      });
    });
    const scale = findReadableScale(values);
    if (!scale) return;

    let peakColor = null;
    list.forEach((series) => {
      let seriesMax = -Infinity;
      series.data.forEach((point) => {
        const y = seriesPointY(point);
        if (typeof y === "number" && y > seriesMax) seriesMax = y;
      });
      if (seriesMax === scale.max) peakColor = colorForZoneValue(series.zones, seriesMax);
    });
    scale.peakColor = peakColor;
    scales.set(unit, scale);
  });

  if (scales.size === 0) return { series: seriesList, scales };

  const series = seriesList.map((item) => {
    const scale = scales.get(item.unit || "");
    if (!scale) return item;

    let peakIndex = -1;
    let peakValue = -Infinity;
    item.data.forEach((point, index) => {
      const y = seriesPointY(point);
      if (typeof y === "number" && y > peakValue) {
        peakValue = y;
        peakIndex = index;
      }
    });

    const data = item.data.map((point, index) => {
      const x = Array.isArray(point) ? point[0] : point?.x;
      const y = seriesPointY(point);
      if (typeof y !== "number" || !Number.isFinite(y)) return [x, null];

      const next = { x, y: scale.toDisplay(y), custom: { realY: y } };
      if (index === peakIndex && y > scale.knee) {
        const valueLabel = formatScaleValue(y);
        const caption = item.shortName ? `${item.shortName} ${valueLabel}` : valueLabel;
        const ownsAxisPeak = y === scale.max;
        next.dataLabels = {
          enabled: true,
          format: caption,
          y: ownsAxisPeak ? -10 : 16,
          backgroundColor: "rgba(255,255,255,0.94)",
          borderRadius: 4,
          padding: 3,
          style: {
            fontSize: "11px",
            fontWeight: "700",
            color: "#1c1c1c",
            textOutline: "none",
          },
        };
      }
      return next;
    });

    const zones = zonesForReadableScale(item.zones, scale);

    return {
      ...item,
      data,
      zones,
      custom: { readableScale: true },
      dataGrouping: { enabled: false },
      dataLabels: {
        enabled: false,
        crop: false,
        overflow: "allow",
        allowOverlap: true,
        style: {
          fontSize: "11px",
          fontWeight: "700",
          color: "#222222",
          textOutline: "3px #ffffff",
        },
      },
    };
  });

  return { series, scales };
}
