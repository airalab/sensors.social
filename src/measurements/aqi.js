import { toFixed } from "./tools";

// PM2.5 breakpoints: US EPA AQI as revised 6 May 2024 (EPA fact sheet "2024 AQI for Fine Particle
// Pollution"): Good up to 9.0, Very Unhealthy up to 225.4, Hazardous from 225.5. The fact sheet gives
// "225.5+"; 325.4 as the AQI 500 anchor follows 40 CFR 58 App. G, not checked against the CFR text.
// PM10 unchanged.
export default {
  label: "AQI",
  name: {
    en: "AQI (US EPA)",
    ru: "ИКВ (US EPA)",
  },
  nameshort: {
    en: "AQI",
    ru: "ИКВ",
  },
  unit: "",
  zones: [
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
  ],
  calculate: function (v) {
    return toFixed(v);
  },
  description: [
    {
      tag: "p",
      text: {
        en: "AQI (Air Quality Index) is a unified 0–500 scale that translates pollutant concentrations into an easy‑to‑read health impact indicator. This implementation follows US EPA methodology for particulate matter (PM2.5 and PM10).",
        ru: "AQI (индекс качества воздуха) — это единая шкала 0–500, которая переводит концентрации загрязнителей в понятный индикатор влияния на здоровье. Здесь используется методология US EPA для взвешенных частиц PM2.5 и PM10.",
      },
    },
    {
      tag: "subtitle",
      text: {
        en: "How AQI is calculated",
        ru: "Как рассчитывается AQI",
      },
    },
    {
      tag: "ul",
      items: {
        en: [
          "Raw sensor readings are averaged by minute, then by hour, then across a recent multi‑hour window.",
          "The averaged PM2.5 and PM10 concentrations are mapped to the AQI scale using official breakpoint tables.",
          "For each pollutant, the AQI is linearly interpolated within its breakpoint range; the final AQI is the maximum of PM2.5 and PM10.",
        ],
        ru: [
          "Исходные показания усредняются по минутам, затем по часам и далее по недавнему многокчасовому окну.",
          "Усреднённые концентрации PM2.5 и PM10 переводятся в шкалу AQI по официальным пороговым таблицам (брейкпоинтам).",
          "Для каждого загрязнителя AQI вычисляется линейной интерполяцией внутри соответствующего диапазона; итоговый AQI — максимум из PM2.5 и PM10.",
        ],
      },
    },
    {
      tag: "subtitle",
      text: {
        en: "Why AQI matters",
        ru: "Почему AQI важен",
      },
    },
    {
      tag: "ul",
      items: {
        en: [
          "Summarizes complex air pollution data into a single health‑oriented number.",
          "Helps to plan outdoor activities and protect sensitive groups (children, elderly, people with respiratory conditions).",
          "Supports consistent color‑coded categories: Good (0–50), Moderate (51–100), Unhealthy for Sensitive Groups (101–150), Unhealthy (151–200), Very Unhealthy (201–300), Hazardous (301–500).",
        ],
        ru: [
          "Сводит сложные данные о загрязнении воздуха к одному числу с фокусом на здоровье.",
          "Помогает планировать активность на улице и защищать чувствительные группы (дети, пожилые, люди с заболеваниями дыхательных путей).",
          "Использует единые цветовые категории: Хорошо (0–50), Умеренно (51–100), Вредно для чувствительных групп (101–150), Вредно (151–200), Очень вредно (201–300), Опасно (301–500).",
        ],
      },
    },
  ],
};
