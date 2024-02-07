import { toFixed } from "./tools";

export default {
  label: "PM2.5",
  unit: "μg/m3",
  icon: "soap",
  chartColor: "#89b268",
  colors: ["#60bc2a", "#ff9d00", "#fc0202"],
  range: [0, 50, 90],
  calculate: function (v) {
    return toFixed(v);
  },
  info: "Suspended, solid and liquid particles with a diameter of 2.5 microns are an air pollutant.",
};
