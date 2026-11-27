import { toFixed } from "./tools";

export default {
  label: "Noise",
  name: {
    en: "Noise",
    ru: "Шум",
  },
  nameshort: {
    en: "Noise",
    ru: "Шум",
  },
  unit: "dBA",

  zones: [
    {
      valueMax: 40,
      color: "var(--measure-green)",
      label: {
        en: "Faint",
        ru: "Тихо",
      },
    },
    {
      valueMax: 70,
      color: "var(--measure-bluegreen)",
      label: {
        en: "Moderate",
        ru: "Удовлетворительно",
      },
    },
    {
      valueMax: 80,
      color: "var(--measure-yellow)",
      label: {
        en: "Loud",
        ru: "Шумно",
      },
    },
    {
      valueMax: 100,
      color: "var(--measure-orange)",
      label: {
        en: "Very loud",
        ru: "Очень шумно",
      },
    },
    {
      color: "#7a00da",
      label: {
        en: "Extremely loud",
        ru: "Экстремально шумно",
      },
    },
  ],
  calculate: function (v) {
    return toFixed(v);
  },
  info: "Noise is what your ears or noise sensor can sense. Measured in Decibel (dB).",
};
