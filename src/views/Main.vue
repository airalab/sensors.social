<template>
  <!-- <InstallPWA /> -->
  <Header />

  <template v-if="point">
    <MessagePopup v-if="point.data.message" @close="handlerClose" :data="point.data" />
    <SensorPopup
      v-else
      :currentProvider="provider"
      :type="type.toLowerCase()"
      :point="point"
      @modal="handlerModal"
      @close="handlerClose"
      @history="handlerHistoryLog"
    />
  </template>

  <Map
    :measuretype="type"
    :historyready="canHistory"
    :historyhandler="handlerHistory"
    @clickMarker="handlerClick"
  />

  <!-- <Footer :currentProvider="provider" :canHistory="canHistory" @history="handlerHistory" :type="type" /> -->
</template>

<script>
import { useStore } from "@/store";
import moment from "moment";
import Map from "../components/Map.vue";
// import Footer from "../components/footer/Footer.vue";
import Header from "../components/header/Header.vue";
import InstallPWA from "../components/header/InstallPWA.vue";
import MessagePopup from "../components/message/MessagePopup.vue";
import SensorPopup from "../components/sensor/SensorPopup.vue";
import config from "../config";
import * as providers from "../providers";
import { instanceMap } from "../utils/map/instance";
import * as markers from "../utils/map/marker";
import { getAddressByPos } from "../utils/map/utils";
import { getTypeProvider, setTypeProvider } from "../utils/utils";

export default {
  props: {
    provider: {
      default: getTypeProvider(),
    },
    type: {
      default: "pm10",
    },
    sensor: {
      type: String,
    },
  },
  components: {
    Header,
    Map,
    // Footer,
    SensorPopup,
    MessagePopup,
    InstallPWA,
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
      isShowInfo: false,
      providerObj: null,
      store: useStore(),
      geoLocationOptions: {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      },
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
  },

  watch: {
    point(newValue, oldValue) {
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
        sensors = await this.providerObj.maxValuesForPeriod(start, end, this.type);
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
        ? Object.fromEntries(Object.entries(point.data).map(([k, v]) => [k.toLowerCase(), v]))
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
        Object.prototype.hasOwnProperty.call(point.data, this.type.toLowerCase()) ||
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

        this.store.mapinactive = true;
      } else {
        log = await this.providerObj.getHistoryBySensor(point.sensor_id);
      }

      const address = await getAddressByPos(point.geo.lat, point.geo.lng, this.$i18n.locale);

      this.point = {
        ...point,
        address,
        log: [...log],
      };

    },
    async handlerHistoryLog({ sensor_id, start, end }) {
      if (this.status === "history") {
        const log = await this.providerObj.getHistoryPeriodBySensor(sensor_id, start, end);
        this.point = {
          ...this.point,
          log: [...log],
        };
      }
    },
    handlerClose() {
      this.store.mapinactive = false;

      // removes all active graphs tabs in sensor popup
      this.store.removeAllCurrentMeasures();
      this.store.removeActiveCurrentMeasure();
      // if (this.point) {
      //   markers.hidePath(this.point.sensor_id);
      // }
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
      this.store.mapinactive = false;
    },
    handlerModal(modal) {
      if (modal === "info") {
        this.isShowInfo = true;
      }
    },
  },

  created() {
    setTypeProvider(this.provider);
  },
  async mounted() {
    document.querySelector("#app").classList.add("map");

    /* + listnenning to broadcast messages about sensors */
    const bcnewsensor = new BroadcastChannel("sensors");
    const bcclearsensors = new BroadcastChannel("sensorsremoved");
    this.store.sensors = [];

    bcnewsensor.onmessage = (e) => {
      /* add only unique items */
      if (e.data) {
        let unique = true;

        this.store.sensors.forEach((i) => {
          if (e.data.sensor_id === i.sensor_id) {
            unique = false;
            return;
          }
        });

        if (unique) {
          this.store.sensors.push(e.data);
        }
      }
    };

    bcclearsensors.onmessage = (e) => {
      if (e.data) {
        this.store.sensors = [];
      }
    };

    /* - listnenning to broadcast messages about sensors */

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
        if (this.providerObj && this.providerObj.connection && markers.isReadyLayers()) {
          clearInterval(iRemote);
          this.canHistory = true;
        }
      }, 1000);
    }

    // get user's geolocation with consent
    // const coords = JSON.parse(localStorage.getItem("map-position"));
    // if (
    //   (coords &&
    //     coords.lat === config.MAP.position.lat &&
    //     coords.lng === config.MAP.position.lng) ||
    //   (coords && Object.entries(coords).length === 0) ||
    //   !coords
    // ) {
    //   navigator.geolocation.getCurrentPosition(
    //     this.getGeoLocationSuccess,
    //     this.getGeoLocationError,
    //     this.geoLocationOptions
    //   );
    // }

    // matomo analytics
    this.$matomo && this.$matomo.disableCookies();
    this.$matomo && this.$matomo.trackPageView();
  },
};
</script>
