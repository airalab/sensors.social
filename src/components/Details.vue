<template>
  <div class="panel">
    <button class="close" @click="$emit('close')">&Cross;</button>
    <h2 class="title">{{ point.sender }}</h2>
    <div v-if="last" style="text-align: left;">
      <p>
        <b>{{ date }}</b>
      </p>
      <p v-for="(param, k) in Object.keys(last.data)" :key="k">
        <b>{{ param }}</b>
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

export default {
  props: ["point"],
  components: {
    Chart,
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
        if (newValue.sender !== oldValue.sender) {
          this.points = [...this.point.log];
        } else {
          const newPoint = this.point.log[this.point.log.length - 1];
          const series = ["PM10", "PM2.5"];
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
      return moment(this.last.timestamp, "x").format("DD.MM.YYYY HH:mm:ss");
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
  z-index: 10000000;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border: 5px solid #e0e0e0;
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
