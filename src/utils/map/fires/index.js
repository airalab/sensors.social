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
 * satellites from `overviewMaxZoom + 1`. Tiles are decoded in a Web Worker (`tiles.worker.js`)
 * and come back as typed arrays; points are projected with plain Web Mercator math, so a
 * redraw of the world view stays within a frame or two.
 *
 * Config (`settings.FIRES`): { tiles, layers, overviewLayers, overviewMaxZoom, since, attribution }
 */

import L from "leaflet";
import { settings } from "@config";
import { TOP_TILE_DEG, fetchFireTile } from "./decode";

const PANE = "firesPane";
const DAY_MS = 86400e3;

let layer = null;
let legendControl = null;
const tileCache = new Map(); // url -> Promise<packed fires>

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

let worker = null;
let workerFailed = false;
let nextId = 0;
const pending = new Map(); // id -> { resolve, reject }

function getWorker() {
  if (!worker && !workerFailed) {
    try {
      worker = new Worker(new URL("./tiles.worker.js", import.meta.url), { type: "module" });
      worker.onmessage = ({ data: { id, fires, error } }) => {
        const p = pending.get(id);
        pending.delete(id);
        if (error) p?.reject(new Error(error));
        else p?.resolve(fires);
      };
    } catch (e) {
      workerFailed = true; // decode on the page instead
    }
  }
  return worker;
}

function loadTile(url, tile) {
  const w = getWorker();
  if (!w) return fetchFireTile(url, tile);
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    w.postMessage({ id, url, tile });
  });
}

function cachedTile(url, tile) {
  if (!tileCache.has(url)) {
    if (tileCache.size > 300) tileCache.clear();
    tileCache.set(
      url,
      loadTile(url, tile).catch((e) => {
        tileCache.delete(url);
        console.error("Failed to load fires tile:", e);
        return null;
      })
    );
  }
  return tileCache.get(url);
}

// Joins tiles into one set of arrays, keeping the detections inside the time window,
// ordered by FRP so the strongest fires are drawn last, on top
function mergeTiles(tiles, from, to) {
  const idx = [];
  tiles.forEach((t, ti) => {
    if (!t) return;
    for (let i = 0; i < t.time.length; i++) {
      if (t.time[i] >= from && t.time[i] < to) idx.push([t.frp[i], ti, i]);
    }
  });
  idx.sort((a, b) => a[0] - b[0]);
  const n = idx.length;
  const out = { lat: new Float32Array(n), lng: new Float32Array(n), frp: new Float32Array(n) };
  idx.forEach(([frp, ti, i], k) => {
    out.lat[k] = tiles[ti].lat[i];
    out.lng[k] = tiles[ti].lng[i];
    out.frp[k] = frp;
  });
  return out;
}

const EMPTY = { lat: [], lng: [], frp: [] };

// Glow radius in px: grows with FRP (MW) and with zoom
function radiusFor(frp, zoom) {
  const base = 1 + Math.log2(1 + frp) * 0.55;
  return base * Math.min(Math.max((zoom - 2) / 6, 0.25), 1.5);
}

// A weak field burn is a faint spark, a large fire a clear glow; zoomed out to a
// continent everything is dimmer, otherwise burning seasons cover the sensors
function alphaFor(frp, zoom) {
  const a = Math.min(Math.max(0.3 + Math.log10(1 + frp) * 0.35, 0.3), 0.9);
  return zoom <= 4 ? a * 0.6 : a;
}

// Points are rendered like a heatmap: each fire adds a soft round kernel to an intensity
// buffer, and a palette turns intensity into colour — dim orange at the rim, pale yellow
// where fires crowd. Tens of thousands of drawImage calls took ~0.8 s per redraw;
// writing the pixels directly takes a few tens of ms.
const kernels = new Map(); // radius (0.5 px steps) -> { size, values }

function kernelFor(radius) {
  const key = Math.max(1, Math.round(radius * 2)) / 2;
  if (!kernels.has(key)) {
    const reach = Math.ceil(key * 2);
    const size = reach * 2 + 1;
    const values = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const d = Math.hypot(x - reach, y - reach) / (key * 2);
        values[y * size + x] = d < 1 ? (1 - d) ** 2 : 0;
      }
    }
    kernels.set(key, { size, values });
  }
  return kernels.get(key);
}

let palette = null;
function glowPalette() {
  if (!palette) {
    palette = new Uint8ClampedArray(256 * 4);
    const stops = [
      [0, [240, 70, 20]],
      [0.5, [255, 140, 50]],
      [1, [255, 236, 170]],
    ];
    for (let i = 0; i < 256; i++) {
      const t = i / 255;
      const k = t < 0.5 ? 0 : 1;
      const [t0, c0] = stops[k];
      const [t1, c1] = stops[k + 1];
      const f = (t - t0) / (t1 - t0);
      for (let c = 0; c < 3; c++) palette[i * 4 + c] = c0[c] + (c1[c] - c0[c]) * f;
      palette[i * 4 + 3] = Math.min(1, t * 2.4) * 235;
    }
  }
  return palette;
}

const FiresCanvas = L.Layer.extend({
  initialize(date) {
    this._window = fireWindowForDate(date);
    this._fires = EMPTY;
    this._firesKey = "";
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
    // The canvas moves with the map, so after a pan the old picture stays in place
    // while tiles load; after a zoom it was hidden and is redrawn right away
    if (this._canvas.style.visibility === "hidden") this._redraw();
    const request = ++this._request;
    const { days, from, to } = this._window;
    const tiles = tilesForBounds(map.getBounds(), tileLevel(map.getZoom()));
    const urls = [];
    const loads = [];
    for (const name of layersForZoom(map.getZoom())) {
      for (const day of days) {
        tiles.forEach((tile) => {
          const url = tileUrl(name, day, tile);
          urls.push(url);
          loads.push(cachedTile(url, tile));
        });
      }
    }
    const key = `${from}-${to}-${urls.join()}`;
    if (key !== this._firesKey) {
      const packed = await Promise.all(loads);
      if (request !== this._request) return; // a newer view or date took over
      this._fires = mergeTiles(packed, from, to);
      this._firesKey = key;
    }
    this._redraw();
  },

  _redraw() {
    const map = this._map;
    if (!map) return;
    const size = map.getSize();
    const w = size.x;
    const h = size.y;
    const canvas = this._canvas;
    L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]));
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.style.visibility = "visible";

    const zoom = map.getZoom();
    const acc = new Float32Array(w * h);
    // Web Mercator by hand: latLngToContainerPoint allocates objects for every point
    const scale = 256 * 2 ** zoom;
    const origin = map.getPixelBounds().min;
    const { lat, lng, frp } = this._fires;
    for (let i = 0; i < lat.length; i++) {
      const px = Math.round(((lng[i] + 180) / 360) * scale - origin.x);
      const sin = Math.sin((lat[i] * Math.PI) / 180);
      const py = Math.round(
        (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale - origin.y
      );
      const { size: k, values } = kernelFor(radiusFor(frp[i], zoom));
      const half = (k - 1) / 2;
      if (px + half < 0 || py + half < 0 || px - half >= w || py - half >= h) continue;
      const a = alphaFor(frp[i], zoom);
      for (let ky = 0; ky < k; ky++) {
        const y = py - half + ky;
        if (y < 0 || y >= h) continue;
        for (let kx = 0; kx < k; kx++) {
          const x = px - half + kx;
          if (x < 0 || x >= w) continue;
          const v = values[ky * k + kx] * a;
          if (v === 0) continue;
          const p = y * w + x;
          acc[p] += v * (1 - acc[p]); // "screen": crowded fires get brighter, never above 1
        }
      }
    }

    const pal = glowPalette();
    const image = new ImageData(w, h);
    const px = image.data;
    for (let p = 0; p < acc.length; p++) {
      if (acc[p] < 0.004) continue;
      const c = Math.round(acc[p] * 255) * 4;
      px[p * 4] = pal[c];
      px[p * 4 + 1] = pal[c + 1];
      px[p * 4 + 2] = pal[c + 2];
      px[p * 4 + 3] = pal[c + 3];
    }
    canvas.getContext("2d").putImageData(image, 0, 0);
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
