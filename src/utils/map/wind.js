import L from "leaflet";
import "leaflet-velocity";
import "leaflet-velocity/dist/leaflet-velocity.css";
import axios from "axios";
import config from "../../config";

export const immediate = false;

const WindControl = L.Control.extend({
  initialize: function (layer) {
    this.layer = layer;
  },
  options: {
    position: "topleft",
  },
  onAdd: function (map) {
    var container = L.DomUtil.create("button", "leaflet-control-button");
    container.textContent = "Wind";
    container.style.padding = "11px";
    container.style.backgroundColor = immediate ? "#eee" : "#fff";
    container.style.border = "1px solid #a2a2a2";
    container.style.borderRadius = "2px";
    container.style.cursor = "pointer";
    container.style.boxShadow = "0 1px 5px rgb(0 0 0 / 20%)";
    container.style.fontWeight = "bold";
    if (immediate) {
      map.addLayer(this.layer);
    }
    container.onclick = () => {
      if (map.hasLayer(this.layer)) {
        map.removeLayer(this.layer);
        container.style.backgroundColor = "#fff";
      } else {
        map.addLayer(this.layer);
        container.style.backgroundColor = "#eee";
      }
    };
    return container;
  },
});

let windLayer;
let windControl;

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
    windControl = new WindControl(windLayer).setPosition("bottomright");
  });
}

export function switchControl(map, enabled = false) {
  if (windControl) {
    if (enabled) {
      map.addControl(windControl);
    } else {
      map.removeControl(windControl);
    }
  }
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

export function switchWind(map, enabled = false) {
  switchLayer(map, enabled);
  switchControl(map, enabled);
}
