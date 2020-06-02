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

delete leaflet.Icon.Default.prototype._getIconUrl;
leaflet.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const scale = generate(
  ["#00796b", "#00796b", "#f9a825", "#e65100", "#dd2c00", "#dd2c00", "#8c0084"],
  [0, 25, 50, 75, 100, 500]
);

let map;
let markers;

export default {
  props: ["zoom", "lat", "lng"],
  mounted() {
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

    const iconCreateFunction = function (cluster) {
      const markers = cluster.getAllChildMarkers();
      const childCount = cluster.getChildCount();
      let sum = 0;
      markers.forEach((marker) => {
        sum += marker.options.data.value;
      });
      if (childCount > 0) {
        sum = sum / childCount;
      }
      const color = getColorRGB(scale, sum);
      const isDark = scale(sum).luminance() < 0.4;

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
    async addPoint(point) {
      const coord = point.geo.split(",");
      const color = getColor(scale, point.value);

      const m = await this.findMarker(point.sensor_id, markers);
      if (m) {
        m.setStyle({
          fillColor: color,
          color: color,
        });
      } else {
        const marker = leaflet
          .circleMarker(new leaflet.LatLng(coord[0], coord[1]), {
            radius: 15,
            fillColor: color,
            color: color,
            weight: 2,
            opacity: 0.7,
            fillOpacity: 0.7,
            data: point,
          })
          .on("click", (e) => {
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
