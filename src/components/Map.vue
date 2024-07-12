<template>
  <div :class="{ inactive: store.mapinactive }" class="mapcontainer" id="map"></div>
  <Footer
    :currentProvider="provider"
    :canHistory="historyready"
    @history="historyhandler"
    :measuretype="measuretype"
  >
    <button
      class="popovercontrol"
      v-if="geoavailable"
      @click.prevent="resetgeo"
      :area-label="$t('showlocation')"
      :title="$t('showlocation')"
    >
      <font-awesome-icon icon="fa-solid fa-location-arrow" />
    </button>
  </Footer>
</template>

<script>
import { useStore } from "@/store";
import { drawuser, init, removeMap, setTheme, setview } from "../utils/map/instance";
import { init as initMarkers } from "../utils/map/marker";
import { init as initWind } from "../utils/map/wind";
import { getTypeProvider } from "../utils/utils";
import Footer from "../components/footer/Footer.vue";
import config from "../config";

export default {
  emits: ["city", "clickMarker", "close"],
  props: ["measuretype", "historyready", "historyhandler"],
  components: { Footer },
  data() {
    return {
      store: useStore(),
      locale: localStorage.getItem("locale") || this.$i18n.locale || "en",
      theme: window?.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark",
      userposition: null,
      geoavailable: false,
    };
  },

  computed: {
    zoom() {
      return this.store.mapposition.zoom;
    },
    lat() {
      return this.store.mapposition.lat;
    },
    lng() {
      return this.store.mapposition.lng;
    },
    provider() {
      return getTypeProvider();
    },
  },

  methods: {
    themelistener({ matches, media }) {
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

    relocatemap(lat, lng, zoom, type) {
      const options = {
        name: "main",
        params: {
          provider: getTypeProvider(),
          type: this.$route.params.type || "pm10",
          zoom: zoom,
          lat: lat,
          lng: lng,
          sensor: this.$route.params.sensor,
        },
      };

      if (this.$router.currentRoute.value.name === "main") {
        /* added here check for current route is map (main), as it caused problems with other pages */
        if (type === "reload") {
          this.$router.push(options).catch((e) => {
            console.warn(e);
          });
          setview([lat, lng], zoom);
        } else {
          this.$router.replace(options).catch((e) => {
            console.warn(e);
          });
        }
      }
    },

    getlocalmappos() {
      const lastsettings = localStorage.getItem("map-position") || JSON.stringify({"lat": config.MAP.position.lat, "lng": config.MAP.position.lng, "zoom": config.MAP.position.zoom });
      this.store.setmapposition(
        JSON.parse(lastsettings).lat,
        JSON.parse(lastsettings).lng,
        JSON.parse(lastsettings).zoom
      );
    },

    setgeo(force = false) {
      return new Promise((resolve, reject) => {
        const latinurl = this.$router?.currentRoute.value?.params?.lat;
        const lnginurl = this.$router?.currentRoute.value?.params?.lng;
        const zoominurl = this.$router?.currentRoute.value?.params?.zoom;

        if((!latinurl || !lnginurl) || force) {
          if ("geolocation" in navigator) {

            navigator.geolocation.getCurrentPosition(
              (position) => {
                /* setting for the app globally user's geo position and zoom 20 for better view */
                this.userposition = [position.coords.latitude, position.coords.longitude];
                this.store.setmapposition(this.userposition[0], this.userposition[1], 20);
                resolve();
              },
              (e) => {
                /* Если не удалось получить позицию юзера, то проверяем локальное хранилище */
                console.warn(`ERROR(${e.code}): ${e.message}`);
                this.getlocalmappos();
                reject();
              },
              {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0
              }
            );
          } else {
            /* Если нет возможности "geolocation", то проверяем локальное хранилище */
            this.getlocalmappos();
            resolve();
          }
        } else {
          this.store.setmapposition(latinurl, lnginurl, zoominurl || config.MAP.position.zoom);
          resolve();
        }
        
      });
    },

    resetgeo() {
      const waitcoords = this.setgeo(true);
      waitcoords.then(() => {
        this.relocatemap(this.lat, this.lng, this.zoom, "reload");
      });
    },

    setgeopermission(permission) {
      if(permission.state === 'granted') {
        this.geoavailable = true;
      } else {
        this.geoavailable = false;
      }
    }
  },

  unmounted() {
    removeMap();
  },

  async mounted() {

    /* + get user's system theme */
    if (window.matchMedia) {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", this.themelistener);
      window
        .matchMedia("(prefers-color-scheme: light)")
        .addEventListener("change", this.themelistener);
    }
    /* - get user's system theme */

    /* + get user's permission for geo */
    if ("geolocation" in navigator) {   
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        this.setgeopermission(result);

        result.addEventListener("change", () => {
          this.setgeopermission(result);
        });
      });
    }
    /* - get user's permission for geo */


    /* + Operate with a map */

    /* retrieve coordinates */
    const waitcoords = this.setgeo();

    waitcoords.then(async () => {
      const map = init([this.lat, this.lng], this.zoom, this.theme);
      this.relocatemap(this.lat, this.lng, this.zoom, "reload");

      if (this.userposition) {
        drawuser(this.userposition, this.zoom);
      }

      map.on("zoomend", (e) => {
        this.relocatemap(
          e.target.getCenter().lat.toFixed(4),
          e.target.getCenter().lng.toFixed(4),
          e.target.getZoom()
        );
        this.store.setmapposition(
          e.target.getCenter().lat.toFixed(4),
          e.target.getCenter().lng.toFixed(4),
          e.target.getZoom()
        );
      });

      map.on("moveend", (e) => {
        /* setTimeout for mobiles (whne swiping up app, it causes unpleasant map moving before closing app) */
        setTimeout( () => {
          this.relocatemap(
            e.target.getCenter().lat.toFixed(4),
            e.target.getCenter().lng.toFixed(4),
            e.target.getZoom()
          );
          this.store.setmapposition(
            e.target.getCenter().lat.toFixed(4),
            e.target.getCenter().lng.toFixed(4),
            e.target.getZoom()
          );
        }, 50)
        
      });

      initMarkers(map, this.measuretype, (data) => {
        this.$emit("clickMarker", data);
      });

      if (this.provider === "realtime") {
        await initWind();
      }
    });
    /* - Operate with a map */

    /* get bookmarks and listenning for broadcast from DB */
    await this.store.idbBookmarkGet();
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
