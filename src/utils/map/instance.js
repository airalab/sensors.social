import L from "leaflet";
import "leaflet-active-area";
import "leaflet.locatecontrol";
import "leaflet.locatecontrol/dist/L.Control.Locate.min.css";
import "leaflet.tilelayer.colorfilter";
import "leaflet/dist/leaflet.css";

let map;
const attrs = {
  attribution:
    '&copy; <a rel="nofollow" href="https://osm.org/copyright">OpenStreetMap</a> contributors',
};

const layerMapLight = L.tileLayer.colorFilter(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    ...attrs,
    filter: ["grayscale:50%", "saturate:70%"],
  }
);
const layerMapDark = L.tileLayer.colorFilter(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    ...attrs,
    filter: [
      "invert:100%",
      "grayscale:100%",
      "bright:100%",
      "saturate:0%",
      "sepia:10%",
    ],
  }
);

export function instanceMap() {
  if (map) {
    return map;
  }
  throw new Error("Must be initialized before using the mapd.");
}

export function init(position, zoom, theme = "light") {
  map = L.map("map", { minZoom: 3 });
  setTheme(theme);
  map.attributionControl.setPrefix("");
  map.setView(position, zoom);
  L.control
    .locate({
      position: "bottomright",
      strings: {
        title: "Show my location",
      },
    })
    .addTo(map);
  map.zoomControl.remove();
  return map;
}

export function setTheme(theme) {
  const map = instanceMap();
  if (theme === "light") {
    map.removeLayer(layerMapDark);
    map.addLayer(layerMapLight);
  } else {
    map.removeLayer(layerMapLight);
    map.addLayer(layerMapDark);
  }
}
