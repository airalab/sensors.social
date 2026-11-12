/**
 * European Air Quality Index (EEA) levels for particulate matter: airindex.eea.europa.eu,
 * revision ETC HE 2024/17 (July 2025). Bands apply to HOURLY mean concentrations, µg/m³.
 * The index has no 0–500 number: valueMax is the level, 1 (Good) … 6 (Extremely poor).
 * Same bands as the PM2.5 / PM10 map scale (src/measurements/pm25.js, pm10.js).
 */
export default [
  {
    valueMax: 1,
    pm25: { concentrationMin: 0, concentrationMax: 5 },
    pm10: { concentrationMin: 0, concentrationMax: 15 },
    color: "var(--measure-green)",
    label: {
      en: "Good",
      ru: "Хорошо",
    },
  },
  {
    valueMax: 2,
    pm25: { concentrationMin: 5, concentrationMax: 15 },
    pm10: { concentrationMin: 15, concentrationMax: 45 },
    color: "var(--measure-bluegreen)",
    label: {
      en: "Fair",
      ru: "Удовлетворительно",
    },
  },
  {
    valueMax: 3,
    pm25: { concentrationMin: 15, concentrationMax: 50 },
    pm10: { concentrationMin: 45, concentrationMax: 120 },
    color: "var(--measure-yellow)",
    label: {
      en: "Moderate",
      ru: "Умеренно",
    },
  },
  {
    valueMax: 4,
    pm25: { concentrationMin: 50, concentrationMax: 90 },
    pm10: { concentrationMin: 120, concentrationMax: 195 },
    color: "var(--measure-orange)",
    label: {
      en: "Poor",
      ru: "Плохо",
    },
  },
  {
    valueMax: 5,
    pm25: { concentrationMin: 90, concentrationMax: 140 },
    pm10: { concentrationMin: 195, concentrationMax: 270 },
    color: "var(--measure-red)",
    label: {
      en: "Very poor",
      ru: "Очень плохо",
    },
  },
  {
    valueMax: 6,
    pm25: { concentrationMin: 140, concentrationMax: Infinity },
    pm10: { concentrationMin: 270, concentrationMax: Infinity },
    color: "var(--measure-darkred)",
    label: {
      en: "Extremely poor",
      ru: "Крайне плохо",
    },
  },
];
