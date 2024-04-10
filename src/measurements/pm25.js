import { toFixed } from "./tools";

export default {
  label: "PM2.5",
  unit: "μg/m3",
  icon: "soap",
  chartColor: "#89b268",
  colors: ["#60bc2a", "#ff9d00", "#fc0202"],
  range: [0, 36, 70, 151, 251],
  zones: [
    {
      value: 36,
      color: "#60bc2a",
    },
    {
      value: 70,
      color: "#12bfcc",
    },
    {
      value: 150,
      color: "#ff9d00",
    },
    {
      value: 250,
      color: "#ff4d00",
    },
    {
      color: "#7a00da",
    },
  ],
  calculate: function (v) {
    return toFixed(v);
  },
  info: "Suspended, solid and liquid particles with a diameter of 2.5 microns are an air pollutant.",
};
