import { toFixed } from "./tools";

export default {
  label: "Tmp",
  name: {
    en: "Temperature",
    ru: "Температура",
  },
  // Map layer picker: what the reader looks for, then the usual symbol
  mapName: {
    en: "Temperature",
    ru: "Температура",
  },
  nameshort: {
    en: "Temperature",
    ru: "Температура",
  },
  unit: "℃",
  zones: [
    {
      valueMax: -9,
      color: "var(--measure-darkblue)",
      label: {
        en: "Very cold",
        ru: "Очень холодно",
      },
    },
    {
      valueMax: 1,
      color: "var(--measure-blue)",
      label: {
        en: "Cold",
        ru: "Холодно",
      },
    },
    {
      valueMax: 10,
      color: "var(--measure-bluegreen)",
      label: {
        en: "Cool",
        ru: "Прохладно",
      },
    },
    {
      valueMax: 27,
      color: "var(--measure-green)",
      label: {
        en: "Warm",
        ru: "Тепло",
      },
    },
    {
      valueMax: 35,
      color: "var(--measure-yellow)",
      label: {
        en: "Hot",
        ru: "Жарко",
      },
    },
    {
      color: "var(--measure-orange)",
      label: {
        en: "Very hot",
        ru: "Очень жарко",
      },
    },
  ],
  states: ["danger", "attention", "good", "attention", "danger", "neutral"],
  calculate: function (v) {
    return toFixed(v);
  },

  description: [
    /** Общая справка */
    {
      tag: "p",
      text: {
        en: "Air temperature is a fundamental comfort parameter that influences thermal sensation, metabolism and safety. Indoors the generally comfortable range is 20 – 25 ℃; outdoors it varies with clothing, wind and humidity. Extreme cold risks hypothermia and frostbite, while high heat can lead to dehydration, heat exhaustion or heat-stroke.",
        ru: "Температура воздуха — ключевой показатель комфорта, влияющий на теплоощущение, обмен веществ и безопасность. В помещении комфорт обычно достигается при 20 – 25 ℃; на улице — зависит от одежды, ветра и влажности. Сильный холод опасен переохлаждением и обморожением, сильная жара — обезвоживанием, тепловым истощением и тепловым ударом.",
      },
    },

    {
      tag: "subtitle",
      text: {
        en: "If temperature falls below 0 ℃, follow these precautions:",
        ru: "Если температура опускается ниже 0 ℃, соблюдайте следующие меры предосторожности:",
      },
    },
    {
      tag: "ul",
      items: {
        en: [
          "Dress in layers, including hat and gloves; keep extremities dry.",
          "Limit time outdoors and take warm-up breaks indoors.",
          "Stay active to maintain body heat, but avoid sweating.",
          "Protect electronic devices and batteries from freezing.",
          "Watch for signs of hypothermia (shivering, slurred speech) and seek warmth immediately.",
        ],
        ru: [
          "Одевайтесь слоями, не забывайте шапку и перчатки; сохраняйте конечности сухими.",
          "Сократите время на улице, регулярно согревайтесь в помещении.",
          "Двигайтесь, чтобы сохранять тепло, но избегайте потоотделения.",
          "Защищайте электронику и аккумуляторы от переохлаждения.",
          "Следите за признаками гипотермии (озноб, невнятная речь) и немедленно согревайтесь.",
        ],
      },
    },

    {
      tag: "subtitle",
      text: {
        en: "If temperature rises above 30 ℃, take the following measures:",
        ru: "Если температура поднимается выше 30 ℃, примите следующие меры:",
      },
    },
    {
      tag: "ul",
      items: {
        en: [
          "Drink water regularly; avoid sugary and alcoholic drinks.",
          "Limit strenuous activity during the hottest hours (11 am – 4 pm).",
          "Wear light-coloured, loose, breathable clothing and a wide-brim hat.",
          "Use fans or air-conditioning and ventilate at night when it is cooler.",
          "Check on vulnerable people (children, elderly) and pets; never leave them in parked cars.",
        ],
        ru: [
          "Пейте воду регулярно, избегайте сладких и алкогольных напитков.",
          "Сведите тяжёлую активность к минимуму в самые жаркие часы (11:00 – 16:00).",
          "Носите светлую, лёгкую и дышащую одежду, головной убор с широкими полями.",
          "Используйте вентиляторы или кондиционер, проветривайте ночью, когда прохладнее.",
          "Заботьтесь о детях, пожилых и животных; никогда не оставляйте их в припаркованных машинах.",
        ],
      },
    },
  ],
};
