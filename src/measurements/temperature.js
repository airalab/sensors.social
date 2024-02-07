import { toFixed } from "./tools";

export default {
  label: "Tmp",
  unit: "℃",
  icon: "temperature-high",
  chartColor: "#2d7ac7",
  colors: ["#fc0202", "#ff9d00", "#60bc2a", "#ff9d00", "#fc0202"],
  range: [-26, -25, -10, 25, 30],
  states: ["danger", "attention", "good", "attention", "danger", "neutral"],
  calculate: function (v) {
    return toFixed(v);
  },
  info: "Показатель температуры воздуха",
};
