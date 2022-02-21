<template>
  <div>
    <Provider :current="provider" />
    <Types :current="type.toLowerCase()" />
    <Color :type="type.toLowerCase()" />
    <Details
      v-if="point"
      :sender="point.sender"
      :sensor_id="point.sensor_id"
      :log="point.log"
      :model="point.model"
      :count="point.count"
      :type="type.toLowerCase()"
      @close="handlerClose"
    />
    <Header :points="points" />
    <ChainInfo v-if="provider === 'remote'" />
    <Emulator
      v-if="emulator"
      :time="emulator.time"
      :status="emulator.status"
      @start="handlerStartEmulate"
      @stop="handlerStopEmulate"
      @play="handlerPlayEmulate"
      @pause="handlerPauseEmulate"
    />
    <Loader v-if="isLoader" />
    <Map
      ref="map"
      :type="type.toLowerCase()"
      @clickMarker="handlerClick"
      :zoom="zoom"
      :lat="lat"
      :lng="lng"
    />
  </div>
</template>

<script>
import Vue from "vue";
import Map from "../components/Map.vue";
import Types from "../components/Types.vue";
import Color from "../components/Color.vue";
import Details from "../components/Details.vue";
import Provider from "../components/Provider.vue";
import Header from "../components/Header.vue";
import Emulator from "../components/Emulator.vue";
import ChainInfo from "../components/ChainInfo.vue";
import Loader from "../components/Loader.vue";
import * as providers from "../providers";
import config from "../config";
import EmulatorLib from "../providers/emulator";

export default {
  props: {
    provider: {
      default: "ipfs",
    },
    type: {
      default: "pm10",
    },
    zoom: {
      default: config.MAP.zoom,
    },
    lat: {
      default: config.MAP.position.lat,
    },
    lng: {
      default: config.MAP.position.lng,
    },
  },
  data() {
    return {
      providerReady: false,
      point: null,
      points: {},
      status: "online",
      emulator: null,
    };
  },
  components: {
    Map,
    Types,
    Color,
    Details,
    Provider,
    Header,
    Emulator,
    ChainInfo,
    Loader,
  },
  computed: {
    isLoader: function () {
      return this.provider === "ipfs" && Object.keys(this.points).length === 0;
    },
  },
  mounted() {
    if (this.provider === "ipfs") {
      Vue.prototype.$provider = new providers.Ipfs(config.IPFS);
    } else if (this.provider === "remote") {
      let url;
      const settings = localStorage.getItem("settings") || null;
      if (settings) {
        try {
          url = JSON.parse(settings).remote.url;
        } catch (_) {
          console.warn("error", settings);
        }
      }
      Vue.prototype.$provider = new providers.Remote(url);
    }
    this.$provider.ready().then(() => {
      this.providerReady = true;
      this.$provider.watch(this.handlerNewPoint);
    });
    if (this.provider === "remote") {
      const iRemote = setInterval(() => {
        if (this.$provider && this.$provider.connection) {
          clearInterval(iRemote);
          this.emulator = new EmulatorLib(this.$provider);
        }
      }, 1000);
    }
  },
  methods: {
    handlerStartEmulate({ start, end, speed, interval, sensors }) {
      this.status = "emulator";
      this.$provider.watch(null);
      this.handlerClose();
      this.$refs.map.clear();

      this.emulator.emulate(
        start,
        end,
        speed,
        interval,
        sensors,
        (point) => {
          this.handlerNewPoint(point);
        },
        () => {
          // console.log("stop");
        }
      );
    },
    handlerStopEmulate() {
      this.emulator.stop();
      this.status = "online";
      this.handlerClose();
      this.$refs.map.clear();
    },
    handlerPauseEmulate() {
      this.emulator.pause();
    },
    handlerPlayEmulate() {
      this.emulator.play();
    },
    handlerNewPoint(point) {
      if (!point.model) {
        return;
      }
      this.$refs.map.addPoint({
        ...point,
        isEmpty: !point.data[this.type.toLowerCase()],
        value: point.data[this.type.toLowerCase()],
      });
      if (this.point && this.point.sensor_id === point.sensor_id) {
        this.$set(this.point, "log", [
          ...this.point.log,
          {
            data: point.data,
            timestamp: point.timestamp,
          },
        ]);
      }

      if (
        Object.prototype.hasOwnProperty.call(
          point.data,
          this.type.toLowerCase()
        )
      ) {
        this.$set(this.points, point.sensor_id, point.data);
      }
    },
    async handlerClick(point) {
      let log;
      let count;
      if (this.status === "emulator") {
        log = await this.emulator.getHistoryBySensor(point.sensor_id);
        count = await this.emulator.getCountTxBySender(point.sender);
      } else {
        log = await this.$provider.getHistoryBySensor(point.sensor_id);
        count = await this.$provider.getCountTxBySender(point.sender);
      }
      this.point = {
        ...point,
        count,
        log,
      };
    },
    handlerClose() {
      this.point = null;
    },
  },
};
</script>
