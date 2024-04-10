export default {
  label: "GC",
  unit: "μR/h",
  icon: "circle-radiation",
  chartColor: "#e99152",
  range: [0.01, 0.1, 1, 10],
  zones: [
    {
      value: 0.01,
      color: "#60bc2a",
    },
    {
      value: 0.1,
      color: "#03a5ed",
    },
    {
      value: 1,
      color: "#ff9d00",
    },
    {
      value: 10,
      color: "#ff4d00",
    },
    {
      color: "#7a00da",
    },
  ],
};
