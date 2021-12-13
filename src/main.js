import Vue from "vue";
import VueHighcharts from "vue-highcharts";
import VueClipboard from "vue-clipboard2";
import Notifications from "vue-notification";
import VCalendar from "v-calendar";
import App from "./App.vue";
import router from "./router";
import { toFixed, measurements } from "./utils/measurement";

Vue.config.productionTip = false;
Vue.use(VueHighcharts);
VueClipboard.config.autoSetContainer = true;
Vue.use(VueClipboard);
Vue.use(Notifications);
Vue.use(VCalendar, {});

Vue.filter("measurement", function (value) {
  return measurements[value]?.label || value;
});
Vue.filter("measurementFormat", function (value, type) {
  return measurements[type]
    ? `${toFixed(value)} ${measurements[type].unit}`
    : toFixed(value);
});
Vue.filter("collapse", function (value) {
  if (!value) {
    return "";
  }
  return value.slice(0, 6) + "..." + value.slice(-4);
});

new Vue({
  router,
  render: (h) => h(App),
}).$mount("#app");
