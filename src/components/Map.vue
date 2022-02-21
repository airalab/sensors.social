<template>
  <div id="map"></div>
</template>

<script>
import leaflet from "leaflet";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import generate, { getColor, getColorRGB } from "../utils/color";
import measurement from "../utils/measurement";
import "leaflet-arrowheads";
import Queue from "js-queue";
import sensors from "../sensors";

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

let map;
let markers;
// let paths = {};

const queue = new Queue();

export default {
  props: ["zoom", "lat", "lng", "type"],
  data() {
    return {
      scale: null,
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
      const isDark = this.scale(sum).luminance() < 0.4;

      return new leaflet.DivIcon({
        html:
          "<div style='font-weight: bold;color:" +
          (isDark ? "white" : "black") +
          ";background-color: rgba(" +
          color +
          ", 0.7);border-color: rgba(" +
          color +
          ", 0.5);border-width: 3px;border-style: solid;border-radius: 18px;'><span>" +
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
      let color = "#a1a1a1";
      let colorRgb = [161, 161, 161];
      if (!point.isEmpty) {
        color = getColor(this.scale, point.value);
        colorRgb = getColorRGB(this.scale, point.value);
      }

      const m = await this.findMarker(point.sensor_id, markers);
      const icon = getIcon(point.sensor_id, colorRgb);
      if (m) {
        if (icon) {
          m.setIcon(icon);
        } else {
          m.setStyle({
            fillColor: color,
            color: color,
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
              color: color,
              weight: 2,
              opacity: 0.7,
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
      let color = "#a1a1a1";
      let colorRgb = [161, 161, 161];
      if (!point.isEmpty) {
        color = getColor(this.scale, point.value);
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
            color: color,
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
              color: color,
              weight: 2,
              opacity: 0.7,
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
</style>
