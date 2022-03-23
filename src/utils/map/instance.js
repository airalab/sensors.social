import L from "leaflet";
import "leaflet/dist/leaflet.css";

let map;
export function instanceMap() {
  if (map) {
    return map;
  }
  throw new Error("Must be initialized before using the mapd.");
}

export function init(position, zoom) {
  map = L.map("map");
  map.setView(position, zoom);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a rel="nofollow" href="https://osm.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
  map.zoomControl.setPosition("bottomright");
  return map;
}
