import { toFixed } from "./tools";

export default {
  label: "Hm",
  name: {
    en: "Humidity",
    ru: "Влажность",
  },
  // Map layer picker: what the reader looks for, then the usual symbol
  mapName: {
    en: "Humidity",
    ru: "Влажность",
  },
  nameshort: {
    en: "Humidity",
    ru: "Влажность",
  },
  unit: "%",
  zones: [
    {
      valueMax: 30,
      color: "var(--measure-orange)",
      label: {
        en: "Very dry",
        ru: "Очень сухо",
      },
    },
    {
      valueMax: 40,
      color: "var(--measure-yellow)",
      label: {
        en: "Dry",
        ru: "Сухо",
      },
    },
    {
      valueMax: 60,
      color: "var(--measure-green)",
      label: {
        en: "Comfortable",
        ru: "Комфортно",
      },
    },
    {
      valueMax: 70,
      color: "var(--measure-bluegreen)",
      label: {
        en: "Humid",
        ru: "Влажно",
      },
    },
    {
      color: "var(--measure-blue)",
      label: {
        en: "Very humid",
        ru: "Очень влажно",
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
        en: "Relative humidity shows how much water vapour the air holds compared with the maximum it could hold at the same temperature. Indoors the optimal range is 40–60 %. Below this the air feels dry and can irritate skin and airways; above it the room becomes stuffy and promotes mould growth and heat stress.",
        ru: "Относительная влажность показывает, сколько водяного пара содержится в воздухе по отношению к возможному максимуму при данной температуре. Оптимальный диапазон в помещении — 40–60 %. При низких значениях воздух “сушит” кожу и слизистые, при высоких — становится душно, повышается риск плесени и перегрева.",
      },
    },
    {
      tag: "subtitle",
      text: {
        en: "If humidity falls below 40 %, take the following measures:",
        ru: "Если влажность опускается ниже 40 %, выполните следующие рекомендации:",
      },
    },
    {
      tag: "ul",
      items: {
        en: [
          "Run a humidifier or place open containers of water near heat sources.",
          "Ventilate briefly but regularly to bring in moister outdoor air.",
          "Drink enough water and use skin moisturisers or saline sprays for mucous membranes.",
          "Add indoor plants that release moisture.",
          "Avoid excessive heating ‒ warmer air dries out faster.",
        ],
        ru: [
          "Включите увлажнитель или поставьте открытые ёмкости с водой около отопительных приборов.",
          "Проветривайте коротко, но регулярно, чтобы впускать более влажный наружный воздух.",
          "Пейте достаточно воды, увлажняйте кожу и слизистые (соляные спреи).",
          "Используйте комнатные растения, которые испаряют влагу.",
          "Не перегревайте помещение: тёплый воздух быстрее пересушивается.",
        ],
      },
    },
    {
      tag: "subtitle",
      text: {
        en: "If humidity rises above 60 %, take the following measures:",
        ru: "Если влажность поднимается выше 60 %, выполните следующие рекомендации:",
      },
    },
    {
      tag: "ul",
      items: {
        en: [
          "Ventilate more often or use a mechanical ventilation/AC system with dehumidification.",
          "Switch on bathroom and kitchen exhaust fans while cooking or showering.",
          "Avoid drying clothes indoors ‒ or do so in a ventilated room.",
          "Use a portable dehumidifier in persistently damp areas.",
          "Monitor humidity and ventilate again if readings stay high.",
        ],
        ru: [
          "Чаще проветривайте или используйте вентиляцию/кондиционер с осушением воздуха.",
          "Включайте вытяжки в ванной и на кухне во время готовки и душа.",
          "Не сушите бельё в жилой зоне, либо сушите при открытом окне.",
          "Используйте портативный осушитель в постоянно сырых помещениях.",
          "Следите за показателями влажности и проветривайте повторно при долгом превышении.",
        ],
      },
    },
  ],
};
