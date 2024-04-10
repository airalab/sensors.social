<template>
  <div style="margin: 20px 0">
    <highcharts :options="options" ref="chart"></highcharts>
  </div>
</template>

<script>
import { useStore } from "@/store";
import moment from "moment";
import measurements from "../../measurements";
import { moveMarkerTime } from "../../utils/map/marker";

export default {
  props: ["log", "measurement", "sensor_id", "model", "type"],
  data() {
    const self = this;
    return {
      datacollection: null,
      options: {
        title: false,
        chart: {
          type: "spline",
          height: 400,
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
          title: false,
        },
        tooltip: {
          shared: true,
          crosshairs: true,
          formatter: function () {
            if (self.model === 3) {
              const point = self.log.find((item) => item.timestamp === this.x);
              moveMarkerTime(self.sensor_id, point);
            }

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
        plotOptions: {
          series: {
            events: {
              mouseOut: function () {
                if (self.model === 3) {
                  const point = self.log[self.log.length - 1];
                  moveMarkerTime(self.sensor_id, point, true);
                }
              },
              legendItemClick: function (n) {
                let name = n;

                if (!n) {
                  name = self.store.currentActiveMeasure;
                }

                if (n.target) {
                  name = n.target.name;
                  let measure = n.target.name;

                  if (name === "temperature") {
                    measure = "tmp";
                  } else if (name === "humidity") {
                    measure = "hm";
                  }

                  self.store.selectCurrentActiveMeasure(
                    measure.toUpperCase(),
                    true
                  );
                }

                if (name) {
                  if (name === "TMP") {
                    name = "temperature";
                  } else if (name === "HM") {
                    name = "humidity";
                  }

                  const item = self.series.filter(
                    (m) => m.name === name.replace(".", "").toLowerCase()
                  );

                  self.toggleTabState(item[0]);
                }
              },
            },
          },
        },
        series: [],
      },
      store: useStore(),
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
            // color: "#000",
            zones: measurements[measurement.toLowerCase()].zones,
            lineWidth: 1,
            data: [],
            options: {
              name: measurement,
            },
          });
        }
        let hasVisible = series.find((item) => item.visible === true);
        if (!hasVisible && series.length > 0) {
          series[0].visible = true;
        }
        return series;
      }
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
    storeMeasures() {
      return this.store.currentActiveMeasure;
    },
  },
  mounted() {
    this.fillData();
  },
  watch: {
    sensor_id: function () {
      this.fillData();
    },
    measurement: function () {
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
    // for toggling tabs state
    storeMeasures: {
      handler: function () {
        this.options.plotOptions.series.events.legendItemClick(
          this.store.currentActiveMeasure
        );
      },
      deep: true,
    },
  },
  methods: {
    fillData() {
      const series = this.series;
      for (const i in series) {
        series[i].data = this.log.map((item) => {
          item.data = Object.fromEntries(
            Object.entries(item.data).map(([k, v]) => [k.toLowerCase(), v])
          );
          return [
            Number(item.timestamp),
            Number(item.data[series[i].options.name]),
          ];
        });
      }
      this.options.series = series;
      if (!this.store.currentActiveMeasure && !this.$props.type)
        this.store.selectCurrentActiveMeasure(
          this.options.series[0].name.toUpperCase(),
          true
        );

      if (!this.store.currentActiveMeasure && this.$props.type) {
        let measure = this.$props.type;
        if (this.$props.type === "temperature") {
          measure = "tmp";
        } else if (this.$props.type === "humidity") {
          measure = "hm";
        }
        this.store.selectCurrentActiveMeasure(measure.toUpperCase(), true);
      }
    },
    addPoint(index, point) {
      this.$refs.chart.chart.series[index].addPoint(point, true, false);
    },
    // helps toggle active/inactive tab and graph
    toggleTabState(item) {
      const measure = this.$refs.chart.chart.series.filter(
        (m) => m.name === item.name
      );

      if (this.$refs.chart.chart.series.length) {
        if (
          this.$refs.chart.chart.series[measure[0].index].name === "temperature"
        ) {
          this.store.addToggleState("TMP");
        } else if (
          this.$refs.chart.chart.series[measure[0].index].name === "humidity"
        ) {
          this.store.addToggleState("HM");
        } else {
          this.store.addToggleState(
            this.$refs.chart.chart.series[measure[0].index].name
              .toUpperCase()
              .replace(".", "")
          );
        }

        if (!this.$refs.chart.chart.series[measure[0].index].visible) {
          this.$refs.chart.chart.series[measure[0].index].show();
        } else {
          this.$refs.chart.chart.series[measure[0].index].hide();
        }
      }
    },
  },
};
</script>

<style>
.highcharts-legend-item path {
  fill: #000 !important;
}
</style>
