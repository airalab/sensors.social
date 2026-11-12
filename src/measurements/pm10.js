import { toFixed } from "./tools";

export default {
  label: "PM10",
  name: {
    en: "Particulate matter with diameter ≤ 10 µm (PM10)",
    ru: "Взвешенные частицы диаметром до 10 мкм (PM10)",
  },
  nameshort: {
    en: "PM10",
    ru: "PM10",
  },
  unit: "μg/m3",
  // EEA European Air Quality Index bands (airindex.eea.europa.eu; revision ETC HE 2024/17, July 2025).
  // Defined for HOURLY mean concentrations: realtime markers show the last-hour mean, Daily Recap the
  // day's mean; the chart keeps colouring each reading. The Fair/Moderate border 45 is the WHO 2021 24-h guideline.
  hourlyMean: true,
  scaleNote: {
    en: "European Air Quality Index (EEA) bands. WHO 24-h guideline: 45 µg/m³.",
    ru: "Шкала Европейского индекса качества воздуха (EEA). Суточная норма ВОЗ: 45 мкг/м³.",
  },
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
      valueMax: 45,
      color: "var(--measure-bluegreen)",
      label: {
        en: "Fair",
        ru: "Удовлетворительно",
      },
    },
    {
      valueMax: 120,
      color: "var(--measure-yellow)",
      label: {
        en: "Moderate",
        ru: "Умеренно",
      },
    },
    {
      valueMax: 195,
      color: "var(--measure-orange)",
      label: {
        en: "Poor",
        ru: "Плохо",
      },
    },
    {
      valueMax: 270,
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
        en: "PM 10 (Particulate Matter 10) consists of atmospheric particles with a size of up to 10 µm, including dust, soot and other pollutants. They can cause health problems by affecting breathing and contributing to respiratory diseases. Sources include industrial emissions, road dust and fuel combustion.",
        ru: "PM 10 (взвешенные частицы до 10 мкм) — пыль, сажа и другие аэрозоли. Частицы проникают в дыхательные пути и вызывают болезни органов дыхания. Основные источники — промышленные выбросы, дорожная пыль и сгорание топлива.",
      },
    },
    {
      tag: "subtitle",
      text: {
        en: "If PM10 levels are high, take the following precautions:",
        ru: "При повышенном уровне PM 10 рекомендуется:",
      },
    },
    {
      tag: "ul",
      items: {
        en: [
          "Limit the time spent outdoors.",
          "Avoid intense physical activity, especially for people with respiratory problems.",
          "Keep windows and doors closed to reduce indoor pollution.",
          "Use well-filtering masks if necessary.",
          "Monitor air-quality information and heed local health-authority advice.",
        ],
        ru: [
          "Сократите время пребывания на улице.",
          "Избегайте активных нагрузок, особенно при заболеваниях органов дыхания.",
          "Держите окна и двери закрытыми, чтобы снизить попадание загрязнённого воздуха внутрь.",
          "При необходимости используйте маски с хорошей фильтрацией.",
          "Следите за данными о качестве воздуха и рекомендациями местных органов здравоохранения.",
        ],
      },
    },
  ],
};
