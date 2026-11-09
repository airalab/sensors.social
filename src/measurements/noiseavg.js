import { toFixed } from "./tools";

export default {
  label: "Noise Avg.",
  name: {
    en: "Average noise (Leq)",
    ru: "Средний уровень шума (Leq)",
  },
  nameshort: {
    en: "Noise Avg.",
    ru: "Шум Средн.",
  },
  unit: "dB",

  zones: [
    {
      valueMax: 50,
      color: "var(--measure-green)",
      label: {
        en: "Faint",
        ru: "Тихо",
      },
    },
    {
      valueMax: 70,
      color: "var(--measure-bluegreen)",
      label: {
        en: "Moderate",
        ru: "Удовлетворительно",
      },
    },
    {
      valueMax: 85,
      color: "var(--measure-yellow)",
      label: {
        en: "Loud",
        ru: "Шумно",
      },
    },
    {
      valueMax: 100,
      color: "var(--measure-orange)",
      label: {
        en: "Very loud",
        ru: "Очень шумно",
      },
    },
    {
      color: "var(--measure-red)",
      label: {
        en: "Extremely loud",
        ru: "Экстремально шумно",
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
        en: "Average noise (Leq) represents the mean sound-pressure level over the measurement period and is expressed in decibels (dB). Prolonged exposure to average levels above 70 dB can lead to fatigue, sleep disturbances and, over years, hearing loss. Typical quiet rooms are 30–40 dB; normal conversation is about 60 dB; busy streets reach 70–80 dB.",
        ru: "Средний уровень шума (Leq) — это усреднённое звуковое давление за период измерения, выраженное в децибелах (dB). Длительное воздействие уровней выше 70 dB приводит к утомлению, нарушению сна и со временем — к потере слуха. Тихое помещение — 30–40 dB, обычная речь — около 60 dB, оживлённая улица — 70–80 dB.",
      },
    },
    {
      tag: "subtitle",
      text: {
        en: "If the average noise level exceeds 70 dB, take the following precautions:",
        ru: "Если средний уровень шума превышает 70 dB, выполните следующие меры предосторожности:",
      },
    },
    {
      tag: "ul",
      items: {
        en: [
          "Close windows and doors or move to a quieter room.",
          "Use earplugs, noise-cancelling headphones or earmuffs.",
          "Increase distance from the noise source; each doubling of the distance reduces the level by about 6 dB.",
          "Soften room acoustics with carpets, curtains and acoustic panels.",
          "Limit the time spent in noisy areas and schedule quiet breaks.",
        ],
        ru: [
          "Закройте окна и двери или перейдите в более тихое помещение.",
          "Используйте беруши, наушники с активным шумоподавлением или противошумные наушники-«муфты».",
          "Увеличьте расстояние до источника шума: каждое удвоение расстояния снижает уровень примерно на 6 дБ.",
          "Смягчите акустику помещения коврами, шторами и акустическими панелями.",
          "Сократите время нахождения в шумной среде и делайте паузы в тишине.",
        ],
      },
    },
  ],
};
