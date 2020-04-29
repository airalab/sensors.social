import Vue from "vue";
import VueHighcharts from "vue-highcharts";
import App from "./App.vue";
import router from "./router";

Vue.config.productionTip = false;
Vue.use(VueHighcharts);

new Vue({
  router,
  render: (h) => h(App),
}).$mount("#app");
