<template>
  <div>
    <Provider :current="provider" />
    <Types :current="type.toLowerCase()" />
    <Color />
    <Details v-if="point" :point="point" @close="handlerClose" />
    <Export v-else-if="providerReady && $provider.canExport()" />
    <Header :points="points" />
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
import Export from "../components/Export.vue";
import Header from "../components/Header.vue";
import * as providers from "../providers";
import config from "../config";

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
    };
  },
  components: {
    Map,
    Types,
    Color,
    Details,
    Provider,
    Export,
    Header,
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
  },
  methods: {
    handlerNewPoint(point) {
      // console.log("new", point);
      if (
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

      this.$set(this.points, point.sensor_id, point.data);
    },
    async handlerClick(point) {
      const log = await this.$provider.getHistoryBySensor(point.sensor_id);
      this.point = {
        ...point,
        log,
      };
    },
    handlerClose() {
      this.point = null;
    },
  },
};
</script>
