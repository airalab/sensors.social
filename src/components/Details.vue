<template>
  <div>
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
    </div>
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
    <Chart
      v-if="log.length > 0"
      :log="log"
      :measurement="measurement"
      :sensor_id="sensor_id"
    />
    <div v-if="link">
      <a :href="link" target="_blank">{{ link }}</a>
    </div>
  </div>
</template>

<script>
import moment from "moment";
import Chart from "./Chart.vue";
import Copy from "./Copy.vue";
import Icon from "./Icon.vue";
import sensors from "../sensors";

export default {
  props: ["sender", "sensor_id", "log", "model", "address", "type"],
  components: {
    Chart,
    Copy,
    Icon,
  },
  data() {
    return {
      measurement: this.type,
    };
  },
  computed: {
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
