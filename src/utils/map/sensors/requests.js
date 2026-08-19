import Provider from "@/providers/remote";
import Libp2pProvider from "@/providers/libp2p";
import { getConfigBounds, filterByBounds } from "../map";
import { hasValidCoordinates, fetchJson } from "../../utils";
import { dayISO, dayBoundsUnix, timelineFetchBounds } from "../../date";
import { mapLayerUnitIds, sortMapLayerUnits } from "../../../measurements/tools";
import { settings, excluded_sensors } from "@config";
import { decryptMeasurementBag } from "@/utils/sensorValueCrypto";

// Глобальные константы провайдеров
const REMOTE_PROVIDER = new Provider(settings.REMOTE_PROVIDER);
const LIBP2P_PROVIDER = new Libp2pProvider(settings.LIBP2P);

// Глобальный объект провайдера
let providerObj = null;

// In-flight v2 sensor requests (preload + logs share the same payload).
const sensorV2Inflight = new Map();
const sensorV2Recent = new Map();
const SENSOR_V2_RECENT_MS = 60_000;

async function decryptSensorHistoryEntries(sensorId, entries, ownerAddress) {
  const owner = normalizeOwnerKey({ owner: ownerAddress });
  if (!owner || !Array.isArray(entries) || entries.length === 0) return entries;

  let ownerAccount = { address: owner };
  try {
    const { useAccounts } = await import("@/composables/useAccounts");
    const list = useAccounts().accounts.value;
    const hasSecret = (a) =>
      String(a?.phrase || "").trim() ||
      String(a?.seedHex || "").trim() ||
      (a?.seed instanceof Uint8Array && a.seed.length >= 32);
    const byOwner = list.find(
      (a) => String(a?.address || "").trim() === owner && hasSecret(a)
    );
    if (byOwner) ownerAccount = byOwner;
    else {
      const sid = String(sensorId || "").trim();
      const bySensor = list.find(
        (a) => String(a?.address || "").trim() === sid && hasSecret(a)
      );
      if (bySensor) ownerAccount = bySensor;
      else {
        const byDevice = list.find(
          (a) =>
            hasSecret(a) &&
            Array.isArray(a.devices) &&
            a.devices.some((deviceId) => String(deviceId).trim() === sid)
        );
        if (byDevice) ownerAccount = byDevice;
      }
    }
  } catch {
    // Fall back to address-only lookup inside decryptMeasurementBag.
  }

  return Promise.all(
    entries.map(async (entry) => {
      if (!entry?.data || typeof entry.data !== "object") return entry;
      const data = await decryptMeasurementBag(sensorId, entry.data, ownerAccount);
      return data === entry.data ? entry : { ...entry, data };
    })
  );
}



/**
 * Day fetch bounds aligned with getSensorDataWithCache: for today end = now, not end-of-day.
 */
export function sensorFetchBoundsForDate(isoDate) {
  return timelineFetchBounds(isoDate, "day");
}

async function fetchSensorV2Payload(sensorId, startTimestamp, endTimestamp, signal = null) {
  const sid = String(sensorId || "");
  if (!sid) return null;

  const key = `${sid}:${startTimestamp}:${endTimestamp}`;
  const recent = sensorV2Recent.get(key);
  if (recent && Date.now() - recent.ts < SENSOR_V2_RECENT_MS) {
    return recent.payload;
  }

  if (sensorV2Inflight.has(key)) {
    return sensorV2Inflight.get(key);
  }

  const promise = fetchJson(
    `${settings.REMOTE_PROVIDER}api/v2/sensor/${sid}/${startTimestamp}/${endTimestamp}`,
    { cache: "no-store", signal }
  )
    .then((payload) => {
      sensorV2Recent.set(key, { payload, ts: Date.now() });
      return payload;
    })
    .finally(() => {
      sensorV2Inflight.delete(key);
    });

  sensorV2Inflight.set(key, promise);
  return promise;
}

// Cache latest v2 meta for a sensor to drive UI (owner sensors dropdown, etc.)
const latestSensorMetaById = new Map();

/** Max distance (km) between points of the same owner to share one map marker. */
export const OWNER_GEO_CLUSTER_KM = 3;

export function haversineKm(geoA, geoB) {
  const lat1 = Number(geoA?.lat);
  const lng1 = Number(geoA?.lng);
  const lat2 = Number(geoB?.lat);
  const lng2 = Number(geoB?.lng);
  if (![lat1, lng1, lat2, lng2].every((n) => Number.isFinite(n))) return Infinity;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function normalizeOwnerKey(item) {
  return String(item?.owner || "").trim();
}

/** True when sensor has an explicit `owner` field (not `donated_by`; used for DIY). */
export function hasSensorOwner(item) {
  return Boolean(String(item?.owner || "").trim());
}

export function parseBundleSensorEntry(entry) {
  if (entry == null) return null;
  if (typeof entry === "string" || typeof entry === "number") {
    const sensor_id = String(entry).trim();
    return sensor_id ? { sensor_id, device_model: null } : null;
  }
  if (typeof entry === "object") {
    const sensor_id = String(entry.sensor_id || entry.id || "").trim();
    if (!sensor_id) return null;
    const dm = entry.device_model ?? entry.model ?? null;
    return {
      sensor_id,
      device_model: dm != null ? String(dm).toLowerCase() : null,
    };
  }
  return null;
}

export function sensorTypeFromDeviceModel(deviceModel) {
  const m = String(deviceModel || "").toLowerCase();
  if (m === "insight") return "insight";
  if (m === "urban") return "urban";
  if (m === "diy") return "diy";
  if (m === "altruist") return "altruist";
  return null;
}

/**
 * Infer Urban vs Insight when Roseman omits device_model on bundle entries.
 * Insight: CO₂ without PM; Urban: PM and/or noise metrics.
 */
export function inferDeviceTypeFromLog(log) {
  if (!Array.isArray(log) || log.length === 0) return null;

  const keys = new Set();
  const sample = log.length > 100 ? log.slice(-100) : log;
  for (const item of sample) {
    const data = item?.data;
    if (!data || typeof data !== "object") continue;
    for (const key of Object.keys(data)) {
      keys.add(String(key).toLowerCase());
    }
  }
  if (keys.size === 0) return null;

  const hasCo2 = keys.has("co2");
  const hasPm = keys.has("pm25") || keys.has("pm10");
  const hasNoise = keys.has("noiseavg") || keys.has("noisemax") || keys.has("noise");

  if (hasCo2 && !hasPm) return "insight";
  if (hasPm || hasNoise) return "urban";
  return null;
}

/**
 * Normalized bundle devices from v2 `sensor.sensors` (supports legacy string[] too).
 */
export function listBundleSensorEntries(meta) {
  const data = meta?.data && typeof meta.data === "object" ? meta.data : {};
  const owner = String(meta?.owner || "").trim();
  const raw = Array.isArray(meta?.sensors) ? meta.sensors : [];
  const entries = raw.map(parseBundleSensorEntry).filter(Boolean);

  const fromList =
    entries.length > 0
      ? entries
      : Object.keys(data).map((sensor_id) => ({ sensor_id, device_model: null }));

  return fromList.filter(({ sensor_id, device_model }) => {
    const sid = String(sensor_id);
    const points = data[sid];
    const hasData = Array.isArray(points) && points.length > 0;
    const hasModel = !!device_model;
    if (!hasData && !hasModel) return false;
    if (owner && sid === owner && !hasModel) return false;
    return true;
  });
}

export function listBundleSensorIds(meta) {
  return listBundleSensorEntries(meta).map((e) => e.sensor_id);
}

/** Device role for map rep — device_model only (Insight vs Urban). */
export function isInsightMapDevice(sensor) {
  return String(sensor?.device_model || "").toLowerCase() === "insight";
}

/**
 * Map marker for an owner geo cluster: prefer Urban, then latest timestamp.
 */
export function pickOwnerClusterRepresentative(members) {
  if (!Array.isArray(members) || members.length === 0) return null;

  const ranked = members.map((m) => {
    const isInsight = isInsightMapDevice(m);
    const ts = Number(m?.timestamp || 0);
    return { m, isInsight, ts };
  });

  const urbanOnly = ranked.filter((x) => !x.isInsight);
  const pool = urbanOnly.length > 0 ? urbanOnly : ranked;
  pool.sort((a, b) => b.ts - a.ts);
  return pool[0]?.m || members[0];
}

/**
 * One map marker per owner within `maxKm`. Distant regions keep separate markers.
 */
export function dedupeSensorsForMap(list, maxKm = OWNER_GEO_CLUSTER_KM) {
  const withoutOwner = [];
  const byOwner = new Map();

  for (const item of Array.isArray(list) ? list : []) {
    const owner = normalizeOwnerKey(item);
    if (!owner) {
      withoutOwner.push(item);
      continue;
    }
    if (!byOwner.has(owner)) byOwner.set(owner, []);
    byOwner.get(owner).push(item);
  }

  const out = [...withoutOwner];

  for (const items of byOwner.values()) {
    const clusters = [];
    for (const item of items) {
      if (!hasValidCoordinates(item?.geo)) continue;
      const geo = item.geo;
      let placed = false;
      for (const c of clusters) {
        const closeEnough = c.members.some(
          (m) => hasValidCoordinates(m?.geo) && haversineKm(geo, m.geo) <= maxKm
        );
        if (closeEnough) {
          c.members.push(item);
          placed = true;
          break;
        }
      }
      if (!placed) clusters.push({ members: [item] });
    }
    for (const c of clusters) {
      const best = pickOwnerClusterRepresentative(c.members);
      if (best) out.push(best);
    }
  }

  return out;
}

function dedupeByOwnerProximity(list, maxKm = OWNER_GEO_CLUSTER_KM) {
  return dedupeSensorsForMap(list, maxKm);
}

/** Same threshold as map marker drawing (near-null island coords). */
export const MAP_COORDINATE_TOLERANCE = 0.001;

// Импортируем утилиты для работы с IndexedDB
import {
  IDBworkflow,
  IDBgettable,
  IDBgetByKey,
  IDBputRecord,
  IDBdeleteByKey,
  IDBcleartable,
  notifyDBChange,
} from "../../idb.js";

const SENSORS_IDB_DB = "Sensors";
const MAP_MARKERS_DATA_STORE = "mapMarkersData";

/** In-memory slice of the latest maxdata payload (per unit) for sibling lookups. */
const maxDataApiCache = new Map();
/** Coalesce parallel ensureMaxDataRecord fetches for the same unit/day/end. */
const maxDataInflight = new Map();
/** Shared TTL for remote day slices (maxdata, markers list, sensor log IDB). */
const REMOTE_DAY_REFRESH_MS = 5 * 60 * 1000;

function maxDataInflightKey(unit, isoDate, end) {
  return `${unit}:${isoDate}:${end}`;
}

function mapMarkersDataId(unit, isoDate) {
  return `${String(unit || "").toLowerCase()}:${isoDate}`;
}

export function getCachedMaxDataValue(sensorId, unit) {
  const entry = getCachedMaxDataEntry(sensorId, unit);
  if (!entry) return null;
  const n = Number(entry.value);
  return Number.isFinite(n) ? n : null;
}

export function getCachedMaxDataEntry(sensorId, unit) {
  const cache = maxDataApiCache.get(unit);
  const entry = cache?.values?.[String(sensorId || "")];
  return entry && typeof entry === "object" ? entry : null;
}

export function clearMaxDataApiCache() {
  maxDataApiCache.clear();
}

/** Marker icon types persisted per rep sensor_id (dual / urban / insight / diy). */
const markerIconMemCache = new Map();

export const MARKER_ICON_TTL_MS = 5 * 60 * 60 * 1000;

function markerIconMemKey(isoDate, sensorId) {
  return `${isoDate}:${String(sensorId || "")}`;
}

export function markerIconsIdbKey(isoDate) {
  return `icons:${isoDate}`;
}

function markerIconRank(iconType) {
  if (iconType === "dual") return 3;
  if (iconType === "insight" || iconType === "urban") return 2;
  return 1;
}

function isIconEntryFresh(icon) {
  if (!icon?.iconType) return false;
  const updatedAt = Number(icon.updatedAt || 0);
  if (!updatedAt) return false;
  return Date.now() - updatedAt < MARKER_ICON_TTL_MS;
}

function isMarkerIconsRecordStale(record) {
  if (!record?.icons || typeof record.icons !== "object") return true;
  const keys = Object.keys(record.icons);
  if (keys.length === 0) return true;
  const recordUpdated = Number(record.lastUpdated || 0);
  if (!recordUpdated || Date.now() - recordUpdated >= MARKER_ICON_TTL_MS) return true;
  return keys.some((sid) => !isIconEntryFresh(record.icons[sid]));
}

export function peekMarkerIconCache(sensorId, isoDate, { respectTtl = false } = {}) {
  if (!sensorId || !isoDate) return null;
  const entry = markerIconMemCache.get(markerIconMemKey(isoDate, sensorId));
  if (!entry?.iconType) return null;
  if (respectTtl && !isIconEntryFresh(entry)) return null;
  return entry;
}

export function clearMarkerIconMemCache() {
  markerIconMemCache.clear();
}

async function readMarkerIconsRecordFromIdb(isoDate) {
  try {
    return await IDBgetByKey(SENSORS_IDB_DB, MAP_MARKERS_DATA_STORE, markerIconsIdbKey(isoDate));
  } catch {
    return null;
  }
}

/** True when icons for this day should be re-resolved (missing or older than 5 h). */
export async function isMarkerIconsDayStale(isoDate) {
  if (!isoDate) return true;
  const record = await readMarkerIconsRecordFromIdb(isoDate);
  return isMarkerIconsRecordStale(record);
}

/** Load all marker icons for a day from IDB into memory (call after loadSensors / before markers). */
export async function hydrateMarkerIconCacheForDate(isoDate) {
  if (!isoDate || !rosemanMarkerIconsEnabledForDate(isoDate)) return;
  const record = await readMarkerIconsRecordFromIdb(isoDate);
  const icons = record?.icons;
  if (!icons || typeof icons !== "object") return;
  for (const [sensorId, icon] of Object.entries(icons)) {
    if (!icon?.iconType) continue;
    const key = markerIconMemKey(isoDate, sensorId);
    const existing = markerIconMemCache.get(key);
    if (!existing || markerIconRank(icon.iconType) >= markerIconRank(existing.iconType)) {
      markerIconMemCache.set(key, icon);
    }
  }
}

/**
 * Persist map marker icon for a rep sensor (stable across popup hydration / realtime).
 * Never downgrades dual → single-device icon unless `force` (TTL refresh).
 */
export async function rememberMarkerIcon(sensorId, isoDate, icon, { force = false } = {}) {
  const sid = String(sensorId || "");
  const iconType = icon?.iconType;
  if (!sid || !isoDate || !iconType) return;

  const memKey = markerIconMemKey(isoDate, sid);
  const existing = markerIconMemCache.get(memKey);
  if (existing && markerIconRank(existing.iconType) > markerIconRank(iconType)) {
    return;
  }

  const payload = {
    iconType,
    fullBleed: Boolean(icon.fullBleed),
    updatedAt: Date.now(),
  };
  markerIconMemCache.set(memKey, payload);

  try {
    const idbKey = markerIconsIdbKey(isoDate);
    const prev = (await readMarkerIconsRecordFromIdb(isoDate)) || {
      id: idbKey,
      isoDate,
      icons: {},
    };
    const prevIcon = prev.icons?.[sid];
    if (prevIcon && markerIconRank(prevIcon.iconType) > markerIconRank(iconType)) {
      markerIconMemCache.set(memKey, { ...prevIcon, updatedAt: prevIcon.updatedAt || payload.updatedAt });
      return;
    }
    await writeMapMarkersDataToIdb({
      ...prev,
      id: idbKey,
      isoDate,
      icons: { ...(prev.icons || {}), [sid]: payload },
      lastUpdated: Date.now(),
    });
  } catch (error) {
    console.warn("mapMarkersData icon write failed:", error);
  }
}

function rememberMaxDataInMemory(unit, isoDate, start, end, values) {
  maxDataApiCache.set(unit, { start, end, isoDate, values: values || {} });
}

function isMaxDataMemoryValid(cached, isoDate, dayStart) {
  if (!cached?.values || cached.isoDate !== isoDate || cached.start !== dayStart) return false;
  return true;
}

function applyMaxValuesToSensors(sensors, unit, maxValues) {
  return sensors.map((sensor) => {
    const entry = maxValues?.[sensor.sensor_id];
    const value = entry ? (entry.value ?? null) : null;
    return {
      ...sensor,
      maxdata: {
        ...sensor.maxdata,
        [unit]: value,
      },
    };
  });
}

function isPastDayCompleteInIdb(record, dayBounds) {
  if (!record?.values) return false;
  return Number(record.start) <= dayBounds.start && Number(record.end) >= dayBounds.end;
}

function isFreshMapMarkersRecord(record) {
  if (!record?.lastUpdated) return false;
  return Date.now() - Number(record.lastUpdated) < REMOTE_DAY_REFRESH_MS;
}

async function readMapMarkersDataFromIdb(unit, isoDate) {
  try {
    return await IDBgetByKey(SENSORS_IDB_DB, MAP_MARKERS_DATA_STORE, mapMarkersDataId(unit, isoDate));
  } catch {
    return null;
  }
}

async function writeMapMarkersDataToIdb(record) {
  try {
    await IDBputRecord(SENSORS_IDB_DB, MAP_MARKERS_DATA_STORE, record);
    notifyDBChange(SENSORS_IDB_DB, MAP_MARKERS_DATA_STORE);
  } catch (error) {
    console.warn("mapMarkersData IDB write failed:", error);
  }
}

/**
 * Single maxdata entry: memory → IDB → network.
 * Any network response is always persisted to mapMarkersData IDB + memory cache.
 */
export async function ensureMaxDataRecord(unit, isoDate = dayISO(), requestedEnd = null) {
  const u = String(unit || "").toLowerCase();
  if (!u) {
    return { values: {}, start: 0, end: 0, source: "empty" };
  }

  const dayBounds = dayBoundsUnix(isoDate);
  const dayStart = dayBounds.start;
  const isToday = isoDate === dayISO();
  const end =
    requestedEnd != null
      ? Number(requestedEnd)
      : isToday
        ? Math.floor(Date.now() / 1000)
        : dayBounds.end;

  const mem = maxDataApiCache.get(u);
  if (isMaxDataMemoryValid(mem, isoDate, dayStart)) {
    if (!isToday || Number(mem.end) >= end) {
      return { values: mem.values, start: mem.start, end: mem.end, source: "memory" };
    }
  }

  const idbRecord = await readMapMarkersDataFromIdb(u, isoDate);

  let fetchStart = dayStart;
  let fetchEnd = end;
  let needFetch = false;

  if (!idbRecord?.values) {
    needFetch = true;
  } else if (!isToday) {
    if (isPastDayCompleteInIdb(idbRecord, dayBounds)) {
      rememberMaxDataInMemory(u, isoDate, idbRecord.start, idbRecord.end, idbRecord.values);
      return {
        values: idbRecord.values,
        start: idbRecord.start,
        end: idbRecord.end,
        source: "idb",
      };
    }
    needFetch = true;
    fetchEnd = dayBounds.end;
  } else if (!mem) {
    rememberMaxDataInMemory(u, isoDate, idbRecord.start, idbRecord.end, idbRecord.values);
    return {
      values: idbRecord.values,
      start: idbRecord.start,
      end: idbRecord.end,
      source: "idb",
    };
  } else if (Number(idbRecord.end) >= end) {
    rememberMaxDataInMemory(u, isoDate, idbRecord.start, idbRecord.end, idbRecord.values);
    return {
      values: idbRecord.values,
      start: idbRecord.start,
      end: idbRecord.end,
      source: "idb",
    };
  } else if (isToday && isFreshMapMarkersRecord(idbRecord)) {
    // Today: `end` tracks now() and drifts every second — reuse IDB for REMOTE_DAY_REFRESH_MS.
    rememberMaxDataInMemory(u, isoDate, idbRecord.start, idbRecord.end, idbRecord.values);
    return {
      values: idbRecord.values,
      start: idbRecord.start,
      end: idbRecord.end,
      source: "idb",
    };
  } else {
    needFetch = true;
    fetchStart = Number(idbRecord.start) || dayStart;
    fetchEnd = end;
  }

  if (!needFetch) {
    return {
      values: mem?.values || idbRecord?.values || {},
      start: mem?.start ?? idbRecord?.start ?? dayStart,
      end: mem?.end ?? idbRecord?.end ?? end,
      source: "memory",
    };
  }

  const inflightKey = maxDataInflightKey(u, isoDate, fetchEnd);
  const inflight = maxDataInflight.get(inflightKey);
  if (inflight) {
    return inflight;
  }

  const fetchPromise = (async () => {
    const values = (await REMOTE_PROVIDER.maxValuesForPeriod(fetchStart, fetchEnd, u)) || {};
    const record = {
      id: mapMarkersDataId(u, isoDate),
      unit: u,
      isoDate,
      start: fetchStart,
      end: fetchEnd,
      values,
      lastUpdated: Date.now(),
    };

    await writeMapMarkersDataToIdb(record);
    rememberMaxDataInMemory(u, isoDate, fetchStart, fetchEnd, values);

    return { values, start: fetchStart, end: fetchEnd, source: "network" };
  })();

  maxDataInflight.set(inflightKey, fetchPromise);
  try {
    return await fetchPromise;
  } finally {
    maxDataInflight.delete(inflightKey);
  }
}

/** At least one maxdata row is placed on the map (not 0,0). */
export function maxdataHasMapGeo(values) {
  if (!values || typeof values !== "object") return false;
  for (const entry of Object.values(values)) {
    if (entry?.geo && hasValidCoordinates(entry.geo)) return true;
  }
  return false;
}

/** @deprecated use sortMapLayerUnits from measurements/tools */
export const sortMeasurementUnits = sortMapLayerUnits;

/** Collect measurement keys from sensors that are drawable on the map (realtime). */
export function collectUnitsFromMapSensors(sensors) {
  const units = new Set();
  for (const sensor of Array.isArray(sensors) ? sensors : []) {
    if (!hasValidCoordinates(sensor?.geo)) continue;
    for (const bag of [sensor?.data, sensor?.maxdata]) {
      if (!bag || typeof bag !== "object") continue;
      for (const [key, raw] of Object.entries(bag)) {
        const unit = String(key).toLowerCase();
        if (!unit || raw === null || raw === undefined) continue;
        units.add(unit);
      }
    }
  }
  return sortMapLayerUnits([...units]);
}

/**
 * Units with maxdata at a real geo for the day (IDB/memory/network via ensureMaxDataRecord).
 */
export async function listMeasurementsOnMap(isoDate = dayISO(), requestedEnd = null) {
  const dateKey = isoDate || dayISO();
  const dayBounds = dayBoundsUnix(dateKey);
  const isToday = dateKey === dayISO();
  const end =
    requestedEnd != null
      ? Number(requestedEnd)
      : isToday
        ? Math.floor(Date.now() / 1000)
        : dayBounds.end;

  const results = await Promise.all(
    mapLayerUnitIds().map(async (unit) => {
      const { values } = await ensureMaxDataRecord(unit, dateKey, end);
      return maxdataHasMapGeo(values) ? unit : null;
    })
  );

  return sortMapLayerUnits(results.filter(Boolean));
}

/** @deprecated use listMeasurementsOnMap */
export async function filterMeasurementsOnMap(units, start, end, isoDate = dayISO()) {
  const list =
    Array.isArray(units) && units.length > 0
      ? units.map((u) => String(u).toLowerCase())
      : mapLayerUnitIds();
  const dateKey = isoDate || dayISO();
  const dayBounds = dayBoundsUnix(dateKey);
  const isToday = dateKey === dayISO();
  const requestedEnd = isToday
    ? Math.max(Number(end) || 0, Math.floor(Date.now() / 1000))
    : dayBounds.end;

  const results = await Promise.all(
    list.map(async (unit) => {
      const { values } = await ensureMaxDataRecord(unit, dateKey, requestedEnd);
      return maxdataHasMapGeo(values) ? unit : null;
    })
  );

  return sortMapLayerUnits(results.filter(Boolean));
}

/**
 * Получает максимальные значения с проверкой кэша и обновлением сенсоров
 * Проверяет, есть ли уже данные в sensors, и делает запрос только при необходимости
 * @param {number} start - начальный timestamp
 * @param {number} end - конечный timestamp
 * @param {string} unit - единица измерения (pm10, pm25, etc.)
 * @param {Array} sensors - массив сенсоров
 * @param {string} [isoDate] - YYYY-MM-DD (для кэша «сегодня» end может расти)
 * @returns {Array} обновленный массив сенсоров с maxdata
 */
export async function getMaxData(start, end, unit, sensors, isoDate = dayISO()) {
  const allHaveUnit =
    sensors.length > 0 &&
    sensors.every((sensor) => sensor?.maxdata && sensor.maxdata[unit] !== undefined);

  if (allHaveUnit) {
    return [...sensors];
  }

  const isToday = isoDate === dayISO();
  const requestedEnd = isToday ? Math.floor(Number(end) || Date.now() / 1000) : dayBoundsUnix(isoDate).end;
  const { values } = await ensureMaxDataRecord(unit, isoDate, requestedEnd);

  return applyMaxValuesToSensors(sensors, unit, values);
}

function markersListCacheId(isoDate, timelineMode = "day") {
  return `markers:${timelineMode || "day"}:${isoDate}`;
}

/**
 * `api/v2/sensor/markers/{start}/{end}` with IDB cache in mapMarkersData.
 * Past days: reuse when cached start/end covers the request.
 * Today: also reuse within REMOTE_DAY_REFRESH_MS while `end` drifts with now().
 */
async function loadMarkersListRaw(start, end, isoDate, timelineMode = "day") {
  const reqStart = Number(start);
  const reqEnd = Number(end);
  const isToday = isoDate === dayISO();
  const cacheId = markersListCacheId(isoDate, timelineMode);

  let cached = null;
  try {
    cached = await IDBgetByKey(SENSORS_IDB_DB, MAP_MARKERS_DATA_STORE, cacheId);
  } catch {
    // IDB unavailable — fall through to network.
  }

  if (Array.isArray(cached?.sensors)) {
    const coversWindow =
      Number(cached.start) <= reqStart && Number(cached.end) >= reqEnd;
    if (coversWindow || (isToday && isFreshMapMarkersRecord(cached))) {
      return cached.sensors;
    }
  }

  const sensors = (await REMOTE_PROVIDER.getSensorsForPeriod(reqStart, reqEnd)) || [];
  await writeMapMarkersDataToIdb({
    id: cacheId,
    isoDate,
    timelineMode,
    start: reqStart,
    end: reqEnd,
    sensors,
    lastUpdated: Date.now(),
  });
  return sensors;
}

async function latestRealtimeHistoryPoints() {
  const historyBySensor = await LIBP2P_PROVIDER.getHistoryPeriod();
  if (!historyBySensor || typeof historyBySensor !== "object") return [];

  const latest = [];
  for (const sensorId of Object.keys(historyBySensor)) {
    const rows = historyBySensor[sensorId];
    if (!Array.isArray(rows) || rows.length === 0) continue;
    latest.push(rows[rows.length - 1]);
  }
  return latest;
}

function markerRowsFromSensorData(historyData, { includeLiveData = false } = {}) {
  const sensors = [];
  const sensorsNoLocation = [];

  if (!Array.isArray(historyData)) return { sensors, sensorsNoLocation };

  for (const sensorData of historyData) {
    if (!sensorData || !sensorData.sensor_id || !sensorData.geo) continue;

    const lat = parseFloat(sensorData.geo.lat);
    const lng = parseFloat(sensorData.geo.lng);

    const sensorInfo = {
      sensor_id: sensorData.sensor_id,
      model: sensorData.model || 2,
      geo: { lat, lng },
      address: sensorData.address || null,
      donated_by: sensorData.donated_by || null,
      owner: String(sensorData.owner || "").trim() || null,
      device_model: sensorData.device_model || null,
      timestamp: sensorData.timestamp || null,
      sensors:
        Array.isArray(sensorData.sensors) && sensorData.sensors.length > 0
          ? sensorData.sensors
          : null,
    };

    if (includeLiveData && sensorData.data && typeof sensorData.data === "object") {
      sensorInfo.data = sensorData.data;
    }

    if (!hasValidCoordinates({ lat, lng })) {
      sensorsNoLocation.push(sensorInfo);
    } else {
      sensors.push(sensorInfo);
    }
  }

  const filteredSensors = filterSensorsByConfig(sensors);
  const filteredSensorsNoLocation = filterSensorsByConfig(sensorsNoLocation);
  const bounds = getConfigBounds(settings);
  return {
    sensors: filterByBounds(filteredSensors, bounds),
    sensorsNoLocation: filterByBounds(filteredSensorsNoLocation, bounds),
  };
}

/**
 * Map sensors for marker layer (remote: markers API + bounds filter).
 * Realtime: seed from libp2p session history so switching back does not wait
 * for the next pubsub tick (already-seen timestamps are not re-emitted).
 * @param {number} start - start unix timestamp
 * @param {number} end - end unix timestamp
 * @param {string} provider - 'remote' | 'realtime'
 * @param {Object} [cacheContext]
 * @param {string} [cacheContext.isoDate] - selected map date (enables IDB cache)
 * @param {string} [cacheContext.timelineMode] - day | week | month | realtime
 * @returns {{ sensors: Array, sensorsNoLocation: Array }}
 */
export async function getSensors(start, end, provider = "remote", cacheContext = null) {
  if (provider === "realtime") {
    return markerRowsFromSensorData(await latestRealtimeHistoryPoints(), { includeLiveData: true });
  }

  const historyData = cacheContext?.isoDate
    ? await loadMarkersListRaw(start, end, cacheContext.isoDate, cacheContext.timelineMode)
    : await REMOTE_PROVIDER.getSensorsForPeriod(start, end);

  return markerRowsFromSensorData(historyData);
}

/**
 * Фильтрует сенсоры согласно конфигурации excluded_sensors
 * @param {Array} sensors - массив сенсоров для фильтрации
 * @returns {Array} отфильтрованный массив сенсоров
 */
function filterSensorsByConfig(sensors) {
  if (!excluded_sensors || !excluded_sensors.sensors || excluded_sensors.sensors.length === 0) {
    return sensors;
  }

  const { mode, sensors: configSensors } = excluded_sensors;
  const sensorIdsSet = new Set(configSensors);

  if (mode === "include-only") {
    // Whitelist: показываем только сенсоры из списка
    return sensors.filter((sensor) => sensorIdsSet.has(sensor.sensor_id));
  } else {
    // Blacklist (exclude): скрываем сенсоры из списка
    return sensors.filter((sensor) => !sensorIdsSet.has(sensor.sensor_id));
  }
}

// =============================================================================
// TEMPORARY Roseman owner workaround — remove when a dedicated Roseman owner API
// ships. The new markers endpoint (`api/v2/sensor/markers/…`) omits `owner` for
// historical days before ~2026-06-08.
//
// On-demand only (popup / getSensorOwner / preloadSensorMeta) — never per-marker
// on map load. Fallback chain:
//   1) v2 sensor payload for today (owner often only in recent aggregates)
//   2) v2 sensor payload for the requested day
//
// Markers before ROSEMAN_MARKER_ICONS_FROM_ISO lack reliable device/owner meta — hide
// device-type icons on the map until that day (colored circles only).
// =============================================================================

/** TEMPORARY — first day markers API includes reliable device icon metadata. */
export const ROSEMAN_MARKER_ICONS_FROM_ISO = "2026-06-08";

export function rosemanMarkerIconsEnabledForDate(isoDate) {
  const d = String(isoDate || dayISO()).trim();
  return d >= ROSEMAN_MARKER_ICONS_FROM_ISO;
}

const rosemanOwnerWorkaroundCache = new Map();
const ROSEMAN_OWNER_WORKAROUND_TTL_MS = 15 * 60 * 1000;

function cacheRosemanOwnerWorkaroundMeta(sensorId, sensorMeta, owner) {
  if (!sensorMeta || typeof sensorMeta !== "object") return;
  const sid = String(sensorId || "").trim();
  if (!sid) return;
  cacheSensorMetaForBundle(sid, owner ? { ...sensorMeta, owner } : sensorMeta);
}

/**
 * TEMPORARY — see block above. Not the final Roseman owner lookup.
 */
async function resolveRosemanOwnerWorkaround(sensorId, startTimestamp, endTimestamp) {
  const sid = String(sensorId || "").trim();
  if (!sid) return null;

  const cached = rosemanOwnerWorkaroundCache.get(sid);
  if (cached && Date.now() - cached.ts < ROSEMAN_OWNER_WORKAROUND_TTL_MS) {
    return cached.owner;
  }

  let owner = null;
  const { start: todayStart, end: todayEnd } = sensorFetchBoundsForDate(dayISO());

  try {
    const todayPayload = await fetchSensorV2Payload(sid, todayStart, todayEnd);
    owner = normalizeOwnerKey(todayPayload?.sensor);
    if (owner) cacheRosemanOwnerWorkaroundMeta(sid, todayPayload.sensor, owner);
  } catch {
    // ignore
  }

  if (!owner && (startTimestamp !== todayStart || endTimestamp !== todayEnd)) {
    try {
      const periodPayload = await fetchSensorV2Payload(sid, startTimestamp, endTimestamp);
      owner = normalizeOwnerKey(periodPayload?.sensor);
      if (owner) cacheRosemanOwnerWorkaroundMeta(sid, periodPayload.sensor, owner);
    } catch {
      // ignore
    }
  }

  rosemanOwnerWorkaroundCache.set(sid, { owner: owner || null, ts: Date.now() });
  return owner || null;
}

/**
 * Получает owner для конкретного сенсора.
 * TEMPORARY: on-demand resolveRosemanOwnerWorkaround until Roseman owner API.
 * @param {string} [isoDate] - просматриваемый день (Daily Recap); для дат до 2026-06-08
 *   workaround также пробует v2 за сегодня.
 */
export async function getSensorOwner(sensorId, isoDate = null) {
  if (!sensorId) return null;

  try {
    const sid = String(sensorId);
    const entry = await readSensorIdbEntry(sid);
    if (entry && isFreshSensorIdbEntry(entry)) {
      if (entry.type === "diy") return null;
      if (entry.owner) return normalizeOwnerKey({ owner: entry.owner });
      // Day logs were written recently; DIY / no-owner sensors need no v2 owner probe.
      if (Date.now() - Number(entry.lastUpdated) < REMOTE_DAY_REFRESH_MS) return null;
    }

    const cached = getCachedSensorMeta(sid);
    if (cached) {
      const owner = normalizeOwnerKey(cached);
      if (owner) return owner;
    }

    const viewedDay = isoDate || dayISO();
    const { start, end } = sensorFetchBoundsForDate(viewedDay);
    return (await resolveRosemanOwnerWorkaround(sid, start, end)) || null;
  } catch (error) {
    console.warn("Failed to load sensor owner:", error);
    return null;
  }
}

function geoFromLogPoints(points) {
  if (!Array.isArray(points) || points.length === 0) return null;
  const geo = points[points.length - 1]?.geo;
  if (!geo || !hasValidCoordinates(geo)) return null;
  return geo;
}

/** Cache v2 meta only for the requested device id. */
function cacheSensorMetaForBundle(requestedId, meta) {
  if (!meta || typeof meta !== "object") return;
  const req = requestedId ? String(requestedId) : "";
  if (req) latestSensorMetaById.set(req, meta);
}

export function getCachedSensorMeta(sensorId) {
  if (!sensorId) return null;
  return latestSensorMetaById.get(String(sensorId)) || null;
}

export function clearSensorMetaCache() {
  latestSensorMetaById.clear();
  clearMaxDataApiCache();
}

function ownerBySensorIdFromList(sensorsList) {
  const map = new Map();
  for (const s of Array.isArray(sensorsList) ? sensorsList : []) {
    const id = String(s?.sensor_id || "");
    const owner = normalizeOwnerKey(s);
    if (id && owner) map.set(id, owner);
  }
  return map;
}

function bundleIdsFromMeta(meta, ownerKey) {
  if (!meta) return null;
  const owner = String(ownerKey || "").trim();
  const metaOwner = normalizeOwnerKey(meta);
  if (owner && metaOwner && metaOwner !== owner) return null;
  const ids = new Set();
  for (const { sensor_id } of listBundleSensorEntries(meta)) {
    const id = String(sensor_id || "");
    if (id) ids.add(id);
  }
  return ids.size > 0 ? ids : null;
}

/** Owner-device select: only devices from the active owner's v2 bundle and map list. */
export function filterBundleOptionsForOwner(items, ownerKey, activeSensorId, sensorsList) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  const owner = String(ownerKey || "").trim();
  if (!owner || list.length === 0) return list;

  const sid = String(activeSensorId || "");
  const allowed = new Set();
  const canonicalOwners = ownerBySensorIdFromList(sensorsList);

  const meta = sid ? getCachedSensorMeta(sid) : null;
  const bundleIds = bundleIdsFromMeta(meta, owner);
  if (bundleIds) {
    for (const id of bundleIds) {
      const listedOwner = canonicalOwners.get(id);
      if (listedOwner && listedOwner !== owner) continue;
      allowed.add(id);
    }
  }

  for (const [id, listedOwner] of canonicalOwners) {
    if (listedOwner === owner) allowed.add(id);
  }

  if (allowed.size === 0) {
    return sid ? list.filter((o) => String(o?.id || "") === sid) : [];
  }

  const filtered = list.filter((o) => {
    const id = String(o?.id || "");
    if (!id || !allowed.has(id)) return false;
    const listedOwner = canonicalOwners.get(id);
    return !listedOwner || listedOwner === owner;
  });

  if (sid && !filtered.some((o) => String(o.id) === sid)) {
    const self = list.find((o) => String(o.id) === sid);
    if (self) return [self, ...filtered];
  }

  return filtered.length > 0 ? filtered : list;
}

/**
 * Keep only owner-bundle siblings within `maxKm` of the anchor. Never widen to other cities.
 */
export function filterOwnerBundleNearAnchor(items, anchorGeo, activeSensorId, maxKm = OWNER_GEO_CLUSTER_KM) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  if (list.length === 0) return list;

  const withGeo = list.filter((o) => o?.geo && hasValidCoordinates(o.geo));
  if (!anchorGeo || !hasValidCoordinates(anchorGeo)) {
    return withGeo;
  }
  return withGeo.filter((o) => haversineKm(anchorGeo, o.geo) <= maxKm);
}

/**
 * All device ids for an owner present on the map list (fallback when getUserSensors API is empty).
 */
export function collectOwnerDeviceIds(ownerKey, sensorsList) {
  const owner = String(ownerKey || "").trim();
  if (!owner) return [];
  return [
    ...new Set(
      (Array.isArray(sensorsList) ? sensorsList : [])
        .filter((s) => normalizeOwnerKey(s) === owner)
        .map((s) => String(s?.sensor_id || ""))
        .filter(Boolean)
    ),
  ];
}

export function getOwnerSensorsWithData(
  sensorId,
  anchorGeoOverride = null,
  sensorsList = null,
  clusterBundle = true
) {
  if (!sensorId) return null;
  const meta = getCachedSensorMeta(sensorId);
  // Meta may not be loaded yet (async preload). Return null so callers can
  // keep previous UI options instead of overwriting with an empty list.
  if (!meta) return null;
  const data = meta?.data && typeof meta.data === "object" ? meta.data : {};
  const sid = String(sensorId);
  const metaOwner = normalizeOwnerKey(meta);
  const canonicalOwners = ownerBySensorIdFromList(sensorsList);

  const anchorGeo =
    (anchorGeoOverride && hasValidCoordinates(anchorGeoOverride) ? anchorGeoOverride : null) ||
    geoFromLogPoints(data?.[sid]) ||
    null;

  const mapped = listBundleSensorEntries(meta)
    .map(({ sensor_id, device_model }) => {
      const id = String(sensor_id);
      const points = Array.isArray(data[id]) ? data[id] : [];
      const hasData = points.length > 0;
      const geo = geoFromLogPoints(points);
      const inferredType = inferDeviceTypeFromLog(points);
      return {
        id,
        hasData: hasData && hasValidCoordinates(geo),
        type:
          sensorTypeFromDeviceModel(device_model) ||
          inferredType ||
          null,
        geo: hasValidCoordinates(geo) ? geo : null,
        device_model: device_model || inferredType || null,
      };
    })
    .filter((entry) => {
      const listedOwner = canonicalOwners.get(entry.id);
      if (listedOwner && metaOwner && listedOwner !== metaOwner) return false;
      return true;
    });

  const filtered = clusterBundle
    ? filterOwnerBundleNearAnchor(mapped, anchorGeo, sid)
    : mapped.filter((o) => o?.geo && hasValidCoordinates(o.geo));
  return filtered.length > 0 ? filtered : null;
}

/**
 * Preloads v2 `{ sensor: { sensors, data, owner } }` meta and caches it,
 * so UI (owner dropdown) can render before full logs are loaded.
 */
export async function preloadSensorMeta(sensorId, startTimestamp, endTimestamp, signal = null) {
  if (!sensorId) return null;
  try {
    const payload = await fetchSensorV2Payload(sensorId, startTimestamp, endTimestamp, signal);
    if (payload?.sensor && typeof payload.sensor === "object") {
      let meta = payload.sensor;
      if (!normalizeOwnerKey(meta)) {
        const owner = await resolveRosemanOwnerWorkaround(
          sensorId,
          startTimestamp,
          endTimestamp
        );
        if (owner) meta = { ...meta, owner };
      }
      cacheSensorMetaForBundle(sensorId, meta);
      return meta;
    }
    return null;
  } catch (error) {
    if (signal && signal.aborted) return null;
    return null;
  }
}

/**
 * Получает сообщения для realtime провайдера
 * @param {number} start - начальный timestamp
 * @param {number} end - конечный timestamp
 * @param {Object} providerObj - объект провайдера
 * @returns {Array} массив обработанных сообщений
 */
export async function getMessages(start, end) {
  try {
    return await REMOTE_PROVIDER.messagesForPeriod(start, end);
  } catch (error) {
    console.warn("Failed to load messages:", error);
    return [];
  }
}

/**
 * Получает данные для конкретного сенсора
 * @param {string} sensorId - ID сенсора
 * @param {number} startTimestamp - начальный timestamp
 * @param {number} endTimestamp - конечный timestamp
 * @param {string} provider - тип провайдера ('remote' или 'realtime')
 * @returns {Array} массив данных сенсора
 */
export async function getSensorData(
  sensorId,
  startTimestamp,
  endTimestamp,
  provider = "remote",
  onRealtimePoint = null,
  signal = null
) {
  try {
    // Проверяем, не был ли запрос отменен
    if (signal && signal.aborted) {
      return null; // null = запрос не выполнен (отменен)
    }

    if (provider === "realtime" && providerObj) {
      // Для realtime провайдера подписываемся на данные
      if (onRealtimePoint) {
        const unwatch = providerObj.watch(async (point) => {
          await onRealtimePoint(point);
        });
        return unwatch; // Возвращаем функцию отписки
      } else {
        // Если callback не передан, получаем исторические данные
        const historyData = await providerObj.getHistoryBySensor(sensorId);
        // Если данных нет, возвращаем [] (загружено, но пусто), если null/undefined - null (не загружено)
        return Array.isArray(historyData) ? historyData : null;
      }
    } else {
      const payload = await fetchSensorV2Payload(
        sensorId,
        startTimestamp,
        endTimestamp,
        signal
      );
      if (payload?.sensor && typeof payload.sensor === "object") {
        cacheSensorMetaForBundle(sensorId, payload.sensor);
      } else if (payload != null) {
        // v2 responded without owner meta — avoid duplicate owner workaround fetch this session.
        rosemanOwnerWorkaroundCache.set(String(sensorId), { owner: null, ts: Date.now() });
      }
      let historyData = payload?.result;
      const owner = normalizeOwnerKey(payload?.sensor);
      if (Array.isArray(historyData) && owner) {
        historyData = await decryptSensorHistoryEntries(sensorId, historyData, owner);
      }
      // Если данных нет, возвращаем [] (загружено, но пусто), если null/undefined - null (не загружено)
      return Array.isArray(historyData) ? historyData : null;
    }
  } catch (error) {
    // Если запрос был отменен, не логируем ошибку
    if (signal && signal.aborted) {
      return null; // null = запрос не выполнен (отменен)
    }
    console.error("Error fetching sensor history:", error);
    return null; // null = запрос не выполнен (ошибка)
  }
}

/**
 * Устанавливает объект провайдера
 * @param {Object} provider - объект провайдера
 */
export function setProvider(provider) {
  providerObj = provider;
}

/**
 * Получает текущий объект провайдера
 * @returns {Object} объект провайдера
 */
export function getProvider() {
  return providerObj;
}

/**
 * Инициализирует провайдер по типу.
 * Live pubsub is started separately via ensureRealtimeSubscription.
 * @param {string} providerType - тип провайдера ('remote' или 'realtime')
 * @param {Function} [onRemoteReady] - callback для remote готовности
 * @returns {Promise<Object>} объект с результатом инициализации
 */
export async function initProvider(providerType, onRemoteReady = null) {
  if (providerType === "remote") {
    setProvider(REMOTE_PROVIDER);

    const isReady = await REMOTE_PROVIDER.status();
    if (!isReady) {
      return { success: false, provider: null };
    }

    // Если передан callback для remote готовности, вызываем его
    if (onRemoteReady) {
      onRemoteReady();
    }

    return { success: true, provider: REMOTE_PROVIDER };
  } else if (providerType === "realtime") {
    setProvider(LIBP2P_PROVIDER);

    await LIBP2P_PROVIDER.ready();

    // Live feed is owned by ensureRealtimeSubscription so day/week/month
    // (remote map provider) still receive pubsub points.
    return { success: true, provider: LIBP2P_PROVIDER };
  }

  return { success: false, provider: null };
}

/**
 * Keep a libp2p pubsub listener even when the map uses the remote provider.
 * @param {Function} onRealtimePoint - callback для обработки данных
 * @returns {Promise<Function|null>} функция отписки
 */
export async function ensureRealtimeSubscription(onRealtimePoint) {
  if (!onRealtimePoint) return null;
  await LIBP2P_PROVIDER.ready();
  return subscribeRealtime(onRealtimePoint);
}

/**
 * Подписывается на realtime данные (libp2p), независимо от текущего map provider.
 * @param {Function} onRealtimePoint - callback для обработки данных
 * @returns {Function} функция отписки
 */
export function subscribeRealtime(onRealtimePoint) {
  if (!onRealtimePoint) return null;
  return LIBP2P_PROVIDER.watch(async (point) => {
    await onRealtimePoint(point);
  });
}

let sensorCitiesCache = null;
let sensorCitiesPromise = null;

/**
 * Cities list for history CSV export. One GET per session.
 * Provider health check uses HEAD in remote Provider.status().
 */
export async function fetchSensorCities() {
  if (sensorCitiesCache) return sensorCitiesCache;
  if (sensorCitiesPromise) return sensorCitiesPromise;

  sensorCitiesPromise = fetch(`${settings.REMOTE_PROVIDER}api/sensor/cities`, { cache: "default" })
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data = json?.result;
      if (!data || typeof data !== "object") throw new Error("Invalid cities payload");
      sensorCitiesCache = data;
      return data;
    })
    .finally(() => {
      sensorCitiesPromise = null;
    });

  return sensorCitiesPromise;
}

// ==================== INDEXEDDB CACHE FUNCTIONS ====================

const SENSOR_IDB_TTL = 24 * 60 * 60 * 1000; // 24 hours

function stripSensorCacheAddress(entry) {
  if (!entry || !("address" in entry)) return entry;
  const { address: _removed, ...rest } = entry;
  return rest;
}

function readSensorIdbEntry(sensorId) {
  const sensorKey = String(sensorId || "");
  if (!sensorKey) return Promise.resolve(null);

  return new Promise((resolve) => {
    IDBworkflow("Sensors", "sensorData", "readonly", (store) => {
      const request = store.get(sensorKey);
      request.onsuccess = () => {
        const result = request.result || null;
        if (result && "address" in result) {
          const cleaned = stripSensorCacheAddress(result);
          IDBworkflow("Sensors", "sensorData", "readwrite", (writeStore) => {
            writeStore.put(cleaned);
          });
          notifyDBChange("Sensors", "sensorData");
          resolve(cleaned);
          return;
        }
        resolve(result);
      };
      request.onerror = () => resolve(null);
    });
  });
}

function isFreshSensorIdbEntry(entry) {
  if (!entry?.lastUpdated) return false;
  return Date.now() - Number(entry.lastUpdated) < SENSOR_IDB_TTL;
}

/**
 * Cached sensor meta from IndexedDB (owner, type).
 * Avoids repeat API calls when logs were loaded in this session or recently.
 */
export async function getCachedSensorIdbMeta(sensorId) {
  try {
    const entry = await readSensorIdbEntry(sensorId);
    if (!isFreshSensorIdbEntry(entry)) return null;
    return {
      owner: entry.owner ?? null,
      type: entry.type ?? null,
    };
  } catch (error) {
    console.error("Error getting cached sensor IDB meta:", error);
    return null;
  }
}

/**
 * Получает данные из кэша для указанных дней
 * @param {string} sensorId - ID сенсора
 * @param {Array<string>} dates - массив дат в формате YYYY-MM-DD
 * @returns {Promise<Object>} объект с данными по дням и адресом
 */
async function getCachedData(sensorId, dates) {
  try {
    const cachedData = { data: {}, owner: null, type: null, lastUpdated: 0 };
    const sensorData = await readSensorIdbEntry(sensorId);

    if (sensorData && isFreshSensorIdbEntry(sensorData)) {
      for (const date of dates) {
        if (sensorData.data && sensorData.data[date]) {
          cachedData.data[date] = sensorData.data[date];
        }
      }
      cachedData.owner = sensorData.owner ?? null;
      cachedData.type = sensorData.type ?? null;
      cachedData.lastUpdated = Number(sensorData.lastUpdated || 0);
    }

    return cachedData;
  } catch (error) {
    console.error("Error getting cached data:", error);
    return { data: {}, owner: null, type: null, lastUpdated: 0 };
  }
}

/**
 * Сохраняет данные в кэш
 * @param {string} sensorId - ID сенсора
 * @param {Object} dataByDate - объект с данными по дням
 * @param {Object} meta - owner, type (optional)
 */
async function saveToCache(sensorId, dataByDate, meta = {}) {
  try {
    const sensorKey = sensorId;
    const now = Date.now();
    const { owner = null, type = null } = meta;

    const existingData = await new Promise((resolve) => {
      IDBworkflow("Sensors", "sensorData", "readonly", (store) => {
        const request = store.get(sensorKey);

        request.onsuccess = () => {
          resolve(request.result || { data: {} });
        };

        request.onerror = () => {
          resolve({ data: {} });
        };
      });
    });

    const updatedData = {
      ...existingData.data,
      ...dataByDate,
    };

    const finalOwner = owner ?? existingData.owner ?? null;
    const finalType = type ?? existingData.type ?? null;

    const cacheEntry = stripSensorCacheAddress({
      id: sensorKey,
      data: updatedData,
      owner: finalOwner,
      type: finalType,
      lastUpdated: now,
      ttl: 24 * 60 * 60 * 1000,
    });

    await new Promise((resolve) => {
      // Wait for put so a quick page reload can read fresh logs from IDB.
      IDBworkflow("Sensors", "sensorData", "readwrite", (store) => {
        const request = store.put(cacheEntry);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      });
    });

    // Уведомляем об изменениях в кэше
    notifyDBChange("Sensors", "sensorData");
  } catch (error) {
    console.error("Error saving to cache:", error);
  }
}

/**
 * Получает список дней между двумя датами
 * @param {string} startDate - начальная дата в формате YYYY-MM-DD
 * @param {string} endDate - конечная дата в формате YYYY-MM-DD
 * @returns {Array<string>} массив дат
 */
function getDaysBetween(startDate, endDate) {
  const days = [];
  const [sy, sm, sd] = String(startDate).split("-").map(Number);
  const [ey, em, ed] = String(endDate).split("-").map(Number);

  const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
  const end = new Date(ey, em - 1, ed, 0, 0, 0, 0);

  for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
    days.push(dayISO(dt));
  }

  return days;
}

/**
 * Очищает устаревшие данные из кэша
 * @param {number} maxAge - максимальный возраст данных в миллисекундах (по умолчанию 7 дней)
 */
export async function clearExpiredCache(maxAge = 7 * 24 * 60 * 60 * 1000) {
  try {
    const allCachedData = await IDBgettable("Sensors", "sensorData");
    const now = Date.now();

    for (const entry of allCachedData) {
      if (now - entry.lastUpdated > maxAge) {
        await IDBdeleteByKey("Sensors", "sensorData", entry.id);
      }
    }

    notifyDBChange("Sensors", "sensorData");
  } catch (error) {
    console.error("Error clearing expired cache:", error);
  }
}

/**
 * Очищает весь кэш сенсоров
 */
export async function clearAllCache() {
  try {
    IDBcleartable("Sensors", "sensorData");
    notifyDBChange("Sensors", "sensorData");
  } catch (error) {
    console.error("Error clearing all cache:", error);
  }
}

/**
 * @deprecated Addresses are stored per geo in the `addresses` IDB store. Use geoAddresses.js.
 */
export async function getCachedAddress() {
  return null;
}

/**
 * @deprecated Addresses are stored per geo in the `addresses` IDB store. Use geoAddresses.js.
 */
export async function saveAddressToCache() {
  return;
}

/**
 * Получает статистику кэша
 * @returns {Promise<Object>} объект со статистикой
 */
export async function getCacheStats() {
  try {
    const allCachedData = await IDBgettable("Sensors", "sensorData");
    const now = Date.now();
    const TTL = 24 * 60 * 60 * 1000; // 24 часа

    const stats = {
      totalSensors: allCachedData.length,
      validSensors: 0,
      expiredSensors: 0,
      totalDays: 0,
      totalDataPoints: 0,
      oldestEntry: null,
      newestEntry: null,
      sensors: [],
    };

    for (const entry of allCachedData) {
      const sensorInfo = {
        sensorId: entry.id, // Теперь ID сенсора хранится в поле id
        days: Object.keys(entry.data || {}).length,
        dataPoints: 0,
        lastUpdated: entry.lastUpdated,
        isExpired: now - entry.lastUpdated >= TTL,
      };

      // Подсчитываем общее количество точек данных
      for (const dayData of Object.values(entry.data || {})) {
        sensorInfo.dataPoints += dayData.length;
      }

      stats.totalDays += sensorInfo.days;
      stats.totalDataPoints += sensorInfo.dataPoints;

      if (sensorInfo.isExpired) {
        stats.expiredSensors++;
      } else {
        stats.validSensors++;
      }

      if (!stats.oldestEntry || entry.lastUpdated < stats.oldestEntry) {
        stats.oldestEntry = entry.lastUpdated;
      }

      if (!stats.newestEntry || entry.lastUpdated > stats.newestEntry) {
        stats.newestEntry = entry.lastUpdated;
      }

      stats.sensors.push(sensorInfo);
    }

    return stats;
  } catch (error) {
    console.error("Error getting cache stats:", error);
    return null;
  }
}

/**
 * Получает данные сенсора с кэшированием по дням
 * @param {string} sensorId - ID сенсора
 * @param {number} startTimestamp - начальный timestamp
 * @param {number} endTimestamp - конечный timestamp
 * @param {string} provider - тип провайдера
 * @param {Function} onRealtimePoint - callback для realtime данных
 * @param {AbortSignal} signal - сигнал для отмены запроса
 * @param {Function} [progressCallback]
 * @param {Object|null} [cacheMeta]
 * @returns {Promise<Array>} массив данных сенсора
 */
export async function getSensorDataWithCache(
  sensorId,
  startTimestamp,
  endTimestamp,
  provider = "remote",
  onRealtimePoint = null,
  signal = null,
  progressCallback = null,
  cacheMeta = null
) {
  // Для realtime провайдера используем обычную логику
  if (provider === "realtime") {
    return getSensorData(sensorId, startTimestamp, endTimestamp, provider, onRealtimePoint, signal);
  }

  try {
    // Конвертируем timestamps в даты
    const startDate = dayISO(startTimestamp);
    const endDate = dayISO(endTimestamp);

    // Получаем список нужных дней
    const neededDays = getDaysBetween(startDate, endDate);

    // NOTE: We intentionally use the per-day caching path (below) for week/month.
    // It provides real progress updates (loadedDays/totalDays) and keeps the UI responsive
    // even when v2 payloads are large for owners with many sensors.

    // Проверяем что есть в кэше (включая адрес)
    const cachedResult = await getCachedData(sensorId, neededDays);
    const cachedData = cachedResult.data;

    // Local calendar day (matches dayISO / timeline bounds, not UTC).
    const today = dayISO();

    // Если в кэшированном массиве логов последний timestamp заметно раньше конца дня, то принудительно обновляем этот день (кроме today).
    const isLikelyIncompleteDayCache = (day) => {
      if (!day || day === today) return false;
      const dayArr = cachedData?.[day];
      if (!Array.isArray(dayArr) || dayArr.length < 2) return false;

      let maxTs = 0;
      for (const item of dayArr) {
        const ts = Number(item?.timestamp || 0);
        if (Number.isFinite(ts) && ts > maxTs) maxTs = ts;
      }
      if (!maxTs) return false;

      const { end: dayEndSec } = dayBoundsUnix(day);
      // 10 минут буфер: не считаем день "обрезанным" если данные почти до конца дня
      return maxTs < Number(dayEndSec) - 10 * 60;
    };

    // Day tab: trust IDB for REMOTE_DAY_REFRESH_MS. Week/month still re-fetch today.
    const isDayTab = neededDays.length === 1;
    const cacheAge = Date.now() - Number(cachedResult.lastUpdated || 0);
    const missingDays = neededDays.filter((day) => {
      if (!cachedData[day]) return true;
      if (isLikelyIncompleteDayCache(day)) return true;
      if (isDayTab) return cacheAge >= REMOTE_DAY_REFRESH_MS;
      if (day === today) return true;
      return false;
    });

    const totalDays = neededDays.length;
    const cachedDays = totalDays - missingDays.length;

    const emitProgress = (payload) => {
      if (typeof progressCallback === "function") {
        try {
          progressCallback({
            totalDays,
            cachedDays,
            ...payload,
          });
        } catch (error) {
          console.warn("Progress callback failed:", error);
        }
      }
    };

    if (totalDays > 0) {
      if (missingDays.length === 0) {
        emitProgress({
          status: "done",
          loadedDays: totalDays,
          missingDays: 0,
          totalDays,
          cachedDays,
        });
      } else {
        emitProgress({
          status: "init",
          loadedDays: cachedDays,
          missingDays: missingDays.length,
          totalDays,
          cachedDays,
        });
      }
    }

    let newData = {};

    // Загружаем недостающие дни или текущий день (для обновления данных)
    if (missingDays.length > 0) {
      let loadedDays = cachedDays;
      for (const day of missingDays) {
        const { start: dayStart, end: dayEnd } = sensorFetchBoundsForDate(day);

        const dayData = await getSensorData(sensorId, dayStart, dayEnd, provider, null, signal);
        // Сохраняем только если это массив (успешно загружено, даже пустое)
        // null означает что запрос не выполнен - не сохраняем в newData
        if (Array.isArray(dayData)) {
          newData[day] = dayData;
          loadedDays += 1;
          emitProgress({
            status: "progress",
            loadedDays,
            missingDays: Math.max(totalDays - loadedDays, 0),
            totalDays,
            cachedDays,
          });
        }
      }
      // Сохраняем только успешно загруженные данные (массивы)
      if (Object.keys(newData).length > 0) {
        const dayLogs = Object.values(newData).find((v) => Array.isArray(v));
        await saveToCache(sensorId, newData, {
          owner: cacheMeta?.owner ?? null,
          // Persist device type so getSensorOwner can skip v2 on the next popup open.
          type: cacheMeta?.type ?? (dayLogs ? inferDeviceTypeFromLog(dayLogs) : null),
        });
      }
    }

    // Объединяем данные из кэша и новые данные
    // Для текущего дня приоритет у новых данных (чтобы получить актуальные данные)
    const allData = {};
    for (const day of neededDays) {
      if (day === today && newData[day]) {
        allData[day] = newData[day];
      } else if (newData[day]) {
        allData[day] = newData[day];
      } else if (cachedData[day] !== undefined && cachedData[day] !== null) {
        if (missingDays.includes(day)) {
          continue; // stale slice — dropped because we are re-fetching this day
        }
        allData[day] = cachedData[day];
      }
    }

    // Объединяем все данные в один массив и сортируем по времени
    const result = [];
    for (const dayData of Object.values(allData)) {
      if (Array.isArray(dayData)) {
        result.push(...dayData);
      }
    }

    // Если result пустой и мы делали запрос, но не получили данных - возвращаем null
    // Если result пустой, но данные были в кэше (пустые массивы) - возвращаем []
    // Если result не пустой - возвращаем отсортированный массив
    if (result.length === 0 && missingDays.length > 0 && Object.keys(newData).length === 0) {
      // Запрос был сделан, но не вернул данных - возвращаем null (не загружено)
      emitProgress({
        status: "error",
        loadedDays: cachedDays,
        missingDays: missingDays.length,
        totalDays,
        cachedDays,
      });
      return null;
    }

    // Добавляем метаданные из кэша для использования в компонентах
    result._cachedOwner = cachedResult.owner ?? null;
    result._cachedType = cachedResult.type ?? null;

    const ownerForDecrypt =
      cacheMeta?.owner ?? cachedResult.owner ?? normalizeOwnerKey(getCachedSensorMeta(sensorId));
    if (ownerForDecrypt) {
      const decrypted = await decryptSensorHistoryEntries(sensorId, result, ownerForDecrypt);
      result.length = 0;
      result.push(...decrypted);
    }

    emitProgress({ status: "done", loadedDays: totalDays, missingDays: 0, totalDays, cachedDays });

    return result.sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error("Error in getSensorDataWithCache:", error);
    if (typeof progressCallback === "function") {
      progressCallback({
        status: "error",
        totalDays: 0,
        cachedDays: 0,
        loadedDays: 0,
        missingDays: 0,
      });
    }
    // Fallback к обычной загрузке
    return getSensorData(sensorId, startTimestamp, endTimestamp, provider, onRealtimePoint, signal);
  }
}
