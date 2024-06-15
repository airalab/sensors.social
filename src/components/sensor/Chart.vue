<template>
  <Chart :options="chartOptions" ref="chart"></Chart>
</template>

<script>
import unitsettings from "../../measurements";
import { Chart } from 'highcharts-vue';

export default {
  components: { Chart },
  props: ["point", "log"],
  data() {
    return {
      chartOptions: {},
      provider: this.$route.params.provider,
      chartObj: null,
    }
  },
  computed: {

    series() {
      const data = this.log.map(e => { return [e.timestamp, e.data] });
      let result = [];

      data.forEach(e => {

        const timestamp = e[0] ?? null;

        for (const [unit, unitdata] of Object.entries(e[1])) {

          /* check/add unit name */
          if(!result.find(r => r.name.toLowerCase() === unit.toLowerCase())) {
            result.push({name: unit.toLowerCase()});
          }

          /* find unit by name to add data */
          const unitind = result.findIndex(e => e.name.toLowerCase() === unit.toLowerCase());

          if(unitind > -1 && unitdata) {

            /* + add time & measures numbers */
            if(!result[unitind]?.data) {
              result[unitind].data = [];
            }
            result[unitind].data.push([timestamp * 1000, parseFloat(unitdata)]);
            /* - add time & measures numbers */

            /* + add color zones */
            for (const [unitset, unitdataset] of Object.entries(unitsettings)) {
              if(unit.toLowerCase() === unitset.toLowerCase()) {
                if(unitdataset?.zones && !result[unitind]?.zones) {
                  result[unitind].zones = unitdataset.zones
                }
              }
            }
            /* - add color zones */

          }
        }
      });

      return result;
    },

    startpoint() {
      if(this.provider === 'realtime'){
        return Date.now();
      } else {
        let start = new Date();
        start.setHours(0,0,0,0);
        return start;
      }
    }
    
  },
  watch: {
    series(v) {

      /* Update all series */
      /* Maybe better to make here different adding:
      realtime - addPoint
      remote - setData */

      v.forEach((newdata, i) => {
        this.chartObj.series[i].setData(newdata.data, false);
      })
      
      this.chartObj.redraw();
    },
  },

  mounted() {
    const { chart } = this.$refs.chart;
    this.chartObj = chart;

    this.chartOptions = {
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
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        series: this.series,
        xAxis: {
          title: false,
          type: 'datetime',
          labels: {
            overflow: 'justify',
            /* https://api.highcharts.com/highcharts/xAxis.dateTimeLabelFormats */
            format: '{value: %H:%M }'
          }
        },
        yAxis: {
          title: false,
        },
        plotOptions: {
          
          series: {
            lineWidth: 2,
            states: {
                hover: {
                    lineWidth: 3
                }
            },
            pointStart: this.startpoint,
            // marker: {
            //     enabled: false
            // },
            dataLabels: {
              enabled: true,
              allowOverlap: true,
              formatter() {
                if (this.point.index == this.series.points.length - 1) {
                  return `<span style="color:${this.color}">${this.series.name}</span>`
                }
              }
            }
          },
        
        },
      }
    }
}
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