/**
 * OG preview service for sensor share links (Telegram, Facebook, …).
 * Bots get HTML with og:* tags; humans are redirected to the main map.
 */

import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT || 3080);
const REMOTE_PROVIDER = process.env.REMOTE_PROVIDER || "https://roseman.robonomics.network/";
const SITE_URL = process.env.SITE_URL || "https://sensors.social";
const SHARE_URL = process.env.SHARE_URL || "https://share.sensors.social";
const SITE_NAME = process.env.SITE_NAME || "Sensors.social";
const DEFAULT_TITLE = process.env.DEFAULT_TITLE || "Map of independent air quality sensors";
const DEFAULT_DESC =
  process.env.DEFAULT_DESC ||
  "Welcome to the decentralized opensource sensors map which operates with the sole intent of serving the free will of individuals, without any beneficiaries.";
const OG_IMAGE = process.env.OG_IMAGE || `${SITE_URL}/og-default.webp`;
const CACHE_DIR = process.env.CACHE_DIR || path.join(__dirname, "cache");
const GEO_CACHE_DIR = path.join(CACHE_DIR, "geo");
const OG_CACHE_DIR = path.join(CACHE_DIR, "og");
const CACHE_PURGE_TOKEN = String(process.env.CACHE_PURGE_TOKEN || "").trim();

/** Bot HTML may be cached by crawlers for a week; server disk cache is indefinite until purge. */
const BOT_CACHE_CONTROL = "public, max-age=604800, immutable";

const BOT_UA =
  /bot|telegram|facebook|twitter|linkedin|slack|discord|whatsapp|vkshare|preview|embed|facebot|ia_archiver/i;

async function ensureCacheDirs() {
  await fs.mkdir(GEO_CACHE_DIR, { recursive: true });
  await fs.mkdir(OG_CACHE_DIR, { recursive: true });
}

function ogMetaCacheKey(sensorId, searchParams) {
  const parts = [];
  for (const key of ["sensor", "type", "provider", "date", "owner"]) {
    const value = searchParams.get(key);
    if (value) parts.push(`${key}=${value}`);
  }
  if (!parts.some((p) => p.startsWith("sensor="))) {
    parts.unshift(`sensor=${sensorId}`);
  }
  return parts.join("&");
}

function geoAddressCacheKey(lat, lng) {
  return `${Number(lat).toFixed(4)},${Number(lng).toFixed(4)}`;
}

function safeCacheFileName(value) {
  return String(value).replace(/[^a-zA-Z0-9._-]/g, "_");
}

function ogCacheFilePath(cacheKey) {
  const hash = crypto.createHash("sha256").update(cacheKey).digest("hex");
  return path.join(OG_CACHE_DIR, `${hash}.json`);
}

function geoCacheFilePath(lat, lng) {
  return path.join(GEO_CACHE_DIR, `${safeCacheFileName(geoAddressCacheKey(lat, lng))}.json`);
}

async function readJsonFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readOgMetaCache(cacheKey) {
  const data = await readJsonFile(ogCacheFilePath(cacheKey));
  if (!data?.title) return null;
  return { title: data.title, description: data.description };
}

async function writeOgMetaCache(cacheKey, meta) {
  await ensureCacheDirs();
  await fs.writeFile(
    ogCacheFilePath(cacheKey),
    JSON.stringify(
      {
        key: cacheKey,
        title: meta.title,
        description: meta.description,
        savedAt: new Date().toISOString(),
      },
      null,
      0
    )
  );
}

async function readGeoAddressCache(lat, lng) {
  const data = await readJsonFile(geoCacheFilePath(lat, lng));
  return data?.address || null;
}

async function writeGeoAddressCache(lat, lng, address) {
  if (!address) return;
  await ensureCacheDirs();
  await fs.writeFile(
    geoCacheFilePath(lat, lng),
    JSON.stringify(
      {
        lat: Number(lat),
        lng: Number(lng),
        address,
        savedAt: new Date().toISOString(),
      },
      null,
      0
    )
  );
}

async function purgeCache(scope = "all") {
  await ensureCacheDirs();

  const removeDirFiles = async (dir) => {
    const names = await fs.readdir(dir).catch(() => []);
    await Promise.all(names.map((name) => fs.unlink(path.join(dir, name)).catch(() => {})));
  };

  if (scope === "all" || scope === "geo") {
    await removeDirFiles(GEO_CACHE_DIR);
  }
  if (scope === "all" || scope === "og") {
    await removeDirFiles(OG_CACHE_DIR);
  }
}

async function cacheStats() {
  await ensureCacheDirs();
  const count = async (dir) => {
    const names = await fs.readdir(dir).catch(() => []);
    return names.length;
  };
  return {
    geoEntries: await count(GEO_CACHE_DIR),
    ogEntries: await count(OG_CACHE_DIR),
    cacheDir: CACHE_DIR,
  };
}

const MEASUREMENT_LABELS = {
  pm10: "PM10",
  pm25: "PM2.5",
  co2: "CO2",
  temperature: "Temperature",
  humidity: "Humidity",
  pressure: "Pressure",
  dose_rate_nsv_h: "Radiation dose rate",
  noise: "Noise",
  noiseavg: "Noise Avg",
  noisemax: "Noise Max",
};

const MEASUREMENT_GROUPS = {
  dust: { members: ["pm10", "pm25"], label: "Dust & Particles" },
  noise: { members: ["noisemax", "noiseavg", "noise"], label: "Noise" },
  climate: { members: ["temperature", "humidity"], label: "Climate" },
};

function formatSensorIdShort(id) {
  const s = String(id || "");
  if (!s) return "";
  if (s.length <= 14) return s;
  return `${s.slice(0, 6)}…${s.slice(-6)}`;
}

function measurementGroupLabel(unitKey) {
  const key = String(unitKey || "").toLowerCase();
  for (const { members, label } of Object.values(MEASUREMENT_GROUPS)) {
    if (members.includes(key)) return label;
  }
  return MEASUREMENT_LABELS[key] || key.toUpperCase();
}

function inferDeviceTypeFromLog(log) {
  if (!Array.isArray(log) || log.length === 0) return null;
  let hasCo2 = false;
  let hasNoise = false;
  for (const item of log) {
    const data = item?.data;
    if (!data || typeof data !== "object") continue;
    if (data.co2 != null) hasCo2 = true;
    if (data.noiseavg != null || data.noisemax != null || data.noise != null) hasNoise = true;
  }
  if (hasCo2 && !hasNoise) return "insight";
  if (hasNoise && !hasCo2) return "urban";
  return "altruist";
}

function titleSuffix(deviceType) {
  if (deviceType === "insight") return `Altruist Insight on ${SITE_NAME}`;
  if (deviceType === "urban" || deviceType === "altruist") return `Altruist Urban on ${SITE_NAME}`;
  return SITE_NAME;
}

function buildSensorShareTitle(address, sensorId, suffix) {
  const place = address || formatSensorIdShort(sensorId);
  return `Air quality at ${place} — ${suffix}`;
}

function buildMeta({ sensorId, query, address, deviceType }) {
  const sid = String(sensorId || "").trim();
  if (!sid) {
    return { title: DEFAULT_TITLE, description: DEFAULT_DESC };
  }

  const title = buildSensorShareTitle(address, sid, titleSuffix(deviceType));
  const shortId = formatSensorIdShort(sid);
  const addressLabel = address || "sensor location";
  const provider = String(query.provider || "remote").toLowerCase();
  const hasType = Boolean(query.type);
  const hasDate = Boolean(query.date);

  let description;
  if (!hasType) {
    if (provider === "realtime") {
      description = `Air quality measurements from sensor ${shortId} at ${addressLabel}.`;
    } else {
      description = `Air quality measurements from sensor ${shortId} at ${addressLabel}${
        hasDate ? ` on ${query.date}` : ""
      }.`;
    }
  } else {
    const typeName = measurementGroupLabel(query.type);
    if (provider === "realtime") {
      description = `Real-time ${typeName} measurements from sensor ${shortId} at ${addressLabel}.`;
    } else {
      description = `${typeName} measurements from sensor ${shortId} at ${addressLabel}${
        hasDate ? ` on ${query.date}` : ""
      }.`;
    }
  }

  return { title, description };
}

function dayBoundsUnix(isoDate) {
  const [y, m, d] = String(isoDate).split("-").map(Number);
  const startDate = new Date(y, m - 1, d, 0, 0, 0, 0);
  const endDate = new Date(y, m - 1, d, 23, 59, 59, 999);
  return {
    start: Math.floor(startDate.getTime() / 1000),
    end: Math.floor(endDate.getTime() / 1000),
  };
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

async function fetchSensorDay(sensorId, isoDate) {
  const day = isoDate || todayIso();
  const { start, end } = dayBoundsUnix(day);
  const url = `${REMOTE_PROVIDER}api/v2/sensor/${encodeURIComponent(sensorId)}/${start}/${end}`;
  const res = await fetch(url);
  if (!res.ok) return { log: [], sensor: null };
  const payload = await res.json();
  return {
    log: Array.isArray(payload?.result) ? payload.result : [],
    sensor: payload?.sensor ?? null,
  };
}

function logFromSensorMeta(sensorMeta, sensorId) {
  const bag = sensorMeta?.data?.[sensorId];
  return Array.isArray(bag) ? bag : [];
}

function hasSensorOwner(sensorMeta) {
  return Boolean(String(sensorMeta?.owner || "").trim());
}

/** Match frontend: no owner → DIY; log inference only for owned Altruist devices. */
function inferDeviceTypeFromMeta(log, sensorMeta, sensorId) {
  if (!hasSensorOwner(sensorMeta)) return "diy";

  const fromLog = inferDeviceTypeFromLog(log);
  if (fromLog) return fromLog;
  const fromMeta = inferDeviceTypeFromLog(logFromSensorMeta(sensorMeta, sensorId));
  if (fromMeta) return fromMeta;
  return "altruist";
}

function geoFromLog(log) {
  if (!Array.isArray(log)) return null;
  for (const item of log) {
    const lat = Number(item?.geo?.lat);
    const lng = Number(item?.geo?.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }
  return null;
}

async function reverseGeocode(lat, lng) {
  const cached = await readGeoAddressCache(lat, lng);
  if (cached) return cached;

  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
    lat
  )}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1&accept-language=en`;
  const res = await fetch(url, {
    headers: { "User-Agent": "sensors.social/share-og (https://sensors.social)" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const a = data?.address || {};
  const parts = [];
  if (a.country) parts.push(a.country);
  const city =
    a.city || a.town || a.village || a.municipality || a.locality || a.county || "";
  if (city) parts.push(city);
  const hood = a.neighbourhood || a.suburb || a.city_district || "";
  if (hood && hood !== city) parts.push(hood);
  const road = a.road || a.pedestrian || a.footway || a.path || "";
  if (road) parts.push(road);
  const house = a.house_number || "";
  if (house) parts.push(house);
  const address = parts.length ? parts.join(", ") : data?.display_name || null;
  await writeGeoAddressCache(lat, lng, address);
  return address;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildBotHtml(meta, pageUrl) {
  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}">`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}">`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}">`,
    `<meta property="og:image" content="${escapeHtml(OG_IMAGE)}">`,
    `<meta property="og:url" content="${escapeHtml(pageUrl)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}">`,
    `<meta name="twitter:image" content="${escapeHtml(OG_IMAGE)}">`,
  ].join("\n    ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    ${tags}
</head>
<body>
  <p><a href="${escapeHtml(meta.redirectUrl)}">Open on ${escapeHtml(SITE_NAME)}</a></p>
</body>
</html>`;
}

function mapRedirectUrl(searchParams) {
  const target = new URL("/", SITE_URL);
  for (const key of ["owner", "sensor", "type", "provider", "date"]) {
    const value = searchParams.get(key);
    if (value) target.searchParams.set(key, value);
  }
  return target.toString();
}

async function buildOgMetaForSensor(sensorId, searchParams) {
  const cacheKey = ogMetaCacheKey(sensorId, searchParams);
  const cached = await readOgMetaCache(cacheKey);
  if (cached) return cached;

  const query = {
    type: searchParams.has("type") ? searchParams.get("type") : null,
    provider: searchParams.get("provider") || "remote",
    date: searchParams.has("date") ? searchParams.get("date") : "",
  };

  const isoDate = query.date || todayIso();
  const { log, sensor } = await fetchSensorDay(sensorId, isoDate);

  const geo = geoFromLog(log) || geoFromLog(logFromSensorMeta(sensor, sensorId));
  const address = geo ? await reverseGeocode(geo.lat, geo.lng) : null;
  const deviceType = inferDeviceTypeFromMeta(log, sensor, sensorId);

  const meta = buildMeta({ sensorId, query, address, deviceType });
  await writeOgMetaCache(cacheKey, meta);
  return meta;
}

function isBot(userAgent) {
  return BOT_UA.test(String(userAgent || ""));
}

function purgeAuthOk(req, url) {
  if (!CACHE_PURGE_TOKEN) return false;
  const header = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const token = header || url.searchParams.get("token") || "";
  return token === CACHE_PURGE_TOKEN;
}

async function handleRequest(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/health") {
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    res.end("ok");
    return;
  }

  if (url.pathname === "/admin/cache-stats" && req.method === "GET") {
    if (!purgeAuthOk(req, url)) {
      res.writeHead(401, { "content-type": "text/plain; charset=utf-8" });
      res.end("unauthorized");
      return;
    }
    const stats = await cacheStats();
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(stats));
    return;
  }

  if (url.pathname === "/admin/purge-cache" && req.method === "POST") {
    if (!purgeAuthOk(req, url)) {
      res.writeHead(401, { "content-type": "text/plain; charset=utf-8" });
      res.end("unauthorized");
      return;
    }
    const scope = url.searchParams.get("scope") || "all";
    if (!["all", "geo", "og"].includes(scope)) {
      res.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
      res.end("scope must be all, geo, or og");
      return;
    }
    await purgeCache(scope);
    const stats = await cacheStats();
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true, scope, ...stats }));
    return;
  }

  if (url.pathname !== "/") {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("not found");
    return;
  }

  const sensorId = url.searchParams.get("sensor");
  const redirectUrl = mapRedirectUrl(url.searchParams);
  const pageUrl = `${SHARE_URL}${url.pathname}${url.search}`;

  if (!sensorId) {
    if (isBot(req.headers["user-agent"])) {
      const html = buildBotHtml(
        { title: DEFAULT_TITLE, description: DEFAULT_DESC, redirectUrl },
        pageUrl
      );
      res.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": BOT_CACHE_CONTROL,
      });
      res.end(html);
      return;
    }
    res.writeHead(302, { location: SITE_URL });
    res.end();
    return;
  }

  if (!isBot(req.headers["user-agent"])) {
    res.writeHead(302, { location: redirectUrl });
    res.end();
    return;
  }

  const meta = await buildOgMetaForSensor(sensorId, url.searchParams);
  const html = buildBotHtml({ ...meta, redirectUrl }, pageUrl);
  res.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": BOT_CACHE_CONTROL,
  });
  res.end(html);
}

async function main() {
  if (process.argv.includes("--purge-cache")) {
    const scopeArg = process.argv.find((arg) => arg.startsWith("--scope="));
    const scope = scopeArg ? scopeArg.split("=")[1] : "all";
    await purgeCache(scope);
    const stats = await cacheStats();
    console.log(`Purged share-og cache (${scope})`, stats);
    return;
  }

  await ensureCacheDirs();

  const server = http.createServer(async (req, res) => {
    try {
      await handleRequest(req, res);
    } catch (error) {
      console.error("share-og error", error);
      res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      res.end("error");
    }
  });

  server.listen(PORT, "127.0.0.1", () => {
    console.log(`share-og listening on http://127.0.0.1:${PORT}`);
    console.log(`share-og disk cache: ${CACHE_DIR}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
