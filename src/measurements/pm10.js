import { toFixed } from "./tools";

export default {
  label: "PM10",
  unit: "μg/m3",
  icon: "soap",
  chartColor: "#e8b738",
  colors: ["#60bc2a", "#ff9d00", "#fc0202"],
  range: [0, 51, 101, 251, 350],
  zones: [
    {
      value: 50,
      color: "#60bc2a",
    },
    {
      value: 100,
      color: "#12bfcc",
    },
    {
      value: 250,
      color: "#ff9d00",
    },
    {
      value: 350,
      color: "#ff4d00",
    },
    {
      color: "#7a00da",
    },
  ],
  calculate: function (v) {
    return toFixed(v);
  },
  info: "PM10 - suspended particles (PM - particulate matter) of a substance with a diameter of less than 10 micrometers (μm). Pollen and other allergens.",
};
