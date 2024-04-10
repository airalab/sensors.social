import { converterPpmToMgm3 } from "./tools";

export default {
  label: "CO",
  unit: "mg/m3",
  icon: "vial-virus",
  chartColor: "#c1c1c1",
  colors: ["#60bc2a", "#ff9d00", "#fc0202"],
  range: [0, 2, 4, 14],
  zones: [
    {
      value: 0,
      color: "#60bc2a",
    },
    {
      value: 2,
      color: "#12bfcc",
    },
    {
      value: 4,
      color: "#ff9d00",
    },
    {
      color: "#7a00da",
    },
  ],
  calculate: function (v) {
    return converterPpmToMgm3(v, 28.01);
  },
  info: "Сarbon monoxide. It is formed during the incomplete decomposition of organic compounds and during the combustion of biomass during forest fires.",
};
