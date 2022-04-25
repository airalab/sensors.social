<template>
  <div class="panel">
    <button class="close" @click="$emit('close')">&Cross;</button>
    <h2 class="title">
      Sensor id:
      <Avatar :address="sensor_id" class="icon" />
      <Copy :msg="sensor_id" :title="`Sensor id: ${sensor_id}`">{{
        sensor_id | collapse
      }}</Copy>
    </h2>
    <div v-if="last" style="text-align: left">
      <p style="text-align: center; margin: 10px">
        <b>{{ date }}</b>
      </p>
      <div style="overflow: hidden; margin: 10px; font-size: 14px">
        <p
          v-for="(param, k) in Object.keys(last.data)"
          :key="k"
          style="float: left; margin-top: 0px"
        >
          <button class="btn" @click="measurement = param">
            <b>{{ param | measurement }}</b> =
            {{ last.data[param] | measurementFormat(param) }}
          </button>
          &nbsp;
        </p>
      </div>
    </div>
    <div v-if="log.length > 0">
      <Chart :log="log" :measurement="measurement" :sensor_id="sensor_id" />
    </div>
    <div v-if="link">
      <a :href="link" target="_blank">{{ link }}</a>
    </div>
  </div>
</template>

<script>
import moment from "moment";
import Chart from "./Chart.vue";
import Avatar from "./Avatar.vue";
import Copy from "./Copy.vue";
import sensors from "../sensors";

export default {
  props: ["sender", "sensor_id", "log", "model", "type"],
  components: {
    Chart,
    Avatar,
    Copy,
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

<style scoped>
.panel {
  overflow: hidden;
  position: absolute;
  top: 41px;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border: 5px solid #e0e0e0;
  width: 400px;
}
.icon {
  width: 14px;
  border-radius: 50%;
  vertical-align: baseline;
  margin-right: 4px;
}
.title {
  font-size: 15px;
  margin-top: 30px;
  text-align: center;
}
.close {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 20px;
  background: #6186ff;
  border: 0;
  color: #fff;
}
.close:hover {
  cursor: pointer;
}
.btn {
  background: none;
  border: none;
}
.btn:hover {
  cursor: pointer;
}
</style>
