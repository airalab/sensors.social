<template>
  <div id="map"></div>
</template>

<script>
import leaflet from "leaflet";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import generate, {
  getColor,
  getColorRGB,
  getColorDarken,
  getColorDarkenRGB,
} from "../utils/color";
import measurement from "../utils/measurement";
import "leaflet-arrowheads";
import Queue from "js-queue";
import sensors from "../sensors";
import config from "../config";
import axios from "axios";
import "leaflet-velocity";
import "leaflet-velocity/dist/leaflet-velocity.css";

delete leaflet.Icon.Default.prototype._getIconUrl;
leaflet.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

function getIcon(sensor_id, colorRgb) {
  if (sensors[sensor_id]) {
    return leaflet.divIcon({
      html: `<img src="${sensors[sensor_id].icon}" alt="" style="border: 3px solid rgba(${colorRgb}, 0.7);width: 40px; height: 40px; border-radius: 50%;">`,
      iconSize: [40, 40],
      className: "marker-icon",
    });
  }
  return false;
}
function getIconArrow(dir, speed, color) {
  return leaflet.divIcon({
    className: "",
    html: `<div class="icon-arrow-container" style="transform: rotate(${
      dir + 90
    }deg);">
      <div class="icon-arrow" style="border-color: ${color} ${color} transparent transparent;">
        <div style="background-color: ${color};"></div>
      </div>
      <div class="label-arrow"">${speed} m/s</div>
    </div>`,
    iconSize: new leaflet.Point(40, 40),
  });
}

let map;
let markers;
const windStart = false;
const queue = new Queue();

export default {
  props: ["zoom", "lat", "lng", "type", "availableWind"],
  data() {
    return {
      scale: null,
      windLayer: null,
      windControl: null,
    };
  },
  mounted() {
    const scaleParams = measurement(this.type);
    this.scale = generate(scaleParams.colors, scaleParams.range);

    map = leaflet.map("map").setView([this.lat, this.lng], this.zoom);
    leaflet
      .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a rel="nofollow" href="https://osm.org/copyright">OpenStreetMap</a> contributors',
      })
      .addTo(map);

    map.zoomControl.setPosition("bottomright");

    map.on("zoomend", (e) => {
      const pos = e.target.getCenter();
      this.$router.replace({
        name: "main",
        params: {
          provider: this.$route.params.provider || "ipfs",
          type: this.$route.params.type || "pm10",
          zoom: e.target.getZoom(),
          lat: pos.lat.toFixed(4),
          lng: pos.lng.toFixed(4),
        },
      });
    });
    map.on("moveend", (e) => {
      const pos = e.target.getCenter();
      this.$router
        .replace({
          name: "main",
          params: {
            provider: this.$route.params.provider || "ipfs",
            type: this.$route.params.type || "pm10",
            zoom: e.target.getZoom(),
            lat: pos.lat.toFixed(4),
            lng: pos.lng.toFixed(4),
          },
        })
        .catch(() => {});
    });

    const iconCreateFunction = (cluster) => {
      const markers = cluster.getAllChildMarkers();
      const childCount = cluster.getChildCount();
      let sum = 0;
      markers.forEach((marker) => {
        sum += Number(marker.options.data.value);
      });
      if (childCount > 0) {
        sum = sum / childCount;
      }
      const color = getColorRGB(this.scale, sum);
      const colorBorder = getColorDarkenRGB(this.scale, sum);
      const isDark = this.scale(sum).luminance() < 0.4;

      return new leaflet.DivIcon({
        html:
          "<div style='font-weight: bold;color:" +
          (isDark ? "#eee" : "#333") +
          ";background-color: rgba(" +
          color +
          ", 0.7);border-color: rgba(" +
          colorBorder +
          ", 1);border-width: 2px;border-style: solid;border-radius: 18px;'><span>" +
          childCount +
          "</span></div>",
        className: "marker-cluster",
        iconSize: new leaflet.Point(40, 40),
      });
    };

    markers = new leaflet.MarkerClusterGroup({
      showCoverageOnHover: false,
      // zoomToBoundsOnClick: false,
      maxClusterRadius: 120,
      iconCreateFunction: iconCreateFunction,
    });

    map.addLayer(markers);

    const WindControl = leaflet.Control.extend({
      initialize: function (layer) {
        this.layer = layer;
      },
      options: {
        position: "topleft",
      },
      onAdd: function (map) {
        var container = leaflet.DomUtil.create(
          "button",
          "leaflet-control-button"
        );
        container.textContent = "Wind";
        container.style.padding = "11px";
        container.style.backgroundColor = windStart ? "#eee" : "#fff";
        container.style.border = "1px solid #a2a2a2";
        container.style.borderRadius = "2px";
        container.style.cursor = "pointer";
        container.style.boxShadow = "0 1px 5px rgb(0 0 0 / 20%)";
        container.style.fontWeight = "bold";
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

    axios.get(config.WIND_PROVIDER).then((r) => {
      this.windLayer = leaflet.velocityLayer({
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
      if (windStart) {
        map.addLayer(this.windLayer);
      }
      this.windControl = new WindControl(this.windLayer).setPosition(
        "bottomright"
      );
      if (this.availableWind) {
        map.addControl(this.windControl);
      }
    });
  },
  watch: {
    availableWind() {
      if (this.availableWind) {
        if (this.windLayer) {
          map.addLayer(this.windLayer);
        }
        if (this.windControl) {
          map.addControl(this.windControl);
        }
      } else {
        if (this.windLayer) {
          map.removeLayer(this.windLayer);
        }
        if (this.windControl) {
          map.removeControl(this.windControl);
        }
      }
    },
  },
  methods: {
    findMarker(sensor_id, markers) {
      return new Promise((resolve) => {
        markers.eachLayer((m) => {
          if (m.options.data.sensor_id === sensor_id) {
            resolve(m);
          }
        });
        resolve(false);
      });
    },
    clear() {
      markers.clearLayers();
    },
    addPoint(point) {
      queue.add(makeRequest.bind(queue, this, point));

      async function makeRequest(component, point) {
        if (point.model === 1) {
          await component.addPointPing(point);
        } else if (point.model === 2) {
          await component.addPointStatic(point);
        } else if (point.model === 3) {
          await component.addPointPath(point);
        }
        this.next();
      }
    },
    async addPointPing(point) {
      if (!point.geo) {
        return;
      }
      const coord = point.geo.split(",");
      const color = "#56ce78";
      leaflet
        .circleMarker(new leaflet.LatLng(coord[0], coord[1]), {
          radius: 7,
          fillColor: color,
          color: color,
          weight: 2,
          opacity: 0.7,
          fillOpacity: 0.7,
          data: point,
        })
        .on("click", (e) => {
          this.$emit("clickMarker", e.target.options.data);
        })
        .addTo(map);
    },
    async addPointStatic(point) {
      if (!point.geo) {
        return;
      }
      const coord = point.geo.split(",");
      let colorBorder = "#999";
      let color = "#a1a1a1";
      let colorRgb = [161, 161, 161];
      if (!point.isEmpty) {
        color = getColor(this.scale, point.value);
        colorBorder = getColorDarken(this.scale, point.value);
        colorRgb = getColorRGB(this.scale, point.value);
      }

      const m = await this.findMarker(point.sensor_id, markers);
      const icon = getIcon(point.sensor_id, colorRgb);
      if (m) {
        if (icon) {
          m.setIcon(icon);
        } else if (
          m.options.typeIcon &&
          m.options.typeIcon === "arrow" &&
          Object.prototype.hasOwnProperty.call(point.data, "windang")
        ) {
          m.setIcon(
            getIconArrow(point.data.windang, point.data.windspeed, color)
          );
        } else {
          m.setStyle({
            fillColor: color,
            color: colorBorder,
          });
        }
      } else {
        let marker;
        if (icon) {
          marker = leaflet.marker(new leaflet.LatLng(coord[0], coord[1]), {
            icon: icon,
            data: point,
          });
        } else if (
          Object.prototype.hasOwnProperty.call(point.data, "windang")
        ) {
          marker = leaflet.marker([coord[0], coord[1]], {
            icon: getIconArrow(point.data.windang, point.data.windspeed, color),
            data: point,
            typeIcon: "arrow",
          });
        } else {
          marker = leaflet.circleMarker(
            new leaflet.LatLng(coord[0], coord[1]),
            {
              radius: 15,
              fillColor: color,
              color: colorBorder,
              weight: 2,
              // opacity: 0.7,
              fillOpacity: 0.7,
              data: point,
            }
          );
        }
        marker.on("click", (e) => {
          this.$emit("clickMarker", e.target.options.data);
        });
        markers.addLayer(marker);
      }
    },
    async addPointPath(point) {
      if (!point.geo) {
        return;
      }
      const coord = point.geo.split(",");
      let colorBorder = "#999";
      let color = "#a1a1a1";
      let colorRgb = [161, 161, 161];
      if (!point.isEmpty) {
        color = getColor(this.scale, point.value);
        colorBorder = getColorDarken(this.scale, point.value);
        colorRgb = getColorRGB(this.scale, point.value);
      }

      const m = await this.findMarker(point.sensor_id, markers);
      const icon = getIcon(point.sensor_id, colorRgb);
      if (m) {
        m.setLatLng(new leaflet.LatLng(coord[0], coord[1]));
        if (icon) {
          m.setIcon(icon);
        } else {
          m.setStyle({
            fillColor: color,
            color: colorBorder,
          });
        }
      } else {
        let marker;
        if (icon) {
          marker = leaflet.marker(new leaflet.LatLng(coord[0], coord[1]), {
            icon: icon,
            data: point,
          });
        } else {
          marker = leaflet.circleMarker(
            new leaflet.LatLng(coord[0], coord[1]),
            {
              radius: 15,
              fillColor: color,
              color: colorBorder,
              weight: 2,
              // opacity: 0.7,
              fillOpacity: 0.7,
              data: point,
            }
          );
        }
        marker.on("click", (e) => {
          this.$emit("clickMarker", e.target.options.data);
        });
        markers.addLayer(marker);
      }
    },
  },
};
</script>

<style scoped>
#map {
  width: 100vw;
  height: 100vh;
}
</style>
<style>
.marker-icon {
  border-radius: 50%;
}

.icon-arrow {
  /* more triangle */
  position: relative;
  height: 0px;
  width: 0px;
  border: 18px solid;
  border-color: darkcyan darkcyan transparent transparent;
  transform: rotate(45deg);
}
.icon-arrow div {
  position: absolute;
  top: 0px;
  right: 0px;
  display: block;
  height: 25px;
  width: 40px;
  background-color: darkcyan;
  transform: rotate(-45deg) translate(4px, 6px);
}
.label-arrow {
  position: absolute;
  top: 8px;
  left: 1px;
  font-size: 12px;
  color: #fff;
  font-weight: bold;
  white-space: nowrap;
  transform: rotate(180deg) translate(14px, -1px);
}
.icon-arrow-container {
  position: relative;
}
</style>
