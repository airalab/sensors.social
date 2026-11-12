/**
 * Realtime markers for metrics whose scale is defined on hourly means (src/measurements, hourlyMean):
 * the marker shows the mean of the last 60 minutes of readings from that sensor, not the latest
 * reading, so one puff of smoke does not repaint it. The popup keeps the raw readings.
 */
import measurements from "@/measurements";

const WINDOW_S = 60 * 60;
const HOURLY = new Set(
  Object.entries(measurements)
    .filter(([, m]) => m?.hourlyMean)
    .map(([k]) => k.toLowerCase())
);
const buffers = new Map(); // sensorId -> [{ t, data }]

/**
 * Adds a reading to the sensor's buffer and returns a copy of `data` where hourly-mean metrics
 * are replaced by the mean of the last 60 minutes (the reading itself included).
 * @param {string} sensorId
 * @param {number} timestamp - seconds or milliseconds
 * @param {Object} data - measurement bag
 */
export function withLastHourMean(sensorId, timestamp, data) {
  if (!data || typeof data !== "object") return data;
  const raw = Number(timestamp);
  const t = String(Math.trunc(raw)).length >= 13 ? Math.floor(raw / 1000) : raw;
  if (!sensorId || !Number.isFinite(t)) return data;

  const buf = buffers.get(sensorId) || [];
  if (!buf.some((e) => e.t === t)) buf.push({ t, data });
  const latest = Math.max(...buf.map((e) => e.t));
  const kept = buf.filter((e) => e.t > latest - WINDOW_S);
  buffers.set(sensorId, kept);

  const out = { ...data };
  for (const key of Object.keys(data)) {
    if (!HOURLY.has(key.toLowerCase())) continue;
    const values = kept.map((e) => Number(e.data?.[key])).filter((v) => Number.isFinite(v) && v >= 0);
    if (values.length) out[key] = values.reduce((a, b) => a + b, 0) / values.length;
  }
  return out;
}
