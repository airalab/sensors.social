<template>
  <div class="panel">
    <button class="close" @click="$emit('close')">&Cross;</button>
    <h2 class="title">
      <Avatar :address="point.sender" class="icon" />
      <Copy :msg="point.sender" :title="`Address: ${point.sender}`">{{
        point.sender | collapse
      }}</Copy>
      |
      <Avatar :address="point.sensor_id" class="icon" />
      <Copy :msg="point.sensor_id" :title="`Sensor id: ${point.sensor_id}`">{{
        point.sensor_id | collapse
      }}</Copy>
    </h2>
    <div v-if="last" style="text-align: left;">
      <p>
        <b>{{ date }}</b>
      </p>
      <p v-for="(param, k) in Object.keys(last.data)" :key="k">
        <b>{{ param | measurement }}</b>
        = {{ last.data[param] }}
      </p>
    </div>
    <div v-if="points.length > 0">
      <Chart ref="chart" :log="points" />
    </div>
  </div>
</template>

<script>
import moment from "moment";
import Chart from "./Chart.vue";
import Avatar from "./Avatar.vue";
import Copy from "./Copy.vue";

export default {
  props: ["point"],
  components: {
    Chart,
    Avatar,
    Copy,
  },
  data() {
    return {
      points: [],
    };
  },
  mounted() {
    this.points = [...this.point.log];
  },
  watch: {
    point: {
      handler: function (newValue, oldValue) {
        if (newValue.sensor_id !== oldValue.sensor_id) {
          this.points = [...this.point.log];
        } else {
          const newPoint = this.point.log[this.point.log.length - 1];
          const series = ["pm10", "pm25"];
          for (const i in series) {
            this.$refs.chart.addPoint(i, [
              Number(newPoint.timestamp),
              newPoint.data[series[i]],
            ]);
          }
        }
      },
      deep: true,
    },
  },
  computed: {
    last: function () {
      return this.point.log[this.point.log.length - 1];
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
  top: 29px;
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
  vertical-align: bottom;
  margin-right: 4px;
}
.title {
  font-size: 15px;
  margin-top: 30px;
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
</style>
