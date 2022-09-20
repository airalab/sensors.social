<template>
  <fragment>
    <h2>
      {{ $t("details.sensor") }}
      <Copy :msg="sensor_id" :title="`Sensor id: ${sensor_id}`">{{
        sensor_id | collapse
      }}</Copy>
    </h2>
    <div class="sensor-popup--subtitle">
      <span><i class="fa-solid fa-stopwatch"></i> {{ date }}</span>
      <span v-if="address">
        <i class="fa-solid fa-location-dot"></i> {{ address }}
      </span>
      &nbsp;
      <a :href="linkSensor" target="_blank">
        <i class="fa-solid fa-up-right-from-square"></i>
      </a>

      <div v-if="model === 3" class="sensors-switcher">
        <input type="checkbox" id="realtime" v-model="isShowPath" />
        <label for="realtime"></label>
        <span class="sensors-switcher-text">{{ $t("details.showpath") }}</span>
      </div>
    </div>
    <div class="sensor-popup--content">
      <template v-if="last">
        <ul class="sensor-popup--data">
          <li v-for="(param, k) in Object.keys(last.data)" :key="k">
            <div @click="measurement = param">
              <Icon :type="param" />
              {{ param | measurement }} =
              {{ last.data[param] | measurementFormat(param) }}
              <a
                v-if="param === 'pm10' || param === 'pm25'"
                href=""
                @click.stop.prevent="$emit('modal', 'info')"
              >
                <i class="fa-solid fa-circle-info"></i>
              </a>
            </div>
          </li>
        </ul>
      </template>
      <div class="text-tip">
        {{ $t("notice") }}
      </div>
      <Chart
        v-if="log.length > 0"
        :model="model"
        :log="log"
        :measurement="measurement"
        :sensor_id="sensor_id"
      />
      <div v-if="link">
        <a :href="link" target="_blank">{{ link }}</a>
      </div>
    </div>
  </fragment>
</template>

<script>
import moment from "moment";
import Chart from "./Chart.vue";
import Copy from "./Copy.vue";
import Icon from "./Icon.vue";
import sensors from "../sensors";
import { showPath, hidePath } from "../utils/map/marker";
import config from "../config";

export default {
  props: ["sender", "sensor_id", "log", "model", "address", "type", "geo"],
  components: {
    Chart,
    Copy,
    Icon,
  },
  data() {
    return {
      measurement: this.type,
      isShowPath: false,
    };
  },
  watch: {
    sensor_id() {
      this.isShowPath = false;
    },
    isShowPath() {
      if (this.isShowPath) {
        showPath(this.sensor_id);
      } else {
        hidePath(this.sensor_id);
      }
    },
  },
  computed: {
    linkSensor: function () {
      const geo = this.geo.split(",");
      return this.$router.resolve({
        name: "main",
        params: {
          provider: this.$route.params.provider || "remote",
          type: this.$route.params.type || "pm10",
          zoom: this.$route.params.zoom || config.MAP.zoom,
          lat: geo[0],
          lng: geo[1],
          sensor: this.sensor_id,
        },
      }).href;
    },
    link: function () {
      return sensors[this.sensor_id] ? sensors[this.sensor_id].link : "";
    },
    last: function () {
      return this.log[this.log.length - 1];
    },
    date: function () {
      return moment(this.last.timestamp, "X").format("DD.MM.YYYY HH:mm:ss");
    },
  },
};
</script>
