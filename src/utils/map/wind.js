import L from "leaflet";
import "leaflet-velocity";
import "leaflet-velocity/dist/leaflet-velocity.css";
import axios from "axios";
import config from "../../config";

export const immediate = false;

let windLayer;

export function init() {
  return axios.get(config.WIND_PROVIDER).then((r) => {
    windLayer = L.velocityLayer({
      displayValues: false,
      data: r.data,
      maxVelocity: 15,
      velocityScale: 0.01,
      colorScale: [
        "rgb(60,157,194)",
        "rgb(128,205,193)",
        "rgb(250,112,52)",
        "rgb(245,64,32)",
      ],
    });
  });
}

export function switchLayer(map, enabled = false) {
  if (windLayer) {
    if (enabled) {
      map.addLayer(windLayer);
    } else {
      map.removeLayer(windLayer);
    }
  }
}
