/**
 * Active fires layer — VIIRS thermal anomalies (375 m) from NASA GIBS vector tiles.
 *
 * Smoke from wildfires and field burning is a common cause of a PM spike that no local
 * source explains. This layer shows where the satellites saw fire on the date picked on
 * the map: for today — the last 24 hours, for a past date — that day.
 *
 * GIBS serves fires either as WMS (rendered per request, ~9 s a tile) or as vector tiles
 * (~0.5 s, every detection with its attributes). The layer reads the vector tiles and
 * draws the points itself on one canvas: a soft glow sized by fire radiative power (FRP),
 * so a field burn stays faint and a large fire stands out. Low-confidence detections are
 * dropped. The vector archive starts in July 2025.
 *
 * Every tile level carries every detection: one satellite-day is ~70k points worldwide,
 * ~2.5 MB gzip. Zoomed out to a world view the layer reads one satellite (`overviewLayers`)
 * in coarse tiles — 15 requests for the whole world instead of 150+ — and adds the other
 * satellites from `overviewMaxZoom + 1`.
 *
 * Config (`settings.FIRES`): { tiles, layers, overviewLayers, overviewMaxZoom, since, attribution }
 */

import L from "leaflet";
import { VectorTile } from "@mapbox/vector-tile";
import Pbf from "pbf";
import { settings } from "@config";

const PANE = "firesPane";
// GIBS EPSG:4326 "500m" matrix set: level 0 tile spans 288°
const TOP_TILE_DEG = 288;
const DAY_MS = 86400e3;

let layer = null;
let legendControl = null;
const tileCache = new Map(); // url -> Promise<fire[]>

function cfg() {
  return settings.FIRES || null;
}

const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);

/**
 * The vector archive starts at `settings.FIRES.since`.
 * @param {string} date - YYYY-MM-DD
 * @returns {boolean}
 */
export function isFiresAvailable(date) {
  const c = cfg();
  if (!c) return false;
  return !date || !c.since || date >= c.since;
}

/**
 * Time window for a map date: the last 24 h for today, the whole UTC day otherwise.
 * @param {string} date - YYYY-MM-DD
 * @returns {{ days: string[], from: number, to: number }} epoch ms
 */
export function fireWindowForDate(date) {
  const now = Date.now();
  if (!date || date >= isoDay(now)) {
    return { days: [isoDay(now - DAY_MS), isoDay(now)], from: now - DAY_MS, to: now };
  }
  const from = Date.parse(`${date}T00:00:00Z`);
  return { days: [date], from, to: from + DAY_MS };
}

// Coarser tiles when zoomed out: fewer requests, the same detections
function tileLevel(zoom) {
  if (zoom <= 4) return 2;
  if (zoom <= 6) return 4;
  return 5;
}

function layersForZoom(zoom) {
  const c = cfg();
  const overview = zoom <= (c.overviewMaxZoom ?? 4) && c.overviewLayers?.length;
  return overview ? c.overviewLayers : c.layers;
}

function tilesForBounds(bounds, level) {
  const deg = TOP_TILE_DEG / 2 ** level;
  const maxCol = Math.ceil(360 / deg) - 1;
  const maxRow = Math.ceil(180 / deg) - 1;
  const clamp = (v, max) => Math.min(Math.max(v, 0), max);
  const col0 = clamp(Math.floor((bounds.getWest() + 180) / deg), maxCol);
  const col1 = clamp(Math.floor((bounds.getEast() + 180) / deg), maxCol);
  const row0 = clamp(Math.floor((90 - bounds.getNorth()) / deg), maxRow);
  const row1 = clamp(Math.floor((90 - bounds.getSouth()) / deg), maxRow);
  const tiles = [];
  for (let row = row0; row <= row1; row++) {
    for (let col = col0; col <= col1; col++) tiles.push({ level, row, col });
  }
  return tiles;
}

function tileUrl(name, day, { level, row, col }) {
  return cfg()
    .tiles.replace("{layer}", name)
    .replace("{date}", day)
    .replace("{z}", level)
    .replace("{y}", row)
    .replace("{x}", col);
}

async function loadTile(url) {
  const res = await fetch(url);
  if (res.status === 404) return []; // no detections in this tile
  if (!res.ok) throw new Error(`fires tile ${res.status}`);
  const tile = new VectorTile(new Pbf(await res.arrayBuffer()));
  const fires = [];
  for (const vlayer of Object.values(tile.layers)) {
    for (let i = 0; i < vlayer.length; i++) {
      const p = vlayer.feature(i).properties;
      if (p.CONFIDENCE === "low") continue;
      const t = String(p.ACQ_TIME).padStart(5, "0");
      fires.push({
        id: `${p.SATELLITE}-${p.UID}-${p.ACQ_DATE}`,
        lat: p.LATITUDE,
        lng: p.LONGITUDE,
        frp: Number(p.FRP) || 0,
        time: Date.parse(`${p.ACQ_DATE}T${t}:00Z`),
      });
    }
  }
  return fires;
}

function cachedTile(url) {
  if (!tileCache.has(url)) {
    if (tileCache.size > 300) tileCache.clear();
    tileCache.set(
      url,
      loadTile(url).catch((e) => {
        tileCache.delete(url);
        console.error("Failed to load fires tile:", e);
        return [];
      })
    );
  }
  return tileCache.get(url);
}

// Glow radius in px: grows with FRP (MW) and with zoom
function radiusFor(frp, zoom) {
  const base = 1.5 + Math.log2(1 + frp) * 0.8;
  return base * Math.min(Math.max((zoom - 2) / 5, 0.25), 1.8);
}

// A weak field burn is a faint spark, a large fire a clear glow; zoomed out to a
// continent everything is dimmer, otherwise burning seasons cover the sensors
function alphaFor(frp, zoom) {
  const a = Math.min(Math.max(0.3 + Math.log10(1 + frp) * 0.35, 0.3), 0.9);
  return zoom <= 4 ? a * 0.6 : a;
}

// One pre-rendered glow, stamped with drawImage: a world view has tens of thousands of
// points, and a gradient per point is too slow to redraw on every pan
const SPRITE_SIZE = 64;
let sprite = null;
function glowSprite() {
  if (!sprite) {
    sprite = document.createElement("canvas");
    sprite.width = sprite.height = SPRITE_SIZE;
    const ctx = sprite.getContext("2d");
    const c = SPRITE_SIZE / 2;
    const glow = ctx.createRadialGradient(c, c, 0, c, c, c);
    glow.addColorStop(0, "rgba(255, 236, 170, 1)");
    glow.addColorStop(0.25, "rgba(255, 140, 50, 0.8)");
    glow.addColorStop(1, "rgba(240, 70, 20, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  }
  return sprite;
}

const FiresCanvas = L.Layer.extend({
  initialize(date) {
    this._window = fireWindowForDate(date);
    this._fires = [];
    this._request = 0;
  },

  onAdd(map) {
    this._canvas = L.DomUtil.create("canvas", "fires-canvas");
    this._canvas.style.pointerEvents = "none";
    map.getPane(PANE).appendChild(this._canvas);
    map.on("moveend", this._update, this);
    map.on("zoomstart", this._hide, this);
    map.on("resize", this._redraw, this);
    this._update();
  },

  onRemove(map) {
    map.off("moveend", this._update, this);
    map.off("zoomstart", this._hide, this);
    map.off("resize", this._redraw, this);
    this._canvas.remove();
    this._request++;
  },

  setDate(date) {
    this._window = fireWindowForDate(date);
    this._update();
  },

  _hide() {
    this._canvas.style.visibility = "hidden";
  },

  async _update() {
    const map = this._map;
    if (!map) return;
    this._redraw(); // keep the known points while new tiles load
    const request = ++this._request;
    const { days, from, to } = this._window;
    const tiles = tilesForBounds(map.getBounds(), tileLevel(map.getZoom()));
    const urls = [];
    for (const name of layersForZoom(map.getZoom())) {
      for (const day of days) tiles.forEach((tile) => urls.push(tileUrl(name, day, tile)));
    }
    const lists = await Promise.all(urls.map(cachedTile));
    if (request !== this._request) return; // a newer view or date took over
    const seen = new Set();
    this._fires = lists
      .flat()
      .filter((f) => f.time >= from && f.time < to && !seen.has(f.id) && seen.add(f.id))
      .sort((a, b) => a.frp - b.frp); // strongest drawn last, on top
    this._redraw();
  },

  _redraw() {
    const map = this._map;
    if (!map) return;
    const size = map.getSize();
    const ratio = window.devicePixelRatio || 1;
    const canvas = this._canvas;
    L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]));
    canvas.width = size.x * ratio;
    canvas.height = size.y * ratio;
    canvas.style.width = `${size.x}px`;
    canvas.style.height = `${size.y}px`;
    canvas.style.visibility = "visible";

    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    const zoom = map.getZoom();
    const bounds = map.getBounds().pad(0.05);
    const glow = glowSprite();
    for (const f of this._fires) {
      if (!bounds.contains([f.lat, f.lng])) continue;
      const { x, y } = map.latLngToContainerPoint([f.lat, f.lng]);
      const d = radiusFor(f.frp, zoom) * 4;
      ctx.globalAlpha = alphaFor(f.frp, zoom);
      ctx.drawImage(glow, x - d / 2, y - d / 2, d, d);
    }
  },
});

function ensurePane(map) {
  if (!map.getPane(PANE)) {
    // above the dust layer (350), below markers/overlays (400)
    const pane = map.createPane(PANE);
    pane.style.zIndex = 360;
    pane.style.pointerEvents = "none";
  }
}

function createLegend() {
  const c = cfg();
  const control = L.control({ position: "bottomright" });
  control.onAdd = () => {
    const div = L.DomUtil.create("div", "fires-legend");
    div.innerHTML = `
      <div class="fires-legend-title">
        <span class="fires-legend-dot"></span> Active fires <span class="fires-legend-time"></span>
      </div>
      <div class="fires-legend-attr">${c.attribution}</div>
    `;
    return div;
  };
  control.setDate = (date) => {
    const el = control.getContainer()?.querySelector(".fires-legend-time");
    if (el) el.textContent = !date || date >= isoDay(Date.now()) ? "last 24 h" : date;
  };
  return control;
}

/**
 * Shows, hides or redates the fires layer.
 * @param {L.Map} map
 * @param {boolean} enabled
 * @param {string} date - map date, YYYY-MM-DD
 */
export function switchFiresLayer(map, enabled, date) {
  if (!map || !cfg()) return;

  if (!enabled || !isFiresAvailable(date)) {
    destroyFiresLayer(map);
    return;
  }

  ensurePane(map);
  if (!layer) {
    layer = new FiresCanvas(date);
    map.addLayer(layer);
  } else {
    layer.setDate(date);
  }

  if (!legendControl) {
    legendControl = createLegend();
    legendControl.addTo(map);
  }
  legendControl.setDate(date);
}

/**
 * Removes the layer and its legend.
 * @param {L.Map} [map]
 */
export function destroyFiresLayer(map) {
  if (layer && map?.hasLayer(layer)) map.removeLayer(layer);
  if (legendControl) legendControl.remove();
  layer = null;
  legendControl = null;
}
