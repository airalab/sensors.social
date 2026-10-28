/* eslint-env node */
/* global globalThis */

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export const WORLD_HALF = 20037508.342789244;
export const WORLD_SIZE = WORLD_HALF * 2;
export const STEP_MS = 3 * 60 * 60 * 1000;
export const ALLOWED_LAYERS = new Set(["composition_duaod550", "composition_bbaod550"]);

const REQUIRED_PARAMS = {
  service: "wms",
  request: "getmap",
  styles: "sh_oranges_aod",
  format: "image/png",
  transparent: "true",
  version: "1.3.0",
  width: "256",
  height: "256",
  crs: "epsg:3857",
};

function numberFromEnv(value, fallback, min = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min ? parsed : fallback;
}

function booleanFromEnv(value, fallback) {
  if (value == null || value === "") return fallback;
  return !["0", "false", "no", "off"].includes(String(value).toLowerCase());
}

export function configFromEnv(env = process.env) {
  return {
    port: numberFromEnv(env.PORT, 3081, 1),
    cacheDir: env.CACHE_DIR || path.resolve("cache"),
    cacheMaxBytes: numberFromEnv(env.CACHE_MAX_BYTES, 10 * 1024 ** 3, 1),
    cacheDays: numberFromEnv(env.CACHE_DAYS, 6, 1),
    concurrency: Math.floor(numberFromEnv(env.PREFETCH_CONCURRENCY, 8, 1)),
    minZoom: Math.floor(numberFromEnv(env.PREFETCH_MIN_ZOOM, 2, 0)),
    maxZoom: Math.floor(numberFromEnv(env.PREFETCH_MAX_ZOOM, 6, 0)),
    requestMaxZoom: Math.floor(numberFromEnv(env.REQUEST_MAX_ZOOM, 6, 0)),
    leadMinutes: numberFromEnv(env.PREFETCH_LEAD_MINUTES, 60, 0),
    prefetchEnabled: booleanFromEnv(env.PREFETCH_ENABLED, true),
    upstream: env.UPSTREAM_WMS || "https://eccharts.ecmwf.int/wms/?token=public",
    requestTimeoutMs: numberFromEnv(env.REQUEST_TIMEOUT_MS, 20_000, 1000),
    retries: Math.floor(numberFromEnv(env.UPSTREAM_RETRIES, 2, 0)),
    maxImageBytes: numberFromEnv(env.MAX_IMAGE_BYTES, 2 * 1024 ** 2, 1024),
  };
}

export function floorStep(date = new Date()) {
  return new Date(Math.floor(date.getTime() / STEP_MS) * STEP_MS);
}

export function isoStep(date) {
  return date.toISOString().replace(".000Z", "Z");
}

export function tileBbox(z, x, y) {
  const span = WORLD_SIZE / 2 ** z;
  const minX = -WORLD_HALF + x * span;
  const maxX = minX + span;
  const maxY = WORLD_HALF - y * span;
  const minY = maxY - span;
  return [minX, minY, maxX, maxY];
}

export function bboxToTile(value, maxZoom = 20) {
  const bbox = String(value || "")
    .split(",")
    .map(Number);
  if (bbox.length !== 4 || bbox.some((n) => !Number.isFinite(n))) {
    throw new RequestError(400, "Invalid bbox");
  }

  const [minX, minY, maxX, maxY] = bbox;
  const width = maxX - minX;
  const height = maxY - minY;
  if (width <= 0 || height <= 0) throw new RequestError(400, "Invalid bbox extent");

  const z = Math.round(Math.log2(WORLD_SIZE / width));
  if (z < 0 || z > maxZoom) throw new RequestError(400, "Unsupported zoom");
  const span = WORLD_SIZE / 2 ** z;
  const x = Math.round((minX + WORLD_HALF) / span);
  const y = Math.round((WORLD_HALF - maxY) / span);
  const limit = 2 ** z;
  if (x < 0 || y < 0 || x >= limit || y >= limit) {
    throw new RequestError(400, "Tile is outside Web Mercator bounds");
  }

  const expected = tileBbox(z, x, y);
  const tolerance = Math.max(0.02, span * 1e-8);
  if (bbox.some((n, i) => Math.abs(n - expected[i]) > tolerance)) {
    throw new RequestError(400, "bbox is not a Web Mercator tile");
  }
  return { z, x, y, bbox: expected };
}

function lowerParams(searchParams) {
  const result = new Map();
  for (const [key, value] of searchParams) result.set(key.toLowerCase(), value);
  return result;
}

function validateTime(value, now, cacheDays) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:00:00Z$/.test(value || "")) {
    throw new RequestError(400, "Invalid time");
  }
  const timestamp = Date.parse(value);
  const hour = Number(value.slice(11, 13));
  if (!Number.isFinite(timestamp) || hour % 3 !== 0) {
    throw new RequestError(400, "time must be a three-hour UTC step");
  }
  const range = cacheDays * 86400e3;
  if (timestamp < now.getTime() - range || timestamp > now.getTime() + range) {
    throw new RequestError(400, "time is outside the supported window");
  }
  return value;
}

export function parseWmsRequest(url, options = {}) {
  const now = options.now || new Date();
  const cacheDays = options.cacheDays ?? 6;
  const maxZoom = options.maxZoom ?? 20;
  const params = lowerParams(url.searchParams);

  for (const [key, expected] of Object.entries(REQUIRED_PARAMS)) {
    if (String(params.get(key) || "").toLowerCase() !== expected) {
      throw new RequestError(400, `Invalid ${key}`);
    }
  }

  const layer = params.get("layers");
  if (!ALLOWED_LAYERS.has(layer)) throw new RequestError(400, "Unsupported layer");
  const time = validateTime(params.get("time"), now, cacheDays);
  const tile = bboxToTile(params.get("bbox"), maxZoom);

  return { layer, time, ...tile };
}

export function buildWmsUrl(upstream, request) {
  const url = new URL(upstream);
  const params = {
    service: "WMS",
    request: "GetMap",
    layers: request.layer,
    styles: "sh_Oranges_aod",
    format: "image/png",
    transparent: "true",
    version: "1.3.0",
    time: request.time,
    width: "256",
    height: "256",
    crs: "EPSG:3857",
    bbox: request.bbox.join(","),
  };
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url;
}

export function cachePath(cacheDir, request) {
  const safeTime = request.time.replaceAll(":", "-");
  return path.join(
    cacheDir,
    safeTime,
    request.layer,
    String(request.z),
    String(request.x),
    `${request.y}.png`
  );
}

export class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class AodCache {
  constructor(config, dependencies = {}) {
    this.config = config;
    this.fetch = dependencies.fetch || globalThis.fetch;
    this.now = dependencies.now || (() => new Date());
    this.inFlight = new Map();
    this.prefetchPromise = null;
    this.lastPrefetch = null;
    this.lastPruneAt = 0;
    this.lastCacheStats = { bytes: null, files: null, measuredAt: null };
    this.upstreamStatus = { lastSuccessAt: null, lastErrorAt: null, lastError: null };
  }

  async init() {
    await fs.mkdir(this.config.cacheDir, { recursive: true });
  }

  parse(url) {
    return parseWmsRequest(url, {
      now: this.now(),
      cacheDays: this.config.cacheDays,
      maxZoom: this.config.requestMaxZoom,
    });
  }

  async read(request) {
    try {
      return await fs.readFile(cachePath(this.config.cacheDir, request));
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
  }

  async get(request) {
    const cached = await this.read(request);
    if (cached) return { body: cached, cache: "HIT" };

    const filename = cachePath(this.config.cacheDir, request);
    if (!this.inFlight.has(filename)) {
      const task = this.fetchAndStore(request, filename).finally(() =>
        this.inFlight.delete(filename)
      );
      this.inFlight.set(filename, task);
    }
    return { body: await this.inFlight.get(filename), cache: "MISS" };
  }

  async fetchAndStore(request, filename) {
    const upstream = buildWmsUrl(this.config.upstream, request);
    let lastError;
    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const response = await this.fetch(upstream, {
          redirect: "follow",
          signal: AbortSignal.timeout(this.config.requestTimeoutMs),
          headers: { "user-agent": "sensors.social-aod-cache/1.0" },
        });
        if (!response.ok) {
          const error = new Error(`Upstream HTTP ${response.status}`);
          const retryAfter = Number(response.headers.get("retry-after"));
          if (Number.isFinite(retryAfter)) error.retryAfterMs = retryAfter * 1000;
          throw error;
        }
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.toLowerCase().startsWith("image/png")) {
          throw new Error(`Unexpected upstream content type: ${contentType || "missing"}`);
        }
        const body = Buffer.from(await response.arrayBuffer());
        if (body.length === 0 || body.length > this.config.maxImageBytes) {
          throw new Error(`Unexpected PNG size: ${body.length}`);
        }
        if (!body.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
          throw new Error("Upstream response is not a PNG");
        }
        await fs.mkdir(path.dirname(filename), { recursive: true });
        const temporary = `${filename}.${process.pid}.${crypto.randomUUID()}.tmp`;
        try {
          await fs.writeFile(temporary, body);
          await fs.rename(temporary, filename);
        } catch (error) {
          await fs.unlink(temporary).catch(() => {});
          throw error;
        }
        this.upstreamStatus = {
          lastSuccessAt: this.now().toISOString(),
          lastErrorAt: this.upstreamStatus.lastErrorAt,
          lastError: null,
        };
        return body;
      } catch (error) {
        lastError = error;
        this.upstreamStatus.lastErrorAt = this.now().toISOString();
        this.upstreamStatus.lastError = error.message;
        if (attempt < this.config.retries) {
          await delay(error.retryAfterMs ?? 250 * 2 ** attempt);
        }
      }
    }
    throw new RequestError(502, `AOD upstream failed: ${lastError?.message || "unknown error"}`);
  }

  markerPath(time) {
    return path.join(this.config.cacheDir, time.replaceAll(":", "-"), ".complete");
  }

  async isPrefetched(time) {
    try {
      await fs.access(this.markerPath(time));
      return true;
    } catch {
      return false;
    }
  }

  async prefetch(time) {
    if (await this.isPrefetched(time)) return { time, skipped: true, total: 0, errors: 0 };
    const requests = [];
    for (const layer of ALLOWED_LAYERS) {
      for (let z = this.config.minZoom; z <= this.config.maxZoom; z++) {
        const limit = 2 ** z;
        for (let x = 0; x < limit; x++) {
          for (let y = 0; y < limit; y++) {
            requests.push({ layer, time, z, x, y, bbox: tileBbox(z, x, y) });
          }
        }
      }
    }

    const state = { time, skipped: false, total: requests.length, completed: 0, errors: 0 };
    this.lastPrefetch = state;
    let cursor = 0;
    const worker = async () => {
      while (cursor < requests.length) {
        const request = requests[cursor++];
        try {
          await this.get(request);
        } catch (error) {
          state.errors++;
          state.lastError = error.message;
        } finally {
          state.completed++;
        }
      }
    };
    await Promise.all(Array.from({ length: this.config.concurrency }, worker));
    state.finishedAt = new Date().toISOString();
    if (state.errors === 0) {
      await fs.mkdir(path.dirname(this.markerPath(time)), { recursive: true });
      await fs.writeFile(this.markerPath(time), `${state.finishedAt}\n`);
    }
    return state;
  }

  async reconcilePrefetch() {
    if (this.prefetchPromise) return this.prefetchPromise;
    this.prefetchPromise = (async () => {
      const now = this.now();
      const current = floorStep(now);
      const targets = [isoStep(current)];
      const next = new Date(current.getTime() + STEP_MS);
      if (next.getTime() - now.getTime() <= this.config.leadMinutes * 60_000) {
        targets.push(isoStep(next));
      }
      for (const target of targets) {
        await this.prefetch(target);
      }
    })().finally(() => {
      this.prefetchPromise = null;
    });
    return this.prefetchPromise;
  }

  async timeDirectories() {
    const entries = await fs.readdir(this.config.cacheDir, { withFileTypes: true }).catch(() => []);
    return entries
      .filter((entry) => entry.isDirectory() && /^\d{4}-\d{2}-\d{2}T\d{2}-00-00Z$/.test(entry.name))
      .map((entry) => ({
        name: entry.name,
        time: Date.parse(entry.name.replace(/T(\d{2})-00-00Z$/, "T$1:00:00Z")),
        path: path.join(this.config.cacheDir, entry.name),
      }))
      .filter((entry) => Number.isFinite(entry.time));
  }

  async directorySize(root) {
    let bytes = 0;
    let files = 0;
    const entries = await fs.readdir(root, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const filename = path.join(root, entry.name);
      if (entry.isDirectory()) {
        const nested = await this.directorySize(filename);
        bytes += nested.bytes;
        files += nested.files;
      } else if (entry.isFile()) {
        const stat = await fs.stat(filename);
        bytes += stat.size;
        files++;
      }
    }
    return { bytes, files };
  }

  async prune(force = false) {
    const now = this.now().getTime();
    if (!force && now - this.lastPruneAt < 6 * 60 * 60 * 1000) return;
    const directories = (await this.timeDirectories()).sort((a, b) => a.time - b.time);
    const oldestAllowed = now - this.config.cacheDays * 86400e3;
    for (const entry of directories.filter((item) => item.time < oldestAllowed)) {
      await fs.rm(entry.path, { recursive: true, force: true });
    }

    const remaining = (await this.timeDirectories()).sort((a, b) => a.time - b.time);
    const sizes = [];
    let total = 0;
    let files = 0;
    for (const entry of remaining) {
      const size = await this.directorySize(entry.path);
      sizes.push({ ...entry, ...size });
      total += size.bytes;
      files += size.files;
    }
    for (const entry of sizes) {
      if (total <= this.config.cacheMaxBytes) break;
      await fs.rm(entry.path, { recursive: true, force: true });
      total -= entry.bytes;
      files -= entry.files;
    }
    this.lastPruneAt = now;
    this.lastCacheStats = { bytes: total, files, measuredAt: new Date(now).toISOString() };
  }

  async stats() {
    return {
      ok: true,
      cache: this.lastCacheStats,
      inFlight: this.inFlight.size,
      prefetch: this.lastPrefetch,
      prefetchEnabled: this.config.prefetchEnabled,
      upstream: this.upstreamStatus,
      now: this.now().toISOString(),
    };
  }
}
