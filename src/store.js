import { defineStore } from "pinia";

export const useStore = defineStore({
  id: "main",
  state: () => ({
    // helps to color map black&white when popup is opened
    isColored: false,
    currentSensorPopupMeasures: [],
    currentActiveMeasure: "",
    idbBookmarkDbname: 'SensorsDBBookmarks',
    idbBookmarkVDbver: 1,
    idbBookmarkVDbtable: 'bookmarks',
    idbWatcherBroadcast: 'idbBookmarkChanges', /* this we need until IndexedDB Observer will be available in browsers */
    sensors: [] // all uploaded sensors (getting via broadcast messages)
  }),
  actions: {
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
