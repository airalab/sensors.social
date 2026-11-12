import { toFixed } from "./tools";

export default {
  label: "PM2.5",
  name: {
    en: "Particulate matter with diameter ≤ 2.5 µm (PM2.5)",
    ru: "Взвешенные частицы диаметром до 2,5 мкм (PM2.5)",
  },
  nameshort: {
    en: "PM2.5",
    ru: "PM2.5",
  },
  unit: "μg/m3",
  // EEA European Air Quality Index bands (airindex.eea.europa.eu; revision ETC HE 2024/17, July 2025).
  // Defined for HOURLY mean concentrations: realtime markers show the last-hour mean, Daily Recap the
  // day's mean; the chart keeps colouring each reading. The Fair/Moderate border 15 is the WHO 2021 24-h guideline.
  hourlyMean: true,
  scaleNote: {
    en: "European Air Quality Index (EEA) bands. WHO 24-h guideline: 15 µg/m³.",
    ru: "Шкала Европейского индекса качества воздуха (EEA). Суточная норма ВОЗ: 15 мкг/м³.",
  },
  zones: [
    {
      valueMax: 5,
      color: "var(--measure-green)",
      label: {
        en: "Good",
        ru: "Хорошо",
      },
    },
    {
      valueMax: 15,
      color: "var(--measure-bluegreen)",
      label: {
        en: "Fair",
        ru: "Удовлетворительно",
      },
    },
    {
      valueMax: 50,
      color: "var(--measure-yellow)",
      label: {
        en: "Moderate",
        ru: "Умеренно",
      },
    },
    {
      valueMax: 90,
      color: "var(--measure-orange)",
      label: {
        en: "Poor",
        ru: "Плохо",
      },
    },
    {
      valueMax: 140,
      color: "var(--measure-red)",
      label: {
        en: "Very poor",
        ru: "Очень плохо",
      },
    },
    {
      color: "var(--measure-darkred)",
      label: {
        en: "Extremely poor",
        ru: "Крайне плохо",
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
        en: "PM 2.5 is atmospheric particles with a size of up to 2.5 micrometers, which include dust, soot, and smoke. They can be harmful to health, causing breathing problems, allergies, and cardiovascular diseases. Sources of PM 2.5 include industry, transportation, and household emissions. Monitoring and reducing their levels are important for health and clean air.",
        ru: "PM 2,5 (взвешенные частицы диаметром до 2,5 мкм) — пыль, сажа, дым и другие мелкие аэрозоли. Они проникают глубоко в лёгкие и могут вызывать затруднённое дыхание, аллергические реакции и сердечно-сосудистые заболевания. Основные источники PM 2,5 — промышленность, транспорт и бытовые выбросы. Контроль и снижение их концентрации важны для здоровья и чистого воздуха.",
      },
    },
    {
      tag: "subtitle",
      text: {
        en: "If PM2.5 levels are high, take the following precautions:",
        ru: "Если уровень PM 2,5 высок, соблюдайте следующие меры предосторожности:",
      },
    },
    {
      tag: "ul",
      items: {
        en: [
          "Stay indoors with good ventilation.",
          "Avoid outdoor physical activities.",
          "Keep windows and doors closed.",
          "Use face masks with good filtration.",
          "Monitor the air quality forecast.",
        ],
        ru: [
          "Оставайтесь в помещении с хорошей вентиляцией.",
          "Избегайте физических нагрузок на открытом воздухе.",
          "Держите окна и двери закрытыми.",
          "Используйте маски с хорошей фильтрацией.",
          "Следите за прогнозом качества воздуха.",
        ],
      },
    },
  ],
};
