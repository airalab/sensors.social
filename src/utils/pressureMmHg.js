/** Map charts and markers expect mmHg. Firmware JSON is Pascal; proto BME is deciPascal. */

const PA_TO_MMHG = 1 / 133.3223684211;
const PASCAL_THRESHOLD = 3000;
const PASCAL_TIMES_100_THRESHOLD = 200000;

export function pressureToMmHg(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  let x = n;
  if (x > PASCAL_TIMES_100_THRESHOLD) x /= 100;
  if (x >= PASCAL_THRESHOLD) x *= PA_TO_MMHG;
  return x;
}

function isWireString(value) {
  return typeof value === "string";
}

function firstDefined(...values) {
  for (const value of values) {
    if (value != null && value !== "") return value;
  }
  return undefined;
}

/** Pascal → mmHg, and proto/JSON noise aliases (`noise` / `dba` → noisemax). */
export function normalizeMeasurementBag(data) {
  if (!data || typeof data !== "object") return data;
  const out = { ...data };
  if (out.pressure != null && !isWireString(out.pressure)) {
    out.pressure = pressureToMmHg(out.pressure);
  }
  const noiseMax = firstDefined(
    out.noisemax,
    out.noise_max,
    out.noiseMax,
    out.dba_max,
    out.dbamax,
    out.noisemax_dba,
    out.dba,
    out.noise
  );
  const noiseAvg = firstDefined(
    out.noiseavg,
    out.noise_avg,
    out.noiseAvg,
    out.dba_avg,
    out.dbaavg,
    out.noiseavg_dba
  );
  if (out.noisemax == null && noiseMax != null) out.noisemax = noiseMax;
  if (out.noiseavg == null && noiseAvg != null) out.noiseavg = noiseAvg;
  return out;
}
