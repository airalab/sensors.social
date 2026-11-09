import { toFixed } from "./tools";

export default {
  label: "Noise Max.",
  name: {
    en: "Maximum noise (Lmax)",
    ru: "Максимальный уровень шума (Lmax)",
  },
  nameshort: {
    en: "Noise Max.",
    ru: "Шум Макс.",
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
        en: "Maximum noise (Lmax) is the highest instantaneous sound level recorded during the measurement window, expressed in decibels (dB). Short peaks above 85 dB can start to damage hearing if they occur often, and single blasts above 120 dB may cause immediate pain or injury. Monitoring Lmax helps to catch those sudden loud events that the average level (Leq) may hide.",
        ru: "Максимальный уровень шума (Lmax) — это наивысшее мгновенное значение звука за период измерения, выраженное в децибелах (dB). Краткие пики выше 85 dB при частом повторении начинают повреждать слух, а одиночные всплески свыше 120 dB могут вызвать боль и мгновенную травму. Контроль Lmax позволяет выявить внезапные громкие события, которые средний показатель (Leq) «сглаживает».",
      },
    },
    {
      tag: "subtitle",
      text: {
        en: "If maximum noise levels exceed 85 dB, take the following precautions:",
        ru: "Если максимальный уровень шума превышает 85 dB, выполните следующие меры:",
      },
    },
    {
      tag: "ul",
      items: {
        en: [
          "Wear earplugs or noise-cancelling earmuffs when peaks are expected.",
          "Reduce the source volume or switch off alarm tones/beeps.",
          "Add soft furnishings or acoustic panels to absorb sudden sounds.",
          "Keep a safe distance: each doubling of the distance cuts the peak level by about 6 dB.",
          "Enable alerts on the noise monitor to warn you of dangerous spikes.",
        ],
        ru: [
          "Используйте беруши или противошумные наушники, если ожидаются всплески.",
          "Уменьшите громкость источника либо отключите звуковые сигналы и пиканье.",
          "Добавьте мягкие материалы или акустические панели для поглощения ударных звуков.",
          "Держитесь на расстоянии: каждое удвоение расстояния снижает пик примерно на 6 дБ.",
          "Включите оповещения на датчике шума, чтобы получать предупреждения о опасных пиках.",
        ],
      },
    },
  ],
};
