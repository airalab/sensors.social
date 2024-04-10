<template>
  <div class="map-wrapper">
    <div :class="{ inactive: store.isColored }" class="map" id="map"></div>
  </div>
</template>

<script>
import { useStore } from "@/store";
import { watchEffect } from "vue";
import config from "../config";
import { init, setTheme } from "../utils/map/instance";
import { init as initMarkers } from "../utils/map/marker";
import { getCityByPos } from "../utils/map/utils";
import { init as initWind } from "../utils/map/wind";
import { saveMapPosiotion } from "../utils/utils";

export default {
  emits: ["city", "clickMarker"],
  props: ["zoom", "lat", "lng", "type", "availableWind"],
  setup() {
    const store = useStore();

    watchEffect(() => {
      try {
        setTheme(store.theme);
        // eslint-disable-next-line no-empty
      } catch (_) {}
    });

    return {
      store,
    };
  },
  async mounted() {
    if (this.zoom > 9) {
      getCityByPos(this.lat, this.lng, this.$i18n.locale).then((r) => {
        this.$emit("city", r);
      });
    }
    const map = init([this.lat, this.lng], this.zoom, this.store.theme);
    map.on("zoomend", (e) => {
      const pos = e.target.getCenter();
      saveMapPosiotion(
        e.target.getZoom(),
        pos.lat.toFixed(4),
        pos.lng.toFixed(4)
      );
      this.$router.replace({
        name: "main",
        params: {
          provider: this.$route.params.provider || config.DEFAUL_TYPE_PROVIDER,
          type: this.$route.params.type || "pm10",
          zoom: e.target.getZoom(),
          lat: pos.lat.toFixed(4),
          lng: pos.lng.toFixed(4),
          sensor: this.$route.params.sensor,
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
      saveMapPosiotion(
        e.target.getZoom(),
        pos.lat.toFixed(4),
        pos.lng.toFixed(4)
      );
      this.$router
        .replace({
          name: "main",
          params: {
            provider:
              this.$route.params.provider || config.DEFAUL_TYPE_PROVIDER,
            type: this.$route.params.type || "pm10",
            zoom: e.target.getZoom(),
            lat: pos.lat.toFixed(4),
            lng: pos.lng.toFixed(4),
            sensor: this.$route.params.sensor,
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

<style>
#map {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  max-height: 100%;
  height: auto;
  z-index: 0;
  width: 100vw;
  height: 100vh;
}

.leaflet-bottom {
  bottom: 70px;
}

#map.inactive {
  filter: grayscale(100%);
}

.leaflet-control-attribution.leaflet-control {
  font-size: calc(var(--font-size) * 0.5);
}

@media screen and (max-width: 680px) {
  .leaflet-bottom {
    bottom: 0px;
  }
}

.marker-cluster-circle {
  border-width: 2px;
  border-style: solid;
  border-radius: 18px;
}
.marker-cluster-circle span {
  line-height: 27px;
  font-weight: bold;
}
.marker-cluster-msg {
  font-weight: bold;
  background-size: contain;
  color: #fff;
  padding-top: 4px;
  font-size: 16px;
  width: 40px !important;
  height: 40px !important;
}
.marker-icon-brand {
  width: 40px !important;
  height: 40px !important;
  border-radius: 50%;
}
.marker-icon-msg {
  width: 40px;
  height: 40px;
}
</style>
