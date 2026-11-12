/**
 * European Air Quality Index (EEA) level for particulate matter.
 *
 * The EEA index is defined on HOURLY mean concentrations (airindex.eea.europa.eu; revision
 * ETC HE 2024/17, July 2025) and has six named levels, no 0–500 number. Here: the mean of the
 * readings in the last 60 minutes of the log, for PM2.5 and PM10; the worse of the two wins.
 *
 * Input:  logs: Array<{ timestamp: number (s), data: { pm25?: number, pm10?: number } }>
 * Output: level 1 (Good) … 6 (Extremely poor), or undefined without PM data.
 */
import aqiEUZones from "../../../measurements/aqi_eu";

const HOUR_S = 60 * 60;

/** EEA level (1…6) for one concentration in µg/m³; upper bounds inclusive, as on the map. */
export function aqiFromConc(conc, pollutant) {
  if (!Number.isFinite(conc) || conc < 0) return null;
  for (const z of aqiEUZones) {
    const bp = z?.[pollutant];
    if (bp && conc <= bp.concentrationMax) return z.valueMax;
  }
  return aqiEUZones[aqiEUZones.length - 1].valueMax;
}

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function calculateAQIIndex(logs) {
  if (!Array.isArray(logs) || logs.length === 0) return undefined;
  let last = -Infinity;
  for (const l of logs) if (Number.isFinite(l?.timestamp) && l.timestamp > last) last = l.timestamp;
  if (!Number.isFinite(last)) return undefined;

  const pm25 = [];
  const pm10 = [];
  for (const l of logs) {
    if (!Number.isFinite(l?.timestamp) || l.timestamp <= last - HOUR_S) continue;
    const d = l.data || {};
    if (Number.isFinite(d.pm25) && d.pm25 >= 0) pm25.push(d.pm25);
    if (Number.isFinite(d.pm10) && d.pm10 >= 0) pm10.push(d.pm10);
  }
  const levels = [
    pm25.length ? aqiFromConc(mean(pm25), "pm25") : null,
    pm10.length ? aqiFromConc(mean(pm10), "pm10") : null,
  ].filter((v) => v !== null);
  return levels.length ? Math.max(...levels) : undefined;
}

export default calculateAQIIndex;
