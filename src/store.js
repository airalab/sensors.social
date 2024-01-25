import { defineStore } from "pinia";

export const useStore = defineStore({
  id: "main",
  state: () => ({
    theme: "",
    // helps to color map black&white when popup is opened
    isColored: false,
    currentSensorPopupMeasures: [],
    currentActiveMeasure: "",
  }),
  actions: {
    initTheme() {
      const cachedTheme = localStorage.theme ? localStorage.theme : false;
      const userPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      let theme = "light";
      if (cachedTheme) {
        theme = cachedTheme;
      } else if (userPrefersDark) {
        theme = "dark";
      }
      this.theme = theme;
      localStorage.theme = theme;
    },
    toggleTheme() {
      switch (localStorage.theme) {
        case "light":
          this.theme = "dark";
          localStorage.theme = "dark";
          break;

        default:
          this.theme = "light";
          localStorage.theme = "light";
          break;
      }
    },
    // helps to color map black&white when popup is opened
    colorMap() {
      this.isColored = true;
    },
    removeColorMap() {
      this.isColored = false;
    },
    // add/remove active state to tabs in sensor popup
    addToggleState(measure) {
      if (!this.currentSensorPopupMeasures.includes(measure)) {
        this.currentSensorPopupMeasures.push(measure.replace(".", ""));
      } else {
        this.currentSensorPopupMeasures =
          this.currentSensorPopupMeasures.filter((item) => item !== measure);
      }
    },
    selectCurrentActiveMeasure(measure, directClick = false) {
      if (this.currentActiveMeasure !== measure) {
        this.currentActiveMeasure = measure;
        if (directClick) {
          this.addToggleState(measure);
        }
      } else if (this.currentSensorPopupMeasures.length) {
        this.currentActiveMeasure = "";
        this.currentActiveMeasure = measure;
        if (directClick) {
          this.addToggleState(measure);
        }
      } else {
        this.addToggleState(measure);
        this.currentActiveMeasure = "";
      }
    },
    removeAllCurrentMeasures() {
      this.currentSensorPopupMeasures = [];
    },
    removeActiveCurrentMeasure() {
      this.currentActiveMeasure = "";
    },
  },
});
