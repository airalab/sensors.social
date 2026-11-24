/**
 * Map marker icons: dual vs single-device (urban / insight / diy).
 * Dual is shown only when Urban and Insight siblings share the same geo cluster (≤ 3 km),
 * not when they merely share an owner account nationwide.
 */
import { sensorPin } from "@/utils/sensorPins";
import { dayISO } from "@/utils/date";
import { resolveSensorType, sensorTypeIcon } from "@/composables/sensorDeviceTypes";
import {
  inferTypesForOwnerIds,
  isMarkerSiblingNearAnchor,
  markerSensorsEntries,
  resolveBundleAnchorGeo,
  resolveOwnerSensorIds,
} from "@/composables/sensorOwnerBundle";
import {
  dedupeSensorsForMap,
  getCachedSensorMeta,
  hasSensorOwner,
  isMarkerIconsDayStale,
  listBundleSensorEntries,
  normalizeOwnerKey,
  parseBundleSensorEntry,
  peekMarkerIconCache,
  rememberMarkerIcon,
  rosemanMarkerIconsEnabledForDate,
  sensorTypeFromDeviceModel,
} from "../utils/map/sensors/requests";
import { hasValidCoordinates } from "../utils/utils";

/** Urban picker slot also matches legacy `altruist` type id. */
function pickerSlotType(entry, slotType) {
  const t = entry?.type || null;
  if (t === slotType) return true;
  if (slotType === "urban" && t === "altruist") return true;
  return false;
}

function findBundleEntryForSlot(bundle, slotType) {
  const list = Array.isArray(bundle) ? bundle : [];
  return list.find((o) => pickerSlotType(o, slotType) && o?.id) || null;
}

/** Collect urban/insight types from marker row + nearby siblings only. */
function ownerDeviceTypesNearAnchor(point, sensorsList = null) {
  const types = new Set();
  const addModel = (dm, sensorId) => {
    if (sensorId && !isMarkerSiblingNearAnchor(sensorId, point, sensorsList)) return;
    const m = String(dm || "").toLowerCase();
    if (m === "insight") types.add("insight");
    if (m === "urban" || m === "altruist") types.add("urban");
  };
  addModel(point?.device_model, point?.sensor_id);
  for (const entry of markerSensorsEntries(point, sensorsList)) {
    const parsed = parseBundleSensorEntry(entry);
    if (parsed) addModel(parsed.device_model, parsed.sensor_id);
  }
  return types;
}

function ownerBundleHasDualFromMarkerSiblings(point, sensorsList = null) {
  const types = ownerDeviceTypesNearAnchor(point, sensorsList);
  return types.has("urban") && types.has("insight");
}

function ownerBundleHasDualFromBundle(bundle) {
  if (!Array.isArray(bundle) || bundle.length === 0) return false;
  return (
    Boolean(findBundleEntryForSlot(bundle, "urban")?.id) &&
    Boolean(findBundleEntryForSlot(bundle, "insight")?.id)
  );
}

function bundleFromMarkerSensors(point, sensorsList = null) {
  const sid = String(point?.sensor_id || "");
  const raw = Array.isArray(point?.sensors) ? point.sensors : [];
  if (!sid && raw.length === 0) return null;

  const ids = new Set();
  if (sid && isMarkerSiblingNearAnchor(sid, point, sensorsList)) ids.add(sid);
  for (const entry of raw) {
    const parsed = parseBundleSensorEntry(entry);
    if (parsed?.sensor_id && isMarkerSiblingNearAnchor(parsed.sensor_id, point, sensorsList)) {
      ids.add(String(parsed.sensor_id));
    }
  }
  if (ids.size < 2) return null;

  const typed = inferTypesForOwnerIds([...ids], sensorsList, point);
  return typed.map(({ id, type }) => ({ id, type }));
}

/** True when co-located bundle has both Urban and Insight device ids. */
export function ownerBundleHasDualDevices(point, sensorsList = null) {
  if (!point || !hasSensorOwner(point)) return false;

  if (ownerBundleHasDualFromMarkerSiblings(point, sensorsList)) return true;

  const fromMarkers = bundleFromMarkerSensors(point, sensorsList);
  if (ownerBundleHasDualFromBundle(fromMarkers)) return true;

  if (ownerBundleHasDualFromBundle(point.ownerSensorsWithData)) return true;

  const sid = point?.sensor_id ? String(point.sensor_id) : "";
  const meta = sid ? getCachedSensorMeta(sid) : null;
  if (meta) {
    const anchorGeo = resolveBundleAnchorGeo(point, sensorsList);
    const fromMeta = listBundleSensorEntries(meta)
      .filter((entry) => {
        if (!hasValidCoordinates(anchorGeo)) return true;
        return isMarkerSiblingNearAnchor(entry.sensor_id, point, sensorsList);
      })
      .map((entry) => ({
        id: entry.sensor_id,
        type: sensorTypeFromDeviceModel(entry.device_model),
      }));
    if (ownerBundleHasDualFromBundle(fromMeta)) return true;
  }

  const ownerKey = normalizeOwnerKey(point);
  if (!ownerKey) return false;

  const ids = resolveOwnerSensorIds(point, ownerKey, point?.ownerSensorIds);
  if (!Array.isArray(ids) || ids.length < 2) return false;

  const nearbyIds = ids.filter((id) => isMarkerSiblingNearAnchor(id, point, sensorsList));
  if (nearbyIds.length < 2) return false;

  const typed = inferTypesForOwnerIds(nearbyIds, sensorsList, point);
  return ownerBundleHasDualFromBundle(typed.map(({ id, type }) => ({ id, type })));
}

/** Owner rows with `sensors[]` cache icons under the urban rep sensor_id. */
function markerIconCacheSensorId(point, sensorsList = null) {
  const sid = String(point?.sensor_id || "");
  if (!sid || !hasSensorOwner(point)) return sid;
  const ownerKey = normalizeOwnerKey(point);
  const list = Array.isArray(sensorsList) ? sensorsList : [];
  for (const s of list) {
    if (normalizeOwnerKey(s) !== ownerKey) continue;
    if (Array.isArray(s.sensors) && s.sensors.length > 0) {
      return String(s.sensor_id);
    }
  }
  return sid;
}

/** Map marker image: config pin override, else dual / urban / insight / diy by sensor type. */
export function mapMarkerIcon(point, sensorsList = null, isoDate = null, { forceRefresh = false } = {}) {
  const dateKey = isoDate || dayISO();
  const cacheSid = markerIconCacheSensorId(point, sensorsList);

  const pin = cacheSid ? sensorPin(cacheSid) : null;
  if (pin?.icon) {
    // a government station keeps the coloured ring of the air-quality zone, as a sensor does;
    // a partner's logo fills the marker
    const ringed = pin.kind === "gov";
    return { image: pin.icon, fullBleed: !ringed, iconType: ringed ? "gov" : "pinned" };
  }

  if (!rosemanMarkerIconsEnabledForDate(dateKey)) {
    return { image: null, fullBleed: false, iconType: null };
  }

  if (ownerBundleHasDualFromMarkerSiblings(point, sensorsList)) {
    const iconType = "dual";
    if (cacheSid) {
      void rememberMarkerIcon(cacheSid, dateKey, { iconType, fullBleed: false });
    }
    return { image: sensorTypeIcon(iconType), fullBleed: false, iconType };
  }

  // Invalidate stale dual icon cached before geo-aware dual detection.
  const dualNow = ownerBundleHasDualDevices(point, sensorsList);
  const cached = !forceRefresh && cacheSid ? peekMarkerIconCache(cacheSid, dateKey) : null;
  if (cached?.iconType) {
    const shouldUpgradeToDual = dualNow && cached.iconType !== "dual";
    const dualStillValid = cached.iconType !== "dual" || dualNow;
    if (dualStillValid && !shouldUpgradeToDual) {
      return {
        image: sensorTypeIcon(cached.iconType),
        fullBleed: Boolean(cached.fullBleed),
        iconType: cached.iconType,
      };
    }
  }

  let iconType = resolveSensorType(point);
  const fullBleed = false;
  if (dualNow) {
    iconType = "dual";
  }

  if (cacheSid) {
    void rememberMarkerIcon(cacheSid, dateKey, { iconType, fullBleed });
  }

  return { image: sensorTypeIcon(iconType), fullBleed, iconType };
}

/** Re-resolve map rep icons for a day when IDB cache is missing or older than 5 h. */
export async function refreshMarkerIconsForSensors(isoDate, sensorsList, { force = false } = {}) {
  if (!isoDate || !rosemanMarkerIconsEnabledForDate(isoDate)) return;
  const stale = force || (await isMarkerIconsDayStale(isoDate));
  if (!stale) return;

  const list = Array.isArray(sensorsList) ? sensorsList : [];
  const reps = dedupeSensorsForMap(list);

  await Promise.all(
    reps.map(async (sensor) => {
      const sid = String(sensor?.sensor_id || "");
      if (!sid || sensorPin(sid)?.icon) return;
      const icon = mapMarkerIcon(sensor, list, isoDate);
      const prev = peekMarkerIconCache(sid, isoDate);
      if (prev?.iconType === icon.iconType) return;
      await rememberMarkerIcon(sid, isoDate, {
        iconType: icon.iconType,
        fullBleed: icon.fullBleed,
      });
    })
  );
}
