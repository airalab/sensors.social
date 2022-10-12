import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.locatecontrol";
import "leaflet.locatecontrol/dist/L.Control.Locate.min.css";
import "leaflet-active-area";

let map;
export function instanceMap() {
  if (map) {
    return map;
  }
  throw new Error("Must be initialized before using the mapd.");
}

export function init(position, zoom) {
  const layerMap = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution:
        '&copy; <a rel="nofollow" href="https://osm.org/copyright">OpenStreetMap</a> contributors',
    }
  );
  map = L.map("map", { layers: [layerMap] });
  map.setView(position, zoom);
  L.control
    .locate({
      position: "bottomright",
      strings: {
        title: "Show my location",
      },
    })
    .addTo(map);
  // map.zoomControl.setPosition("bottomright");
  map.zoomControl.remove();
  return map;
}
