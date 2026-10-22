/**
 * Owner device bundles: merge owner API, v2 meta, and map markers into picker rows.
 * Geo filtering uses OWNER_GEO_CLUSTER_KM (3 km) so nationwide owner accounts do not
 * pollute a single map marker or popup cluster.
 */
import { peekUserSensorsCache } from "@/composables/useAccounts";
import { resolveSensorType } from "@/composables/sensorDeviceTypes";
import { hasValidCoordinates } from "../utils/utils";
import { dayISO } from "@/utils/date";
import { measurementValue } from "@/measurements/aliases";
import {
  filterOwnerBundleNearAnchor,
  getCachedSensorMeta,
  getCachedSensorIdbMeta,
  getCachedMaxDataValue,
  getCachedMaxDataEntry,
  getOwnerSensorsWithData,
  listBundleSensorIds,
  inferDeviceTypeFromLog,
  listBundleSensorEntries,
  parseBundleSensorEntry,
  preloadSensorMeta,
  normalizeOwnerKey,
  hasSensorOwner,
  haversineKm,
  OWNER_GEO_CLUSTER_KM,
  collectOwnerDeviceIds,
  sensorFetchBoundsForDate,
  sensorTypeFromDeviceModel,
} from "../utils/map/sensors/requests";

const OWNER_PICKER_TYPES = ["urban", "insight"];
const DIY_PICKER_TYPES = ["diy", "urban", "insight"];
const PM_LOG_KEYS = ["pm25", "pm10"];

/** Markers-API `sensors[]` siblings for an owner map row. */
export function markerSensorsEntries(point, sensorsList = null) {
  if (Array.isArray(point?.sensors) && point.sensors.length > 0) return point.sensors;
  const ownerKey = normalizeOwnerKey(point);
  if (!ownerKey) return [];
  for (const s of Array.isArray(sensorsList) ? sensorsList : []) {
    if (normalizeOwnerKey(s) !== ownerKey) continue;
    if (Array.isArray(s.sensors) && s.sensors.length > 0) return s.sensors;
  }
  return [];
}

/** Popup/map anchor: point geo, else the sensor row on the map list. */
export function resolveBundleAnchorGeo(point, sensorsList) {
  if (hasValidCoordinates(point?.geo)) return point.geo;
  const sid = point?.sensor_id ? String(point.sensor_id) : "";
  if (!sid) return null;
  const fromList = (Array.isArray(sensorsList) ? sensorsList : []).find(
    (s) => String(s?.sensor_id || "") === sid
  );
  if (hasValidCoordinates(fromList?.geo)) return fromList.geo;
  return null;
}

/** Geo for a markers-API bundle sibling (map row, maxdata, or v2 log). */
export function resolveMarkerSiblingGeo(sensorId, point, sensorsList = null) {
  const id = String(sensorId || "");
  if (!id) return null;
  if (String(point?.sensor_id || "") === id && hasValidCoordinates(point?.geo)) {
    return point.geo;
  }
  const fromList = (Array.isArray(sensorsList) ? sensorsList : []).find(
    (s) => String(s?.sensor_id || "") === id
  );
  if (fromList?.geo && hasValidCoordinates(fromList.geo)) return fromList.geo;
  for (const unit of ["pm10", "pm25", "co2", "temperature", "noisemax", "humidity"]) {
    const md = getCachedMaxDataEntry(id, unit);
    if (md?.geo && hasValidCoordinates(md.geo)) return md.geo;
  }
  const meta = getCachedSensorMeta(id);
  const log = meta?.data?.[id];
  if (Array.isArray(log)) {
    for (const item of log) {
      if (item?.geo && hasValidCoordinates(item.geo)) return item.geo;
    }
  }
  return null;
}

/** True when sibling is within OWNER_GEO_CLUSTER_KM of the bundle anchor (or geo unknown). */
export function isMarkerSiblingNearAnchor(sensorId, point, sensorsList = null) {
  const anchorGeo = resolveBundleAnchorGeo(point, sensorsList);
  if (!hasValidCoordinates(anchorGeo)) return true;
  const geo = resolveMarkerSiblingGeo(sensorId, point, sensorsList);
  if (!geo) return false;
  return haversineKm(anchorGeo, geo) <= OWNER_GEO_CLUSTER_KM;
}

/** Resolve urban/insight/diy per id from map row, markers siblings, v2 meta, or active point. */
export function inferTypesForOwnerIds(ids, sensorsList, activePoint) {
  const currentId = String(activePoint?.sensor_id || "");
  return ids.map((id) => {
    const sid = String(id);
    const fromMap = (Array.isArray(sensorsList) ? sensorsList : []).find(
      (s) => String(s?.sensor_id || "") === sid
    );
    const metaEntry = (() => {
      const meta = getCachedSensorMeta(activePoint?.sensor_id);
      if (!meta) return null;
      return listBundleSensorEntries(meta).find((e) => String(e.sensor_id) === sid) || null;
    })();
    const markerSibling = (() => {
      const raw = Array.isArray(activePoint?.sensors) ? activePoint.sensors : [];
      return raw.map(parseBundleSensorEntry).find((e) => e && String(e.sensor_id) === sid) || null;
    })();
    const type =
      sensorTypeFromDeviceModel(fromMap?.device_model) ||
      sensorTypeFromDeviceModel(markerSibling?.device_model) ||
      sensorTypeFromDeviceModel(metaEntry?.device_model) ||
      (sid === currentId
        ? sensorTypeFromDeviceModel(activePoint?.device_model) ||
          (activePoint?.idbSensorType && activePoint.idbSensorType !== "diy"
            ? activePoint.idbSensorType
            : null)
        : null);
    return { id: sid, type };
  });
}

async function enrichOwnerIdsWithIdbTypes(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return entries;

  await Promise.all(
    entries.map(async (entry) => {
      if (entry.type) return;
      const meta = await getCachedSensorIdbMeta(entry.id);
      if (meta?.type && meta.type !== "diy" && meta.type !== "altruist") {
        entry.type = meta.type;
      }
    })
  );

  return entries;
}

/** Build picker rows `{ id, type, geo, hasData }` for a list of owner sensor ids. */
export function buildOwnerBundleFromIds(
  ids,
  sensorsList,
  activeSensorId,
  activePoint,
  typedEntries = null
) {
  if (!Array.isArray(ids) || ids.length === 0) return null;

  const typed = typedEntries || inferTypesForOwnerIds(ids, sensorsList, activePoint);

  return typed.map(({ id: sid, type }) => {
    const fromMap = (Array.isArray(sensorsList) ? sensorsList : []).find(
      (s) => String(s?.sensor_id || "") === sid
    );
    const geo =
      (fromMap?.geo && hasValidCoordinates(fromMap.geo) ? fromMap.geo : null) ||
      (sid === String(activeSensorId || "") && hasValidCoordinates(activePoint?.geo)
        ? activePoint.geo
        : null);
    const hasGeo = hasValidCoordinates(geo);

    return {
      id: sid,
      hasData: hasGeo,
      type,
      geo: hasGeo ? geo : null,
      device_model: fromMap?.device_model || null,
    };
  });
}

/** `?sensor=` in URL → 3 km cluster; `?owner=` only → all owner devices with geo. */
export function shouldClusterOwnerBundle(query) {
  return Boolean(String(query?.sensor ?? query?.sensors ?? "").trim());
}

/** Picker bundle: 3 km cluster when `clusterBundle`, else all devices with geo. */
export function finalizeOwnerBundleNearAnchor(rows, anchorGeo, activeSensorId, clusterBundle = true) {
  const list = Array.isArray(rows) ? rows.filter(Boolean) : [];
  if (list.length === 0) return null;

  if (!clusterBundle) {
    const withGeo = list.filter((o) => o?.geo && hasValidCoordinates(o.geo));
    return withGeo.length > 0 ? withGeo : null;
  }

  const sid = String(activeSensorId || "");
  if (!hasValidCoordinates(anchorGeo)) {
    const self = sid
      ? list.find((o) => String(o.id) === sid && o.geo && hasValidCoordinates(o.geo))
      : null;
    return self ? [self] : null;
  }

  return filterOwnerBundleNearAnchor(list, anchorGeo, activeSensorId);
}

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

/**
 * Rows for sensor picker popover: active / available / missing per device type.
 * Order is fixed: urban → insight (OWNER_PICKER_TYPES), not bundle merge order.
 * @returns {Array<{ type: string, sensorId: string|null, state: 'active'|'available'|'missing' }>}
 */
export function buildSensorPickerRows(point, logSamples = null) {
  const currentId = String(point?.sensor_id || "");
  const hasOwner = hasSensorOwner(point);
  const types = hasOwner ? OWNER_PICKER_TYPES : DIY_PICKER_TYPES;
  const bundle = hasOwner ? point?.ownerSensorsWithData : null;

  const bundleWithGeo = hasOwner
    ? (Array.isArray(bundle) ? bundle : []).filter((e) => e?.geo && hasValidCoordinates(e.geo))
    : null;

  if (hasOwner && (!bundleWithGeo || bundleWithGeo.length === 0)) {
    return OWNER_PICKER_TYPES.map((type) => ({ type, sensorId: null, state: "missing" }));
  }

  const rows = types.map((type) => {
    if (!hasOwner) {
      if (type === "diy") {
        return { type, sensorId: currentId || null, state: currentId ? "active" : "missing" };
      }
      return { type, sensorId: null, state: "missing" };
    }

    const entry = findBundleEntryForSlot(bundleWithGeo, type);
    if (!entry) return { type, sensorId: null, state: "missing" };

    const id = String(entry.id);
    if (id === currentId) return { type, sensorId: id, state: "active" };
    return { type, sensorId: id, state: "available" };
  });

  if (hasOwner && currentId && !rows.some((r) => r.state === "active")) {
    const currentType = resolveSensorType(point, logSamples);
    const slotType =
      currentType === "insight" ? "insight" : currentType === "diy" ? "diy" : "urban";
    const idx = rows.findIndex((r) => r.type === slotType);
    if (idx >= 0) {
      rows[idx] = { type: slotType, sensorId: currentId, state: "active" };
    }
  }

  return rows;
}

/** Read numeric value from a measurement bag (handles PM -1 sentinel). */
export function unitValueFromBag(bag, unit) {
  if (!bag || unit == null) return null;
  const u = String(unit).toLowerCase();
  let raw = bag[u];
  let rawKey = u;
  if (raw === undefined) {
    for (const [k, v] of Object.entries(bag)) {
      if (String(k).toLowerCase() === u) {
        raw = v;
        rawKey = u;
        break;
      }
    }
  }
  if (raw === undefined && u === "gc") {
    for (const [k, v] of Object.entries(bag)) {
      if (String(k).toLowerCase() === "radiation") {
        raw = v;
        rawKey = "radiation";
        break;
      }
    }
  }
  if (raw === null || raw === undefined) return null;
  const num = Number(measurementValue(rawKey, raw));
  if (!Number.isFinite(num)) return null;
  if (PM_LOG_KEYS.includes(u) && num === -1) return null;
  return num;
}

/** Picker order: bundle → markers API siblings → v2 meta. */
export function bundleSensorIdsInPickerOrder(point, sensorsList) {
  const seen = new Set();
  const ids = [];
  const push = (raw) => {
    const sid = String(raw || "").trim();
    if (!sid || seen.has(sid)) return;
    seen.add(sid);
    ids.push(sid);
  };

  for (const e of point?.ownerSensorsWithData || []) push(e.id || e.sensor_id);
  for (const entry of markerSensorsEntries(point, sensorsList)) {
    push(parseBundleSensorEntry(entry)?.sensor_id);
  }
  const repId = String(point?.sensor_id || "");
  const meta = repId ? getCachedSensorMeta(repId) : null;
  if (meta) {
    for (const entry of listBundleSensorEntries(meta)) push(entry.sensor_id);
  }
  return ids.length ? ids : repId ? [repId] : [];
}

/** First bundle device that has readings for the active map unit. */
export function pickSensorIdForMapUnit(point, sensorsList, unit, provider) {
  const defaultId = String(point?.sensor_id || "");
  const u = String(unit || "").toLowerCase();
  if (!defaultId || !u) return defaultId;

  const list = Array.isArray(sensorsList) ? sensorsList : [];
  const isRemote = provider === "remote";
  for (const sid of bundleSensorIdsInPickerOrder(point, sensorsList)) {
    const row = list.find((s) => String(s?.sensor_id || "") === sid);
    const bag = isRemote ? row?.maxdata : row?.data;
    if (unitValueFromBag(bag, u) !== null) return sid;
    if (isRemote && getCachedMaxDataValue(sid, u) !== null) return sid;
  }
  return defaultId;
}

/** Merge bundle lists by sensor id; prefer geo and hasData from any source. */
export function mergeOwnerBundleLists(pubsub, meta) {
  const p = Array.isArray(pubsub) ? pubsub.filter(Boolean) : [];
  const m = Array.isArray(meta) ? meta.filter(Boolean) : [];
  if (m.length === 0) return p.length > 0 ? p : null;
  if (p.length === 0) return m;

  const byId = new Map(m.map((o) => [String(o.id), { ...o }]));
  for (const o of p) {
    const id = String(o.id);
    const existing = byId.get(id);
    if (existing) {
      byId.set(id, {
        ...existing,
        ...o,
        geo: o.geo || existing.geo,
        type: existing.type || o.type,
        hasData: existing.hasData === true || o.hasData === true,
      });
    } else {
      byId.set(id, o);
    }
  }
  return Array.from(byId.values());
}

/** Nearby owner markers on the map list (pubsub / daily recap). */
function buildPubsubOwnerList(point, sensorsList, anchorGeo, clusterBundle = true) {
  const owner = normalizeOwnerKey(point);
  if (!owner) return null;
  const sid = String(point?.sensor_id || "");
  const list = Array.isArray(sensorsList) ? sensorsList : [];
  const ownerSensors = list.filter((s) => normalizeOwnerKey(s) === owner);

  if (!clusterBundle) {
    const withGeo = ownerSensors.filter((s) => hasValidCoordinates(s?.geo));
    if (withGeo.length === 0) return null;
    const ids = withGeo.map((s) => String(s.sensor_id));
    const typed = inferTypesForOwnerIds(ids, sensorsList, point);
    return buildOwnerBundleFromIds(ids, sensorsList, sid, point, typed);
  }

  const geo = anchorGeo || point?.geo;
  if (!hasValidCoordinates(geo)) {
    return null;
  }

  const nearby = ownerSensors.filter(
    (s) => hasValidCoordinates(s?.geo) && haversineKm(geo, s.geo) <= OWNER_GEO_CLUSTER_KM
  );
  if (nearby.length === 0) return null;

  const ids = nearby.map((s) => String(s.sensor_id));
  if (sid && !ids.includes(sid)) {
    const self = ownerSensors.find((s) => String(s?.sensor_id || "") === sid);
    if (self && hasValidCoordinates(self?.geo)) {
      ids.unshift(sid);
    }
  }

  const typed = inferTypesForOwnerIds(ids, sensorsList, point);
  return buildOwnerBundleFromIds(ids, sensorsList, sid, point, typed);
}

function ownerIdsFromV2Meta(sensorId) {
  const meta = getCachedSensorMeta(sensorId);
  const ids = meta ? listBundleSensorIds(meta) : null;
  return Array.isArray(ids) && ids.length > 0 ? ids.map((id) => String(id)) : null;
}

export function resolveOwnerSensorIds(point, ownerKey, ownerSensorIds = null) {
  const explicit = ownerSensorIds ?? point?.ownerSensorIds ?? peekUserSensorsCache(ownerKey);
  if (Array.isArray(explicit) && explicit.length > 0) return explicit;

  const sid = point?.sensor_id ? String(point.sensor_id) : "";
  return sid ? ownerIdsFromV2Meta(sid) : null;
}

function buildOwnerBundleFromV2Meta(point, sensorsList, clusterBundle = true) {
  const sid = point?.sensor_id;
  if (!sid) return null;
  const anchorGeo = resolveBundleAnchorGeo(point, sensorsList);
  return getOwnerSensorsWithData(sid, anchorGeo, sensorsList, clusterBundle);
}

/**
 * Resolve owner device ids without Roseman owner-list API.
 * Order: explicit/cache → map markers list → v2 sensor meta preload.
 */
export async function ensureOwnerSensorIds(
  point,
  ownerKey,
  ownerSensorIds = null,
  sensorsList = null
) {
  let ids = resolveOwnerSensorIds(point, ownerKey, ownerSensorIds);
  if (ids?.length) return ids;

  const fromMap = collectOwnerDeviceIds(ownerKey, sensorsList);
  if (fromMap.length) return fromMap;

  const sid = point?.sensor_id ? String(point.sensor_id) : "";
  if (!sid) return null;

  if (!getCachedSensorMeta(sid)) {
    const { start, end } = sensorFetchBoundsForDate(dayISO());
    await preloadSensorMeta(sid, start, end);
  }

  return ownerIdsFromV2Meta(sid);
}

function mergeOwnerBundleSources(point, sensorsList, anchorGeo, fromOwnerApi, clusterBundle) {
  // Priority: resolved owner ids → v2 meta → markers on map (last wins on conflicts).
  const fromV2 = buildOwnerBundleFromV2Meta(point, sensorsList, clusterBundle);
  const pubsub = buildPubsubOwnerList(point, sensorsList, anchorGeo, clusterBundle);
  let merged = mergeOwnerBundleLists(fromOwnerApi, fromV2);
  merged = mergeOwnerBundleLists(merged, pubsub);
  return merged?.length ? merged : fromV2 || fromOwnerApi;
}

/** Sync bundle build (map markers / popup already has owner ids). */
export function buildOwnerSensorsWithData(
  point,
  sensorsList,
  ownerSensorIds = null,
  clusterBundle = true
) {
  const ownerKey = normalizeOwnerKey(point);
  if (!ownerKey && !point?.sensor_id) return null;

  const sid = point?.sensor_id;
  const ids = resolveOwnerSensorIds(point, ownerKey, ownerSensorIds);
  const anchorGeo = resolveBundleAnchorGeo(point, sensorsList);

  let fromOwnerApi = null;
  if (ids) {
    const typed = inferTypesForOwnerIds(ids, sensorsList, point);
    fromOwnerApi = buildOwnerBundleFromIds(ids, sensorsList, sid, point, typed);
  }

  return mergeOwnerBundleSources(point, sensorsList, anchorGeo, fromOwnerApi, clusterBundle);
}

/** Async bundle build: may preload v2 meta and merge map markers. */
export async function buildOwnerSensorsWithDataAsync(
  point,
  sensorsList,
  ownerSensorIds = null,
  clusterBundle = true
) {
  const ownerKey = normalizeOwnerKey(point);
  if (!ownerKey && !point?.sensor_id) return null;

  const sid = point?.sensor_id;
  const ids = await ensureOwnerSensorIds(point, ownerKey, ownerSensorIds, sensorsList);
  const anchorGeo = resolveBundleAnchorGeo(point, sensorsList);

  let fromOwnerApi = null;
  if (ids?.length) {
    let typed = inferTypesForOwnerIds(ids, sensorsList, point);
    typed = await enrichOwnerIdsWithIdbTypes(typed);
    fromOwnerApi = buildOwnerBundleFromIds(ids, sensorsList, sid, point, typed);
  }

  return mergeOwnerBundleSources(point, sensorsList, anchorGeo, fromOwnerApi, clusterBundle);
}

export function mergeOwnerBundleOptions(fresh, prevOptions) {
  const prev = Array.isArray(prevOptions) ? prevOptions.filter(Boolean) : null;
  const merged = mergeOwnerBundleLists(fresh, prev?.length ? prev : null);
  return merged?.length ? merged : null;
}

export function applyFilteredOwnerBundleOptions(point, prevOptions, sensorsList, clusterBundle = true) {
  if (!point) return null;
  const anchorGeo = resolveBundleAnchorGeo(point, sensorsList);
  const fresh = buildOwnerSensorsWithData(point, sensorsList, null, clusterBundle);
  const source = fresh?.length
    ? fresh
    : Array.isArray(prevOptions)
      ? prevOptions.filter(Boolean)
      : null;
  if (!source?.length) return null;
  return finalizeOwnerBundleNearAnchor(source, anchorGeo, point.sensor_id, clusterBundle);
}

/** Canonical owner for a device: map list first, then open popup, then URL. */
export function resolveOwnerForSensorId(
  sensorId,
  sensorsList,
  fallbackPoint = null,
  openPopupPoint = null
) {
  const sid = String(sensorId || "");
  if (!sid) return "";

  const list = Array.isArray(sensorsList) ? sensorsList : [];
  const fromList = list.find((s) => String(s?.sensor_id || "") === sid);
  const fromListOwner = normalizeOwnerKey(fromList);
  if (fromListOwner) return fromListOwner;

  const popup = openPopupPoint;
  if (popup && String(popup.sensor_id || "") === sid) {
    const popupOwner = normalizeOwnerKey(popup);
    if (popupOwner) return popupOwner;
  }

  if (fallbackPoint) {
    const fb = normalizeOwnerKey(fallbackPoint);
    if (fb) return fb;
  }

  return "";
}

/**
 * Sensors in one owner geo cluster around the popup anchor (never the full nationwide owner list).
 */
export function resolveOwnerClusterPool(point, sensorsList, ownerKey, anchorGeo) {
  const list = (Array.isArray(sensorsList) ? sensorsList : []).filter(
    (s) => normalizeOwnerKey(s) === ownerKey
  );
  const sid = String(point?.sensor_id || "");

  if (!hasValidCoordinates(anchorGeo)) {
    if (!sid) return list;
    const row = list.find((s) => String(s?.sensor_id || "") === sid);
    return row ? [row] : list;
  }

  const nearby = list.filter(
    (s) => hasValidCoordinates(s?.geo) && haversineKm(anchorGeo, s.geo) <= OWNER_GEO_CLUSTER_KM
  );
  if (nearby.length > 0) return nearby;

  if (!sid) return [];

  const row = list.find((s) => String(s?.sensor_id || "") === sid);
  if (row) {
    return [hasValidCoordinates(row.geo) ? row : { ...row, geo: anchorGeo }];
  }

  return [
    {
      sensor_id: sid,
      geo: anchorGeo,
      owner: ownerKey,
      model: point?.model || 2,
      maxdata: point?.maxdata,
      data: point?.data,
      device_model: point?.device_model,
      timestamp: point?.timestamp,
    },
  ];
}

/**
 * Sensor ids for value aggregation in one owner geo cluster (≤ OWNER_GEO_CLUSTER_KM).
 * Nationwide owner `sensors[]` siblings without nearby geo are excluded.
 */
export function collectOwnerClusterSensorIds(point, sensorsList, ownerKey, anchorGeo) {
  const ids = new Set();
  const poolIds = new Set();

  for (const s of resolveOwnerClusterPool(point, sensorsList, ownerKey, anchorGeo)) {
    const id = String(s?.sensor_id || "");
    if (id) {
      ids.add(id);
      poolIds.add(id);
    }
  }

  const tryAddSiblingId = (sensorId) => {
    const sid = String(sensorId || "").trim();
    if (!sid || ids.has(sid)) return;
    if (poolIds.has(sid)) {
      ids.add(sid);
      return;
    }
    if (!hasValidCoordinates(anchorGeo)) return;
    const row = (Array.isArray(sensorsList) ? sensorsList : []).find(
      (s) => String(s?.sensor_id || "") === sid
    );
    if (row?.geo && hasValidCoordinates(row.geo) && haversineKm(anchorGeo, row.geo) <= OWNER_GEO_CLUSTER_KM) {
      ids.add(sid);
    }
  };

  const addBundleEntry = (entry) => {
    const parsed = parseBundleSensorEntry(entry);
    if (parsed?.sensor_id) tryAddSiblingId(parsed.sensor_id);
  };

  if (Array.isArray(point?.sensors)) {
    for (const entry of point.sensors) addBundleEntry(entry);
  }
  if (Array.isArray(point?.ownerSensorIds)) {
    for (const id of point.ownerSensorIds) tryAddSiblingId(id);
  }
  if (Array.isArray(point?.ownerSensorsWithData)) {
    for (const o of point.ownerSensorsWithData) {
      if (o?.hasData === false) continue;
      const sid = String(o?.id || o?.sensor_id || "").trim();
      if (!sid) continue;
      if (poolIds.has(sid) || ids.has(sid)) {
        ids.add(sid);
        continue;
      }
      if (
        hasValidCoordinates(anchorGeo) &&
        hasValidCoordinates(o?.geo) &&
        haversineKm(anchorGeo, o.geo) <= OWNER_GEO_CLUSTER_KM
      ) {
        ids.add(sid);
      }
    }
  }

  if (ownerKey) {
    for (const s of Array.isArray(sensorsList) ? sensorsList : []) {
      if (normalizeOwnerKey(s) !== ownerKey) continue;
      if (Array.isArray(s.sensors)) {
        for (const entry of s.sensors) addBundleEntry(entry);
      }
    }
  }

  return [...ids];
}

/** Stable signature for owner bundle rows (sorted ids) — detects bundle changes after hydrate. */
export function ownerBundleSig(opts) {
  if (!Array.isArray(opts) || opts.length === 0) return "";
  return opts
    .map((o) => String(o?.id || ""))
    .filter(Boolean)
    .sort()
    .join(",");
}
