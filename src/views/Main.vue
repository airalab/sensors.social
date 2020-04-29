<template>
  <div>
    <Provider :current="provider" />
    <Types :current="type.toLowerCase()" />
    <Color />
    <Details v-if="point" :point="point" @close="handlerClose" />
    <Map ref="map" @clickMarker="handlerClick" :zoom="zoom" :lat="lat" :lng="lng" />
  </div>
</template>

<script>
import Map from "../components/Map.vue";
import Types from "../components/Types.vue";
import Color from "../components/Color.vue";
import Details from "../components/Details.vue";
import Provider from "../components/Provider.vue";
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
      default: "5"
    },
    lat: {
      default: "56.4625"
    },
    lng: {
      default: "43.2422"
    }
  },
  data() {
    return {
      point: null,
      log: {}
    };
  },
  components: {
    Map,
    Types,
    Color,
    Details,
    Provider
  },
  mounted() {
    if (this.provider === "ipfs") {
      const provider = new providers.Ipfs(config.IPFS);
      provider.ready().then(() => {
        provider.watch(this.handlerNewPoint);
      });
    }
  },
  methods: {
    handlerNewPoint(point) {
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
      if (!Object.prototype.hasOwnProperty.call(this.log, point.sender)) {
        this.$set(this.log, point.sender, []);
      }
      this.log[point.sender].push({
        data: point.data,
        timestamp: point.timestamp
      });
    },
    handlerClick(point) {
      this.point = {
        ...point,
        log: Object.prototype.hasOwnProperty.call(this.log, point.sender)
          ? this.log[point.sender]
          : []
      };
    },
    handlerClose() {
      this.point = null;
    }
  }
};
</script>
