<template>
  <div class="sensors-screen">
    <div class="sensors-screen-layers">
      <div class="sensors-screen-layers--center">
        <Header :localeCurrent="$i18n.locale" :city="city" />

        <div class="container sensors-container">
          <ColorfulScale :type="type" />

          <template v-if="point">
            <MessagePopup
              v-if="point.data.message"
              @close="handlerClose"
              :data="point.data"
            />
            <SensorPopup
              v-else
              :sender="point.sender"
              :sensor_id="point.sensor_id"
              :log="point.log"
              :model="point.model"
              :address="point.address"
              :geo="point.geo"
              :donated_by="point.donated_by"
              :type="type.toLowerCase()"
              @modal="handlerModal"
              @close="handlerClose"
            />
          </template>

          <Map
            :type="type"
            :zoom="zoom"
            :lat="lat"
            :lng="lng"
            :availableWind="provider === 'realtime'"
            @clickMarker="handlerClick"
            @city="handlerChangeCity"
          />
        </div>

        <Footer
          :currentProvider="provider"
          :canHistory="canHistory"
          @history="handlerHistory"
          :type="type"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { useStore } from "@/store";
import moment from "moment";
import Loader from "../components/Loader.vue";
import Map from "../components/Map.vue";
import ColorfulScale from "../components/colorfulScale/ColorfulScale.vue";
import Footer from "../components/footer/Footer.vue";
import Header from "../components/header/Header.vue";
import MessagePopup from "../components/message/MessagePopup.vue";
import SensorPopup from "../components/sensor/SensorPopup.vue";
import config from "../config";
import * as providers from "../providers";
import { instanceMap } from "../utils/map/instance";
import * as markers from "../utils/map/marker";
import { getAddressByPos } from "../utils/map/utils";
import { getMapPosiotion } from "../utils/utils";

const mapPosition = getMapPosiotion();

export default {
  props: {
    provider: {
      default: config.DEFAUL_TYPE_PROVIDER,
    },
    type: {
      default: "pm10",
    },
    zoom: {
      default: mapPosition.zoom,
    },
    lat: {
      default: mapPosition.lat,
    },
    lng: {
      default: mapPosition.lng,
    },
    sensor: {
      type: String,
    },
  },
  components: {
    Header,
    Map,
    ColorfulScale,
    Footer,
    SensorPopup,
    Loader,
    MessagePopup,
  },

  metaInfo() {
    return {
      meta: { name: "color-scheme", content: "dark light" },
    };
  },

  data() {
    return {
      providerReady: false,
      point: null,
      points: {},
      status: "online",
      canHistory: false,
      city: "",
      isShowInfo: false,
      providerObj: null,
      store: useStore(),
    };
  },
  computed: {
    isLoader() {
      return (
        this.provider === "realtime" && Object.keys(this.points).length === 0
      );
    },
  },
  async mounted() {
    if (this.provider === "remote") {
      this.providerObj = new providers.Remote(config.REMOTE_PROVIDER);
      if (!(await this.providerObj.status())) {
        window.location.href =
          window.location.origin +
          "/" +
          this.$router.resolve({
            name: this.$route.name,
            params: {
              provider: "realtime",
              type: this.$route.params.type,
              zoom: this.$route.params.zoom,
              lat: this.$route.params.lat,
              lng: this.$route.params.lng,
              sensor: this.$route.params.sensor,
            },
          }).href;
        return;
      }
    } else {
      this.providerObj = new providers.Libp2p(config.LIBP2P);
    }
    this.providerObj.ready().then(() => {
      this.providerReady = true;
      this.providerObj.watch(this.handlerNewPoint);
    });
    if (this.provider === "remote") {
      const iRemote = setInterval(() => {
        if (
          this.providerObj &&
          this.providerObj.connection &&
          markers.isReadyLayers()
        ) {
          clearInterval(iRemote);
          this.canHistory = true;
        }
      }, 1000);
    }

    this.$nextTick(() => {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", () => {
          if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            localStorage.setItem("theme", "light");
            this.store.toggleTheme();
          } else {
            localStorage.setItem("theme", "dark");
            this.store.toggleTheme();
          }
        });
    });

    // matomo analytics
    this.$matomo && this.$matomo.disableCookies();
    this.$matomo && this.$matomo.trackPageView();
  },

  watch: {
    point(_, oldValue) {
      if (oldValue) {
        markers.hidePath(oldValue.sensor_id);
      }
    },
  },
  methods: {
    async handlerHistory({ start, end }) {
      this.status = "history";
      this.providerObj.watch(null);
      this.handlerClose();
      markers.clear();
      this.providerObj.setStartDate(start);
      this.providerObj.setEndDate(end);
      const today = moment().format("YYYY-MM-DD");
      const startDate = moment.unix(start).format("YYYY-MM-DD");
      let sensors;
      if (today === startDate) {
        sensors = await this.providerObj.lastValuesForPeriod(start, end);
      } else {
        sensors = await this.providerObj.maxValuesForPeriod(
          start,
          end,
          this.type
        );
      }
      for (const sensor in sensors) {
        for (const item of sensors[sensor]) {
          this.handlerNewPoint(item);
        }
      }
      const messages = await this.providerObj.messagesForPeriod(start, end);
      for (const message in messages) {
        this.handlerNewPoint(messages[message]);
      }
    },
    handlerNewPoint(point) {
      if (!point.model || !markers.isReadyLayers()) {
        return;
      }
      point.data = point.data
        ? Object.fromEntries(
            Object.entries(point.data).map(([k, v]) => [k.toLowerCase(), v])
          )
        : {};
      markers.addPoint({
        ...point,
        isEmpty: !point.data[this.type.toLowerCase()],
        value: point.data[this.type.toLowerCase()],
      });

      if (point.sensor_id === this.sensor) {
        this.handlerClick(point);
      }

      if (this.point && this.point.sensor_id === point.sensor_id) {
        this.point.log = [
          ...this.point.log,
          {
            data: point.data,
            timestamp: point.timestamp,
          },
        ];
      }

      if (
        Object.prototype.hasOwnProperty.call(
          point.data,
          this.type.toLowerCase()
        ) ||
        Object.prototype.hasOwnProperty.call(point.data, "message")
      ) {
        this.points[point.sensor_id] = point.data;
      }
    },
    async handlerClick(point) {
      let log;
      if (this.status === "history") {
        log = await this.providerObj.getHistoryPeriodBySensor(
          point.sensor_id,
          this.providerObj.start,
          this.providerObj.end
        );
        // adds b&W filter from the map
        this.store.colorMap();
      } else {
        log = await this.providerObj.getHistoryBySensor(point.sensor_id);
      }

      const address = await getAddressByPos(
        point.geo.lat,
        point.geo.lng,
        this.$i18n.locale
      );

      this.point = {
        ...point,
        address,
        log: [...log],
      };
    },
    handlerClose() {
      // removes b&W filter from the map
      this.store.removeColorMap();
      // removes all active graphs tabs in sensor popup
      this.store.removeAllCurrentMeasures();
      this.store.removeActiveCurrentMeasure();
      if (this.point) {
        markers.hidePath(this.point.sensor_id);
      }
      this.point = null;
      instanceMap().setActiveArea({
        position: "absolute",
        top: "0px",
        left: "0px",
        right: "0px",
        height: "100%",
      });
    },
    handlerCloseInfo() {
      this.isShowInfo = false;
      // removing b&w filter form the map after popup closes
    },
    handlerModal(modal) {
      if (modal === "info") {
        this.isShowInfo = true;
      }
    },
    handlerChangeCity(city) {
      this.city = city;
    },
  },
};
</script>

<style>
.sensors-panel--bottom {
  position: relative;
  z-index: 10;
}
</style>
