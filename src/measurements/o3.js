export default {
  label: "O3",
  name: {
    en: "Ozone",
    ru: "Озон",
  },
  // Map layer picker: what the reader looks for, then the usual symbol
  mapName: {
    en: "Ozone O₃",
    ru: "Озон O₃",
  },
  nameshort: {
    en: "O₃",
    ru: "O₃",
  },
  unit: "ppb",
  zones: [
    {
      valueMax: 54,
      color: "var(--measure-green)",
      label: {
        en: "Good",
        ru: "Хорошо",
      },
    },
    {
      valueMax: 70,
      color: "var(--measure-bluegreen)",
      label: {
        en: "Moderate",
        ru: "Умеренно",
      },
    },
    {
      valueMax: 85,
      color: "var(--measure-yellow)",
      label: {
        en: "Unhealthy for sensitive groups",
        ru: "Вредно для чувствительных групп",
      },
    },
    {
      color: "#fc0202",
      label: {
        en: "Unhealthy",
        ru: "Вредно",
      },
    },
  ],
  description:
    "Ozone (O₃) at ground level is formed by sunlight-driven reactions of NOₓ and VOCs. It can irritate lungs and reduce breathing capacity. This sensor reports O₃ in parts per billion (ppb).",
};
