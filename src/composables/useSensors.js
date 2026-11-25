/**
 * Central composable for map sensors, popup state, logs, and marker lifecycle.
 *
 * File layout: imports → constants → variables → refs → computed → methods.
 * Module-level refs/computed are shared across all useSensors() callers.
 */
import { ref, computed, watch, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";

import { useMap } from "@/composables/useMap";
import { peekUserSensorsCache, useAccounts, accountHasOwnerSecret } from "@/composables/useAccounts";
import { isPointBookmarked, refreshAllMarkerBookmarkHighlights } from "@/composables/useBookmarks";

import { excluded_sensors, settings } from "@config";
import * as sensorsUtils from "../utils/map/sensors";
import { clearActiveMarker, setActiveMarker } from "../utils/map/markers";
import {
  getSensors,
  getSensorDataWithCache,
  getMaxData,
  getSensorOwner,
  getCachedSensorIdbMeta,
  clearSensorMetaCache,
  getCachedMaxDataValue,
  getCachedMaxDataEntry,
  hydrateMarkerIconCacheForDate,
  parseBundleSensorEntry,
  pickOwnerClusterRepresentative,
  normalizeOwnerKey,
  hasSensorOwner,
  haversineKm,
  OWNER_GEO_CLUSTER_KM,
  sensorFetchBoundsForDate,
  sensorTypeFromDeviceModel,
  inferDeviceTypeFromLog,
} from "../utils/map/sensors/requests";
import { hasValidCoordinates } from "../utils/utils";
import { dayISO, timelineFetchBounds } from "@/utils/date";
import { getMapAddressZoom } from "@/utils/map/defaultView";
import { loadLogsHealth } from "../utils/calculations/sensor/logs_health.js";
import converter from "../measurements";
import {
  decryptMeasurementBag,
  measurementBagHasEncryptedValues,
} from "../utils/sensorValueCrypto";
import { getProvider } from "../utils/map/sensors/requests";

import {
  resolveSensorType,
  formatSensorIdShort,
  sensorTypeTitle,
  sensorTypeIcon,
} from "./sensorDeviceTypes";
import {
  shouldClusterOwnerBundle,
  buildSensorPickerRows,
  buildOwnerSensorsWithData,
  buildOwnerSensorsWithDataAsync,
  mergeOwnerBundleOptions,
  applyFilteredOwnerBundleOptions,
  finalizeOwnerBundleNearAnchor,
  resolveBundleAnchorGeo,
  resolveOwnerForSensorId,
  resolveOwnerClusterPool,
  collectOwnerClusterSensorIds,
  pickSensorIdForMapUnit,
  ownerBundleSig,
  markerSensorsEntries,
  unitValueFromBag,
  ensureOwnerSensorIds,
  inferTypesForOwnerIds,
  buildOwnerBundleFromIds,
} from "./sensorOwnerBundle";
import { mapMarkerIcon, refreshMarkerIconsForSensors } from "./sensorMarkerIcons";

// --- Constants ---

/** Roseman API uses -1 for pm25/pm10 as “no reading” — strip from log points. */
const PM_LOG_KEYS = ["pm25", "pm10"];
const DEFAULT_SENSOR_MODEL = 2;

const createDefaultLogsProgress = () => ({
  status: "idle",
  active: false,
  totalDays: 0,
  cachedDays: 0,
  loadedDays: 0,
  missingDays: 0,
  percent: 0,
  mode: null,
});

// --- Variables ---

let realtimeLogsLoadInFlight = false;
let currentRequestId = null;
let currentLogsRequestId = null;
let lastLoadProvider = null;
let currentLogsAbortController = null;
let currentLogsKey = null;
let logsRequestInFlight = false;
let popupSessionId = 0;
let realtimeHydrationWatchersRegistered = false;
let ownerDecryptWatchersRegistered = false;
let setSensorDataHandler = null;
let updateSensorLogsHandler = null;

const ownerPromises = new Map();

// --- Refs ---

const sensors = ref([]);
const sensorsNoLocation = ref([]);
const sensorsLoaded = ref(false);
/** Rows of the feed areas a visitor switched on (useFeeds), by area id. */
const feedRowsByArea = new Map();
const withFeedRows = (list) => [...list.filter((s) => !s.feed), ...[...feedRowsByArea.values()].flat()];
const logsProgress = ref(createDefaultLogsProgress());
const sensorPoint = ref(null);
const recentlyClosed = ref({ id: null, until: 0 });
const isUpdatingPopup = ref(false);
const realtimeLiveSensorIds = ref(new Set());
const realtimeHydratedSid = ref(null);

// --- Computed ---

const isSensor = computed(() => {
  // Popup can be opened via URL (`sensor=`) or by marker click (no `sensor=` in URL).
  return !!(sensorPoint.value && sensorPoint.value.sensor_id);
});

// --- Methods (module-private) ---



function logHasEncryptedValues(logs) {
  if (!Array.isArray(logs)) return false;
  return logs.some((item) => measurementBagHasEncryptedValues(item?.data));
}

async function redecryptDataBag(sensorId, bag, ownerAccount) {
  if (!bag || typeof bag !== "object") return bag;
  const decrypted = await decryptMeasurementBag(sensorId, bag, ownerAccount);
  const out = {};
  for (const [key, raw] of Object.entries(decrypted)) {
    const name = String(key).toLowerCase();
    if (typeof raw === "string" && raw.startsWith("e.")) {
      out[name] = raw;
      continue;
    }
    out[name] = converter[name]?.calculate ? converter[name].calculate(raw) : raw;
  }
  return out;
}

async function redecryptLogEntries(sensorId, logs, ownerAccount) {
  if (!Array.isArray(logs) || logs.length === 0) return { logs, changed: false };
  let changed = false;
  const next = await Promise.all(
    logs.map(async (item) => {
      if (!item?.data || !measurementBagHasEncryptedValues(item.data)) return item;
      const data = await redecryptDataBag(sensorId, item.data, ownerAccount);
      if (JSON.stringify(data) === JSON.stringify(item.data)) return item;
      changed = true;
      return { ...item, data };
    })
  );
  return { logs: next, changed };
}

/** Merge popup/stream logs with libp2p history; decrypt when owner seed is available. */
async function hydrateRealtimeLogsForSensor(sensorId, existingLogs, ownerAccount) {
  const provider = getProvider();
  if (provider?.redecryptHistoryForSensor && ownerAccount) {
    await provider.redecryptHistoryForSensor(sensorId, ownerAccount);
  }

  let logs = normalizeSensorLogs(existingLogs);
  if (provider?.getHistoryBySensor) {
    const history = historyPointsToLogs(await provider.getHistoryBySensor(sensorId));
    logs = mergeSensorLogsByTimestamp(logs, history);
  }

  if (logs.length > 0 && ownerAccount) {
    ({ logs } = await redecryptLogEntries(sensorId, logs, ownerAccount));
  }
  return logs;
}

function isSensorOpenFor(sensorId) {
  return sensorPoint.value && String(sensorPoint.value.sensor_id) === String(sensorId);
}


function historyPointsToLogs(history) {
  if (!Array.isArray(history)) return [];
  return history
    .map((p) => {
      const ts = Number(p?.timestamp);
      if (!Number.isFinite(ts) || !p?.data) return null;
      const entry = { timestamp: ts, data: p.data };
      if (p.geo && Number.isFinite(Number(p.geo.lat)) && Number.isFinite(Number(p.geo.lng))) {
        entry.geo = p.geo;
      }
      return entry;
    })
    .filter(Boolean)
    .sort((a, b) => a.timestamp - b.timestamp);
}

function resolveOwnerAccount(accountsList, ownerAddress, sensorId) {
  const list = Array.isArray(accountsList) ? accountsList : [];
  const owner = String(ownerAddress || "").trim();
  const sid = String(sensorId || "").trim();

  if (owner) {
    const byOwner = list.find(
      (a) => String(a?.address || "").trim() === owner && accountHasOwnerSecret(a)
    );
    if (byOwner) return byOwner;
  }

  if (sid) {
    const bySensorAsAccount = list.find(
      (a) => String(a?.address || "").trim() === sid && accountHasOwnerSecret(a)
    );
    if (bySensorAsAccount) return bySensorAsAccount;

    const byDevice = list.find(
      (a) =>
        accountHasOwnerSecret(a) &&
        Array.isArray(a.devices) &&
        a.devices.some((deviceId) => String(deviceId).trim() === sid)
    );
    if (byDevice) return byDevice;
  }

  return null;
}

function isOwnerAccountLoggedIn(accountsList, ownerAddress, sensorId) {
  return !!resolveOwnerAccount(accountsList, ownerAddress, sensorId);
}

async function redecryptAllRealtimeHistory(accountsList) {
  const mapState = useMap();
  if (mapState.currentProvider.value !== "realtime") return;

  const provider = getProvider();
  if (!provider?.redecryptHistoryForSensor || !provider?.history) return;

  const list = Array.isArray(accountsList) ? accountsList : [];
  if (list.length === 0) return;

  await Promise.all(
    Object.keys(provider.history).map(async (sensorId) => {
      const sid = String(sensorId);
      const items = provider.history[sensorId];
      const pointOwner = items?.find((item) => item?.owner)?.owner;
      const account = resolveOwnerAccount(list, pointOwner, sid);
      if (!account) return;

      const changed = await provider.redecryptHistoryForSensor(sid, account);
      if (!changed) return;

      const history = provider.history[sid];
      const latest = Array.isArray(history) ? history[history.length - 1] : null;
      if (!latest?.data || measurementBagHasEncryptedValues(latest.data)) return;

      if (setSensorDataHandler) {
        setSensorDataHandler(sid, {
          data: latest.data,
          owner: latest.owner || null,
          geo: latest.geo,
          model: latest.model,
          device_model: latest.device_model,
          timestamp: latest.timestamp,
        });
      }
    })
  );
}

/** Decrypt open popup (+ realtime history) when a logged-in owner seed is available. */
async function runOwnerDecrypt() {
  const mapState = useMap();
  const popup = sensorPoint.value;
  if (!popup?.sensor_id) return;

  const owner = normalizeOwnerKey(popup);
  const sensorId = String(popup.sensor_id);
  const accountsList = useAccounts().accounts.value;
  const ownerAccount = resolveOwnerAccount(accountsList, owner, sensorId);
  if (!ownerAccount) return;

  const needsDataDecrypt = measurementBagHasEncryptedValues(popup.data);
  const needsLogsDecrypt = logHasEncryptedValues(popup.logs);
  if (!needsDataDecrypt && !needsLogsDecrypt && mapState.currentProvider.value !== "realtime") {
    return;
  }

  let nextData = popup.data;
  if (needsDataDecrypt) {
    nextData = await redecryptDataBag(sensorId, popup.data, ownerAccount);
  }

  let logsOut = normalizeSensorLogs(popup.logs);
  if (mapState.currentProvider.value === "realtime") {
    const provider = getProvider();
    if (provider?.redecryptHistoryForSensor) {
      await provider.redecryptHistoryForSensor(sensorId, ownerAccount);
    }
    const history = historyPointsToLogs(await provider?.getHistoryBySensor?.(sensorId));
    if (history.length > 0) {
      const latestHistory = history[history.length - 1];
      if (
        latestHistory?.data &&
        !measurementBagHasEncryptedValues(latestHistory.data)
      ) {
        nextData = latestHistory.data;
      }
    }
    const nextLogs = await hydrateRealtimeLogsForSensor(sensorId, logsOut, ownerAccount);
    logsOut = nextLogs.length > 0 ? [...nextLogs] : [...logsOut];
  } else if (needsLogsDecrypt) {
    ({ logs: logsOut } = await redecryptLogEntries(sensorId, logsOut, ownerAccount));
  }

  const stillEncrypted =
    measurementBagHasEncryptedValues(nextData) || logHasEncryptedValues(logsOut);
  if (
    stillEncrypted &&
    !needsDataDecrypt &&
    !needsLogsDecrypt &&
    mapState.currentProvider.value !== "realtime"
  ) {
    return;
  }

  const decryptRev = (popup._decryptRev || 0) + 1;
  sensorPoint.value = {
    ...popup,
    data: nextData,
    logs: logsOut,
    owner: owner || popup.owner || ownerAccount.address || popup.owner,
    _decryptRev: decryptRev,
    _logsKey: popup._logsKey || `owner-decrypt:${sensorId}:${decryptRev}`,
  };

  if (setSensorDataHandler) {
    setSensorDataHandler(sensorId, {
      data: nextData,
      ...(logsOut.length > 0 ? { logs: logsOut } : null),
    });
  }

  if (
    updateSensorLogsHandler &&
    isSensorOpenFor(sensorId) &&
    mapState.currentProvider.value === "realtime" &&
    stillEncrypted
  ) {
    await updateSensorLogsHandler(sensorId);
  }
}

function pmValueMeansMissing(value) {
  const n = Number(value);
  return Number.isFinite(n) && n === -1;
}

function sanitizePmFieldsInData(data) {
  if (!data || typeof data !== "object") return data;
  let next = data;
  let copied = false;
  for (const key of PM_LOG_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
    if (!pmValueMeansMissing(data[key])) continue;
    if (!copied) {
      next = { ...data };
      copied = true;
    }
    delete next[key];
  }
  return next;
}

function sanitizeSensorLogsPmSentinels(logs) {
  if (!Array.isArray(logs)) return logs;
  return logs.map((item) => {
    if (!item || typeof item !== "object") return item;
    const nextData = sanitizePmFieldsInData(item.data);
    if (nextData === item.data) return item;
    return { ...item, data: nextData };
  });
}

function normalizeSensorLogEntry(item) {
  if (!item || typeof item !== "object") return null;
  const ts = Number(item.timestamp);
  const data = item.data;
  if (!Number.isFinite(ts) || !data || typeof data !== "object") return null;
  const entry = { timestamp: ts, data };
  if (item.geo && Number.isFinite(Number(item.geo.lat)) && Number.isFinite(Number(item.geo.lng))) {
    entry.geo = item.geo;
  }
  return entry;
}

function normalizeSensorLogs(logs) {
  if (!Array.isArray(logs)) return [];
  return logs.map(normalizeSensorLogEntry).filter(Boolean);
}

function logEntryHasEncryptedData(entry) {
  return measurementBagHasEncryptedValues(entry?.data);
}

/** When timestamps collide, keep decrypted readings over still-encrypted ones. */
function preferMergedLogEntry(incumbent, candidate) {
  const incEnc = logEntryHasEncryptedData(incumbent);
  const candEnc = logEntryHasEncryptedData(candidate);
  if (incEnc && !candEnc) return candidate;
  if (!incEnc && candEnc) return incumbent;
  return candidate;
}

function mergeSensorLogsByTimestamp(streaming, api) {
  const stream = normalizeSensorLogs(streaming);
  const remote = normalizeSensorLogs(api);
  if (remote.length === 0) return stream;
  if (stream.length === 0) return remote;
  const byTs = new Map();
  for (const item of remote) byTs.set(item.timestamp, item);
  for (const item of stream) {
    const prev = byTs.get(item.timestamp);
    byTs.set(item.timestamp, prev ? preferMergedLogEntry(prev, item) : item);
  }
  return Array.from(byTs.values()).sort((a, b) => a.timestamp - b.timestamp);
}

/** Merge IDB-cached owner / device type into popup shell before async hydrate.
 * @param {Object} point - Popup shell or map row
 * @param {Object|null} meta - Cached IDB meta (owner, type)
 * @returns {Object} Point with owner / device_model patched
 */
function mergePointWithIdbMeta(point, meta) {
  if (!point || !meta) return point;

  const next = { ...point };

  if (!normalizeOwnerKey(next) && meta.owner) {
    next.owner = meta.owner;
  }
  if (meta.type && meta.type !== "altruist") {
    next.idbSensorType = meta.type;
    if (!next.device_model && meta.type !== "diy") {
      next.device_model = meta.type;
    }
  }

  return next;
}

export function useSensors() {
  // --- Setup ---

  const mapState = useMap();

  const router = useRouter();
  const route = useRoute();
  const ownerBundleClustered = () => shouldClusterOwnerBundle(route.query);

  // --- Computed ---

  /** Run logsHealth overlays only for remote, when checkLogsHealth is on and sensor is not brand-new. */
  const runLogsHealth = computed(
    () =>
      settings?.SENSOR?.checkLogsHealth === true &&
      mapState.currentProvider.value === "remote" &&
      !isSensorNew()
  );

  /** Header counter: unique device IDs from Daily recap API (incl. no-geo + bundle siblings). */
  const mapSensorsCount = computed(() => {
    if (mapState.currentProvider.value === "realtime") {
      return collectHeaderSensorIds([sensors.value]);
    }
    return collectHeaderSensorIds([sensors.value, sensorsNoLocation.value]);
  });

  // --- Methods ---

  const isSensorNew = () => {
    const logs = sensorPoint.value?.logs || null;
    if (!Array.isArray(logs) || logs.length < 2) return false;

    const warmUpSec = settings?.SENSOR?.warmUpTime;
    if (typeof warmUpSec !== "number" || !Number.isFinite(warmUpSec) || warmUpSec <= 0) {
      return false;
    }

    const timestamps = [];
    for (const item of logs) {
      const ts = item?.timestamp;
      if (typeof ts !== "number" || !Number.isFinite(ts)) continue;
      const d = new Date(ts * 1000);
      if (
        d.getUTCHours() === 0 &&
        d.getUTCMinutes() === 0 &&
        d.getUTCSeconds() === 0 &&
        d.getUTCMilliseconds() === 0
      ) {
        continue;
      }
      timestamps.push(ts);
    }
    if (timestamps.length < 2) return false;

    const minTs = Math.min(...timestamps);
    const nowSec = Math.floor(Date.now() / 1000);
    return nowSec - minTs <= warmUpSec;
  };

  const resetLogsProgress = () => {
    logsProgress.value = createDefaultLogsProgress();
  };

  /**
   * Resolve owner for bundle / popup: URL deep link → point → map list → IndexedDB
   * → TEMPORARY Roseman owner workaround (getSensorOwner).
   * DIY (no owner in IDB type) returns empty string.
   * @param {string} sensorId - Device id
   * @param {Object|null} [point] - Open popup or map row
   * @returns {Promise<string>} Normalized owner key, or empty string
   */
  const resolveOwnerKeyForSensor = async (sensorId, point = null) => {
    const fromUrl = route.query.owner ? String(route.query.owner).trim() : "";
    if (fromUrl) return fromUrl;

    const fromPoint = normalizeOwnerKey(point);
    if (fromPoint) return fromPoint;

    const sid = sensorId ? String(sensorId) : "";
    if (!sid) return "";

    const fromMap = sensors.value.find((s) => String(s?.sensor_id || "") === sid);
    const mapOwner = normalizeOwnerKey(fromMap);
    if (mapOwner) return mapOwner;

    const idb = await getCachedSensorIdbMeta(sid);
    if (idb?.type === "diy") return "";
    if (idb?.owner) return String(idb.owner).trim();

    const viewedDay = mapState.currentDate.value || dayISO();
    const fromApi = await getSensorOwner(sid, viewedDay);
    return fromApi || "";
  };

  const applyOwnerFromCache = (sensorId, owner) => {
    if (!owner || !sensorId) return;
    const sid = String(sensorId);
    const existsOnMap = sensors.value?.some((s) => String(s?.sensor_id || "") === sid);
    if (existsOnMap) {
      setSensorData(sid, { owner });
    }
    if (sensorPoint.value?.sensor_id === sid) {
      sensorPoint.value = { ...sensorPoint.value, owner };
    }
    mapState.setMapSettings(route, router, { owner });
  };

  const ensureOwnerLoaded = (sensorId) => {
    if (!sensorId) return Promise.resolve(null);

    const existing = sensors.value.find((s) => s.sensor_id === sensorId);
    if (existing?.owner) {
      return Promise.resolve(existing.owner);
    }

    if (ownerPromises.has(sensorId)) {
      return ownerPromises.get(sensorId);
    }

    const promise = (async () => {
      const idbMeta = await getCachedSensorIdbMeta(sensorId);
      if (idbMeta?.type === "diy") return null;
      if (idbMeta?.owner) {
        applyOwnerFromCache(sensorId, idbMeta.owner);
        return idbMeta.owner;
      }

      const viewedDay = mapState.currentDate.value || dayISO();
      const owner = await getSensorOwner(sensorId, viewedDay);
      if (owner) {
        applyOwnerFromCache(sensorId, owner);
      }
      return owner;
    })()
      .catch((error) => {
        console.warn("Failed to load owner for sensor", sensorId, error);
        return null;
      })
      .finally(() => {
        ownerPromises.delete(sensorId);
      });

    ownerPromises.set(sensorId, promise);
    return promise;
  };

  /**
   * Whether the popup is open for the given sensor id.
   * @param {string} sensorId - Sensor id to check
   * @returns {boolean} True when popup is open for this sensor
   */
  const isSensorOpen = (sensorId) => {
    return sensorPoint.value && sensorPoint.value.sensor_id === sensorId;
  };

  /**
   * Patch one sensor row in the shared sensors list (geo, model, maxdata, logs, …).
   * @param {Array} list - Current sensors array
   * @param {string} sensorId - Sensor id to patch or append
   * @param {Object} data - Fields to merge
   * @param {Object} [data.geo] - Coordinates `{lat, lng}`
   * @param {number} [data.model] - Sensor model
   * @param {Object} [data.maxdata] - Daily recap values
   * @param {Object} [data.data] - Live measurement bag
   * @param {Array|null} [data.logs] - Chart logs
   * @returns {Array} Updated sensors array (new reference)
   */
  const applySensorPatchToList = (list, sensorId, data) => {
    const existingSensors = [...(Array.isArray(list) ? list : [])];
    const sensorIndex = existingSensors.findIndex((s) => s.sensor_id === sensorId);

    if (sensorIndex >= 0) {
      const existingSensor = existingSensors[sensorIndex];
      const updatedSensor = {
        ...existingSensor,
        geo: data.geo || existingSensor.geo,
        model: data.model || existingSensor.model,
        device_model:
          data.device_model !== undefined ? data.device_model : existingSensor.device_model,
        maxdata: { ...existingSensor.maxdata, ...(data.maxdata || {}) },
        data: { ...existingSensor.data, ...(data.data || {}) },
        logs: data.logs !== undefined ? data.logs : existingSensor.logs ?? null,
        timestamp: data.timestamp ?? existingSensor.timestamp,
        owner:
          data.owner !== undefined
            ? normalizeOwnerKey({ owner: data.owner }) || null
            : existingSensor.owner,
      };
      existingSensors[sensorIndex] = formatPointForSensor(updatedSensor, { calculateValue: false });
    } else {
      existingSensors.push(
        formatPointForSensor(
          {
            sensor_id: sensorId,
            geo: data.geo || { lat: 0, lng: 0 },
            device_model: data.device_model || null,
            maxdata: data.maxdata || {},
            data: data.data || {},
            logs: data.logs ?? null,
            timestamp: data.timestamp ?? null,
            owner: data.owner ? normalizeOwnerKey({ owner: data.owner }) : null,
          },
          { calculateValue: false }
        )
      );
    }

    return existingSensors;
  };

  const setSensorData = (sensorId, data) => {
    if (!sensorId || !data) return;
    if (mapState.currentProvider.value === "realtime") {
      const nextLive = new Set(realtimeLiveSensorIds.value);
      nextLive.add(String(sensorId));
      realtimeLiveSensorIds.value = nextLive;
    }
    setSensors(applySensorPatchToList(sensors.value, sensorId, data));
  };

  /** True once pubsub (or live row) has delivered payload for this sensor in realtime. */
  const sensorHasRealtimePayload = (sensorId) => {
    const sid = String(sensorId || "");
    if (!sid) return false;
    if (realtimeLiveSensorIds.value.has(sid)) return true;
    const row = sensors.value?.find((s) => String(s?.sensor_id || "") === sid);
    const rowData = row?.data;
    if (rowData && typeof rowData === "object" && Object.keys(rowData).length > 0) return true;
    const popup = sensorPoint.value;
    if (
      popup &&
      String(popup.sensor_id) === sid &&
      popup.data &&
      typeof popup.data === "object" &&
      Object.keys(popup.data).length > 0
    ) {
      return true;
    }
    return false;
  };

  const logRequestResult = ({
    ok = false,
    superseded = false,
    deduped = false,
    requestId = null,
    timelineMode = null,
  } = {}) => ({ ok, superseded, deduped, requestId, timelineMode });

  /**
   * Load chart logs for the open popup (remote API or realtime stream).
   * @param {string} sensorId - Sensor id to fetch logs for
   * @returns {Promise<Object>} Request outcome (`ok`, `superseded`, `deduped`, …)
   * @throws {Error} On fetch failure logs are set to an empty array
   */
  const updateSensorLogs = async (sensorId) => {
    if (!isSensorOpen(sensorId)) {
      return logRequestResult({ superseded: true });
    }
    const isRealtimeMode = mapState.currentProvider.value === "realtime";

    // Avoid re-fetching the same logs due to UI-only re-renders (e.g. tab switches).
    // Keyed by sensor + provider + timeline mode + selected date.
    const requestedKey = `${String(sensorId)}-${mapState.currentProvider.value}-${
      mapState.timelineMode.value
    }-${mapState.currentDate.value}`;
    // Only dedupe while a request is actually running.
    if (logsRequestInFlight && currentLogsKey === requestedKey) {
      return logRequestResult({
        ok: true,
        deduped: true,
        requestId: currentLogsRequestId,
        timelineMode: mapState.timelineMode.value,
      });
    }

    // Realtime: allow only one in-flight log fetch — rapid pubsub ticks otherwise abort forever.
    if (isRealtimeMode && realtimeLogsLoadInFlight) {
      return logRequestResult({ superseded: true });
    }

    // Realtime chart: hydrate libp2p history and decrypt when owner/device backup is loaded.
    if (isRealtimeMode && mapState.timelineMode.value === "realtime") {
      const owner = normalizeOwnerKey(sensorPoint.value);
      const accountStore = useAccounts();
      const ownerAccount = resolveOwnerAccount(
        accountStore.accounts.value,
        owner,
        sensorId
      );

      if (ownerAccount) {
        let nextData = sensorPoint.value?.data;
        if (measurementBagHasEncryptedValues(nextData)) {
          nextData = await redecryptDataBag(sensorId, nextData, ownerAccount);
        }
        const nextLogs = await hydrateRealtimeLogsForSensor(
          sensorId,
          sensorPoint.value?.logs,
          ownerAccount
        );
        const decryptRev = (sensorPoint.value?._decryptRev || 0) + 1;
        sensorPoint.value = {
          ...sensorPoint.value,
          data: nextData,
          logs: nextLogs.length > 0 ? [...nextLogs] : [...(sensorPoint.value?.logs ?? [])],
          _decryptRev: decryptRev,
          _logsKey: sensorPoint.value?._logsKey || `${requestedKey}:live`,
        };
        if (nextLogs.length > 0) {
          setSensorData(sensorId, { data: nextData, logs: nextLogs });
        }
        resetLogsProgress();
        return logRequestResult({
          ok: true,
          deduped: true,
          timelineMode: mapState.timelineMode.value,
        });
      }

      const live = normalizeSensorLogs(sensorPoint.value?.logs);
      if (live.length > 0 && !logHasEncryptedValues(live)) {
        resetLogsProgress();
        return logRequestResult({
          ok: true,
          deduped: true,
          timelineMode: mapState.timelineMode.value,
        });
      }
    }

    if (isRealtimeMode) realtimeLogsLoadInFlight = true;

    // Remote: skip refetch when sensor + provider + timeline + date key is unchanged.
    if (mapState.currentProvider.value === "remote") {
      const currentLogs = sensorPoint.value?.logs;
      const loadedKey = sensorPoint.value?._logsKey || null;
      if (loadedKey && loadedKey === requestedKey && Array.isArray(currentLogs)) {
        const accountStore = useAccounts();
        const ownerAccount = resolveOwnerAccount(
          accountStore.accounts.value,
          normalizeOwnerKey(sensorPoint.value),
          sensorId
        );
        if (ownerAccount && logHasEncryptedValues(currentLogs)) {
          const { logs: decryptedLogs } = await redecryptLogEntries(
            sensorId,
            currentLogs,
            ownerAccount
          );
          const cleanLogs = sanitizeSensorLogsPmSentinels(decryptedLogs);
          const ownerSensorsWithData = applyFilteredOwnerBundleOptions(
            sensorPoint.value,
            sensorPoint.value?.ownerSensorsWithData,
            sensors.value
          );
          const decryptRev = (sensorPoint.value?._decryptRev || 0) + 1;
          sensorPoint.value = {
            ...sensorPoint.value,
            logs: cleanLogs,
            _decryptRev: decryptRev,
            ...(ownerSensorsWithData?.length ? { ownerSensorsWithData } : null),
          };
          const existsOnMap = sensors.value?.some((s) => s?.sensor_id === sensorId);
          if (existsOnMap) setSensorData(sensorId, { logs: cleanLogs });
          if (runLogsHealth.value) {
            void loadLogsHealth(sensorId, cleanLogs, {
              currentDate: mapState.currentDate.value,
              timelineMode: mapState.timelineMode.value,
            });
          }
          return logRequestResult({
            ok: true,
            deduped: true,
            timelineMode: mapState.timelineMode.value,
          });
        }

        resetLogsProgress();
        const cleanLogs = sanitizeSensorLogsPmSentinels(currentLogs);
        const ownerSensorsWithData = applyFilteredOwnerBundleOptions(
          sensorPoint.value,
          sensorPoint.value?.ownerSensorsWithData,
          sensors.value
        );
        sensorPoint.value = {
          ...sensorPoint.value,
          logs: cleanLogs,
          ...(ownerSensorsWithData?.length ? { ownerSensorsWithData } : null),
        };
        {
          const existsOnMap = sensors.value?.some((s) => s?.sensor_id === sensorId);
          if (existsOnMap) setSensorData(sensorId, { logs: cleanLogs });
        }
        if (runLogsHealth.value) {
          void loadLogsHealth(sensorId, cleanLogs, {
            currentDate: mapState.currentDate.value,
            timelineMode: mapState.timelineMode.value,
          });
        }
        return logRequestResult({
          ok: true,
          deduped: true,
          timelineMode: mapState.timelineMode.value,
        });
      }
    }

    let requestId = null;
    let timelineModeAtRequest = mapState.timelineMode.value;

    try {
      // Timeline bounds: exact day vs week/month period
      const timelineMode = mapState.timelineMode.value;
      timelineModeAtRequest = timelineMode;
      const { start, end } = timelineFetchBounds(mapState.currentDate.value, timelineMode);

      if (timelineMode === "day") {
        resetLogsProgress();
      } else {
        logsProgress.value = {
          status: "loading",
          active: true,
          totalDays: 0,
          cachedDays: 0,
          loadedDays: 0,
          missingDays: 0,
          percent: 0,
          mode: timelineMode,
        };
      }

      // Abort any previous log request for this popup
      if (currentLogsAbortController) {
        currentLogsAbortController.abort();
      }

      currentLogsRequestId = Math.random().toString(36);
      requestId = currentLogsRequestId;
      currentLogsKey = requestedKey;
      logsRequestInFlight = true;

      // Fresh AbortController for this fetch
      currentLogsAbortController = new AbortController();

      // Fetch logs via API (cache + abort); keep logArray undefined until settled
      // Progress updates should be tied to the REQUEST mode, not the live UI mode,
      // otherwise quick switches can cause updates to be ignored and the bar to "freeze".
      const progressMode = timelineMode;
      const handleProgressUpdate = (payload) => {
        if (!["week", "month"].includes(progressMode)) return;
        const current = logsProgress.value;
        const totalDays = payload.totalDays ?? current.totalDays;
        const loadedDays = payload.loadedDays ?? current.loadedDays;
        const cachedDays = payload.cachedDays ?? current.cachedDays;
        const missingDays = payload.missingDays ?? Math.max(totalDays - loadedDays, 0);
        const percent = totalDays > 0 ? Math.round((loadedDays / totalDays) * 100) : 0;
        const nextStatus = payload.status || current.status;

        logsProgress.value = {
          status: nextStatus,
          active: nextStatus === "loading" || nextStatus === "progress" || nextStatus === "init",
          totalDays,
          cachedDays,
          loadedDays,
          missingDays,
          percent,
          mode: progressMode,
        };
      };

      const cachePoint = sensorPoint.value;
      const cacheMeta = cachePoint
        ? {
            owner: normalizeOwnerKey(cachePoint) || null,
            type:
              sensorTypeFromDeviceModel(cachePoint.device_model) ||
              inferDeviceTypeFromLog(cachePoint.logs) ||
              null,
          }
        : null;

      let logArray = await getSensorDataWithCache(
        sensorId,
        start,
        end,
        mapState.currentProvider.value,
        null, // onRealtimePoint
        currentLogsAbortController.signal,
        handleProgressUpdate,
        cacheMeta
      );

      // NOTE: No remote fallback in realtime.

      // Drop result if a newer request superseded this one
      if (currentLogsRequestId !== requestId) {
        resetLogsProgress();
        return logRequestResult({
          superseded: true,
          requestId,
          timelineMode: timelineModeAtRequest,
        });
      }

      // Dew point enrichment happens inside getSensorDataWithCache

      // Pass cached address / owner / type into log cache layer
      if (logArray && sensorPoint.value) {
        const patch = {};
        if (logArray._cachedOwner) patch.owner = logArray._cachedOwner;
        const inferredType = Array.isArray(logArray) ? inferDeviceTypeFromLog(logArray) : null;
        if (logArray._cachedType && logArray._cachedType !== "altruist") {
          patch.idbSensorType = logArray._cachedType;
          if (!sensorPoint.value.device_model && logArray._cachedType !== "diy") {
            patch.device_model = logArray._cachedType;
          }
        } else if (inferredType) {
          patch.idbSensorType = inferredType;
          patch.device_model = inferredType;
        }
        if (Object.keys(patch).length > 0) {
          sensorPoint.value = { ...sensorPoint.value, ...patch };
        }
      }

      // logArray: array = loaded (maybe empty); null = not loaded / aborted
      if (logArray === null) {
        // Fetch failed or aborted — keep previous logs state
        sensorPoint.value = { ...sensorPoint.value, logs: sensorPoint.value?.logs ?? null };
        resetLogsProgress();
        return logRequestResult({
          ok: false,
          superseded: currentLogsRequestId !== requestId,
          requestId,
          timelineMode: timelineModeAtRequest,
        });
      }

      if (Array.isArray(logArray)) {
        // Success (incl. empty array); PM -1 sentinels stripped
        const cleanLogs = sanitizeSensorLogsPmSentinels(logArray);
        let logs = isRealtimeMode
          ? mergeSensorLogsByTimestamp(sensorPoint.value?.logs, cleanLogs)
          : cleanLogs;

        if (!isRealtimeMode) {
          const accountStore = useAccounts();
          const ownerAccount = resolveOwnerAccount(
            accountStore.accounts.value,
            normalizeOwnerKey(sensorPoint.value),
            sensorId
          );
          if (ownerAccount && logHasEncryptedValues(logs)) {
            ({ logs } = await redecryptLogEntries(sensorId, logs, ownerAccount));
          }
        }

        // Realtime chart: empty API before pubsub → keep null (skeleton), not "no data".
        if (
          isRealtimeMode &&
          mapState.timelineMode.value === "realtime" &&
          logs.length === 0 &&
          !sensorHasRealtimePayload(sensorId)
        ) {
          sensorPoint.value = { ...sensorPoint.value, logs: null, _logsKey: null };
          resetLogsProgress();
          return logRequestResult({
            ok: false,
            requestId,
            timelineMode: timelineModeAtRequest,
          });
        }

        const inferredType = inferDeviceTypeFromLog(logs);
        const ownerSensorsWithData = applyFilteredOwnerBundleOptions(
          sensorPoint.value,
          sensorPoint.value?.ownerSensorsWithData,
          sensors.value
        );
        sensorPoint.value = {
          ...sensorPoint.value,
          logs,
          _logsKey: requestedKey,
          ...(inferredType
            ? { device_model: inferredType, idbSensorType: inferredType }
            : null),
          ...(ownerSensorsWithData?.length ? { ownerSensorsWithData } : null),
        };

        // Persist logs on sensor row + popup
        {
          const existsOnMap = sensors.value?.some((s) => s?.sensor_id === sensorId);
          if (existsOnMap) {
            setSensorData(sensorId, {
              logs,
            });
          }
        }

        if (runLogsHealth.value) {
          void loadLogsHealth(sensorId, logs, {
            currentDate: mapState.currentDate.value,
            timelineMode: mapState.timelineMode.value,
          });
        }

        if (["week", "month"].includes(mapState.timelineMode.value)) {
          logsProgress.value = {
            status: "done",
            active: false,
            totalDays: logsProgress.value.totalDays || logsProgress.value.loadedDays,
            cachedDays: logsProgress.value.cachedDays,
            loadedDays: logsProgress.value.totalDays || logsProgress.value.loadedDays,
            missingDays: 0,
            percent: 100,
            mode: mapState.timelineMode.value,
          };
        } else {
          resetLogsProgress();
        }

        return logRequestResult({
          ok: true,
          requestId,
          timelineMode: timelineModeAtRequest,
        });
      }

      return logRequestResult({
        ok: false,
        requestId,
        timelineMode: timelineModeAtRequest,
      });
    } catch (error) {
      const aborted =
        error?.name === "AbortError" ||
        (currentLogsAbortController && currentLogsAbortController.signal.aborted);
      if (!aborted) {
        console.error("Error updating sensor logs:", error);
      }
      // On error leave logs null (not loaded)
      sensorPoint.value = { ...sensorPoint.value, logs: null };
      logsProgress.value = {
        status: "error",
        active: false,
        totalDays: logsProgress.value.totalDays,
        cachedDays: logsProgress.value.cachedDays,
        loadedDays: logsProgress.value.loadedDays,
        missingDays: logsProgress.value.missingDays,
        percent: logsProgress.value.percent,
        mode: mapState.timelineMode.value,
      };
      return logRequestResult({
        superseded: aborted || currentLogsRequestId !== requestId,
        requestId,
        timelineMode: timelineModeAtRequest,
      });
    } finally {
      logsRequestInFlight = false;
      if (isRealtimeMode) {
        realtimeLogsLoadInFlight = false;
      }
    }
  };

  /** Mount popup immediately with skeleton (logs null) while async enrich runs. */
  const commitPopupShell = (rawPoint) => {
    const sid = String(rawPoint?.sensor_id || "");
    if (!sid) return false;

    const prev = sensorPoint.value;
    const sameSensor = prev && String(prev.sensor_id) === sid;

    let geo = rawPoint?.geo;
    if (!hasValidCoordinates(geo) && sameSensor && hasValidCoordinates(prev?.geo)) {
      geo = prev.geo;
    }

    const isRealtimeTimeline =
      mapState.currentProvider.value === "realtime" &&
      mapState.timelineMode.value === "realtime";
    const logs = isRealtimeTimeline
      ? Array.isArray(rawPoint?.logs) && rawPoint.logs.length > 0
        ? rawPoint.logs
        : null
      : sameSensor && Array.isArray(prev?.logs)
        ? prev.logs
        : Array.isArray(rawPoint?.logs)
          ? rawPoint.logs
          : null;

    mapState.mapinactive.value = true;
    const shell = formatPointForSensor({
      sensor_id: sid,
      geo: hasValidCoordinates(geo) ? geo : null,
      model: rawPoint?.model || prev?.model || DEFAULT_SENSOR_MODEL,
      device_model: rawPoint?.device_model ?? prev?.device_model ?? null,
      owner:
        rawPoint?.owner ||
        prev?.owner ||
        (route.query.owner ? String(route.query.owner) : null),
      address: rawPoint?.address || prev?.address || null,
      data: rawPoint?.data || prev?.data || {},
      maxdata: rawPoint?.maxdata || prev?.maxdata || {},
      logs,
      ownerSensorsWithData:
        rawPoint?.ownerSensorsWithData ||
        (sameSensor ? prev?.ownerSensorsWithData : null) ||
        null,
      ownerSensorIds:
        rawPoint?.ownerSensorIds || (sameSensor ? prev?.ownerSensorIds : null) || null,
      idbSensorType: rawPoint?.idbSensorType ?? (sameSensor ? prev?.idbSensorType : null) ?? null,
      _ownerResolved:
        rawPoint?._ownerResolved ?? (sameSensor ? prev?._ownerResolved : false) ?? false,
    });

    if (mapState.currentProvider.value === "realtime") {
      const fullBundle = buildOwnerSensorsWithData(shell, sensors.value, null, ownerBundleClustered());
      const anchorGeo = resolveBundleAnchorGeo(shell, sensors.value);
      const bundleOpts = finalizeOwnerBundleNearAnchor(
        fullBundle,
        anchorGeo,
        shell.sensor_id,
        ownerBundleClustered()
      );
      if (bundleOpts?.length) {
        shell.ownerSensorsWithData = bundleOpts;
      }
    }

    sensorPoint.value = shell;
    return true;
  };

  /**
   * Open or refresh the sensor popup (bundle, logs, map click unit routing).
   * @param {Object} point - Sensor row or partial popup data
   * @param {string} point.sensor_id - Sensor id
   * @param {Object} [point.geo] - Coordinates `{lat, lng}`
   * @param {number} [point.model] - Sensor model
   * @param {Object} [point.maxdata] - Daily recap values
   * @param {Object} [point.data] - Live measurement bag
   * @param {Object} [options] - Popup open options
   * @param {boolean} [options.fromMapClick] - Opened from map marker click
   */
  const updateSensorPopup = async (point, options = {}) => {


    if (!point.sensor_id) {
      return;
    }

    // Re-check after every await — user may have closed popup while we waited
    const isStalePopupUpdate = () => {
      if (route.query.sensor && route.query.sensor !== point.sensor_id) return true;
      const closed = recentlyClosed.value;
      // Recently closed: URL may still show old sensor id briefly
      return (
        closed?.id === point.sensor_id && Date.now() < (closed.until || 0)
      );
    };

    if (isStalePopupUpdate()) {
      return;
    }

    // Mode/provider refreshes must not switch the open device (urban vs insight in one bundle).
    const lockedSensorId = String(
      route.query.sensor ||
        (sensorPoint.value?.sensor_id && !options.fromMapClick ? sensorPoint.value.sensor_id : "") ||
        ""
    ).trim();
    if (lockedSensorId && lockedSensorId !== String(point.sensor_id) && !options.fromMapClick) {
      const lockedRow = sensors.value.find((s) => String(s?.sensor_id || "") === lockedSensorId);
      point = {
        ...point,
        sensor_id: lockedSensorId,
        ...(lockedRow?.owner ? { owner: lockedRow.owner } : null),
        ...(lockedRow?.geo ? { geo: lockedRow.geo } : null),
        ...(lockedRow?.device_model ? { device_model: lockedRow.device_model } : null),
      };
    }

    // If URL no longer points to this sensor (e.g. popup was closed),
    // don't reopen it from stale async updates.
    // Map marker clicks pass `fromMapClick: true` so a stale `sensor=` in URL
    // (e.g. after switching device in select) does not block opening the clicked marker.
    if (!options.fromMapClick && route.query.sensor && route.query.sensor !== point.sensor_id) {
      return;
    }

    const idbMeta = await getCachedSensorIdbMeta(point.sensor_id);
    if (idbMeta) {
      point = mergePointWithIdbMeta(point, idbMeta);
    }

    if (!point.owner && route.query.owner) {
      point.owner = String(route.query.owner);
    }

    const ownerKey = await resolveOwnerKeyForSensor(point.sensor_id, point);
    if (ownerKey) {
      point.owner = ownerKey;
      if (!point.ownerSensorsWithData?.length) {
        const ids = await ensureOwnerSensorIds(
          { ...point, owner: ownerKey },
          ownerKey,
          null,
          sensors.value
        );
        const fullBundle = await buildOwnerSensorsWithDataAsync(
          { ...point, owner: ownerKey, ownerSensorIds: ids },
          sensors.value,
          ids,
          ownerBundleClustered()
        );
        const anchorGeo = resolveBundleAnchorGeo(point, sensors.value);
        const bundleOpts = finalizeOwnerBundleNearAnchor(
          fullBundle,
          anchorGeo,
          point.sensor_id,
          ownerBundleClustered()
        );
        if (bundleOpts?.length) {
          point = { ...point, owner: ownerKey, ownerSensorIds: ids, ownerSensorsWithData: bundleOpts };
        } else if (ids?.length) {
          point = { ...point, owner: ownerKey, ownerSensorIds: ids };
        }
      }
    }

    const shouldPickForMapUnit =
      options.fromMapClick || (!route.query.sensor && Boolean(route.query.owner));
    if (shouldPickForMapUnit) {
      const pickedId = pickSensorIdForMapUnit(
        point,
        sensors.value,
        mapState.currentUnit.value,
        mapState.currentProvider.value
      );
      if (pickedId !== String(point.sensor_id || "")) {
        const row = sensors.value.find((s) => String(s?.sensor_id || "") === pickedId);
        point = {
          ...point,
          sensor_id: pickedId,
          ...(row?.device_model ? { device_model: row.device_model } : null),
          geo: point.geo || row?.geo,
          sensors: point.sensors || row?.sensors || null,
        };
        if (options.fromMapClick || !route.query.sensor) {
          mapState.setMapSettings(route, router, { sensor: pickedId });
        }
      }
    }

    const prevSensorId = String(sensorPoint.value?.sensor_id || "");
    const nextSensorId = String(point.sensor_id || "");
    const sensorSwitched = prevSensorId && nextSensorId && prevSensorId !== nextSensorId;
    if (sensorSwitched) {
      clearSensorLogs();
    }

    commitPopupShell(point);

    // Marker clicks must always win; other callers can wait for the in-flight enrich pass.
    if (isUpdatingPopup.value && !options.fromMapClick) {
      return;
    }

    const session = ++popupSessionId;

    try {
      isUpdatingPopup.value = true;
      const prevOwnerKey = normalizeOwnerKey(sensorPoint.value);

      // Same owner, different device in select: keep the map-cluster anchor, not a distant city.
      const prevPopup = sensorPoint.value;
      if (
        prevPopup &&
        String(prevPopup.sensor_id || "") !== String(point.sensor_id || "") &&
        normalizeOwnerKey(prevPopup) &&
        normalizeOwnerKey(prevPopup) === normalizeOwnerKey(point) &&
        hasValidCoordinates(prevPopup.geo)
      ) {
        point.geo = prevPopup.geo;
      }

      if (mapState.currentProvider.value === "realtime") {
        mapState.setTimelineMode("realtime", point.sensor_id);
      }

      const mergePopupPoint = (prev, next) => {
        if (!prev) return next;
        if (!next) return prev;
        const sameId = String(prev?.sensor_id || "") === String(next?.sensor_id || "");
        if (!sameId) return next;

        const nextOwnerSensors = next.ownerSensorsWithData;
        const prevOwnerSensors = prev.ownerSensorsWithData;
        const anchorGeo = resolveBundleAnchorGeo(
          { sensor_id: next.sensor_id || prev.sensor_id, geo: next.geo || prev.geo },
          sensors.value
        );
        const mergedBundle = mergeOwnerBundleOptions(nextOwnerSensors, prevOwnerSensors);
        const ownerSensorsWithData = finalizeOwnerBundleNearAnchor(
          mergedBundle,
          anchorGeo,
          next.sensor_id || prev.sensor_id,
          ownerBundleClustered()
        );

        return {
          ...prev,
          ...next,
          owner: next.owner || prev.owner,
          ownerSensorIds: next.ownerSensorIds || prev.ownerSensorIds || null,
          idbSensorType: next.idbSensorType || prev.idbSensorType || null,
          geo: next.geo || prev.geo,
          model: next.model || prev.model,
          data: next.data || prev.data,
          logs:
            mapState.currentProvider.value === "realtime"
              ? (next.logs ?? null)
              : next.logs !== undefined
                ? next.logs
                : prev.logs,
          ownerSensorsWithData,
          _ownerResolved: next._ownerResolved || prev._ownerResolved || false,
        };
      };

      const patchOwnerBundleOptions = (p) => {
        if (!p?.sensor_id || !sensorPoint.value) return;
        if (String(sensorPoint.value.sensor_id) !== String(p.sensor_id)) return;
        const opts = applyFilteredOwnerBundleOptions(
          p,
          p.ownerSensorsWithData,
          sensors.value,
          ownerBundleClustered()
        );
        if (opts) {
          sensorPoint.value = { ...sensorPoint.value, ownerSensorsWithData: opts };
        }
      };

      // Backfill owner from URL / existing popup state (realtime shared links use ?owner=).
      const open = sensorPoint.value && sensorPoint.value.sensor_id === point.sensor_id ? sensorPoint.value : null;
      if (!point.owner && route.query.owner) {
        point.owner = String(route.query.owner);
      }
      if (mapState.currentProvider.value === "realtime") {
        // preserve popup state only
      }
      if (!point.owner && open?.owner) {
        point.owner = open.owner;
      }

      // Owner already on the point — sync hydrate
      const foundSensor = sensors.value.find((s) => s.sensor_id === point.sensor_id);

      // Owner already on the point — sync hydrate
      if (!point.owner && foundSensor?.owner) {
        point.owner = foundSensor.owner;
      }

      // No owner yet — async resolve (DIY has no owner)
      if (!point.owner && point.idbSensorType !== "diy") {
        point.owner = (await resolveOwnerKeyForSensor(point.sensor_id, point)) || null;
      }
      point._ownerResolved = true;

      if (isStalePopupUpdate()) {
        return;
      }

      const isNewPopup = !isSensorOpen(point.sensor_id);
      const hasDataChanges =
        !foundSensor ||
        !foundSensor.geo ||
        !point.geo ||
        foundSensor.geo.lat !== point.geo.lat ||
        foundSensor.geo.lng !== point.geo.lng;

      const ownerChanged =
        sensorPoint.value?.sensor_id === point.sensor_id &&
        point.owner &&
        sensorPoint.value?.owner !== point.owner;

      // Update popup when sensor id changed or payload differs
      if (isNewPopup || hasDataChanges || ownerChanged) {
        if (isNewPopup) {
          mapState.mapinactive.value = true;
        }

        // Copy logs only when non-empty — null vs [] means not loaded vs loaded empty
        const hasLogsInPoint = point.logs && Array.isArray(point.logs);
        const hasLogsInSensor =
          foundSensor &&
          foundSensor.logs &&
          Array.isArray(foundSensor.logs) &&
          foundSensor.logs.length > 0;
        if (
          hasLogsInSensor &&
          !hasLogsInPoint &&
          mapState.timelineMode.value === "day"
        ) {
          point.logs = foundSensor.logs;
        }

        // Normalize logs to null when absent
        if (point.logs === undefined) {
          point.logs = null;
        }

        // If we're updating the same open sensor, keep stable fields from the current popup.
        // This avoids header/select flicker when callers pass partial points.
        const prevOpen =
          sensorPoint.value && sensorPoint.value.sensor_id === point.sensor_id ? sensorPoint.value : null;
        if (prevOpen) {
          if (!point.owner && prevOpen.owner) {
            point.owner = prevOpen.owner;
          }
          if (
            !point.ownerSensorsWithData &&
            prevOpen.ownerSensorsWithData &&
            normalizeOwnerKey(prevOpen) &&
            normalizeOwnerKey(prevOpen) === normalizeOwnerKey(point)
          ) {
            point.ownerSensorsWithData = prevOpen.ownerSensorsWithData;
            if (!point.ownerSensorIds && prevOpen.ownerSensorIds) {
              point.ownerSensorIds = prevOpen.ownerSensorIds;
            }
          }
        }

        const filteredOpts = applyFilteredOwnerBundleOptions(
          point,
          point.ownerSensorsWithData,
          sensors.value
        );
        if (filteredOpts?.length) {
          point.ownerSensorsWithData = filteredOpts;
        }

        sensorPoint.value = formatPointForSensor({
          ...point,
          geo: point.geo,
          zoom: point.zoom,
        });
        // In realtime, never let partial redraws wipe header/select fields.
        if (mapState.currentProvider.value === "realtime") {
          sensorPoint.value = mergePopupPoint(prevOpen, sensorPoint.value);
        }

        // sensors:
        // Don't create a new marker entry for "owner dropdown" sensors that aren't part of the map points list.
        // Otherwise switching to a related sensor can create an extra marker.
        const existsOnMap = sensors.value?.some((s) => s?.sensor_id === point.sensor_id);
        if (existsOnMap) {
          setSensorData(point.sensor_id, {
            geo: point.geo,
            zoom: point.zoom,
            address: point.address,
          });
        }

        const highlightMarker = () => {
          try {
            setActiveMarker(resolveOwnerClusterMarkerId(point.sensor_id));
          } catch (e) {
            console.warn("setActiveMarker failed", e);
          }
        };
        if (isNewPopup) {
          void nextTick(highlightMarker);
        } else {
          highlightMarker();
        }
      } else if (sensorPoint.value?.sensor_id) {
        setActiveMarker(resolveOwnerClusterMarkerId(sensorPoint.value.sensor_id));
      }
      if (mapState.currentProvider.value === "realtime" && sensorPoint.value?.sensor_id) {
        patchOwnerBundleOptions(sensorPoint.value);
      }

      const logsContextKey = `${String(point.sensor_id)}-${mapState.currentProvider.value}-${
        mapState.timelineMode.value
      }-${mapState.currentDate.value}`;
      const currentLogs = sensorPoint.value?.logs;
      const remoteLogsAlreadyLoaded =
        mapState.currentProvider.value === "remote" &&
        String(sensorPoint.value?.sensor_id || "") === String(point.sensor_id) &&
        sensorPoint.value?._logsKey === logsContextKey &&
        Array.isArray(currentLogs);

      if (ownerKey && sensorPoint.value?.sensor_id) {
        void hydrateOwnerBundleFromUserSensors(sensorPoint.value.sensor_id, session);
      }

      // Defer log fetch for fast shell open; skip if remote logs already keyed
      if (remoteLogsAlreadyLoaded) {
        // Remote logs already loaded for this context
      } else {
        void nextTick(() => {
          if (session !== popupSessionId || !isSensorOpen(point.sensor_id)) return;
          void updateSensorLogs(point.sensor_id);
        });
      }

      const nextOwnerKey = normalizeOwnerKey(sensorPoint.value);
      void nextTick(() => {
        if (session !== popupSessionId || !sensorPoint.value) return;
        try {
          if (prevOwnerKey && nextOwnerKey && prevOwnerKey !== nextOwnerKey) {
            rebundleOwnerMarkers(prevOwnerKey);
            rebundleOwnerMarkers(nextOwnerKey);
          }
        } catch (e) {
          console.warn("post-popup marker rebundle failed", e);
        }
      });
    } catch (error) {
      console.error("Error updating sensor popup:", error);
    } finally {
      isUpdatingPopup.value = false;
    }
  };

  /**
   * Normalize map/popup point: bundle, marker icon, optional marker value.
   * @param {Object} basePoint - Raw sensor row or popup data
   * @param {Object} [options] - Format options
   * @param {boolean} [options.calculateValue] - Compute `value` and `isEmpty` for map layer
   * @returns {Object} Unified point for popup / markers
   */
  const formatPointForSensor = (basePoint, options = {}) => {
    const { calculateValue = false } = options;

    const ownerKey = normalizeOwnerKey(basePoint);
    const ownerSensorsWithData = (() => {
      if (Array.isArray(basePoint.ownerSensorsWithData) && basePoint.ownerSensorsWithData.length > 0) {
        return (
          applyFilteredOwnerBundleOptions(basePoint, basePoint.ownerSensorsWithData, sensors.value) ??
          basePoint.ownerSensorsWithData
        );
      }
      if (!hasSensorOwner(basePoint)) return null;
      return applyFilteredOwnerBundleOptions(basePoint, null, sensors.value);
    })();

    const ownerSensorIds =
      basePoint.ownerSensorIds ??
      (ownerKey ? peekUserSensorsCache(ownerKey) : null);

    const markerIcon = mapMarkerIcon(
      { ...basePoint, ownerSensorsWithData, ownerSensorIds },
      sensors.value,
      mapState.currentDate.value
    );

    const point = {
      sensor_id: basePoint.sensor_id,
      geo: basePoint.geo,
      model: basePoint.model || DEFAULT_SENSOR_MODEL,
      device_model: basePoint.device_model || null,
      maxdata: basePoint.maxdata || {},
      data: basePoint.data || {},
      address: basePoint.address || null,
      owner: basePoint.owner || null,
      sensors: Array.isArray(basePoint.sensors) ? basePoint.sensors : null,
      idbSensorType: basePoint.idbSensorType ?? null,
      timestamp: basePoint.timestamp ?? null,
      ownerSensorsWithData,
      ownerSensorIds,
      isBookmarked: isPointBookmarked(basePoint),
      logs: Array.isArray(basePoint.logs)
        ? sanitizeSensorLogsPmSentinels(basePoint.logs)
        : basePoint.logs ?? null,
      _ownerResolved: basePoint._ownerResolved ?? false,
      iconLocal: markerIcon.image,
      markerIconFullBleed: markerIcon.fullBleed,
    };

    // Marker colour value only when drawing on map
    if (calculateValue) {
      const { value, isEmpty } = calculateMarkerValue(point);
      point.value = value;
      point.isEmpty = isEmpty;
    }

    return point;
  };

  const readMarkerUnitValue = (p) => {
    const currentUnit = mapState.currentUnit.value;
    const bag =
      mapState.currentProvider.value === "remote" ? p?.maxdata : p?.data;
    const value = unitValueFromBag(bag, currentUnit);
    if (value !== null) return { value, isEmpty: false };
    return { value: null, isEmpty: true };
  };

  const mergeSensorWithList = (p) => {
    if (!p?.sensor_id) return p;
    const row = sensors.value?.find(
      (s) => String(s?.sensor_id || "") === String(p.sensor_id)
    );
    if (!row) return p;
    return {
      ...row,
      ...p,
      maxdata: { ...(row.maxdata || {}), ...(p.maxdata || {}) },
      data: { ...(row.data || {}), ...(p.data || {}) },
      logs: p.logs ?? row.logs,
    };
  };

  const isOpenOwnerClusterRep = (point) => {
    const open = sensorPoint.value;
    if (!open?.sensor_id || !point?.sensor_id) return false;
    const repId = resolveOwnerClusterMarkerId(open.sensor_id);
    return String(point.sensor_id) === String(repId);
  };

  const maxFromLogs = (logs, unit) => {
    if (!Array.isArray(logs) || logs.length === 0) return null;
    let max = null;
    for (const item of logs) {
      const v = unitValueFromBag(item?.data, unit);
      if (v !== null && (max === null || v > max)) max = v;
    }
    return max;
  };

  const maxValueInOwnerCluster = (point) => {
    const ownerKey = normalizeOwnerKey(point);
    if (!ownerKey) return null;
    const list = sensors.value || [];
    const anchorGeo = resolveBundleAnchorGeo(point, list);
    const currentUnit = mapState.currentUnit.value;
    const isRemote = mapState.currentProvider.value === "remote";
    const sensorIdSet = new Set(
      collectOwnerClusterSensorIds(point, list, ownerKey, anchorGeo)
    );

    // Sibling not in markers list but maxdata geo is at the same cluster (e.g. Insight CO₂).
    if (isRemote && hasValidCoordinates(anchorGeo)) {
      for (const entry of markerSensorsEntries(point, list)) {
        const parsed = parseBundleSensorEntry(entry);
        const sid = parsed?.sensor_id ? String(parsed.sensor_id) : "";
        if (!sid || sensorIdSet.has(sid)) continue;
        const md = getCachedMaxDataEntry(sid, currentUnit);
        const geo = md?.geo;
        if (geo && hasValidCoordinates(geo) && haversineKm(anchorGeo, geo) <= OWNER_GEO_CLUSTER_KM) {
          sensorIdSet.add(sid);
        }
      }
    }

    let max = null;
    for (const sensorId of sensorIdSet) {
      const row = list.find((s) => String(s?.sensor_id || "") === sensorId);
      if (row) {
        const fromRow = readMarkerUnitValue(row);
        if (!fromRow.isEmpty) {
          if (max === null || fromRow.value > max) max = fromRow.value;
          continue;
        }
      }
      if (isRemote) {
        const v = getCachedMaxDataValue(sensorId, currentUnit);
        if (v !== null && (max === null || v > max)) max = v;
      }
    }
    return max;
  };

  /**
   * Marker value for current map unit (owner cluster max in remote).
   * @param {Object} point - Sensor row
   * @param {Object} [point.maxdata] - Daily recap (remote provider)
   * @param {Object} [point.data] - Live bag (realtime provider)
   * @param {number} [point.timestamp] - Last reading time (realtime)
   * @returns {Object} `{value: number|null, isEmpty: boolean}`
   */
  const calculateMarkerValue = (point) => {
    const currentUnit = mapState.currentUnit.value;
    const direct = readMarkerUnitValue(point);
    if (!direct.isEmpty) return direct;

    const openRep = isOpenOwnerClusterRep(point);

    if (currentUnit === "co2" || mapState.currentProvider.value === "realtime") {
      const clusterMax = maxValueInOwnerCluster(point);
      if (clusterMax !== null) return { value: clusterMax, isEmpty: false };
    }

    if (!openRep) return direct;

    const open = mergeSensorWithList(sensorPoint.value);

    const fromPopup = readMarkerUnitValue(open);
    if (!fromPopup.isEmpty) return fromPopup;

    const ownerKey = normalizeOwnerKey(point);
    if (ownerKey) {
      const anchorGeo = resolveBundleAnchorGeo(open, sensors.value);
      for (const s of sensors.value || []) {
        if (normalizeOwnerKey(s) !== ownerKey) continue;
        if (hasValidCoordinates(anchorGeo) && hasValidCoordinates(s?.geo)) {
          if (haversineKm(anchorGeo, s.geo) > OWNER_GEO_CLUSTER_KM) continue;
        }
        const fromSibling = readMarkerUnitValue(mergeSensorWithList(s));
        if (!fromSibling.isEmpty) return fromSibling;
      }
    }

    const logMax = maxFromLogs(open.logs, currentUnit);
    if (logMax !== null) return { value: logMax, isEmpty: false };

    const clusterMax = maxValueInOwnerCluster(open);
    if (clusterMax !== null) return { value: clusterMax, isEmpty: false };

    return { value: null, isEmpty: true };
  };

  /**
   * Whether excluded_sensors config hides this id.
   * @param {string} sensorId - Sensor id
   * @returns {boolean} True when the sensor should be hidden
   */
  const shouldFilterSensor = (sensorId) => {
    if (!excluded_sensors || !excluded_sensors.sensors || excluded_sensors.sensors.length === 0) {
      return false;
    }

    const { mode, sensors: configSensors } = excluded_sensors;
    const sensorIdsSet = new Set(configSensors);

    if (mode === "include-only") {
      // include-only: hide ids not in the list
      return !sensorIdsSet.has(sensorId);
    } else {
      // exclude: hide ids in the list
      return sensorIdsSet.has(sensorId);
    }
  };

  const collectHeaderSensorIds = (lists) => {
    const ids = new Set();
    const addRow = (row) => {
      if (!row) return;
      const sid = String(row.sensor_id || "").trim();
      if (sid && !shouldFilterSensor(sid)) ids.add(sid);
      for (const entry of row.sensors || []) {
        const parsed = parseBundleSensorEntry(entry);
        const bundleId = parsed?.sensor_id;
        if (bundleId && !shouldFilterSensor(bundleId)) ids.add(bundleId);
      }
    };
    for (const list of lists) {
      if (Array.isArray(list)) list.forEach(addRow);
    }
    return ids.size;
  };

  const clusterSensorsByOwnerProximity = (items, maxKm = OWNER_GEO_CLUSTER_KM) => {
    const clusters = [];
    for (const s of items) {
      if (!hasValidCoordinates(s?.geo)) continue;
      const geo = s.geo;
      let placed = false;
      for (const c of clusters) {
        const closeEnough = c.members.some(
          (m) => hasValidCoordinates(m?.geo) && haversineKm(geo, m.geo) <= maxKm
        );
        if (closeEnough) {
          c.members.push(s);
          placed = true;
          break;
        }
      }
      if (!placed) clusters.push({ members: [s] });
    }
    return clusters;
  };

  /** Map marker id for an owner bundle (urban rep within 5 km), for active-marker highlight. */
  const resolveOwnerClusterMarkerId = (sensorId) => {
    const sid = String(sensorId || "");
    if (!sid) return sensorId;
    const list = sensors.value || [];
    const sensor = list.find((s) => String(s?.sensor_id || "") === sid);
    if (!sensor) return sensorId;
    const ownerKey = normalizeOwnerKey(sensor);
    if (!ownerKey) return sensorId;
    const ownerSensors = list.filter((s) => normalizeOwnerKey(s) === ownerKey);
    if (ownerSensors.length <= 1) return sid;

    const anchorGeo = sensor?.geo;
    const nearby = hasValidCoordinates(anchorGeo)
      ? ownerSensors.filter(
          (s) =>
            !hasValidCoordinates(s?.geo) ||
            haversineKm(anchorGeo, s.geo) <= OWNER_GEO_CLUSTER_KM
        )
      : ownerSensors;
    const pool = nearby.length > 0 ? nearby : ownerSensors;
    const cluster = clusterSensorsByOwnerProximity(pool).find((c) =>
      c.members.some((m) => String(m?.sensor_id || "") === sid)
    );
    const rep = cluster
      ? pickOwnerClusterRepresentative(cluster.members)
      : pickOwnerClusterRepresentative(pool);
    return rep?.sensor_id ? String(rep.sensor_id) : sid;
  };

  /** One dot per owner cluster — same path as initial map draw (not popup-specific). */
  const rebundleOwnerClusterForPoint = (point, { highlight = true } = {}) => {
    if (!point || !sensorsUtils.isReadyLayer()) return;
    const ownerKey = normalizeOwnerKey(point);
    if (!ownerKey) return;
    rebundleOwnerMarkers(ownerKey, resolveBundleAnchorGeo(point, sensors.value));
    if (highlight && sensorPoint.value?.sensor_id && isSensorOpen(point.sensor_id)) {
      setActiveMarker(resolveOwnerClusterMarkerId(sensorPoint.value.sensor_id));
    }
  };

  /** Re-color + re-highlight the open sensor's bundled map marker (e.g. after unit change). */
  const refreshOpenSensorMapMarker = (ctx = {}) => {
    const { requestId = null, timelineMode = null } = ctx;
    if (requestId && requestId !== currentLogsRequestId) return;
    if (timelineMode && timelineMode !== mapState.timelineMode.value) return;
    if (!sensorPoint.value?.sensor_id || !sensorsUtils.isReadyLayer()) return;
    const bundleOpts = applyFilteredOwnerBundleOptions(
      sensorPoint.value,
      sensorPoint.value.ownerSensorsWithData,
      sensors.value
    );
    if (bundleOpts?.length) {
      sensorPoint.value = { ...sensorPoint.value, ownerSensorsWithData: bundleOpts };
    }
    if (normalizeOwnerKey(sensorPoint.value)) {
      rebundleOwnerClusterForPoint(sensorPoint.value);
    } else if (hasValidCoordinates(sensorPoint.value.geo)) {
      updateSensorMarker(sensorPoint.value);
      setActiveMarker(resolveOwnerClusterMarkerId(sensorPoint.value.sensor_id));
    }
  };

  /** Full map rebundle — e.g. after day/week/month switches that can leave orphan sibling markers. */
  const reassertMapMarkers = () => {
    if (!sensorsUtils.isReadyLayer()) return;
    lastUpdateKey = "";
    updateSensorMarkers(true, { force: true });
    if (sensorPoint.value?.sensor_id) {
      setActiveMarker(resolveOwnerClusterMarkerId(sensorPoint.value.sensor_id));
    }
  };

  /**
   * One map dot per owner geo cluster. Removes sibling markers within 5 km.
   * @param {string|null} ownerKey - rebundle only this owner; all owners when omitted.
   * @param {Object|null} anchorGeo - force one cluster around popup/map anchor
   */
  const rebundleOwnerMarkers = (ownerKey = null, anchorGeo = null) => {
    if (!sensorsUtils.isReadyLayer()) return;
    const list = sensors.value || [];

    const applyCluster = (members) => {
      if (!Array.isArray(members) || members.length === 0) return;
      const rep = pickOwnerClusterRepresentative(members);
      if (!rep?.sensor_id) return;
      const repId = String(rep.sensor_id);
      const clusterAnchor =
        (anchorGeo && hasValidCoordinates(anchorGeo) ? anchorGeo : null) ||
        resolveBundleAnchorGeo(rep, list);
      const ownerKey = normalizeOwnerKey(rep);
      const cachedIds = ownerKey ? peekUserSensorsCache(ownerKey) : null;
      const memberIds = [
        ...new Set([
          ...members.map((s) => String(s.sensor_id)),
          ...(Array.isArray(cachedIds) ? cachedIds.map((id) => String(id)) : []),
        ]),
      ];
      const typed = inferTypesForOwnerIds(memberIds, list, rep);
      const clusterBundle = finalizeOwnerBundleNearAnchor(
        buildOwnerBundleFromIds(memberIds, list, repId, rep, typed),
        clusterAnchor,
        repId
      );
      const repPoint = formatPointForSensor(
        {
          ...rep,
          ownerSensorIds: cachedIds || rep.ownerSensorIds || null,
          ownerSensorsWithData: clusterBundle?.length ? clusterBundle : null,
        },
        { calculateValue: true }
      );
      if (!repPoint.model) return;

      if (!shouldFilterSensor(repId)) {
        sensorsUtils.upsertPoint(repPoint, mapState.currentUnit.value);
      }

      for (const s of members) {
        const sid = String(s?.sensor_id || "");
        if (sid && sid !== repId) sensorsUtils.removeMarker(sid);
      }

      if (shouldFilterSensor(repId)) {
        sensorsUtils.removeMarker(repId);
      }
    };

    const rebundleItems = (items) => {
      for (const c of clusterSensorsByOwnerProximity(items)) {
        applyCluster(c.members);
      }
    };

    if (ownerKey) {
      const items = list.filter((s) => normalizeOwnerKey(s) === ownerKey);
      if (anchorGeo && hasValidCoordinates(anchorGeo)) {
        const nearby = items.filter(
          (s) =>
            hasValidCoordinates(s?.geo) &&
            haversineKm(anchorGeo, s.geo) <= OWNER_GEO_CLUSTER_KM
        );
        if (nearby.length > 0) {
          applyCluster(nearby);
          return;
        }
      }
      rebundleItems(items);
      return;
    }

    const byOwner = new Map();
    const unowned = [];
    for (const s of list) {
      const key = normalizeOwnerKey(s);
      if (!key) {
        unowned.push(s);
        continue;
      }
      if (!byOwner.has(key)) byOwner.set(key, []);
      byOwner.get(key).push(s);
    }
    for (const items of byOwner.values()) rebundleItems(items);
    for (const s of unowned) {
      if (!s?.sensor_id || shouldFilterSensor(s.sensor_id)) continue;
      const p = formatPointForSensor(s, { calculateValue: true });
      if (!p.model) continue;
      sensorsUtils.upsertPoint(p, mapState.currentUnit.value);
    }
  };

  /**
   * Upsert or remove a single map marker.
   * @param {Object} point - Sensor row for the marker
   * @param {string} point.sensor_id - Sensor id
   * @param {Object} point.geo - Coordinates `{lat, lng}`
   * @param {number} point.model - Sensor model
   * @param {Object} point.data - Measurement bag
   * @param {Object} point.maxdata - Daily recap values
   */
  const updateSensorMarker = (point) => {

    // excluded_sensors config
    if (shouldFilterSensor(point.sensor_id)) {
      // Remove marker when filtered out
      sensorsUtils.removeMarker(point.sensor_id);
      return;
    }

    try {
      // Normalize point for map layer
      point.data = point.data
        ? Object.fromEntries(Object.entries(point.data).map(([k, v]) => [k.toLowerCase(), v]))
        : {};

      const ownerKey = normalizeOwnerKey(point);
      if (ownerKey) {
        const popupOwner = normalizeOwnerKey(sensorPoint.value);
        if (sensorPoint.value && popupOwner === ownerKey) {
          const bundleOpts =
            applyFilteredOwnerBundleOptions(
              sensorPoint.value,
              null,
              sensors.value,
              ownerBundleClustered()
            ) ||
            buildOwnerSensorsWithData(sensorPoint.value, sensors.value, null, ownerBundleClustered());
          if (bundleOpts?.length) {
            sensorPoint.value = { ...sensorPoint.value, ownerSensorsWithData: bundleOpts };
          }
          rebundleOwnerClusterForPoint(sensorPoint.value);
        } else {
          rebundleOwnerMarkers(ownerKey);
        }
        return;
      }

      const unifiedPoint = formatPointForSensor(point, { calculateValue: true });
      sensorsUtils.upsertPoint(unifiedPoint, mapState.currentUnit.value);
    } catch (error) {
      console.error("Error updating marker:", error, point);
    }
  };

  /**
   * Reset logs to null (not loaded) for one sensor or the open popup.
   * @param {string|null} [sensorId] - Sensor id; clears open popup when omitted
   */
  const clearSensorLogs = (sensorId = null) => {
    if (sensorId && isSensorOpen(sensorId)) {
      // Clear logs on a specific sensor row
      if (sensorPoint.value && sensorPoint.value.sensor_id === sensorId) {
        sensorPoint.value = { ...sensorPoint.value, logs: null, _logsKey: null };
      }
      // Clear logs in sensors array
      const sensorIndex = sensors.value.findIndex((s) => s.sensor_id === sensorId);
      if (sensorIndex >= 0) {
        const updatedSensors = [...sensors.value];
        updatedSensors[sensorIndex] = { ...updatedSensors[sensorIndex], logs: null };
        setSensors(updatedSensors);
      }
    } else if (sensorPoint.value) {
      // Clear logs on open popup
      sensorPoint.value = { ...sensorPoint.value, logs: null, _logsKey: null };
    }

    resetLogsProgress();
  };

  const handlerCloseSensor = () => {
    mapState.mapinactive.value = false;

    popupSessionId += 1;
    const closingId = route.query.sensor || null;
    sensorPoint.value = null;
    if (closingId) {
      recentlyClosed.value = { id: closingId, until: Date.now() + 1500 };
    }

    try {
      clearActiveMarker();
    } catch {
      // Map layer may not be ready yet.
    }

    const currentQuery = { ...route.query };
    delete currentQuery.sensor;
    delete currentQuery.owner;

    try {
      const shouldReset = sessionStorage.getItem("story_nav_set_date") === "1";
      if (shouldReset) {
        currentQuery.date = dayISO();
        sessionStorage.removeItem("story_nav_set_date");
        mapState.setCurrentDate(currentQuery.date);
      }
    } catch {}

    router.replace({ query: currentQuery });

    // Popup sync only touches one anchor cluster; restore the full map on close.
    if (!sensorsUtils.isReadyLayer()) return;
    lastUpdateKey = "";
    rebundleOwnerMarkers();
    try {
      sensorsUtils.refreshClusters();
    } catch {
      // Map layer may not be ready yet.
    }
  };

  /**
   * Refetch maxdata for current map unit and repaint markers (remote only).
   */
  const updateSensorMaxData = async () => {
    // Remote daily recap only
    if (mapState.currentProvider.value !== "remote" || sensors.value.length === 0) {
      return;
    }

    const { start, end } = sensorFetchBoundsForDate(mapState.currentDate.value);

    try {
      await hydrateMarkerIconCacheForDate(mapState.currentDate.value);

      // Merge maxdata for active unit into sensor rows
      const updatedSensors = await getMaxData(
        start,
        end,
        mapState.currentUnit.value,
        sensors.value,
        mapState.currentDate.value
      );

      await refreshMarkerIconsForSensors(mapState.currentDate.value, updatedSensors);

      // Apply and rebundle map markers
      lastUpdateKey = "";
      setSensors(updatedSensors);
      updateSensorMarkers(true);
      refreshOpenSensorMapMarker();
    } catch (error) {
      console.error("Error updating maxdata:", error);
    }
  };

  /**
   * Load owner device ids for SensorPicker and map cluster (map list + v2 meta, no owner API).
   * Owner comes from the point or URL (?owner=); DIY sensors skip this (no owner).
   * @param {string} sensorId - Open popup sensor id
   * @param {number} [session=popupSessionId] - Popup session guard
   */
  const hydrateOwnerBundleFromUserSensors = async (sensorId, session = popupSessionId) => {
    const sid = sensorId ? String(sensorId) : "";
    if (!sid || !isSensorOpen(sid)) return;

    const point = sensorPoint.value;
    const ownerKey = await resolveOwnerKeyForSensor(sid, point);
    if (!ownerKey) return;

    const ids = await ensureOwnerSensorIds(
      { ...(point || {}), sensor_id: sid, owner: ownerKey },
      ownerKey,
      null,
      sensors.value
    );
    if (session !== popupSessionId || !isSensorOpen(sid)) return;

    const anchorGeo = resolveBundleAnchorGeo(point || { sensor_id: sid }, sensors.value);
    const prevBundleSig = ownerBundleSig(point?.ownerSensorsWithData);
    const fullBundle = await buildOwnerSensorsWithDataAsync(
      { ...(point || {}), sensor_id: sid, owner: ownerKey, ownerSensorIds: ids },
      sensors.value,
      ids,
      ownerBundleClustered()
    );
    const bundleOpts = finalizeOwnerBundleNearAnchor(
      fullBundle,
      anchorGeo,
      sid,
      ownerBundleClustered()
    );

    if (session === popupSessionId && isSensorOpen(sid) && sensorPoint.value) {
      sensorPoint.value = {
        ...sensorPoint.value,
        owner: ownerKey,
        ownerSensorIds: ids,
        ...(bundleOpts?.length ? { ownerSensorsWithData: bundleOpts } : null),
      };
    }

    if (session !== popupSessionId || !isSensorOpen(sid)) return;

    let added = false;
    if (Array.isArray(bundleOpts) && bundleOpts.length > 0) {
      const next = [...(sensors.value || [])];
      for (const o of bundleOpts) {
        if (!o.hasData || !hasValidCoordinates(o.geo)) continue;
        const id = String(o.id);
        if (next.some((s) => String(s?.sensor_id || "") === id)) continue;
        next.push(
          formatPointForSensor(
            {
              sensor_id: id,
              geo: o.geo,
              owner: ownerKey,
              device_model: o.device_model || null,
              model: DEFAULT_SENSOR_MODEL,
              timestamp: Math.floor(Date.now() / 1000),
            },
            { calculateValue: false }
          )
        );
        added = true;
      }
      if (added && session === popupSessionId) setSensors(next);
    }

    if (session !== popupSessionId || !isSensorOpen(sid)) return;

    const bundleChanged = ownerBundleSig(bundleOpts) !== prevBundleSig;

    if (isSensorOpen(sid) && sensorPoint.value) {
      if (bundleChanged || added) {
        rebundleOwnerClusterForPoint(sensorPoint.value);
      } else {
        setActiveMarker(resolveOwnerClusterMarkerId(sensorPoint.value.sensor_id));
      }
    } else {
      rebundleOwnerMarkers(ownerKey, anchorGeo);
    }
  };

  const loadSensors = async () => {
    const timelineMode = mapState.timelineMode.value;
    const { start, end } = timelineFetchBounds(mapState.currentDate.value, timelineMode);

    // Cancel stale loadSensors request
    currentRequestId = Math.random().toString(36);
    const requestId = currentRequestId;

    const provider = mapState.currentProvider.value;
    if (provider !== lastLoadProvider) {
      try {
        sensorsUtils.clearAllMarkers();
      } catch {
        // Map layer may not be ready yet.
      }
      lastUpdateKey = "";
      lastLoadProvider = provider;
      clearSensorMetaCache();
      realtimeHydratedSid.value = null;
    }

    clearSensors();

    // Fetch marker list (remote) or clear for realtime
    try {
      const { sensors: sensorsData, sensorsNoLocation: sensorsNoLocationData } = await getSensors(
        start,
        end,
        mapState.currentProvider.value,
        {
          isoDate: mapState.currentDate.value,
          timelineMode,
        }
      );

      // Drop result if a newer request superseded this one
      if (currentRequestId !== requestId) {
        return;
      }

      // Replace shared sensor arrays
      if (sensorsData && Array.isArray(sensorsData)) {
        setSensors(sensorsData);
      }
      if (sensorsNoLocationData && Array.isArray(sensorsNoLocationData)) {
        setSensorsNoLocation(sensorsNoLocationData);
      }

      await hydrateMarkerIconCacheForDate(mapState.currentDate.value);
      await refreshMarkerIconsForSensors(mapState.currentDate.value, sensors.value);
    } catch (error) {
      console.error("Error fetching sensor history:", error);
    }
  };

  let lastUpdateKey = "";

  /**
   * Repaint all map markers (owner rebundle + cluster refresh). Deduped by date/unit key.
   * @param {boolean} [clear=true] - Clear all markers before redraw
   * @param {Object} [options]
   * @param {boolean} [options.force=false] - Skip dedupe key and repaint anyway
   */
  const updateSensorMarkers = (clear = true, { force = false } = {}) => {
    if (!sensorsUtils.isReadyLayer()) return;

    const currentUnit = mapState.currentUnit.value;
    const currentDate = mapState.currentDate.value;

    // Skip duplicate repaints for same provider/date/unit
    const updateKey = `${mapState.currentProvider.value}-${currentDate}-${currentUnit}-${mapState.timelineMode.value}-${sensors.value.length}`;
    if (!force && updateKey === lastUpdateKey) {
      return;
    }
    lastUpdateKey = updateKey;

    try {
      // Full clear before rebundle when requested
      if (clear) {
        try {
          sensorsUtils.clearAllMarkers();
        } catch {
          return;
        }
      }

      rebundleOwnerMarkers();

      // Refresh leaflet marker clusters
      try {
        sensorsUtils.refreshClusters();
      } catch (error) {
        console.warn("refreshClusters: Map context not ready yet");
      }

      if (sensorPoint.value?.sensor_id) {
        setActiveMarker(resolveOwnerClusterMarkerId(sensorPoint.value.sensor_id));
      }

      refreshAllMarkerBookmarkHighlights();
    } catch (error) {
      console.error("Error updating markers:", error);
    }
  };

  // Local sensor list setters
  const setSensors = (sensorsArr) => {
    sensors.value = withFeedRows(Array.isArray(sensorsArr) ? sensorsArr : []);
    sensorsLoaded.value = true;
  };

  /**
   * Government stations of one feed area (utils/map/feeds) in the sensor list, replacing that area's
   * previous rows, then a repaint. Kept apart and appended on every setSensors: a list computed from an
   * older snapshot (maxdata arriving after a feed area) must not wipe them.
   */
  const mergeFeedRows = (areaId, rows) => {
    feedRowsByArea.set(areaId, rows);
    sensors.value = withFeedRows(sensors.value);
    updateSensorMarkers(true, { force: true });
  };

  /** Removes feed rows (all, or those of the given areas) and repaints if any were there. */
  const dropFeedRows = (areaIds = null) => {
    const before = feedRowsByArea.size;
    for (const id of areaIds || [...feedRowsByArea.keys()]) feedRowsByArea.delete(id);
    if (feedRowsByArea.size === before) return;
    sensors.value = withFeedRows(sensors.value);
    updateSensorMarkers(true, { force: true });
  };

  const setSensorsNoLocation = (sensorsArr) => {
    sensorsNoLocation.value = Array.isArray(sensorsArr) ? sensorsArr : [];
  };

  const clearSensors = () => {
    realtimeLiveSensorIds.value = new Set();
    realtimeHydratedSid.value = null;
    clearSensorMetaCache();
    sensors.value = [];
    sensorsNoLocation.value = [];
    sensorsLoaded.value = false;
  };

  const switchOpenSensor = (nextId, point = sensorPoint.value) => {
    const next = String(nextId || "").trim();
    const current = String(point?.sensor_id || "");
    if (!next || next === current) return;

    const sensorsList = sensors.value || [];
    const nextRow = sensorsList.find((s) => String(s?.sensor_id || "") === next);
    const nextOwner = nextRow?.owner || point?.owner || null;

    mapState.setMapSettings(route, router, {
      lat: point?.geo?.lat ?? route.query.lat,
      lng: point?.geo?.lng ?? route.query.lng,
      zoom: route.query.zoom ?? getMapAddressZoom(),
      sensor: next,
      owner: nextOwner ? String(nextOwner) : undefined,
    });

    clearSensorLogs();

    void ensureOwnerLoaded(next);
    void (async () => {
      if (!sensorPoint.value) return;
      const ownerKey = String(nextOwner || sensorPoint.value?.owner || route.query.owner || "").trim();
      if (!ownerKey) return;

      await hydrateOwnerBundleFromUserSensors(next);
      if (mapState.currentProvider.value === "realtime") {
        refreshOpenSensorMapMarker();
        return;
      }

      const anchorGeo =
        resolveBundleAnchorGeo(
          {
            sensor_id: next,
            geo: point?.geo || sensorPoint.value?.geo || nextRow?.geo,
          },
          sensorsList
        ) ||
        point?.geo ||
        sensorPoint.value?.geo ||
        null;

      const nextPoint = {
        ...point,
        sensor_id: next,
        owner: ownerKey,
        geo: anchorGeo,
        ownerSensorIds: sensorPoint.value?.ownerSensorIds || point?.ownerSensorIds || null,
      };
      const fullBundle = buildOwnerSensorsWithData(nextPoint, sensorsList, null, ownerBundleClustered());
      const bundleOpts =
        finalizeOwnerBundleNearAnchor(fullBundle, anchorGeo, next, ownerBundleClustered()) ||
        point?.ownerSensorsWithData;
      rebundleOwnerClusterForPoint({
        ...nextPoint,
        ownerSensorsWithData: bundleOpts,
      });
    })();
  };

  // --- Watchers ---

  /**
   * Realtime hydration: patch popup geo from pubsub and refresh owner bundle when
   * sibling devices appear in the same 3 km cluster.
   */

  if (!ownerDecryptWatchersRegistered) {
    ownerDecryptWatchersRegistered = true;
    const accountStore = useAccounts();

    setSensorDataHandler = setSensorData;
    updateSensorLogsHandler = updateSensorLogs;
    void runOwnerDecrypt();

    watch(
      () => {
        const popup = sensorPoint.value;
        const owner = normalizeOwnerKey(popup);
        const sid = popup?.sensor_id ? String(popup.sensor_id) : "";
        const accountsList = accountStore.accounts.value;
        const accountsUnlockKey = accountsList
          .map((a) => {
            const addr = String(a?.address || "").trim();
            const secret = accountHasOwnerSecret(a) ? "1" : "0";
            const devices = Array.isArray(a.devices) ? a.devices.length : 0;
            return `${addr}:${secret}:${devices}`;
          })
          .sort()
          .join("|");
        const needsDecrypt =
          measurementBagHasEncryptedValues(popup?.data) || logHasEncryptedValues(popup?.logs);
        return `${mapState.currentProvider.value}|${sid}|${owner}|${popup?._ownerResolved ? "1" : "0"}|${accountsUnlockKey}|${needsDecrypt}|${popup?.logs?.length || 0}`;
      },
      () => {
        void runOwnerDecrypt();
      },
      { immediate: true, flush: "post" }
    );
  }

  if (!realtimeHydrationWatchersRegistered) {
    realtimeHydrationWatchersRegistered = true;
    watch(
      () => route.query.sensor,
      (nextSid, prevSid) => {
        if (String(nextSid || "") !== String(prevSid || "")) {
          realtimeHydratedSid.value = null;
        }
      }
    );
    watch(
      () => {
        if (mapState.currentProvider.value !== "realtime") return null;
        const popup = sensorPoint.value;
        const sid = String(route.query.sensor || popup?.sensor_id || "").trim();
        if (!sid || !popup || String(popup.sensor_id) !== sid) return null;

        const ownerKey = normalizeOwnerKey(popup);
        const anchorGeo = resolveBundleAnchorGeo(popup, sensors.value);
        const pool = ownerKey
          ? resolveOwnerClusterPool(popup, sensors.value, ownerKey, anchorGeo)
          : [];
        const poolSig = pool
          .map((s) => `${s.sensor_id}:${s.device_model || ""}:${s.geo?.lat},${s.geo?.lng}`)
          .sort()
          .join("|");
        return `${sid}|${ownerKey}|${poolSig}|${anchorGeo?.lat},${anchorGeo?.lng}`;
      },
      (key, prevKey) => {
        if (!key || key === prevKey) return;

        const sid = String(route.query.sensor || sensorPoint.value?.sensor_id || "").trim();
        if (!sid || !sensorPoint.value || String(sensorPoint.value.sensor_id) !== sid) return;

        const full = (Array.isArray(sensors.value) ? sensors.value : []).find(
          (s) => String(s?.sensor_id || "") === sid
        );

        if (full && realtimeHydratedSid.value !== sid) {
          const ownerKey =
            resolveOwnerForSensorId(sid, sensors.value, full, sensorPoint.value) ||
            normalizeOwnerKey(sensorPoint.value) ||
            "";

          sensorPoint.value = {
            ...sensorPoint.value,
            geo: full.geo || sensorPoint.value.geo,
            model: full.model || sensorPoint.value.model,
            owner: full.owner || sensorPoint.value.owner,
            device_model: full.device_model ?? sensorPoint.value.device_model ?? null,
            data: full.data || sensorPoint.value.data,
          };
          realtimeHydratedSid.value = sid;

          if (ownerKey) {
            rebundleOwnerClusterForPoint(sensorPoint.value);
          }
        }

        if (normalizeOwnerKey(sensorPoint.value)) {
          const opts = applyFilteredOwnerBundleOptions(
            sensorPoint.value,
            sensorPoint.value.ownerSensorsWithData,
            sensors.value
          );
          if (opts?.length) {
            sensorPoint.value = { ...sensorPoint.value, ownerSensorsWithData: opts };
          }
          rebundleOwnerClusterForPoint(sensorPoint.value);
        }
      },
      { immediate: true }
    );
  }

  return {
    mergeFeedRows,
    dropFeedRows,
    // State
    sensorPoint,
    sensors,
    sensorsNoLocation,
    sensorsLoaded,
    logsProgress,

    // Computed
    isSensor,
    mapSensorsCount,
    runLogsHealth,

    // Functions
    isSensorOpen,
    isSensorNew,
    setSensorData,
    updateSensorLogs,
    updateSensorPopup,
    commitPopupShell,
    formatPointForSensor,
    calculateMarkerValue,
    updateSensorMarker,
    handlerCloseSensor,
    updateSensorMaxData,
    loadSensors,
    updateSensorMarkers,
    buildOwnerSensorsWithData: (point, list) =>
      buildOwnerSensorsWithData(point, list, null, ownerBundleClustered()),
    resolveBundleAnchorGeo: (point, list) => resolveBundleAnchorGeo(point, list),
    hydrateOwnerBundleFromUserSensors,
    refreshOpenSensorMapMarker,
    reassertMapMarkers,
    setSensors,
    setSensorsNoLocation,
    clearSensors,
    clearSensorLogs,
    resolveSensorType,
    buildSensorPickerRows,
    shouldClusterOwnerBundle,
    formatSensorIdShort,
    sensorTypeTitle,
    sensorTypeIcon,
    switchOpenSensor,
  };
}

// --- Re-exports ---

export {
  resolveSensorType,
  formatSensorIdShort,
  isSensorAddressReady,
  isPanelSensorPickerReady,
  isPanelOwnerLoading,
  sensorTypeTitle,
  sensorTypeIcon,
} from "./sensorDeviceTypes";
export {
  shouldClusterOwnerBundle,
  buildSensorPickerRows,
  buildOwnerSensorsWithData,
  buildOwnerSensorsWithDataAsync,
  resolveBundleAnchorGeo,
  pickSensorIdForMapUnit,
} from "./sensorOwnerBundle";
export { ownerBundleHasDualDevices, mapMarkerIcon, refreshMarkerIconsForSensors } from "./sensorMarkerIcons";

export { redecryptDataBag, resolveOwnerAccount, historyPointsToLogs, isOwnerAccountLoggedIn, hydrateRealtimeLogsForSensor };
export async function refreshRealtimeOwnerDecrypt() {
  await redecryptAllRealtimeHistory(useAccounts().accounts.value);
  return runOwnerDecrypt();
}
