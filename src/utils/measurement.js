function converterPpmToMgm3(v, molecularWeight) {
  return Number(+((v * molecularWeight) / 24.05526).toFixed(4));
}

export const measurements = {
  pm10: {
    colors: [
      "#00796b",
      "#00796b",
      "#f9a825",
      "#e65100",
      "#dd2c00",
      "#dd2c00",
      "#8c0084",
    ],
    range: [0, 25, 50, 75, 100, 500],
    rangeView: [
      [100, 500],
      [80, 100],
      [60, 75],
      [40, 50],
      [20, 25],
      [0, 0],
    ],
    calc: function (v) {
      return v;
    },
  },
  pm25: {
    colors: [
      "#00796b",
      "#00796b",
      "#f9a825",
      "#e65100",
      "#dd2c00",
      "#dd2c00",
      "#8c0084",
    ],
    range: [0, 25, 50, 75, 100, 500],
    rangeView: [
      [100, 500],
      [80, 100],
      [60, 75],
      [40, 50],
      [20, 25],
      [0, 0],
    ],
    calc: function (v) {
      return v;
    },
  },
  co: {
    colors: [
      "#00796b",
      "#00796b",
      "#f9a825",
      "#e65100",
      "#dd2c00",
      "#dd2c00",
      "#8c0084",
    ],
    range: [0, 5, 10, 15, 20, 40],
    rangeView: [
      [100, 40],
      [80, 20],
      [60, 15],
      [40, 10],
      [20, 5],
      [0, 0],
    ],
    calc: function (v) {
      return converterPpmToMgm3(v, 28.01);
    },
  },
  nh3: {
    colors: [
      "#00796b",
      "#00796b",
      "#f9a825",
      "#e65100",
      "#dd2c00",
      "#dd2c00",
      "#8c0084",
    ],
    range: [0, 5, 10, 15, 20, 40],
    rangeView: [
      [100, 40],
      [80, 20],
      [60, 15],
      [40, 10],
      [20, 5],
      [0, 0],
    ],
    calc: function (v) {
      return converterPpmToMgm3(v, 17.03);
    },
  },
  no2: {
    colors: [
      "#00796b",
      "#00796b",
      "#f9a825",
      "#e65100",
      "#dd2c00",
      "#dd2c00",
      "#8c0084",
    ],
    range: [0, 0.5, 1, 1.5, 2, 5],
    rangeView: [
      [100, 5],
      [80, 2],
      [60, 1.5],
      [40, 1],
      [20, 0.5],
      [0, 0],
    ],
    calc: function (v) {
      return converterPpmToMgm3(v, 46.01);
    },
  },
};

export default function (param) {
  return measurements[param] || measurements["pm10"];
}
