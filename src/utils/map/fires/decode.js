/**
 * Fetches one GIBS fires vector tile and packs its detections into typed arrays,
 * so a worker can hand them to the page without copying (transferable buffers).
 *
 * Tiles overlap by a buffer, so a detection near an edge comes in two neighbouring
 * tiles. Each tile keeps only the points inside its own extent — no duplicates.
 */

import { VectorTile } from "@mapbox/vector-tile";
import Pbf from "pbf";

// GIBS EPSG:4326 "500m" matrix set: level 0 tile spans 288°
export const TOP_TILE_DEG = 288;

/**
 * @param {string} url
 * @param {{ level: number, row: number, col: number }} tile
 * @returns {Promise<{ lat: Float32Array, lng: Float32Array, frp: Float32Array, time: Float64Array }>}
 */
export async function fetchFireTile(url, { level, row, col }) {
  const res = await fetch(url);
  if (res.status === 404) return packFires([]); // no detections in this tile
  if (!res.ok) throw new Error(`fires tile ${res.status}`);

  const deg = TOP_TILE_DEG / 2 ** level;
  const west = -180 + col * deg;
  const north = 90 - row * deg;

  const tile = new VectorTile(new Pbf(await res.arrayBuffer()));
  const fires = [];
  for (const layer of Object.values(tile.layers)) {
    for (let i = 0; i < layer.length; i++) {
      const p = layer.feature(i).properties;
      if (p.CONFIDENCE === "low") continue;
      const { LATITUDE: lat, LONGITUDE: lng } = p;
      if (lng < west || lng >= west + deg || lat > north || lat <= north - deg) continue;
      const t = String(p.ACQ_TIME).padStart(5, "0");
      fires.push([lat, lng, Number(p.FRP) || 0, Date.parse(`${p.ACQ_DATE}T${t}:00Z`)]);
    }
  }
  return packFires(fires);
}

function packFires(fires) {
  const n = fires.length;
  const packed = {
    lat: new Float32Array(n),
    lng: new Float32Array(n),
    frp: new Float32Array(n),
    time: new Float64Array(n),
  };
  fires.forEach(([lat, lng, frp, time], i) => {
    packed.lat[i] = lat;
    packed.lng[i] = lng;
    packed.frp[i] = frp;
    packed.time[i] = time;
  });
  return packed;
}
