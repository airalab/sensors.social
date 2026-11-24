export default {
  label: "Dew Point",
  name: {
    en: "Dew point",
    ru: "Точка росы",
  },
  // Map layer picker: what the reader looks for, then the usual symbol
  mapName: {
    en: "Dew point",
    ru: "Точка росы",
  },
  nameshort: {
    en: "Dew point",
    ru: "Точка росы",
  },
  unit: "℃",

  zones: [
    {
      valueMax: 10,
      color: "var(--measure-orange)",
      label: {
        en: "Very Dry Air",
        ru: "Очень сухой воздух",
      },
    },
    {
      valueMax: 15,
      color: "var(--measure-yellow)",
      label: {
        en: "Dry",
        ru: "Сухо",
      },
    },
    {
      valueMax: 18,
      color: "var(--measure-green)",
      label: {
        en: "Comfortable",
        ru: "Комфортно",
      },
    },
    {
      valueMax: 21,
      color: "var(--measure-bluegreen)",
      label: {
        en: "Humid",
        ru: "Влажно",
      },
    },
    {
      valueMax: 24,
      color: "var(--measure-blue)",
      label: {
        en: "High Humidity Level",
        ru: "Высокий уровень влажности",
      },
    },
    {
      color: "var(--measure-darkblue)",
      label: {
        en: "Extremely Humid",
        ru: "Очень влажно",
      },
    },
  ],
  description: [
    {
      tag: "p",
      text: {
        en: "Dew point is the temperature at which air becomes saturated with water vapor and condensation begins. It indicates the actual moisture content in the air, unlike relative humidity which depends on temperature. A higher dew point means more moisture in the air, making it feel more humid and uncomfortable.",
        ru: "Точка росы — это температура, при которой воздух насыщается водяным паром и начинается конденсация. Она показывает реальное содержание влаги в воздухе, в отличие от относительной влажности, которая зависит от температуры. Чем выше точка росы, тем больше влаги в воздухе и тем более влажно и некомфортно.",
      },
    },
    {
      tag: "subtitle",
      text: {
        en: "Why is dew point important?",
        ru: "Почему важна точка росы?",
      },
    },
    {
      tag: "ul",
      items: {
        en: [
          "Indicates actual moisture content regardless of temperature changes",
          "Helps predict comfort levels and potential for condensation",
          "Important for health: high dew points can worsen respiratory conditions",
          "Affects building materials: condensation can cause mold and damage",
          "Useful for outdoor activities: high dew points make exercise more difficult",
        ],
        ru: [
          "Показывает реальное содержание влаги независимо от изменений температуры",
          "Помогает предсказать комфорт и возможность конденсации",
          "Важно для здоровья: высокая точка росы может ухудшить дыхательные заболевания",
          "Влияет на строительные материалы: конденсация может вызвать плесень и повреждения",
          "Полезно для активного отдыха: высокая точка росы затрудняет физические упражнения",
        ],
      },
    },
    {
      tag: "subtitle",
      text: {
        en: "Comfort levels by dew point:",
        ru: "Уровни комфорта по точке росы:",
      },
    },
    {
      tag: "ul",
      items: {
        en: [
          "Below 10°C (50°F): Very dry, may cause skin and respiratory irritation",
          "10-15°C (50-59°F): Dry but comfortable for most people",
          "15-18°C (59-65°F): Comfortable for most activities",
          "18-21°C (65-70°F): Noticeably humid, some discomfort",
          "21-24°C (70-75°F): Uncomfortable for most people",
          "Above 24°C (75°F): Oppressive, dangerous for outdoor activities",
        ],
        ru: [
          "Ниже 10°C: Очень сухо, может вызвать раздражение кожи и дыхательных путей",
          "10-15°C: Сухо, но комфортно для большинства людей",
          "15-18°C: Комфортно для большинства видов деятельности",
          "18-21°C: Заметно влажно, некоторый дискомфорт",
          "21-24°C: Некомфортно для большинства людей",
          "Выше 24°C: Угнетающе, опасно для активного отдыха",
        ],
      },
    },
  ],
};
