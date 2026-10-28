/**
 * Aerosol optical depth (AOD) layer — dust and smoke over the whole air column, from CAMS
 * (Copernicus Atmosphere Monitoring Service) via the ECMWF WMS.
 *
 * Ground sensors show what is in the air at street level; this layer shows where a large
 * dust mass or smoke plume is and where it is heading. The WMS has a `time` dimension in
 * 3 h steps from ~5 days back to ~5 days of forecast, so the layer follows the map date.
 *
 * Dust and smoke (biomass burning AOD) are two WMS layers merged into one tile layer,
 * smoke on top. For each tile both WMS images are loaded, adjusted once in a canvas — alpha
 * boosted, and a source with a `ramp` recoloured, because the WMS offers only orange and
 * rainbow palettes — and composited into a single image. A CSS/SVG filter on the pane did
 * the same, but Chrome re-ran it on every frame of a pan: 30 fps with one filtered layer,
 * 15 fps with two. One merged image per tile also halves the semi-transparent area the
 * browser has to blend while panning.
 *
 * Config (`settings.AOD_WMS`):
 *   { url, layers: [{ key, layer, ramp? }], style, opacity, alphaBoost, daysBack, attribution }
 *   ramp — 5 colours from dense (dark) to light
 */

import L from "leaflet";
import { settings } from "@config";

const PANE = "aodPane";
const STEP_HOURS = 3;

/** @type {L.TileLayer.WMS | null} */
let aodLayer = null;
let legendControl = null;

function cfg() {
  return settings.AOD_WMS || null;
}

/**
 * WMS time for a map date (YYYY-MM-DD): the latest 3 h step for today,
 * 09:00 UTC (midday in the East Mediterranean) for past days.
 * @param {string} date
 * @returns {string} ISO time, e.g. 2026-10-11T09:00:00Z
 */
export function aodTimeForDate(date) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  if (!date || date >= today) {
    const h = Math.floor(now.getUTCHours() / STEP_HOURS) * STEP_HOURS;
    return `${today}T${String(h).padStart(2, "0")}:00:00Z`;
  }
  return `${date}T09:00:00Z`;
}

/**
 * The WMS keeps only the last few days of analysis — older dates render empty.
 * @param {string} date - YYYY-MM-DD
 * @returns {boolean}
 */
export function isAodAvailable(date) {
  const c = cfg();
  if (!c) return false;
  const oldest = new Date(Date.now() - (c.daysBack ?? 4) * 86400e3).toISOString().slice(0, 10);
  return !date || date >= oldest;
}

function aodLayerDefs() {
  const c = cfg();
  return c?.layers?.length ? c.layers : [];
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Luminance (0–255) → RGB lookup over the ramp, as an SVG feFuncR/G/B "table" would do.
// The orange palette goes from light to dark as AOD grows, so the ramp keeps that order.
function rampLut(ramp) {
  const stops = ramp.map(hexToRgb);
  const lut = new Uint8ClampedArray(256 * 3);
  const segments = stops.length - 1;
  for (let i = 0; i < 256; i++) {
    const pos = (i / 255) * segments;
    const k = Math.min(Math.floor(pos), segments - 1);
    const f = pos - k;
    for (let ch = 0; ch < 3; ch++) {
      lut[i * 3 + ch] = stops[k][ch] + (stops[k + 1][ch] - stops[k][ch]) * f;
    }
  }
  return lut;
}

// The WMS palette fades light dust (AOD 0.1–0.3) almost to nothing, so tile alpha is
// multiplied to keep a light plume visible.
function adjustPixels(px, boost, lut) {
  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3];
    if (a === 0) continue;
    px[i + 3] = a * boost;
    if (lut) {
      const l = Math.round(0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) * 3;
      px[i] = lut[l];
      px[i + 1] = lut[l + 1];
      px[i + 2] = lut[l + 2];
    }
  }
}

// Pixels are read, so tiles are fetched in CORS mode. The WMS redirects to a PNG that it
// serves without CORS headers to a request without Origin, and the browser keeps it for
// years: a tile an <img> already loaded would fail here. Such a request is retried once
// past the HTTP cache.
async function loadImage(url) {
  let res;
  try {
    res = await fetch(url, { mode: "cors" });
  } catch {
    res = await fetch(url, { mode: "cors", cache: "reload" });
  }
  if (!res.ok) throw new Error(`AOD tile HTTP ${res.status}`);
  return createImageBitmap(await res.blob());
}

function drawAdjusted(ctx, img, boost, lut) {
  const tmp = document.createElement("canvas");
  tmp.width = ctx.canvas.width;
  tmp.height = ctx.canvas.height;
  const tctx = tmp.getContext("2d", { willReadFrequently: true });
  tctx.drawImage(img, 0, 0, tmp.width, tmp.height);
  const data = tctx.getImageData(0, 0, tmp.width, tmp.height);
  adjustPixels(data.data, boost, lut);
  tctx.putImageData(data, 0, 0);
  ctx.drawImage(tmp, 0, 0);
}

const AodTileLayer = L.TileLayer.WMS.extend({
  // declared here so L.TileLayer.WMS does not send them to the server as WMS params
  options: { sources: [], boost: 1 },

  createTile(coords, done) {
    const size = this.getTileSize();
    const tile = document.createElement("canvas");
    tile.width = size.x;
    tile.height = size.y;
    const base = this.getTileUrl(coords);
    const first = `layers=${encodeURIComponent(this.wmsParams.layers)}`;
    const { sources, boost } = this.options;
    Promise.allSettled(
      sources.map((src) =>
        loadImage(base.replace(first, `layers=${encodeURIComponent(src.layer)}`))
      )
    ).then((results) => {
      if (!results.some((r) => r.status === "fulfilled")) return done(results[0].reason, tile);
      const ctx = tile.getContext("2d");
      results.forEach((r, i) => {
        if (r.status !== "fulfilled") return;
        drawAdjusted(ctx, r.value, boost, sources[i].lut);
        r.value.close();
      });
      done(null, tile);
    });
    return tile;
  },
});

function ensurePane(map) {
  if (!map.getPane(PANE)) {
    // between base tiles (200) and markers/overlays (400)
    const pane = map.createPane(PANE);
    pane.style.zIndex = 350;
    pane.style.pointerEvents = "none";
  }
}

function createLegend() {
  const c = cfg();
  const control = L.control({ position: "bottomright" });
  control.onAdd = () => {
    const div = L.DomUtil.create("div", "aod-legend");
    const rows = aodLayerDefs()
      .map((def) => {
        const style = def.ramp
          ? ` style="background: linear-gradient(to right, ${[...def.ramp].reverse().join(", ")})"`
          : "";
        return `<div class="aod-legend-row"><span class="aod-legend-name">${
          def.key[0].toUpperCase() + def.key.slice(1)
        }</span><div class="aod-legend-scale"${style}></div></div>`;
      })
      .join("");
    div.innerHTML = `
      <div class="aod-legend-title">AOD <span class="aod-legend-time"></span></div>
      ${rows}
      <div class="aod-legend-labels"><span>0.1</span><span>0.5</span><span>1+</span></div>
      <div class="aod-legend-attr">${c.attribution}</div>
    `;
    return div;
  };
  control.setTime = (t) => {
    const el = control.getContainer()?.querySelector(".aod-legend-time");
    if (el) el.textContent = `${t.slice(0, 10)} ${t.slice(11, 16)} UTC`;
  };
  return control;
}

/**
 * Shows, hides or retimes the AOD layer.
 * @param {L.Map} map
 * @param {boolean} enabled
 * @param {string} date - map date, YYYY-MM-DD
 */
export function switchAodLayer(map, enabled, date) {
  const c = cfg();
  if (!map || !c) return;

  if (!enabled || !isAodAvailable(date)) {
    destroyAodLayer(map);
    return;
  }

  const time = aodTimeForDate(date);
  ensurePane(map);

  const defs = aodLayerDefs();
  if (!aodLayer && defs.length) {
    aodLayer = new AodTileLayer(c.url, {
      layers: defs[0].layer,
      styles: c.style,
      format: "image/png",
      transparent: true,
      version: "1.3.0",
      time,
      opacity: c.opacity ?? 1,
      maxNativeZoom: c.maxNativeZoom ?? 6,
      pane: PANE,
      attribution: c.attribution,
      sources: defs.map((def) => ({ layer: def.layer, lut: def.ramp ? rampLut(def.ramp) : null })),
      boost: c.alphaBoost ?? 1,
    });
    map.addLayer(aodLayer);
  } else if (aodLayer && aodLayer.wmsParams.time !== time) {
    aodLayer.setParams({ time });
  }

  if (!legendControl) {
    legendControl = createLegend();
    legendControl.addTo(map);
  }
  legendControl.setTime(time);
}

/**
 * Removes the layer and its legend.
 * @param {L.Map} [map]
 */
export function destroyAodLayer(map) {
  if (aodLayer && map?.hasLayer(aodLayer)) map.removeLayer(aodLayer);
  if (legendControl) legendControl.remove();
  aodLayer = null;
  legendControl = null;
}
