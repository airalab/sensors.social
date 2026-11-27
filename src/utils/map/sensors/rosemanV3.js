import { settings } from "@config";
import {
  decodeSignedEnvelopeBatchToPoints,
  v3JsonItemsToPoints,
} from "@/utils/proto/decodeEnvelope";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { sensorIdAliases } from "@/utils/sensorId";

const PAGE_LIMIT = 1000;
const MAX_PAGES = 20;
const PAGE_TIMEOUT_MS = 4_000;

function rosemanApiBase(url = settings.REMOTE_PROVIDER) {
  return String(url || "").replace(/\/?$/, "/");
}

function unixToMs(ts) {
  const n = Number(ts);
  if (!Number.isFinite(n) || n <= 0) return NaN;
  return n < 1e12 ? Math.trunc(n * 1000) : Math.trunc(n);
}

function queryFor(id, startMs, endMs, cursor = null) {
  const params = new URLSearchParams({
    sensor_id: id,
    start: String(startMs),
    end: String(endMs),
    limit: String(PAGE_LIMIT),
  });
  if (cursor) params.set("cursor", cursor);
  return params.toString();
}

async function fetchPage(url, parentSignal = null) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PAGE_TIMEOUT_MS);
  const onAbort = () => ctrl.abort();
  if (parentSignal) {
    if (parentSignal.aborted) ctrl.abort();
    else parentSignal.addEventListener("abort", onAbort, { once: true });
  }
  try {
    return await fetch(url, { cache: "no-store", signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
    parentSignal?.removeEventListener("abort", onAbort);
  }
}

async function fetchProtobufPages(base, id, startMs, endMs, signal) {
  const points = [];
  let cursor = null;
  let httpOk = false;
  let hadBytes = false;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    if (signal?.aborted) break;
    const url = `${base}api/v3/messages?${queryFor(id, startMs, endMs, cursor)}`;
    let res;
    try {
      res = await fetchPage(url, signal);
    } catch {
      return { httpOk, hadBytes, points };
    }
    if (!res.ok) return { httpOk, hadBytes, points };
    httpOk = true;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength > 0) {
      hadBytes = true;
      try {
        points.push(
          ...decodeSignedEnvelopeBatchToPoints(buf, {
            requireGeo: false,
            verbose: false,
          })
        );
      } catch {
        return { httpOk, hadBytes, points };
      }
    }
    cursor = res.headers.get("X-Next-Cursor");
    if (!cursor) break;
  }
  return { httpOk, hadBytes, points };
}

async function fetchJsonPages(base, id, startMs, endMs, signal) {
  const points = [];
  let cursor = null;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    if (signal?.aborted) break;
    const url = `${base}api/v3/messages/json?${queryFor(id, startMs, endMs, cursor)}`;
    let res;
    try {
      res = await fetchPage(url, signal);
    } catch {
      return points;
    }
    if (!res.ok) return points;
    let body;
    try {
      body = await res.json();
    } catch {
      return points;
    }
    const items = body?.result?.items;
    if (Array.isArray(items) && items.length > 0) {
      points.push(
        ...v3JsonItemsToPoints(items, {
          requireGeo: false,
          verbose: false,
        })
      );
    }
    cursor = body?.result?.next_cursor || null;
    if (!cursor) break;
  }
  return points;
}

/**
 * Protobuf history for one sensor. Map markers stay on v2 JSON.
 * @returns {Promise<object[]>}
 */
export async function fetchRosemanV3SensorPoints(sensorId, start, end, signal = null) {
  const startMs = unixToMs(start);
  let endMs = unixToMs(end);
  if (!String(sensorId || "").trim() || !Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    return [];
  }
  if (endMs <= startMs) endMs = startMs + 1000;

  const base = rosemanApiBase();
  await cryptoWaitReady();
  const original = String(sensorId || "").trim();
  const aliases = sensorIdAliases(original);
  const ids = [original, ...aliases.filter((id) => id && id !== original)];
  for (const id of ids) {
    const proto = await fetchProtobufPages(base, id, startMs, endMs, signal);
    if (proto.points.length > 0) return proto.points;
    if (!proto.httpOk || proto.hadBytes) {
      const jsonPoints = await fetchJsonPages(base, id, startMs, endMs, signal);
      if (jsonPoints.length > 0) return jsonPoints;
    }
  }
  return [];
}

export function protoPointsToHistory(points) {
  return (Array.isArray(points) ? points : [])
    .map((point) => {
      const timestamp = Number(point?.timestamp);
      if (!Number.isFinite(timestamp) || timestamp <= 0) return null;
      return {
        timestamp,
        data: point.data && typeof point.data === "object" ? point.data : {},
        geo: point.geo || undefined,
        proto: true,
        protoPrivate: Array.isArray(point.protoPrivate) ? point.protoPrivate : null,
        device_model: point.device_model || null,
      };
    })
    .filter(Boolean);
}
