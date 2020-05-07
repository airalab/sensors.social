<template>
  <div>
    <Provider :current="provider" />
    <Types :current="type.toLowerCase()" />
    <Color />
    <Details v-if="point" :point="point" @close="handlerClose" />
    <Export v-else-if="providerReady && $provider.canExport()" />
    <Map ref="map" @clickMarker="handlerClick" :zoom="zoom" :lat="lat" :lng="lng" />
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
import * as providers from "../providers";
import config from "../config";

export default {
  props: {
    provider: {
      default: "ipfs"
    },
    type: {
      default: "pm10"
    },
    zoom: {
      default: "12"
    },
    lat: {
      default: "53.5364"
    },
    lng: {
      default: "49.3139"
    }
  },
  data() {
    return {
      providerReady: false,
      point: null
    };
  },
  components: {
    Map,
    Types,
    Color,
    Details,
    Provider,
    Export
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
      .then(points => {
        points.forEach(point => {
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
          this.type.toUpperCase()
        )
      ) {
        return;
      }
      this.$refs.map.addPoint({
        ...point,
        value: point.data[this.type.toUpperCase()]
      });
      if (this.point && this.point.sender === point.sender) {
        this.point.log.push({
          data: point.data,
          timestamp: point.timestamp
        });
      }
    },
    async handlerClick(point) {
      const log = await this.$provider.getHistoryBySender(point.sender);
      this.point = {
        ...point,
        log
      };
    },
    handlerClose() {
      this.point = null;
    }
  }
};
</script>
