/**
 * Aerosol optical depth (AOD) layer — dust over the whole air column, from CAMS
 * (Copernicus Atmosphere Monitoring Service) via the ECMWF WMS.
 *
 * Ground sensors show what is in the air at street level; this layer shows where a large
 * dust mass is and where it is heading. The WMS has a `time` dimension in 3 h steps from
 * ~5 days back to ~5 days of forecast, so the layer follows the date picked on the map.
 *
 * Config (`settings.AOD_WMS`): { url, layer, style, opacity, alphaBoost, daysBack, attribution }
 */

import L from "leaflet";
import { settings } from "@config";

const PANE = "aodPane";
const STEP_HOURS = 3;

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

// The WMS palette fades light dust (AOD 0.1–0.3) almost to nothing. An SVG filter
// multiplies tile alpha so a light plume stays visible while the palette is kept.
function ensureAlphaBoostFilter(boost) {
  const id = "aod-alpha-boost";
  if (!document.getElementById(id)) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.position = "absolute";
    svg.innerHTML = `<filter id="${id}" color-interpolation-filters="sRGB">
      <feComponentTransfer><feFuncA type="linear" slope="${boost}" /></feComponentTransfer>
    </filter>`;
    document.body.appendChild(svg);
  }
  return `url(#${id})`;
}

function ensurePane(map) {
  if (!map.getPane(PANE)) {
    // between base tiles (200) and markers/overlays (400)
    const pane = map.createPane(PANE);
    pane.style.zIndex = 350;
    pane.style.pointerEvents = "none";
    const boost = cfg().alphaBoost ?? 1;
    if (boost !== 1) pane.style.filter = ensureAlphaBoostFilter(boost);
  }
}

function createLegend() {
  const c = cfg();
  const control = L.control({ position: "bottomright" });
  control.onAdd = () => {
    const div = L.DomUtil.create("div", "aod-legend");
    div.innerHTML = `
      <div class="aod-legend-title">Dust AOD <span class="aod-legend-time"></span></div>
      <div class="aod-legend-scale"></div>
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

  if (!aodLayer) {
    aodLayer = L.tileLayer.wms(c.url, {
      layers: c.layer,
      styles: c.style,
      format: "image/png",
      transparent: true,
      version: "1.3.0",
      time,
      opacity: c.opacity ?? 1,
      pane: PANE,
      attribution: c.attribution,
    });
    map.addLayer(aodLayer);
  } else if (aodLayer.wmsParams.time !== time) {
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
