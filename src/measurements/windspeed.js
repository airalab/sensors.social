export default {
  label: "Windspeed",
  name: {
    en: "Wind Speed",
    ru: "Скорость ветра",
  },
  // Map layer picker: what the reader looks for, then the usual symbol
  mapName: {
    en: "Wind speed",
    ru: "Скорость ветра",
  },
  nameshort: {
    en: "Wind Speed",
    ru: "Скорость ветра",
  },
  unit: "m/s",
  zones: [
    {
      valueMax: 1,
      color: "var(--measure-green)",
      label: {
        en: "Calm",
        ru: "Штиль",
      },
    },
    {
      valueMax: 3,
      color: "var(--measure-bluegreen)",
      label: {
        en: "Light breeze",
        ru: "Легкий ветер",
      },
    },
    {
      valueMax: 6,
      color: "var(--measure-yellow)",
      label: {
        en: "Moderate breeze",
        ru: "Умеренный ветер",
      },
    },
    {
      valueMax: 10,
      color: "var(--measure-orange)",
      label: {
        en: "Fresh breeze",
        ru: "Свежий ветер",
      },
    },
    {
      color: "var(--measure-red)",
      label: {
        en: "Strong wind",
        ru: "Сильный ветер",
      },
    },
  ],
};
