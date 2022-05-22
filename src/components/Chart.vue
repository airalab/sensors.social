<template>
  <div class="chart">
    <highcharts :options="options" ref="chart"></highcharts>
  </div>
</template>

<script>
import moment from "moment";
import { measurements } from "../utils/measurement";

export default {
  props: ["log", "measurement", "sensor_id"],
  data() {
    return {
      datacollection: null,
      options: {
        title: false,
        chart: {
          type: "spline",
          height: 300,
          width: 500,
        },
        xAxis: {
          type: "datetime",
          labels: {
            formatter: function () {
              return moment(this.value, "X").format("HH:mm");
            },
          },
          title: false,
        },
        yAxis: {
          min: 0,
          title: false,
        },
        tooltip: {
          shared: true,
          crosshairs: true,
          formatter: function () {
            let data = "";
            this.points.forEach((d) => {
              data += "<b>" + d.series.name + "</b> = " + d.y + "<br />";
            });
            return (
              "<span>" +
              moment(this.x, "X").format("DD.MM.YYYY HH:mm:ss") +
              "</span><br />" +
              data
            );
          },
        },
        series: [],
      },
    };
  },
  computed: {
    series: function () {
      if (this.log.length > 0) {
        const measurementNames = Object.keys(this.log[0].data).map((item) =>
          item.toLowerCase()
        );
        const series = [];
        for (let measurement of measurementNames) {
          series.push({
            visible: measurement === this.measurement,
            name: measurement,
            color:
              measurements[measurement] && measurements[measurement].chartColor
                ? measurements[measurement].chartColor
                : "#e8b738",
            lineWidth: 1,
            data: [],
            options: {
              name: measurement,
            },
          });
        }
        return series;
      }
      // if (this.measurement === "pm10" || this.measurement === "pm25") {
      //   return [
      //     {
      //       name: "PM10",
      //       color: "#e8b738",
      //       lineWidth: 1,
      //       data: [],
      //       options: {
      //         name: "pm10",
      //       },
      //     },
      //     {
      //       name: "PM2.5",
      //       color: "#89b268",
      //       lineWidth: 1,
      //       data: [],
      //       options: {
      //         name: "pm25",
      //       },
      //     },
      //   ];
      // }
      return [
        {
          name: this.measurement,
          color: "#e8b738",
          lineWidth: 1,
          data: [],
          options: {
            name: this.measurement,
          },
        },
      ];
    },
  },
  mounted() {
    this.options.yAxis.min = this.getMinY();
    this.fillData();
  },
  watch: {
    sensor_id: function () {
      this.fillData();
    },
    measurement: function () {
      this.options.yAxis.min = this.getMinY();
      this.fillData();
    },
    log: {
      immediate: false,
      handler: function (newValue) {
        // $nextTick для случая если полностью обновился график
        this.$nextTick(() => {
          const count =
            this.$refs.chart.chart.series[0].points.length - newValue.length;
          if (count < 0) {
            let series = [this.measurement];
            if (this.measurement === "pm10" || this.measurement === "pm25") {
              series = ["pm10", "pm25"];
            }
            const newPoints = newValue.slice(count);
            for (const i in series) {
              for (let point of newPoints) {
                this.addPoint(i, [
                  Number(point.timestamp),
                  Number(point.data[series[i]]),
                ]);
              }
            }
          }
        });
      },
    },
  },
  methods: {
    getMinY() {
      return this.measurement === "temperature" ? -50 : 0;
    },
    fillData() {
      const series = this.series;
      for (const i in series) {
        series[i].data = this.log.map((item) => {
          return [
            Number(item.timestamp),
            Number(item.data[series[i].options.name]),
          ];
        });
      }
      this.options.series = series;
    },
    addPoint(index, point) {
      this.$refs.chart.chart.series[index].addPoint(point, true, false);
    },
  },
};
</script>

<style>
.chart {
  /* max-width: 400px; */
  margin: 0 auto;
}
</style>
