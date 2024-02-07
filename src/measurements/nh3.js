import { converterPpmToMgm3 } from "./tools";

export default {
  label: "NH3",
  unit: "mg/m3",
  icon: "vial-virus",
  chartColor: "#a1e37a",
  colors: ["#60bc2a", "#ff9d00", "#fc0202"],
  range: [0, 15, 40],
  calculate: function (v) {
    return converterPpmToMgm3(v, 17.03);
  },
};
