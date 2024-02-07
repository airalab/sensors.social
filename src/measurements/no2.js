import { converterPpmToMgm3 } from "./tools";

export default {
  label: "NO2",
  unit: "mg/m3",
  icon: "vial-virus",
  chartColor: "#d4dd53",
  colors: ["#60bc2a", "#ff9d00", "#fc0202"],
  range: [0, 1, 5],
  calculate: function (v) {
    return converterPpmToMgm3(v, 46.01);
  },
};
