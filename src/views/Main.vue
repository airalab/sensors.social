<template>
  <div>
    <Provider :current="provider" />
    <Types :current="type.toLowerCase()" />
    <Color />
    <Details v-if="point" :point="point" @close="handlerClose" />
    <Header :points="points" />
    <Emulator
      v-if="emulator"
      :time="emulator.time"
      @start="handlerStartEmulate"
      @stop="handlerStopEmulate"
      @play="handlerPlayEmulate"
      @pause="handlerPauseEmulate"
    />
    <Map
      ref="map"
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
      default: "12",
    },
    lat: {
      default: "53.5364",
    },
    lng: {
      default: "49.3139",
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
    this.$provider
      .ready()
      .then(() => {
        this.providerReady = true;
        return this.$provider.getSensors();
      })
      .then((points) => {
        points.forEach((point) => {
          this.handlerNewPoint(point);
        });
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
    handlerStartEmulate({ start, end, speed, interval }) {
      this.status = "emulator";
      this.$provider.watch(null);
      this.handlerClose();
      this.$refs.map.clear();

      this.emulator.emulate(
        start,
        end,
        speed,
        interval,
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
      this.$provider.getSensors().then((points) => {
        points.forEach((point) => {
          this.handlerNewPoint(point);
        });
        this.$provider.watch(this.handlerNewPoint);
      });
    },
    handlerPauseEmulate() {
      this.emulator.pause();
    },
    handlerPlayEmulate() {
      this.emulator.play();
    },
    handlerNewPoint(point) {
      if (
        point.model !== 1 &&
        !Object.prototype.hasOwnProperty.call(
          point.data,
          this.type.toLowerCase()
        )
      ) {
        return;
      }
      this.$refs.map.addPoint({
        ...point,
        value: point.data[this.type.toLowerCase()],
      });
      if (this.point && this.point.sensor_id === point.sensor_id) {
        this.point.log.push({
          data: point.data,
          timestamp: point.timestamp,
        });
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
