import { converterPpmToMgm3 } from "./tools";

export default {
  label: "CO",
  unit: "mg/m3",
  icon: "vial-virus",
  chartColor: "#c1c1c1",
  colors: ["#60bc2a", "#ff9d00", "#fc0202"],
  range: [0, 15, 40],
  calculate: function (v) {
    return converterPpmToMgm3(v, 28.01);
  },
  info: "Сarbon monoxide. It is formed during the incomplete decomposition of organic compounds and during the combustion of biomass during forest fires.",
};
