import { toFixed } from "./tools";

export default {
  label: "Pr",
  name: {
    en: "Atmospheric pressure",
    ru: "Атмосферное давление",
  },
  // Map layer picker: what the reader looks for, then the usual symbol
  mapName: {
    en: "Pressure",
    ru: "Давление",
  },
  nameshort: {
    en: "Pressure",
    ru: "Давление",
  },
  unit: "mmHg",

  zones: [
    {
      valueMax: 747,
      color: "var(--measure-bluegreen)",
      label: {
        en: "Very low",
        ru: "Очень низкое давление",
      },
    },
    {
      valueMax: 767,
      color: "var(--measure-green)",
      label: {
        en: "Normal",
        ru: "Нормальное давление",
      },
    },
    {
      valueMax: 775,
      color: "var(--measure-yellow)",
      label: {
        en: "High",
        ru: "Высокое давление",
      },
    },
    {
      color: "var(--measure-orange)",
      label: {
        en: "Very high",
        ru: "Очень высокое давление",
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
        en: "Atmospheric pressure is the weight of the air column pressing on the Earth’s surface, expressed here in millimetres of mercury (mmHg). The long-term mean at sea level is ≈ 760 mmHg. Barometric swings reflect weather systems: falling pressure often precedes clouds and storms, while rising pressure brings clear, calm conditions. Sudden changes can affect well-being, causing headaches, dizziness or fluctuations in blood pressure in sensitive people.",
        ru: "Атмосферное давление — это вес столба воздуха, давящий на поверхность Земли; измеряется в миллиметрах ртутного столба (мм рт. ст.). Среднее значение на уровне моря ≈ 760 мм рт. ст. Перепады барометра связаны с погодными фронтами: понижение чаще предвещает облачность и осадки, повышение — ясную и тихую погоду. Резкие колебания могут сказываться на самочувствии метеочувствительных людей: вызывать головные боли, головокружение, перепады артериального давления.",
      },
    },
    {
      tag: "subtitle",
      text: {
        en: "If pressure drops below 750 mmHg, consider the following advice:",
        ru: "При понижении давления ниже 750 мм рт. ст. воспользуйтесь следующими рекомендациями:",
      },
    },
    {
      tag: "ul",
      items: {
        en: [
          "Stand up slowly to avoid dizziness and faintness.",
          "Stay hydrated; warm drinks can help improve circulation.",
          "Ventilate the room for fresh oxygen-rich air.",
          "Rest if you feel lethargic or have a weather-related headache.",
          "Discuss any persistent symptoms with your doctor, especially if you take cardiovascular medication.",
        ],
        ru: [
          "Вставайте медленно, чтобы избежать головокружения и слабости.",
          "Пейте больше жидкости; тёплые напитки улучшают кровообращение.",
          "Проветривайте помещение, чтобы обеспечить приток кислорода.",
          "Отдохните, если чувствуете сонливость или «погодную» головную боль.",
          "При стойком недомогании обратитесь к врачу, особенно если принимаете сердечно-сосудистые препараты.",
        ],
      },
    },
    {
      tag: "subtitle",
      text: {
        en: "If pressure rises above 770 mmHg, take these measures:",
        ru: "При повышении давления выше 770 мм рт. ст. примите следующие меры:",
      },
    },
    {
      tag: "ul",
      items: {
        en: [
          "Limit strenuous outdoor activity if you have hypertension.",
          "Maintain comfortable indoor humidity to ease breathing.",
          "Drink plenty of water and eat light meals.",
          "Reduce caffeine and alcohol, which can elevate blood pressure.",
          "Regularly monitor your blood pressure and follow medical advice on medication adjustment.",
        ],
        ru: [
          "Ограничьте тяжёлые нагрузки на улице, особенно при склонности к гипертонии.",
          "Поддерживайте комфортную влажность в помещении для лёгкого дыхания.",
          "Пейте достаточно воды, отдавайте предпочтение лёгкой пище.",
          "Сократите потребление кофеина и алкоголя, повышающих давление.",
          "Регулярно контролируйте артериальное давление и корректируйте терапию по рекомендации врача.",
        ],
      },
    },
  ],
};
