// PM2.5 breakpoints: US EPA AQI as revised 6 May 2024 (EPA fact sheet "2024 AQI for Fine Particle
// Pollution"): Good up to 9.0, Very Unhealthy up to 225.4, Hazardous from 225.5. The fact sheet gives
// "225.5+"; 325.4 as the AQI 500 anchor follows 40 CFR 58 App. G, not checked against the CFR text.
// PM10 unchanged.
export default [
  {
    valueMax: 50,
    pm25: { concentrationMin: 0.0, concentrationMax: 9.0 },
    pm10: { concentrationMin: 0, concentrationMax: 54 },
    color: "var(--measure-green)",
    label: {
      en: "Good",
      ru: "Хорошо",
    },
  },
  {
    valueMax: 100,
    pm25: { concentrationMin: 9.1, concentrationMax: 35.4 },
    pm10: { concentrationMin: 55, concentrationMax: 154 },
    color: "var(--measure-bluegreen)",
    label: {
      en: "Moderate",
      ru: "Умеренно",
    },
  },
  {
    valueMax: 150,
    pm25: { concentrationMin: 35.5, concentrationMax: 55.4 },
    pm10: { concentrationMin: 155, concentrationMax: 254 },
    color: "var(--measure-yellow)",
    label: {
      en: "Unhealthy for Sensitive Groups",
      ru: "Вредно для чувствительных групп",
    },
  },
  {
    valueMax: 200,
    pm25: { concentrationMin: 55.5, concentrationMax: 125.4 },
    pm10: { concentrationMin: 255, concentrationMax: 354 },
    color: "var(--measure-orange)",
    label: {
      en: "Unhealthy",
      ru: "Вредно",
    },
  },
  {
    valueMax: 300,
    pm25: { concentrationMin: 125.5, concentrationMax: 225.4 },
    pm10: { concentrationMin: 355, concentrationMax: 424 },
    color: "var(--measure-red)",
    label: {
      en: "Very Unhealthy",
      ru: "Очень вредно",
    },
  },
  {
    valueMax: 500,
    pm25: { concentrationMin: 225.5, concentrationMax: 325.4 },
    pm10: { concentrationMin: 425, concentrationMax: 604 },
    color: "var(--measure-darkred)",
    label: {
      en: "Hazardous",
      ru: "Опасно",
    },
  },
];
