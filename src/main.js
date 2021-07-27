import Vue from "vue";
import VueHighcharts from "vue-highcharts";
import VueClipboard from "vue-clipboard2";
import Notifications from "vue-notification";
import VCalendar from "v-calendar";
import App from "./App.vue";
import router from "./router";

Vue.config.productionTip = false;
Vue.use(VueHighcharts);
VueClipboard.config.autoSetContainer = true;
Vue.use(VueClipboard);
Vue.use(Notifications);
Vue.use(VCalendar, {});

Vue.filter("measurement", function (value) {
  const types = {
    pm10: "PM10",
    pm25: "PM2.5",
    temperature: "Tmp",
    pressure: "Pr",
    humidity: "Hm",
    co: "CO",
    nh3: "NH3",
    no2: "NO2",
  };
  return types[value] || value;
});
Vue.filter("measurementFormat", function (value, type) {
  const types = {
    temperature: "℃",
    pressure: "mmHg",
    humidity: "%",
    co: "mg/m3",
    nh3: "mg/m3",
    no2: "mg/m3",
  };
  return types[type] ? `${value} ${types[type]}` : value;
});
Vue.filter("collapse", function (value) {
  return value.slice(0, 6) + "..." + value.slice(-4);
});

new Vue({
  router,
  render: (h) => h(App),
}).$mount("#app");
