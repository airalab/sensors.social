import measurements from "../measurements";
import { toFixed } from "../measurements/tools";

export function useFilters(app) {
  app.config.globalProperties.$filters = {
    measurement(value) {
      return measurements[value.toLowerCase()]?.label || value;
    },
    measurementFormat(value, type) {
      return measurements[type.toLowerCase()]
        ? `${toFixed(value)} ${measurements[type.toLowerCase()].unit}`
        : toFixed(value);
    },
    // measurementInfo(type) {
    //   return measurements[type.toLowerCase()]?.info || "";
    // },
    collapse(value) {
      if (!value) {
        return "";
      }
      return value.slice(0, 6) + "..." + value.slice(-4);
    },
  };
}
