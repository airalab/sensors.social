import { toFixed } from "./tools";

export default {
  label: "PM10",
  unit: "μg/m3",
  icon: "soap",
  chartColor: "#e8b738",
  colors: ["#60bc2a", "#ff9d00", "#fc0202"],
  range: [0, 50, 90],
  calculate: function (v) {
    return toFixed(v);
  },
  info: "PM10 - suspended particles (PM - particulate matter) of a substance with a diameter of less than 10 micrometers (μm). Pollen and other allergens.",
};
