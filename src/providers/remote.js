import { settings } from "@config";
import { fetchJson } from "@/utils/utils";
import measurements from "../measurements";

const MEAN_METRICS = new Set(
  Object.entries(measurements)
    .filter(([, m]) => m?.hourlyMean)
    .map(([k]) => k.toLowerCase())
);

class Provider {
  constructor(url) {
    this.url = url.replace(/\/$/, "");
    this.start = null;
    this.end = null;
  }

  async status() {
    try {
      const res = await fetch(`${settings.REMOTE_PROVIDER}api/sensor/cities`, {
        method: "HEAD",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  ready() {
    return Promise.resolve(); // Remote provider is always ready
  }

  setStartDate(start) {
    this.start = start;
  }

  setEndDate(end) {
    this.end = end;
  }

  async lastValuesForPeriod(start, end, type) {
    try {
      const result = await fetchJson(
        `${settings.REMOTE_PROVIDER}api/sensor/last/${start}/${end}/${type}`,
        { cache: "no-store" }
      );
      return result?.result || {};
    } catch {
      return {};
    }
  }

  async maxValuesForPeriod(start, end, type) {
    // The PM scale (EEA) is defined on means, not on the day's single highest reading: Daily Recap
    // colours PM by the day's mean (RoSeMAN avgdata). Until a RoSeMAN with avgdata is deployed,
    // this falls back to maxdata, the day's maximum. Other metrics keep the maximum.
    if (MEAN_METRICS.has(String(type).toLowerCase())) {
      try {
        const result = await fetchJson(
          `${settings.REMOTE_PROVIDER}api/v2/sensor/avgdata/${type}/${start}/${end}`,
          { cache: "no-store" }
        );
        if (result?.result) return result.result;
      } catch {
        // no avgdata on this RoSeMAN yet
      }
    }
    try {
      const result = await fetchJson(
        `${settings.REMOTE_PROVIDER}api/v2/sensor/maxdata/${type}/${start}/${end}`,
        { cache: "no-store" }
      );
      return result?.result || {};
    } catch {
      return {};
    }
  }

  async messagesForPeriod(start, end) {
    try {
      const result = await fetchJson(
        `${settings.REMOTE_PROVIDER}api/v2/sensor/messages/${start}/${end}`,
        { cache: "no-store" }
      );
      return result?.result || [];
    } catch {
      return [];
    }
  }

  async getHistoryBySensor(sensor) {
    try {
      const result = await fetchJson(`${settings.REMOTE_PROVIDER}api/sensor/${sensor}`, {
        cache: "no-store",
      });
      return result?.result || [];
    } catch {
      return [];
    }
  }

  async getHistoryPeriodBySensor(sensor, start, end) {
    try {
      const result = await fetchJson(
        `${settings.REMOTE_PROVIDER}api/v2/sensor/${sensor}/${start}/${end}`,
        { cache: "no-store" }
      );
      return result?.result || [];
    } catch {
      return [];
    }
  }

  async getSensorsForPeriod(start, end) {
    try {
      const result = await fetchJson(
        `${settings.REMOTE_PROVIDER}api/v2/sensor/markers/${start}/${end}`,
        { cache: "no-store" }
      );
      return result?.result || [];
    } catch {
      return [];
    }
  }

  watch(cb) {
    // Remote provider doesn't use real-time updates via socket
    // Data is fetched via HTTP requests instead
    if (cb) {
      console.warn("watch() method not supported for remote provider");
    }
  }
}

export default Provider;
