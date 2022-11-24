export function toFixed(num, dec = 4) {
  return +Number(num).toFixed(dec);
}
function converterPpmToMgm3(v, molecularWeight) {
  return toFixed((v * molecularWeight) / 24.05526);
}

export const states = ["good", "attention", "danger", "neutral"];
export const stateIcons = ["smile", "frown-open", "dizzy", "meh"];
export function getStateIcon(name) {
  return stateIcons[states.findIndex((item) => item === name)];
}

export const measurements = {
  pm10: {
    label: "PM10",
    unit: "μg/m3",
    icon: "soap",
    chartColor: "#e8b738",
    colors: ["#60bc2a", "#ff9d00", "#fc0202"],
    range: [0, 50, 90],
    calc: function (v) {
      return toFixed(Number(v));
    },
    info: "PM10 - suspended particles (PM - particulate matter) of a substance with a diameter of less than 10 micrometers (μm). Pollen and other allergens.",
  },
  pm25: {
    label: "PM2.5",
    unit: "μg/m3",
    icon: "soap",
    chartColor: "#89b268",
    colors: ["#60bc2a", "#ff9d00", "#fc0202"],
    range: [0, 50, 90],
    calc: function (v) {
      return toFixed(Number(v));
    },
    info: "Suspended, solid and liquid particles with a diameter of 2.5 microns are an air pollutant.",
  },
  co: {
    label: "CO",
    unit: "mg/m3",
    icon: "vial-virus",
    chartColor: "#c1c1c1",
    colors: ["#60bc2a", "#ff9d00", "#fc0202"],
    range: [0, 15, 40],
    calc: function (v) {
      return converterPpmToMgm3(v, 28.01);
    },
    info: "Сarbon monoxide. It is formed during the incomplete decomposition of organic compounds and during the combustion of biomass during forest fires.",
  },
  nh3: {
    label: "NH3",
    unit: "mg/m3",
    icon: "vial-virus",
    chartColor: "#a1e37a",
    colors: ["#60bc2a", "#ff9d00", "#fc0202"],
    range: [0, 15, 40],
    calc: function (v) {
      return converterPpmToMgm3(v, 17.03);
    },
  },
  no2: {
    label: "NO2",
    unit: "mg/m3",
    icon: "vial-virus",
    chartColor: "#d4dd53",
    colors: ["#60bc2a", "#ff9d00", "#fc0202"],
    range: [0, 1, 5],
    calc: function (v) {
      return converterPpmToMgm3(v, 46.01);
    },
  },
  temperature: {
    label: "Tmp",
    unit: "℃",
    icon: "temperature-high",
    chartColor: "#2d7ac7",
    colors: ["#fc0202", "#ff9d00", "#60bc2a", "#ff9d00", "#fc0202"],
    range: [-26, -25, -10, 25, 30],
    states: ["danger", "attention", "good", "attention", "danger", "neutral"],
    calc: function (v) {
      return toFixed(Number(v));
    },
    info: "Показатель температуры воздуха",
  },
  airtemp: {
    label: "Airtemp",
    unit: "℃",
  },
  airtempmin: {
    label: "MinAirtemp",
    unit: "℃",
  },
  airtempavg: {
    label: "AvgAirtemp",
    unit: "℃",
  },
  airtempmax: {
    label: "MaxAirtemp",
    unit: "℃",
  },
  soiltemp: {
    label: "Soiltemp",
    unit: "℃",
  },
  rainfall: {
    label: "Rainfall",
    unit: "mm",
  },
  sat5: {
    label: "Sat5",
    unit: "",
  },
  sat10: {
    label: "Sat10",
    unit: "",
  },
  windang: {
    label: "Windang",
    unit: "°",
    icon: "wind",
  },
  windspeed: {
    label: "Windspeed",
    unit: "m/s",
    icon: "wind",
  },
  windspeedmax: {
    label: "Windspeedmax",
    unit: "m/s",
  },
  pm1: {
    label: "PM1",
    unit: "μg/m3",
    icon: "soap",
    chartColor: "#ff99e9",
  },
  pressure: {
    label: "Pr",
    unit: "mmHg",
    icon: "arrows-down-to-line",
  },
  humidity: {
    label: "Hm",
    unit: "%",
    icon: "droplet",
    chartColor: "#6fd3ff",
  },
  gc: {
    label: "GC",
    unit: "μR/h",
    icon: "circle-radiation",
    chartColor: "#e99152",
  },
};

export default function (param) {
  return measurements[param] || measurements["pm10"];
}
