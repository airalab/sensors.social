<template>
  <div class="sensors-screen" :class="{ loading: isLoader }">
    <div class="sensors-screen-layers">
      <div class="sensors-screen-layers--center">
        <Header :localeCurrent="$i18n.locale" :city="city" />

        <div class="sensors-panel--center-left">
          <Modal v-if="point" @close="handlerClose">
            <Message
              v-if="point.data.message"
              :data="point.data"
              @close="handlerClose"
            />
            <Details
              v-else
              :sender="point.sender"
              :sensor_id="point.sensor_id"
              :log="point.log"
              :model="point.model"
              :count="point.count"
              :type="type.toLowerCase()"
              @close="handlerClose"
              @modal="handlerModal"
            />
          </Modal>
        </div>

        <div class="sensors-panel--center-right">
          <Modal v-if="isShowInfo" @close="handlerCloseInfo">
            <Info />
          </Modal>
        </div>
      </div>

      <div class="sensors-panel sensors-panel--bottom">
        <div class="sensors-panel-section sensors-dateselect">
          <Provider
            :current="provider"
            :canHistory="canHistory"
            @history="handlerHistory"
          />
          <Wind :disabled="provider !== 'ipfs'" />
          <Messages />
        </div>

        <Types :current="type.toLowerCase()" @modal="handlerModal" />
      </div>
    </div>

    <Map
      :type="type.toLowerCase()"
      @clickMarker="handlerClick"
      @city="handlerChangeCity"
      :zoom="zoom"
      :lat="lat"
      :lng="lng"
      :availableWind="provider === 'ipfs'"
    />
    <i class="fa-solid fa-compass fa-spin"></i>
  </div>
</template>

<script>
import Vue from "vue";
import Map from "../components/Map.vue";
import Types from "../components/Types.vue";
import Details from "../components/Details.vue";
import Provider from "../components/Provider.vue";
import Header from "../components/Header.vue";
import Wind from "../components/Wind.vue";
import Messages from "../components/Messages.vue";
import Message from "../components/Message.vue";
import Info from "../components/Info.vue";
import Modal from "../components/Modal.vue";
import * as providers from "../providers";
import config from "../config";
import * as markers from "../utils/map/marker";

export default {
  props: {
    provider: {
      default: "remote",
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
      canHistory: false,
      city: "",
      isShowInfo: false,
    };
  },
  components: {
    Map,
    Types,
    Details,
    Provider,
    Header,
    Wind,
    Messages,
    Modal,
    Info,
    Message,
  },
  computed: {
    isLoader() {
      return this.provider === "ipfs" && Object.keys(this.points).length === 0;
    },
  },
  mounted() {
    if (this.provider === "remote") {
      Vue.prototype.$provider = new providers.Remote(config.REMOTE_PROVIDER);
    } else {
      Vue.prototype.$provider = new providers.Ipfs(config.IPFS);
    }
    this.$provider.ready().then(() => {
      this.providerReady = true;
      this.$provider.watch(this.handlerNewPoint);
    });
    if (this.provider === "remote") {
      const iRemote = setInterval(() => {
        if (this.$provider && this.$provider.connection) {
          clearInterval(iRemote);
          this.canHistory = true;
        }
      }, 1000);
    } else {
      this.$provider.watchMessages(this.handlerNewPoint);
    }
  },
  methods: {
    async handlerHistory({ start, end }) {
      this.status = "history";
      this.$provider.watch(null);
      this.handlerClose();
      markers.clear();
      this.$provider.setStartDate(start);
      this.$provider.setEndDate(end);
      const sensors = await this.$provider.lastValuesForPeriod(start, end);
      for (const sensor in sensors) {
        this.handlerNewPoint(sensors[sensor]);
      }
      const messages = await this.$provider.messagesForPeriod(start, end);
      for (const message in messages) {
        this.handlerNewPoint(messages[message]);
      }
    },
    handlerNewPoint(point) {
      if (!point.model) {
        return;
      }
      markers.addPoint({
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
        ) ||
        Object.prototype.hasOwnProperty.call(point.data, "message")
      ) {
        this.$set(this.points, point.sensor_id, point.data);
      }
    },
    async handlerClick(point) {
      let log;
      if (this.status === "history") {
        log = await this.$provider.getHistoryPeriodBySensor(
          point.sensor_id,
          this.$provider.start,
          this.$provider.end
        );
      } else {
        log = await this.$provider.getHistoryBySensor(point.sensor_id);
      }
      this.point = {
        ...point,
        log: [...log],
      };
    },
    handlerClose() {
      this.point = null;
    },
    handlerCloseInfo() {
      this.isShowInfo = false;
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
