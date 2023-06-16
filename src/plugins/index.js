import Highcharts from "highcharts";
import { createPinia } from "pinia";
import VueHighcharts from "vue-highcharts";
import VueClipboard from "vue3-clipboard";
import router from "../router";
import { useFilters } from "./filters";
import { useIcons } from "./fontawesome";
import { useI18n } from "./i18n";
import { useNotification } from "./notification";

export function usePlugins(app) {
  app.use(createPinia());
  app.use(router);
  app.use(VueHighcharts, { Highcharts });
  app.use(VueClipboard, {
    autoSetContainer: true,
    appendToBody: true,
  });
  useI18n(app);
  useIcons(app);
  useFilters(app);
  useNotification(app);
}
