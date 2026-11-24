/**
 * Device type resolution and popup UI helpers (diy / urban / insight / dual).
 * Pure functions — no Vue state. Used by picker, meta, and map marker icons.
 */
import {
  getCachedSensorMeta,
  inferDeviceTypeFromLog,
  listBundleSensorEntries,
  hasSensorOwner,
  sensorTypeFromDeviceModel,
} from "../utils/map/sensors/requests";

import { sensorPin } from "@/utils/sensorPins";
import diyPrototypeIcon from "@/assets/images/altruist-device/altruist-diy-prototype.webp";
import dualDefaultIcon from "@/assets/images/altruist-device/altruist-dual-default-icon.webp";
import insightDefaultIcon from "@/assets/images/altruist-device/altruist-insight-default-icon.webp";
import urbanDefaultIcon from "@/assets/images/altruist-device/altruist-urban-default-icon.webp";

/**
 * Sensor device kind for UI: diy / insight / urban / altruist.
 * DIY sensors have no owner; Altruist devices use device_model (or cached IDB / bundle type).
 */
export function resolveSensorType(point, logOverride = null) {
  if (!point) return "diy";

  // Government stations have no owner account, yet they are not DIY. The marker carries
  // device_model "gov"; a card opened by link has only the id, so the pinned config tells.
  if (sensorTypeFromDeviceModel(point.device_model) === "gov") return "gov";
  if (sensorPin(point.sensor_id)?.kind === "gov") return "gov";

  if (!hasSensorOwner(point)) return "diy";

  const fromModel = sensorTypeFromDeviceModel(point.device_model);
  if (fromModel) return fromModel;

  const log = logOverride ?? (Array.isArray(point?.logs) ? point.logs : null);
  const fromLog = inferDeviceTypeFromLog(log);
  if (fromLog) return fromLog;

  const sid = String(point.sensor_id || "");
  const fromBundle = Array.isArray(point.ownerSensorsWithData)
    ? point.ownerSensorsWithData.find((o) => String(o?.id || o?.sensor_id || "") === sid)?.type
    : null;
  if (fromBundle) return fromBundle;

  if (sid) {
    const meta = getCachedSensorMeta(sid);
    if (meta) {
      const entry = listBundleSensorEntries(meta).find((e) => String(e.sensor_id) === sid);
      const fromMeta = sensorTypeFromDeviceModel(entry?.device_model);
      if (fromMeta) return fromMeta;
      const fromMetaLog = inferDeviceTypeFromLog(meta?.data?.[sid]);
      if (fromMetaLog) return fromMetaLog;
    }
  }

  const cached = point.idbSensorType;
  if (cached && cached !== "altruist") return cached;

  return "altruist";
}

/** Short id for picker label: `4Hq6vZ…YUrZV`. */
export function formatSensorIdShort(id) {
  const s = String(id || "");
  if (!s) return "";
  if (s.length <= 14) return s;
  return `${s.slice(0, 6)}…${s.slice(-6)}`;
}

export function isSensorAddressReady(address) {
  return Boolean(address) && address !== "Loading address...";
}

/** Sensor picker trigger: device type / owner bundle resolved. */
export function isPanelSensorPickerReady(point) {
  const sid = String(point?.sensor_id || "");
  if (!sid) return false;
  if (point.device_model || point.idbSensorType) return true;
  if (hasSensorOwner(point)) {
    return (
      Array.isArray(point.ownerSensorsWithData) ||
      Boolean(point.ownerSensorIds?.length) ||
      Boolean(point.device_model) ||
      Boolean(point.idbSensorType)
    );
  }
  return point._ownerResolved === true;
}

/** Owner block: resolved (owner known or confirmed DIY / government station without owner). */
export function isPanelOwnerResolved(point) {
  if (point?.idbSensorType === "diy") return true;
  if (resolveSensorType(point) === "gov") return true;
  if (hasSensorOwner(point)) return true;
  return point?._ownerResolved === true;
}

export function isPanelOwnerLoading(point) {
  const sid = String(point?.sensor_id || "");
  if (!sid || point?.idbSensorType === "diy") return false;
  if (resolveSensorType(point) === "gov") return false;
  if (hasSensorOwner(point)) return false;
  return !isPanelOwnerResolved(point);
}

/** Chart / timeline: logs still loading. */
export function isSensorLogsLoading(point, log, { provider, timelineMode } = {}) {
  if (!Array.isArray(log)) return true;
  if (
    provider === "realtime" &&
    timelineMode === "realtime" &&
    !point?._logsKey &&
    log.length === 0
  ) {
    return true;
  }
  return false;
}

/** Human-readable label for sensor picker and page meta. */
export function sensorTypeTitle(type) {
  if (type === "diy") return "DIY";
  if (type === "gov") return "Government station";
  if (type === "insight") return "Altruist Insight";
  if (type === "urban") return "Altruist Urban";
  if (type === "altruist") return "Altruist Urban";
  return "Altruist Urban";
}

/**
 * WebP asset for map marker or picker (dual = urban + insight at same geo).
 * A government station shows its network's logo from the pinned config.
 */
export function sensorTypeIcon(type, sensorId = null) {
  if (type === "gov") return sensorPin(sensorId)?.icon || diyPrototypeIcon;
  if (type === "diy") return diyPrototypeIcon;
  if (type === "insight") return insightDefaultIcon;
  if (type === "dual") return dualDefaultIcon;
  return urbanDefaultIcon;
}
