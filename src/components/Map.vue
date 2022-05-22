<template>
  <div id="map" class="map"></div>
</template>

<script>
import { init } from "../utils/map/instance";
import { init as initWind } from "../utils/map/wind";
import { init as initMarkers } from "../utils/map/marker";
import { getCityByPos } from "../utils/map/utils";

export default {
  props: ["zoom", "lat", "lng", "type", "availableWind"],
  async mounted() {
    if (this.zoom > 9) {
      getCityByPos(this.lat, this.lng, this.$i18n.locale).then((r) => {
        this.$emit("city", r);
      });
    }
    const map = init([this.lat, this.lng], this.zoom);
    map.on("zoomend", (e) => {
      const pos = e.target.getCenter();
      this.$router.replace({
        name: "main",
        params: {
          provider: this.$route.params.provider || "remote",
          type: this.$route.params.type || "pm10",
          zoom: e.target.getZoom(),
          lat: pos.lat.toFixed(4),
          lng: pos.lng.toFixed(4),
        },
      });
    });
    map.on("moveend", (e) => {
      const pos = e.target.getCenter();
      const zoom = e.target.getZoom();
      if (zoom > 9) {
        getCityByPos(pos.lat, pos.lng, this.$i18n.locale).then((r) => {
          this.$emit("city", r);
        });
      } else {
        this.$emit("city", "");
      }

      this.$router
        .replace({
          name: "main",
          params: {
            provider: this.$route.params.provider || "remote",
            type: this.$route.params.type || "pm10",
            zoom: e.target.getZoom(),
            lat: pos.lat.toFixed(4),
            lng: pos.lng.toFixed(4),
          },
        })
        .catch(() => {});
    });

    initMarkers(map, this.type, (data) => {
      this.$emit("clickMarker", data);
    });

    if (this.availableWind) {
      await initWind();
    }
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
