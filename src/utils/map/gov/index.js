/**
 * Government stations layer — reference monitors of national air-quality networks, shown next to
 * the Altruist sensors for comparison. First source: Cyprus, Department of Labour Inspection (DLI).
 *
 * The data are public and republished as is. RoSeMAN reads the official sites (they have no API
 * and no CORS) in its optional gov-stations module and serves GET /api/v2/gov/stations →
 * { result: [{ id, publisher, url, country, note, stations: [{ id, name, kind, lat, lng, approx?,
 * timestamp, values: { pm25, pm10, no2, o3, so2, co, … } }] }] }, μg/m³, hourly means.
 *
 * The layer is a plain L.layerGroup of its own, apart from the sensor clusters: stations do not
 * merge with sensors, do not open the sensor card, and keep their own icon. The marker colour is the
 * map's PM2.5 zone (PM10 when the station has no PM2.5), grey when the reading is over 3 h old.
 * Gases are listed in μg/m³ as published, without colour: the map's gas scales are in ppb/ppm.
 *
 * Config (`settings.GOV_STATIONS`): { url, refreshMinutes }
 */

import L from "leaflet";
import { settings } from "@config";
import { i18n } from "../../../plugins/i18n";
import { getColorForValue } from "../sensors/colors";
import { icon as faIcon } from "@fortawesome/fontawesome-svg-core";
import { faLandmark } from "@fortawesome/free-solid-svg-icons";

const PANE = "govStationsPane";
const STALE_S = 3 * 3600;
const PREF_KEY = "govStations";
const LANDMARK = faIcon(faLandmark).html.join("");

let group = null;
let timer = null;

const t = (key, args) => i18n.global.t(key, args);
const cfg = () => settings.GOV_STATIONS || null;

const escapeHtml = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

const VALUE_ROWS = [
  ["pm25", "PM2.5"],
  ["pm10", "PM10"],
  ["no2", "NO₂"],
  ["o3", "O₃"],
  ["so2", "SO₂"],
  ["co", "CO"],
  ["c6h6", "C₆H₆"],
];

function markerColor(station, nowS) {
  if (!station.timestamp || nowS - station.timestamp > STALE_S) return getColorForValue(null);
  const v = station.values || {};
  if (Number.isFinite(v.pm25)) return getColorForValue(v.pm25, "pm25");
  if (Number.isFinite(v.pm10)) return getColorForValue(v.pm10, "pm10");
  return getColorForValue(null);
}

function icon(color) {
  return L.divIcon({
    className: "gov-station-marker",
    html: `<span class="gov-station-badge" style="--gov-color:${color}">${LANDMARK}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

function popupHtml(station, source, nowS) {
  const locale = i18n.global.locale.value;
  const v = station.values || {};
  const rows = VALUE_ROWS.filter(([k]) => Number.isFinite(v[k]))
    .map(([k, label]) => {
      const colored = k === "pm25" || k === "pm10";
      const dot = colored
        ? `<span class="gov-dot" style="background:${getColorForValue(v[k], k)}"></span>`
        : `<span class="gov-dot gov-dot-empty"></span>`;
      return `<tr><td>${dot}${label}</td><td class="gov-val">${v[k]}</td></tr>`;
    })
    .join("");
  const when = station.timestamp
    ? new Date(station.timestamp * 1000).toLocaleString(locale, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
  const stale =
    station.timestamp && nowS - station.timestamp > STALE_S
      ? ` <span class="gov-stale">${t("gov.stale")}</span>`
      : "";
  return `
    <div class="gov-popup">
      <div class="gov-popup-kicker">${LANDMARK} ${t("gov.kicker")}</div>
      <div class="gov-popup-title">${escapeHtml(station.name)}</div>
      <table class="gov-popup-values">
        <thead><tr><th></th><th>μg/m³</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="2">${t("gov.noValues")}</td></tr>`}</tbody>
      </table>
      <div class="gov-popup-time">${t("gov.hourly", { time: when })}${stale}</div>
      ${station.approx ? `<div class="gov-popup-note">${t("gov.approx")}</div>` : ""}
      <div class="gov-popup-source">
        ${t("gov.source")}
        <a href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${escapeHtml(
    source.publisher
  )}</a>
      </div>
    </div>`;
}

// The site header and the map controls float over the map: pan a popup clear of both
function popupPadding() {
  const top = document.querySelector("header")?.getBoundingClientRect().bottom || 0;
  const controls = document.querySelector(".mapcontrols")?.getBoundingClientRect();
  const bottom = controls ? window.innerHeight - controls.top : 0;
  return {
    autoPanPaddingTopLeft: L.point(16, top + 16),
    autoPanPaddingBottomRight: L.point(16, bottom + 16),
  };
}

function ensurePane(map) {
  if (!map.getPane(PANE)) {
    // above sensor markers (600), below popups (700)
    map.createPane(PANE).style.zIndex = 640;
  }
}

async function refresh() {
  if (!group) return;
  let sources = [];
  try {
    const res = await fetch(cfg().url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    sources = (await res.json()).result || [];
  } catch (e) {
    console.error("Government stations:", e);
    return;
  }
  if (!group) return;
  group.clearLayers();
  const nowS = Date.now() / 1000;
  for (const source of sources) {
    for (const st of source.stations || []) {
      if (!Number.isFinite(st.lat) || !Number.isFinite(st.lng)) continue;
      L.marker([st.lat, st.lng], {
        icon: icon(markerColor(st, nowS)),
        pane: PANE,
        title: st.name,
        keyboard: true,
      })
        .bindPopup(popupHtml(st, source, nowS), {
          className: "gov-popup-wrap",
          maxWidth: 280,
          ...popupPadding(),
        })
        .addTo(group);
    }
  }
}

export function readGovPref() {
  try {
    return localStorage.getItem(PREF_KEY) === "true";
  } catch {
    return false;
  }
}

export function saveGovPref(enabled) {
  try {
    localStorage.setItem(PREF_KEY, String(enabled));
  } catch {
    // no storage: the toggle still works for this visit
  }
}

/**
 * Shows or hides the government stations layer.
 * @param {L.Map} map
 * @param {boolean} enabled
 */
export function switchGovLayer(map, enabled) {
  if (!map || !cfg()) return;
  if (!enabled) {
    destroyGovLayer(map);
    return;
  }
  if (group) return;
  ensurePane(map);
  group = L.layerGroup().addTo(map);
  refresh();
  timer = setInterval(refresh, (cfg().refreshMinutes || 15) * 60e3);
}

/**
 * Removes the layer and stops its refresh.
 * @param {L.Map} [map]
 */
export function destroyGovLayer(map) {
  if (timer) clearInterval(timer);
  timer = null;
  if (group && map?.hasLayer(group)) map.removeLayer(group);
  group = null;
}
