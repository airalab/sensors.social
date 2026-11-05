import { toFixed } from "./tools";
import { measurementValue } from "./aliases";

export default {
  label: "Dose rate",
  name: {
    en: "Radiation dose rate",
    ru: "Мощность дозы излучения",
  },
  nameshort: {
    en: "Dose rate",
    ru: "Мощность дозы",
  },
  unit: "nSv/h",
  zoneLabelsAreRanges: true,
  scaleNote: {
    en: "EURDEP display ranges. Colour shows the measured dose rate, not a safety classification.",
    ru: "Диапазоны отображения EURDEP. Цвет показывает измеренную мощность дозы, а не категорию безопасности.",
  },

  // Bounds and colours from the EURDEP Simple Map legend in its official help:
  // https://remap.jrc.ec.europa.eu/img/eurdep-simple-map-layout-web-updated.png
  // Upper bounds are inclusive, following the shared measurement-zone lookup.
  zones: [
    {
      valueMax: 100,
      color: "#1dafaf",
      label: {
        en: "0–100",
        ru: "0–100",
      },
    },
    {
      valueMax: 200,
      color: "#1d8baf",
      label: {
        en: "100–200",
        ru: "100–200",
      },
    },
    {
      valueMax: 300,
      color: "#1d66af",
      label: {
        en: "200–300",
        ru: "200–300",
      },
    },
    {
      valueMax: 500,
      color: "#1d41af",
      label: {
        en: "300–500",
        ru: "300–500",
      },
    },
    {
      valueMax: 2000,
      color: "#411daf",
      label: {
        en: "500–2000",
        ru: "500–2000",
      },
    },
    {
      color: "#661daf",
      label: {
        en: ">2000",
        ru: ">2000",
      },
    },
  ],
  calculate: function (v) {
    return toFixed(measurementValue("dose_rate_nsv_h", v));
  },
  description: [
    {
      tag: "p",
      text: {
        en: "Radiation dose rate is shown in nanosieverts per hour (nSv/h). 1,000 nSv/h = 1 µSv/h. These readings are separate from the RadSens exposure rate in µR/h.",
        ru: "Мощность дозы излучения показана в нанозивертах в час (нЗв/ч, nSv/h). 1000 нЗв/ч = 1 мкЗв/ч. Эти показания отображаются отдельно от мощности экспозиционной дозы RadSens в мкР/ч.",
      },
    },
    {
      tag: "p",
      text: {
        en: "The colour scale follows the EURDEP Simple Map legend: 0–100, 100–200, 200–300, 300–500, 500–2000 and above 2000 nSv/h. These are display ranges, not safety limits. Natural background varies with location, altitude and weather. Source: https://remap.jrc.ec.europa.eu/Help/Simple.aspx.",
        ru: "Цветовая шкала соответствует легенде EURDEP Simple Map: 0–100, 100–200, 200–300, 300–500, 500–2000 и выше 2000 нЗв/ч. Это диапазоны отображения, а не пределы безопасности. Естественный фон зависит от местности, высоты и погоды. Источник: https://remap.jrc.ec.europa.eu/Help/Simple.aspx.",
      },
    },
  ],
};
