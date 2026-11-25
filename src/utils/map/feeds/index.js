/**
 * Public data feeds — government air quality stations — served by RoSeMAN apart from our devices
 * (GET api/v2/feeds*). Nothing is requested until a visitor zooms in far enough (FEEDS.minZoom) over an
 * area that has stations and says "show": then that area's markers join the map as government stations.
 *
 * An area is what a visitor switches on in one go: a national network (Belgium), or a region of a network
 * that spans several (a U.S. state). The answer is remembered per area in localStorage, "feeds.area.<id>".
 */
import { ref } from "vue";
import { settings } from "@config";

const CHOICE_PREFIX = "feeds.area.";
const LAYER_KEY = "feeds";

export const feedsConfig = settings.FEEDS || null;

function readLayer() {
  try {
    const v = localStorage.getItem(LAYER_KEY);
    return v === "true" ? true : v === "false" ? false : null;
  } catch {
    return null;
  }
}

/**
 * The footer toggle "Gov. stations" (like Fires): false = no government stations and no prompts; true = the
 * areas switched on are shown and new ones are asked about; null = never touched (shown off, prompts on).
 * "Show" in a prompt turns it on.
 */
export const feedsLayer = ref(readLayer());

export function setFeedsLayer(on) {
  feedsLayer.value = on;
  try {
    localStorage.setItem(LAYER_KEY, String(on));
  } catch {
    /* private mode: lasts this visit only */
  }
}

function api() {
  return feedsConfig?.api || settings.REMOTE_PROVIDER;
}

/** "on" | "off" | null (not asked yet) */
export function areaChoice(areaId) {
  try {
    const v = localStorage.getItem(CHOICE_PREFIX + areaId);
    return v === "on" || v === "off" ? v : null;
  } catch {
    return null;
  }
}

export function setAreaChoice(areaId, choice) {
  try {
    localStorage.setItem(CHOICE_PREFIX + areaId, choice);
  } catch {
    /* private mode: the answer lasts this visit only */
  }
}

let catalog = null;

/** Feeds and their areas (cached for the page's life; a failure is retried on the next call). */
export function loadCatalog() {
  if (!catalog) {
    catalog = fetch(`${api()}api/v2/feeds`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`feeds ${res.status}`))))
      .then(({ result, cellDeg }) =>
        (result || []).flatMap((feed) =>
          (feed.areas || []).map((area) => ({ ...area, feed, cellDeg: cellDeg || 0.5 }))
        )
      )
      .catch((e) => {
        catalog = null;
        console.error("Feeds catalog:", e);
        return [];
      });
  }
  return catalog;
}

const cellsInView = (area, bounds) => {
  const d = area.cellDeg;
  const w = bounds.getWest();
  const e = bounds.getEast();
  const s = bounds.getSouth();
  const n = bounds.getNorth();
  return (area.cells || []).filter(
    ([i, j]) => i * d <= n && (i + 1) * d >= s && j * d <= e && (j + 1) * d >= w
  );
};

/** Areas with a station cell (catalog `cells`) inside the map's bounds (Leaflet LatLngBounds). */
export function areasInView(areas, bounds) {
  return areas.filter((area) => cellsInView(area, bounds).length > 0);
}

/**
 * Areas to ask about, best first: the one with a station nearest the map's centre. Station cells, not the
 * bbox: a country's bbox reaches over its neighbours (the Netherlands' covers Brussels).
 */
export function rankForPrompt(areas, bounds) {
  const c = bounds.getCenter();
  const kx = Math.cos((c.lat * Math.PI) / 180);
  const nearest = (area) =>
    Math.min(
      ...cellsInView(area, bounds).map(([i, j]) =>
        Math.hypot(((j + 0.5) * area.cellDeg - c.lng) * kx, (i + 0.5) * area.cellDeg - c.lat)
      )
    );
  return areas
    .map((area) => ({ area, d: nearest(area) }))
    .filter(({ d }) => Number.isFinite(d))
    .sort((a, b) => a.d - b.d)
    .map(({ area }) => area);
}

/** The area's stations with their newest and highest hour in [from, to]; window capped at 7 days by the API. */
export async function areaMarkers(areaId, from, to) {
  const span = Math.min(to - from, 7 * 86400);
  const res = await fetch(
    `${api()}api/v2/feeds/areas/${encodeURIComponent(areaId)}/markers?from=${to - span}&to=${to}`
  );
  if (!res.ok) throw new Error(`feed area ${areaId}: ${res.status}`);
  return (await res.json()).result || [];
}

/** A station's hours in the shape of api/v2/sensor/{id}/{start}/{end}, for the sensor card. */
export async function stationHistoryAsSensorPayload(id, from, to, geo) {
  const res = await fetch(
    `${api()}api/v2/feeds/stations/${encodeURIComponent(id)}/history?from=${from}&to=${to}`
  );
  if (!res.ok) return { result: [], sensor: null };
  const { result } = await res.json();
  // a plain copy: the position may come from a reactive object, which IndexedDB cannot store
  const at = geo ? { lat: Number(geo.lat), lng: Number(geo.lng) } : null;
  return {
    result: (result || []).map((r) => ({ data: r.values, timestamp: r.timestamp, geo: at })),
    sensor: null,
  };
}

/** A marker of the API → a row of the map's sensor list, drawn and opened like any sensor. */
export function markerToSensorRow(marker, areaId) {
  return {
    sensor_id: marker.id,
    model: 2,
    geo: { lat: marker.lat, lng: marker.lng },
    device_model: "gov",
    donated_by: "",
    owner: "",
    sensors: [],
    timestamp: marker.timestamp,
    maxdata: { ...marker.max },
    data: { ...marker.latest },
    feed: areaId,
  };
}
