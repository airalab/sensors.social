/** Log keys that are the same measurement under another name. */
const MEASUREMENT_ID_ALIAS = {
  radiation: "gc",
};

/**
 * Some stations publish RadSens as `radiation` in µR/h × 10_000
 * (120714.7 → 12.07 µR/h). The `gc` field is already µR/h, so it is left alone.
 * Readings already in µR/h stay under this threshold.
 */
const RADIATION_SCALE = 10000;
const RADIATION_SCALE_MIN = 1000;

export function canonicalMeasurementId(id) {
  const key = String(id || "").toLowerCase();
  return MEASUREMENT_ID_ALIAS[key] || key;
}

export function measurementValue(rawId, rawValue) {
  if (String(rawId || "").toLowerCase() !== "radiation") return rawValue;
  const n = Number(rawValue);
  if (!Number.isFinite(n) || Math.abs(n) < RADIATION_SCALE_MIN) return rawValue;
  return Math.round((n / RADIATION_SCALE) * 100) / 100;
}
