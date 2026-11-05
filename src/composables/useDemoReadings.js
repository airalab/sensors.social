/**
 * Demo preview readings for the sensor popup kiosk.
 *
 * Demo does not invent its own palette. Each value is matched to a zone in
 * `src/measurements/<unit>.js` (same catalog as the map and the scales table).
 * Zone `color` is a CSS variable from `src/assets/styles/variables.css`
 * (`--measure-green`, `--measure-yellow`, …). DemoShowcase paints numbers,
 * chips and progress bars with that token via `--zone-color`.
 *
 * `demoItems` — kiosk subset (indoor vs outdoor), with PM2.5 + PM10 merged
 * into one Air quality card (`parts`). Call once from Data.vue and pass down.
 */
import { computed, ref, toValue, watch } from "vue";
import { useI18n } from "vue-i18n";
import measurements from "../measurements";
import { measurementValue } from "../measurements/aliases";
import { findZoneForValue, zoneLabelForLocale } from "../measurements/tools";
import { MEASUREMENT_GROUP_LOOKUP } from "@/measurements/groups";
import { isEncryptedSensorValue } from "@/utils/sensorValueCrypto";
import { resolveSensorType } from "@/composables/sensorDeviceTypes";

const ZONE_SOURCE_ALIAS = { airtemp: "temperature" };

/** Catalog order for the full `items` list (not the kiosk grid). */
const DISPLAY_ORDER = [
  "pm25",
  "pm10",
  "co2",
  "temperature",
  "airtemp",
  "humidity",
  "noise",
  "noisemax",
  "noiseavg",
  "pressure",
  "gc",
  "dose_rate_nsv_h",
];

const NOISE_KEYS = ["noisemax", "noiseavg", "noise"];

/** First-screen card order. Outdoor ends with PM so Air quality can span the last row. */
const DEMO_OUTDOOR_ORDER = [
  "temperature",
  "airtemp",
  "humidity",
  "noisemax",
  "noiseavg",
  "noise",
  "pressure",
  "dose_rate_nsv_h",
  "pm25",
  "pm10",
];
const DEMO_INDOOR_ORDER = ["co2", "temperature", "airtemp", "humidity", "pressure"];

/** Font Awesome icons for demo cards only; map markers keep their own set. */
const DEMO_ICONS = {
  pm25: "fa-solid fa-leaf",
  pm10: "fa-solid fa-leaf",
  co2: "fa-solid fa-wind",
  temperature: "fa-solid fa-temperature-high",
  airtemp: "fa-solid fa-temperature-high",
  humidity: "fa-solid fa-droplet",
  noise: "fa-solid fa-volume-high",
  noisemax: "fa-solid fa-volume-high",
  noiseavg: "fa-solid fa-volume-high",
  pressure: "fa-solid fa-gauge-high",
  dose_rate_nsv_h: "fa-solid fa-radiation",
};

/** One hint per zone index, aligned with `measurement.zones` in src/measurements/. */
const DEMO_HINTS = {
  temperature: [
    { en: "Dress warmer", ru: "Оденьтесь теплее" },
    { en: "Stay warm", ru: "Согрейтесь" },
    { en: "A light layer", ru: "Легкая куртка" },
    { en: "All good", ru: "Всё в порядке" },
    { en: "Seek shade", ru: "Ищите тень" },
    { en: "Drink water", ru: "Пейте воду" },
  ],
  humidity: [
    { en: "Add moisture", ru: "Увлажните воздух" },
    { en: "A bit dry", ru: "Суховато" },
    { en: "All good", ru: "Всё в порядке" },
    { en: "Air the room", ru: "Проветрите" },
    { en: "Too muggy", ru: "Душновато" },
  ],
  noise: [
    { en: "Nice and quiet", ru: "Тихо и спокойно" },
    { en: "All good", ru: "Всё в порядке" },
    { en: "A bit noisy", ru: "Шумновато" },
    { en: "Too loud", ru: "Слишком громко" },
    { en: "Protect ears", ru: "Берегите слух" },
  ],
  pm25: [
    { en: "All good", ru: "Всё в порядке" },
    { en: "Limit time outside", ru: "Меньше на улице" },
    { en: "Stay indoors", ru: "Останьтесь внутри" },
    { en: "Close windows", ru: "Закройте окна" },
    { en: "Avoid going out", ru: "Не выходите" },
  ],
  co2: [
    { en: "Fresh air", ru: "Свежий воздух" },
    { en: "All good", ru: "Всё в порядке" },
    { en: "Air the room", ru: "Проветрите" },
    { en: "Open a window", ru: "Откройте окно" },
    { en: "Leave the room", ru: "Выйдите ненадолго" },
  ],
  pressure: [
    { en: "Unsettled weather", ru: "Неустойчивая погода" },
    { en: "All good", ru: "Всё в порядке" },
    { en: "Clear weather", ru: "Ясная погода" },
    { en: "Go easy", ru: "Берегите себя" },
  ],
};

// Alias extra log keys to the hint lists above.
DEMO_HINTS.airtemp = DEMO_HINTS.temperature;
DEMO_HINTS.pm10 = DEMO_HINTS.pm25;
DEMO_HINTS.noisemax = DEMO_HINTS.noise;
DEMO_HINTS.noiseavg = DEMO_HINTS.noise;

function hintForLocale(key, zoneIndex, loc) {
  const list = DEMO_HINTS[key];
  if (!list?.length) return "";
  const row = list[Math.min(Math.max(zoneIndex, 0), list.length - 1)];
  return row?.[loc] || row?.en || "";
}

/** Fill % of the card track: position inside the current zone, then across all zones. */
function zoneProgressPercent(measurement, value) {
  const zones = measurement?.zones;
  if (!Array.isArray(zones) || zones.length === 0) return 12;
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;

  const caps = zones.map((z) => (typeof z.valueMax === "number" ? z.valueMax : null));
  let index = caps.findIndex((cap) => cap != null && n <= cap);
  if (index === -1) index = zones.length - 1;

  const prev = index === 0 ? null : caps[index - 1];
  const next = caps[index];
  const following = caps[index + 1];

  let start;
  if (prev != null) {
    start = prev;
  } else if (next != null) {
    const step = following != null ? Math.abs(following - next) : Math.abs(next);
    start = next - (step || Math.abs(next) || 1);
    if (n >= 0 && next >= 0) start = Math.min(0, start);
  } else {
    start = n;
  }

  const end =
    next != null ? next : start + Math.max(Math.abs(start) * 0.5, 12);
  const span = end - start || 1;
  const t = Math.min(1, Math.max(0, (n - start) / span));
  return Math.max(12, Math.round(((index + t) / zones.length) * 100));
}

function entryTimestamp(entry) {
  const ts = Number(entry?.timestamp);
  return Number.isFinite(ts) ? ts : -Infinity;
}

/** Log row with the latest timestamp (same edge the chart plots). */
function latestLogEntry(logValue) {
  if (!Array.isArray(logValue) || logValue.length === 0) return null;
  let best = null;
  let bestTs = -Infinity;
  for (const entry of logValue) {
    if (!entry?.data || typeof entry.data !== "object") continue;
    const ts = entryTimestamp(entry);
    if (ts >= bestTs) {
      bestTs = ts;
      best = entry;
    }
  }
  return best;
}

/** Overlay numeric keys from `overlay` onto `base`; skip empty so sparse packets keep prior metrics. */
function mergeNumericBag(base, overlay) {
  const next = base && typeof base === "object" ? { ...base } : {};
  if (!overlay || typeof overlay !== "object") {
    return Object.keys(next).length ? next : null;
  }
  for (const [key, val] of Object.entries(overlay)) {
    if (numericValue(val) == null) continue;
    next[key] = val;
  }
  return Object.keys(next).length ? next : null;
}

/** Log row with the most numeric keys; tie-break by latest timestamp. */
function fullestLogBag(logValue) {
  if (!Array.isArray(logValue) || logValue.length === 0) return null;
  let best = null;
  let bestCount = -1;
  let bestTs = -Infinity;
  for (const entry of logValue) {
    const data = entry?.data;
    if (!data || typeof data !== "object") continue;
    let count = 0;
    for (const val of Object.values(data)) {
      if (numericValue(val) != null) count += 1;
    }
    if (!count) continue;
    const ts = entryTimestamp(entry);
    if (count > bestCount || (count === bestCount && ts >= bestTs)) {
      bestCount = count;
      bestTs = ts;
      best = data;
    }
  }
  return best;
}

/**
 * Current measurement bag for demo cards / now strip.
 * Merge the fullest historical row + the latest row + live `point.data`.
 * A pubsub tick often has fewer keys than a remote log row; using only the
 * last row would drop PM and collapse the Air quality card (grid jump).
 */
function latestBag(log, point) {
  const logValue = toValue(log);
  const livePoint = toValue(point);
  const live = livePoint?.data && typeof livePoint.data === "object" ? livePoint.data : null;
  const entry = latestLogEntry(logValue);
  const fromLog = entry?.data && typeof entry.data === "object" ? entry.data : null;

  void livePoint?.timestamp;
  void livePoint?._logsKey;
  void livePoint?._decryptRev;
  if (Array.isArray(logValue)) void logValue.length;
  if (live) {
    for (const key of Object.keys(live)) void live[key];
  }

  return mergeNumericBag(mergeNumericBag(fullestLogBag(logValue), fromLog), live);
}

function bagValue(bag, key) {
  if (!bag || typeof bag !== "object") return undefined;
  if (Object.prototype.hasOwnProperty.call(bag, key)) return bag[key];
  const found = Object.keys(bag).find((k) => String(k).toLowerCase() === key);
  return found != null ? bag[found] : undefined;
}

function numericValue(raw) {
  if (raw == null || isEncryptedSensorValue(raw)) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function formatDisplayValue(measurement, value) {
  const calculated =
    typeof measurement?.calculate === "function" ? measurement.calculate(value) : value;
  const n = Number(calculated);
  if (!Number.isFinite(n)) return "";
  const abs = Math.abs(n);
  const digits = abs >= 100 ? 0 : 1;
  return n.toFixed(digits).replace(/\.0$/, "");
}

function sortByOrder(keys, order) {
  const rank = (key) => {
    const i = order.indexOf(key);
    return i === -1 ? order.length : i;
  };
  return [...keys].sort((a, b) => {
    const diff = rank(a) - rank(b);
    return diff !== 0 ? diff : a.localeCompare(b);
  });
}

/** Keep first matching key per order; skip duplicate airtemp/noise variants. */
function pickByOrder(items, order, limit = Infinity) {
  const picked = [];
  for (const key of order) {
    const item = items.find((row) => row.key === key);
    if (!item) continue;
    if (key === "airtemp" && items.some((row) => row.key === "temperature")) continue;
    if (NOISE_KEYS.includes(key) && picked.some((row) => NOISE_KEYS.includes(row.key))) continue;
    picked.push(item);
    if (picked.length >= limit) break;
  }
  return picked;
}

/** Insight, or a CO2 sensor without PM → indoor kiosk layout (no Air quality card). */
function isIndoorContext(items, point, log) {
  const type = resolveSensorType(toValue(point), toValue(log));
  if (type === "insight") return true;
  const hasCo2 = items.some((row) => row.key === "co2");
  const hasPm = items.some((row) => row.key === "pm25" || row.key === "pm10");
  return hasCo2 && !hasPm;
}

export function isDemoPair(item) {
  return Array.isArray(item?.parts) && item.parts.length > 1;
}

/** Flatten a card to the keys the carousel/chart can switch to. */
export function demoItemKeys(item) {
  if (isDemoPair(item)) return item.parts.map((part) => part.key);
  return item?.key ? [item.key] : [];
}

/** One chart slide per measurement group (climate / dust / noise collapse to a single type). */
export function demoChartTypes(items) {
  const seen = new Set();
  const types = [];
  for (const item of items || []) {
    for (const key of demoItemKeys(item)) {
      if (key === "aqi") continue;
      const group = MEASUREMENT_GROUP_LOOKUP[key] || key;
      if (seen.has(group)) continue;
      seen.add(group);
      types.push(key);
    }
  }
  return types;
}

export function asDemoPart(item) {
  return {
    key: item.key,
    name: item.shortName || item.name,
    displayValue: item.displayValue,
    unit: item.unit,
    zoneLabel: item.zoneLabel,
    color: item.color,
    progress: item.progress,
    hint: item.hint,
    value: item.value,
  };
}

/** Fold PM2.5 + PM10 into one Air quality card. Header tint follows the worse zone. */
function mergePmAsAirQuality(items, airQualityName) {
  const pm25 = items.find((row) => row.key === "pm25");
  const pm10 = items.find((row) => row.key === "pm10");
  if (!pm25 && !pm10) return items;

  const others = items.filter((row) => row.key !== "pm25" && row.key !== "pm10");
  const sources = [pm25, pm10].filter(Boolean);
  const worst = sources.reduce((a, b) => (b.zoneIndex > a.zoneIndex ? b : a));
  const primary = pm25 || pm10;

  return [
    ...others,
    {
      key: primary.key,
      name: airQualityName,
      icon: DEMO_ICONS.pm25,
      zoneLabel: sources.map((row) => `${row.shortName || row.name} ${row.zoneLabel}`).join(" · "),
      color: worst.color,
      displayValue: primary.displayValue,
      unit: primary.unit,
      progress: worst.progress,
      hint: worst.hint,
      parts: sources.map(asDemoPart),
    },
  ];
}

function patchDemoItem(dst, src) {
  dst.displayValue = src.displayValue;
  dst.zoneLabel = src.zoneLabel;
  dst.zoneIndex = src.zoneIndex;
  dst.color = src.color;
  dst.progress = src.progress;
  dst.hint = src.hint;
  dst.value = src.value;
  dst.name = src.name;
  dst.shortName = src.shortName;
  dst.unit = src.unit;
  if (!Array.isArray(src.parts) || !Array.isArray(dst.parts)) return;
  // Never shrink the Air quality split — a 2-col card becoming 1-col reflows the grid.
  const n = Math.min(dst.parts.length, src.parts.length);
  for (let i = 0; i < n; i += 1) {
    if (dst.parts[i]?.key === src.parts[i].key) patchDemoItem(dst.parts[i], src.parts[i]);
  }
}

export function useDemoReadings(log, point) {
  const { t, locale } = useI18n();
  const localeCode = computed(() => localStorage.getItem("locale") || locale.value || "en");

  const heldBag = ref(null);
  const indoorLocked = ref(null);

  const incomingBag = computed(() => latestBag(log, point));

  const items = computed(() => {
    const bag = heldBag.value || incomingBag.value;
    if (!bag) return [];

    const loc = localeCode.value;
    const hasTemperature = numericValue(bagValue(bag, "temperature")) != null;
    const rows = [];
    const uniqueKeys = [...new Set(Object.keys(bag).map((k) => String(k).toLowerCase()))];

    for (const key of sortByOrder(uniqueKeys, DISPLAY_ORDER)) {
      if (key === "airtemp" && hasTemperature) continue;

      const raw = bagValue(bag, key);
      const value = numericValue(key === "dose_rate_nsv_h" ? measurementValue(key, raw) : raw);
      if (value == null) continue;

      const sourceKey = ZONE_SOURCE_ALIAS[key] || key;
      const measurement = measurements[sourceKey];
      if (!measurement?.zones?.length) continue;

      const asNoise = NOISE_KEYS.includes(key);
      // Zone table lives on the measurement module; hex values live in variables.css.
      const zone = findZoneForValue(measurement, value);
      const zoneLabel = zoneLabelForLocale(zone, loc);
      if (!zoneLabel) continue;

      const noiseName = measurements.noise?.nameshort?.[loc] || measurements.noise?.label || key;
      const shortName =
        measurement?.nameshort?.[loc] || measurement?.label || key;
      const zoneIndex = Math.max(0, (measurement.zones || []).indexOf(zone));

      rows.push({
        key,
        name: asNoise ? noiseName : shortName,
        shortName,
        zoneLabel,
        zoneIndex,
        value,
        // Same token as the map / scales, e.g. `var(--measure-green)` from variables.css.
        color: zone?.color || "var(--measure-nodata)",
        displayValue: formatDisplayValue(measurement, value),
        unit: measurement.unit || "",
        icon: DEMO_ICONS[key] || DEMO_ICONS[sourceKey] || "fa-solid fa-chart-simple",
        progress: zoneProgressPercent(measurement, value),
        hint: hintForLocale(sourceKey, zoneIndex, loc),
      });
    }

    return rows;
  });

  const indoor = computed(() => {
    if (indoorLocked.value != null) return indoorLocked.value;
    return isIndoorContext(items.value, point, log);
  });

  const liveDemoItems = computed(() =>
    mergePmAsAirQuality(
      pickByOrder(items.value, indoor.value ? DEMO_INDOOR_ORDER : DEMO_OUTDOOR_ORDER),
      t("sensorpopup.air_quality")
    )
  );

  const demoItems = ref([]);

  function resetHeld(id, prev) {
    if (prev !== undefined && id !== prev) {
      heldBag.value = null;
      indoorLocked.value = null;
      demoItems.value = [];
    }
  }

  watch(
    () => toValue(point)?.sensor_id,
    resetHeld
  );

  watch(
    incomingBag,
    (next) => {
      if (!next) return;
      heldBag.value = mergeNumericBag(heldBag.value, next);
    },
    { immediate: true }
  );

  watch(
    items,
    (rows) => {
      if (demoItems.value.length) return;
      const hasPm = rows.some((row) => row.key === "pm25" || row.key === "pm10");
      if (hasPm) {
        indoorLocked.value = false;
        return;
      }
      if (indoorLocked.value != null) return;
      const guess = isIndoorContext(rows, point, log);
      const hasCo2 = rows.some((row) => row.key === "co2");
      if (guess || hasCo2) indoorLocked.value = true;
    },
    { immediate: true }
  );

  watch(
    liveDemoItems,
    (next) => {
      if (!Array.isArray(next) || !next.length) return;
      const cur = demoItems.value;
      if (!cur.length) {
        demoItems.value = next;
        return;
      }
      // Freeze the first-screen grid: only paint new numbers onto existing cards.
      const byKey = new Map(next.map((item) => [item.key, item]));
      cur.forEach((dst) => {
        const src = byKey.get(dst.key);
        if (src) patchDemoItem(dst, src);
      });
    },
    { immediate: true }
  );

  return { demoItems };
}
