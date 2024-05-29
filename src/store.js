import { defineStore } from "pinia";
import config from "./config";

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
    sensors: [], // all uploaded sensors (getting via broadcast messages)
    /* mapposition explainer: */
    /* first onload we're trying to find user's geolocation */
    /* if it's not possible we're trying to get last location from local storage (now it's "map-position" in localStorage) */
    /* if nothing has worked we take config geo or 0 meridian if something with config happened */
    mapposition: {
      zoom: config?.MAP.zoom || '4',
      lat:  config?.MAP.position.lat || '0',
      lng:  config?.MAP.position.lng || '0',
    },
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
    setmapposition(lat, lng, zoom) {
      this.mapposition.lat = lat;
      this.mapposition.lng = lng;
      this.mapposition.zoom = zoom;
      localStorage.setItem("map-position", JSON.stringify({lat, lng, zoom}));
    }
  },
});
