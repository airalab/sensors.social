export default {
  label: "NO2",
  name: {
    en: "Nitrogen Dioxide",
    ru: "Диоксид азота",
  },
  // Map layer picker: what the reader looks for, then the usual symbol
  mapName: {
    en: "Exhaust NO₂",
    ru: "Выхлопы NO₂",
  },
  nameshort: {
    en: "NO₂",
    ru: "NO₂",
  },
  unit: "ppb",
  zones: [
    {
      valueMax: 53,
      color: "var(--measure-green)",
      label: {
        en: "Good",
        ru: "Хорошо",
      },
    },
    {
      valueMax: 100,
      color: "var(--measure-bluegreen)",
      label: {
        en: "Moderate",
        ru: "Умеренно",
      },
    },
    {
      valueMax: 360,
      color: "#fc0202",
      label: {
        en: "Unhealthy",
        ru: "Вредно",
      },
    },
    {
      color: "#7a00da",
      label: {
        en: "Very unhealthy",
        ru: "Очень вредно",
      },
    },
  ],
  description:
    "Nitrogen dioxide (NO₂) is a harmful gas produced mainly by fuel combustion (traffic, heating). It irritates airways and can worsen asthma. This sensor reports NO₂ in parts per billion (ppb).",
};
