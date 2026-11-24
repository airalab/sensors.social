// import { converterPpmToMgm3 } from "./tools";

export default {
  label: "CO",
  name: {
    en: "Carbon monoxide",
    ru: "Угарный газ",
  },
  // Map layer picker: what the reader looks for, then the usual symbol
  mapName: {
    en: "Carbon monoxide CO",
    ru: "Угарный газ CO",
  },
  nameshort: {
    en: "CO",
    ru: "CO",
  },
  unit: "ppm",
  zones: [
    {
      valueMax: 0,
      color: "var(--measure-green)",
      label: {
        en: "Good",
        ru: "Хорошо",
      },
    },
    {
      valueMax: 2,
      color: "var(--measure-bluegreen)",
      label: {
        en: "Satisfyingly",
        ru: "Удовлетворительно",
      },
    },
    {
      valueMax: 4,
      color: "var(--measure-yellow)",
      label: {
        en: "Poor",
        ru: "Плохо",
      },
    },
    {
      color: "#7a00da",
      label: {
        en: "Very poor",
        ru: "Очень плохо",
      },
    },
  ],
  // calculate: function (v) {
  //   return converterPpmToMgm3(v, 28.01);
  // },
  info: "Carbon monoxide. It is formed during the incomplete decomposition of organic compounds and during the combustion of biomass during forest fires.",
  description:
    "The particles of CO (carbon monoxide) outdoors represent gaseous pollution formed during incomplete combustion of hydrocarbons, especially in the exhaust gases of vehicles. Elevated levels of CO can have a negative impact on health, leading to poisoning. Restricting emissions and using protective masks can help reduce CO levels and improve air quality.Outdoors, the level of CO pollution (carbon monoxide) is typically measured in milligrams per cubic meter (mg/m³) of air.",
  recommendations: [
    {
      recsCOText: "In case of elevated levels of CO outdoors, it is recommended to:",
      recsCO: [
        "Limit the time spent outdoors.",
        "Avoid physical activity, especially for individuals with respiratory problems.",
        "Close windows and doors to reduce the entry of polluted air into indoor spaces.",
        "Use masks with good filtration when necessary.",
        "Monitor information about air quality and follow recommendations from local health authorities.",
      ],
      recsCOText2:
        "These recommendations will help reduce the impact of carbon monoxide on health and provide greater protection.",
    },
  ],
};
