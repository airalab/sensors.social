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
      <p style="text-align: center">
        <b>{{ date }}</b>
      </p>
      <div style="overflow: hidden; margin: 10px; font-size: 14px">
        <p
          v-for="(param, k) in Object.keys(last.data)"
          :key="k"
          style="float: left; margin: 10px 10px 0 0"
        >
          <b>{{ param | measurement }}</b>
          = {{ last.data[param] | measurementFormat(param) }}
        </p>
      </div>
      <p v-if="countTx !== false">
        <b>Datalog</b>
        = {{ countTx }} tx
      </p>
    </div>
    <div v-if="points.length > 0">
      <Chart ref="chart" :log="points" :series="series" :type="type" />
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
  props: ["sender", "sensor_id", "log", "model", "count", "type"],
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
  watch: {
    sensor_id: {
      immediate: true,
      handler: function (newValue, oldValue) {
        if (newValue !== oldValue) {
          let isData = false;
          for (const item of this.log) {
            for (const type of this.series) {
              if (item.data[type.options.name]) {
                isData = true;
                break;
              }
            }
          }
          if (this.model !== 1 && isData) {
            this.points = [...this.log];
          } else {
            this.points = [];
          }
        }
      },
    },
    log: {
      immediate: false,
      handler: function (newValue) {
        this.$nextTick(() => {
          if (this.$refs.chart) {
            const count =
              this.$refs.chart.$refs.chart.chart.series[0].points.length -
              newValue.length;
            if (count < 0) {
              let series = [this.type];
              if (this.type === "pm10" || this.type === "pm25") {
                series = ["pm10", "pm25"];
              }
              const newPoints = newValue.slice(count);
              for (const i in series) {
                for (let point of newPoints) {
                  this.$refs.chart.addPoint(i, [
                    Number(point.timestamp),
                    Number(point.data[series[i]]),
                  ]);
                }
              }
            }
          }
        });
      },
    },
  },
  computed: {
    link: function () {
      return sensors[this.sensor_id] ? sensors[this.sensor_id].link : "";
    },
    countTx: function () {
      return this.count;
    },
    last: function () {
      return this.log[this.log.length - 1];
    },
    date: function () {
      return moment(this.last.timestamp, "X").format("DD.MM.YYYY HH:mm:ss");
    },
    series: function () {
      if (this.type === "pm10" || this.type === "pm25") {
        return [
          {
            name: "PM10",
            color: "#e8b738",
            lineWidth: 1,
            data: [],
            options: {
              name: "pm10",
            },
          },
          {
            name: "PM2.5",
            color: "#89b268",
            lineWidth: 1,
            data: [],
            options: {
              name: "pm25",
            },
          },
        ];
      }
      return [
        {
          name: this.type,
          color: "#e8b738",
          lineWidth: 1,
          data: [],
          options: {
            name: this.type,
          },
        },
      ];
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
  vertical-align: baseline;
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
