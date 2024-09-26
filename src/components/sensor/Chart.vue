<template>
  <Chart :constructor-type="'stockChart'" :options="chartOptions" ref="chart"></Chart>
</template>

<script>
import Highcharts from "highcharts";
import { Chart } from "highcharts-vue";
import stockInit from "highcharts/modules/stock";
import unitsettings from "../../measurements";

Highcharts.seriesTypes.spline.prototype.drawLegendSymbol = function (legend, item) {
  this.options.marker.enabled = true;
  Highcharts.LegendSymbol.lineMarker?.call(this, legend, item);
  this.options.marker.enabled = false;
};

stockInit(Highcharts);

export default {
  components: { Chart },
  props: ["point", "log"],
  data() {
    return {
      chartOptions: {},
      provider: this.$route.params.provider,
      chartObj: null,
    };
  },
  computed: {
    series() {
      const unitsettingsLowerCase = Object.fromEntries(
        Object.entries(unitsettings).map(([k, v]) => [k.toLowerCase(), v])
      );
      const result = [];
      for (const item of this.log) {
        if (item.data) {
          for (let keyname of Object.keys(item.data)) {
            keyname = keyname.toLowerCase();
            const i = result.findIndex((m) => m.name === keyname);
            if (i >= 0) {
              result[i].data.push([item.timestamp * 1000, item.data[keyname]]);
            } else {
              result.push({
                name: keyname,
                data: [[item.timestamp * 1000, parseFloat(item.data[keyname])]],
                zones: unitsettingsLowerCase[keyname]?.zones,
              });
            }
          }
        }
      }
      return result;
    },

    startpoint() {
      if (this.provider === "realtime") {
        return Date.now();
      } else {
        let start = new Date();
        start.setHours(0, 0, 0, 0);
        return start;
      }
    },
  },
  watch: {
    series(v) {
      /* Update all series */
      /* Maybe better to make here different adding:
      realtime - addPoint
      remote - setData */

      v.forEach((newdata, i) => {
        const id = this.chartObj.series.findIndex((m) => m.name === newdata.name);
        if (id >= 0) {
          this.chartObj.series[i].setData(newdata.data, false);
        } else {
          this.chartObj.addSeries(newdata);
        }
      });

      this.chartObj.redraw();
    },
  },

  mounted() {
    const { chart } = this.$refs.chart;
    this.chartObj = chart;

    this.chartOptions = {
      legend: {
        enabled: true,
      },
      rangeSelector: {
        inputEnabled: false,
        buttons: [
          {
            type: "all",
            text: "All",
            title: "View all",
          },
        ],
      },
      chart: {
        type: "spline",
        height: 400,
        /* for debugging */
        // events: {
        //   addSeries: (e) => {
        //     console.log('series added', e);
        //   },
        //   redraw: (e) => {
        //     console.log('series redraw', e);
        //   },
        // }
      },
      title: {
        text: "",
      },
      time: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      series: this.series,
      xAxis: {
        title: false,
        type: "datetime",
        labels: {
          overflow: "justify",
          /* https://api.highcharts.com/highcharts/xAxis.dateTimeLabelFormats */
          format: "{value: %H:%M }",
        },
      },
      yAxis: {
        title: false,
      },
      tooltip: {
        valueDecimals: 2,
      },
      // plotOptions: {
      //   series: {
      //     lineWidth: 2,
      //     states: {
      //       hover: {
      //         lineWidth: 3,
      //       },
      //     },
      //     pointStart: this.startpoint,
      //     // marker: {
      //     //     enabled: false
      //     // },
      //     dataLabels: {
      //       enabled: true,
      //       allowOverlap: true,
      //       formatter() {
      //         if (this.point.index == this.series.points.length - 1) {
      //           return `<span style="color:${this.color}">${this.series.name}</span>`;
      //         }
      //       },
      //     },
      //   },
      // },
    };
  },
};
</script>

<style>
/* rewrite some Highcharts styles */
.highcharts-legend-item {
  font-weight: 900;
}

.highcharts-legend-item .highcharts-graph,
.highcharts-legend-item .highcharts-point {
  stroke: #000 !important;
}

.highcharts-legend-item .highcharts-point {
  fill: #000 !important;
  stroke-width: 2;
}

.highcharts-legend-item-hidden text {
  fill: #999 !important;
  color: #999 !important;
  text-decoration: none !important;
}

.highcharts-legend-item-hidden .highcharts-graph,
.highcharts-legend-item-hidden .highcharts-point {
  stroke: #999 !important;
}

.highcharts-legend-item-hidden .highcharts-point {
  fill: #999 !important;
}
</style>
