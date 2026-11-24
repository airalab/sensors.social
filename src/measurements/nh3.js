import { converterPpmToMgm3 } from "./tools";

export default {
  label: "NH3",
  name: {
    en: "Ammonia",
    ru: "Аммиак",
  },
  // Map layer picker: what the reader looks for, then the usual symbol
  mapName: {
    en: "Ammonia NH₃",
    ru: "Аммиак NH₃",
  },
  nameshort: {
    en: "NH3",
    ru: "NH3",
  },
  unit: "mg/m3",
  zones: [
    {
      valueMax: 15,
      color: "var(--measure-green)",
      label: {
        en: "Good",
        ru: "Хорошо",
      },
    },
    {
      valueMax: 40,
      color: "var(--measure-yellow)",
      label: {
        en: "Satisfyingly",
        ru: "Удовлетворительно",
      },
    },
    {
      color: "#fc0202",
      label: {
        en: "Poor",
        ru: "Плохо",
      },
    },
  ],
  calculate: function (v) {
    return converterPpmToMgm3(v, 17.03);
  },
};
