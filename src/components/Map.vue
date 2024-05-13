<template>
  <div
    :class="{ inactive: store.isColored }"
    class="mapcontainer"
    id="map"
  ></div>
</template>

<script>
import { useStore } from "@/store";
import config from "../config";
import { init, removeMap, setTheme } from "../utils/map/instance";
import { init as initMarkers } from "../utils/map/marker";
import { getCityByPos } from "../utils/map/utils";
import { init as initWind } from "../utils/map/wind";
import { saveMapPosiotion } from "../utils/utils";

export default {
  emits: ["city", "clickMarker", "close"],
  props: ["zoom", "lat", "lng", "type", "availableWind"],
  data() {
    return {
      locale: localStorage.getItem("locale") || this.$i18n.locale || "en",
      theme: window?.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark",
      store: useStore(),
    };
  },
  methods: {
    listener({ matches, media }) {
      if (!matches) {
        // Not matching anymore = not interesting
        return;
      }

      if (media === "(prefers-color-scheme: dark)") {
        this.theme = "dark";
      } else if (media === "(prefers-color-scheme: light)") {
        this.theme = "light";
      }

      setTheme(this.theme);
    },
  },
  computed: {
    route() {
      return this.$router;
    },
  },
  unmounted() {
    removeMap();
  },
  async mounted() {
    /* + get user's system theme */
    if (window.matchMedia) {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", this.listener);
      window
        .matchMedia("(prefers-color-scheme: light)")
        .addEventListener("change", this.listener);
    }
    /* - get user's system theme */

    if (this.zoom > 9) {
      getCityByPos(this.lat, this.lng, this.locale).then((r) => {
        this.$emit("city", r);
      });
    }

    const map = init([this.lat, this.lng], this.zoom, this.theme);

    map.on("zoomend", (e) => {
      const pos = e.target.getCenter();
      saveMapPosiotion(
        e.target.getZoom(),
        pos.lat.toFixed(4),
        pos.lng.toFixed(4)
      );

      if (this.$router.currentRoute.value.name === "main") {
        /* added here check for current route is map (main), as it caused problems with other pages */
        this.$router.replace({
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
        });
      }
    });

    map.on("moveend", (e) => {
      const pos = e.target.getCenter();
      const zoom = e.target.getZoom();
      if (zoom > 9) {
        getCityByPos(pos.lat, pos.lng, this.locale).then((r) => {
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

      if (this.$router.currentRoute.value.name === "main") {
        /* added here check for current route is map (main), as it caused problems with other pages */
        /* ! Here was a problem actually */
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
      }
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
/* + open source leaflet map rewritings */
.leaflet-control-attribution,
.leaflet-container .leaflet-control-attribution {
  font-size: calc(var(--font-size) * 0.5);
  background: none;
  margin: 0 !important;
}

.leaflet-bottom .leaflet-control-locate {
  border: var(--app-borderwidth) solid var(--app-bordercolor);
}

.leaflet-bottom .leaflet-control-locate .leaflet-bar-part-single {
  background: var(--app-inputbg);
}

.leaflet-right .leaflet-control {
  margin-right: var(--gap);
}

.leaflet-bottom .leaflet-control {
  margin-bottom: 0.3rem;
}

.leaflet-control-locate a .leaflet-control-locate-location-arrow,
.leaflet-control-locate.following a .leaflet-control-locate-location-arrow {
  background: var(--app-bordercolor);
}

.leaflet-touch .leaflet-bar,
.leaflet-touch .leaflet-bar a,
.leaflet-bar a,
.leaflet-bar {
  border-radius: 50% !important;
}

.leaflet-touch .leaflet-bar a,
.leaflet-bar a {
  width: calc(var(--app-inputheight) - var(--app-borderwidth) * 2);
  height: calc(var(--app-inputheight) - var(--app-borderwidth) * 2);
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50% !important;
}
/* - open source leaflet map rewritings */

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
  width: 35px !important;
  height: 35px !important;
  border-radius: 50%;
}
.marker-icon-msg {
  width: 40px;
  height: 40px;
}
</style>

<style scoped>
.mapcontainer {
  background-color: var(--color-light-gray);
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  width: 100%;
  height: 100svh;
  overflow: hidden;
}

.mapcontainer.inactive {
  filter: grayscale(100%);
}
</style>
