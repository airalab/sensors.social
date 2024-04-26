<template>
  <div
    class="container sensor-popup popup-wrapper sensors-panel sensors-panel--center-right active popup-js"
  >
    <div :class="classList">
      <div class="sensor-popup__header-wrapper">
        <div class="sensor-popup--subtitle">
          <div class="sensor-popup__header-top-wrapper">
            <Bookmark
              :address="address.address && address.address.join(', ')"
              :link="linkSensor"
            />
            <button
              @click="shareData"
              class="share"
              :class="{ shared: isShared }"
            ></button>
          </div>

          <div class="sensor-address" v-if="address">
            <span>{{
              address.address.join(", ").length >= 45
                ? address.address.join(", ").slice(0, 45) + "..."
                : address.address.join(", ")
            }}</span>
          </div>

          <span v-if="link">
            <a :href="link" target="_blank">{{ link }}</a>
          </span>

          <span>
            <!-- {{ $t("details.sensor") }} -->
            <Copy
              :msg="sensor_id"
              :title="`Sensor id: ${sensor_id}`"
              :notify="$t('details.copied')"
            >
              {{ $filters.collapse(sensor_id) }}
            </Copy>
          </span>

          <div v-if="model === 3" class="sensors-switcher">
            <input type="checkbox" id="realtime" v-model="isShowPath" />
            <label for="realtime"></label>
            <span class="sensors-switcher-text">
              {{ $t("details.showpath") }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div ref="content" class="sensor-popup--content">
      <template v-if="last">
        <div class="sensor-popup--content-info">
          <!-- INPUT FOR CHANGING CHART -->
          <!-- calendar -->
          <!-- <div class="sensors-dateselect__calendar">
            <input
              type="date"
              v-model="start"
              :max="maxDate"
              :disabled="currentProvider == 'realtime'"
            />
            <span class="sensors-dateselect__calendar-button">
              <button type="button">
                <svg
                  width="17"
                  height="19"
                  viewBox="0 0 17 19"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clip-path="url(#clip0_23_68)">
                    <path
                      d="M4.85714 0C5.52879 0 6.07143 0.530664 6.07143 1.1875V2.375H10.9286V1.1875C10.9286 0.530664 11.4712 0 12.1429 0C12.8145 0 13.3571 0.530664 13.3571 1.1875V2.375H15.1786C16.1842 2.375 17 3.17285 17 4.15625V5.9375H0V4.15625C0 3.17285 0.815848 2.375 1.82143 2.375H3.64286V1.1875C3.64286 0.530664 4.18549 0 4.85714 0ZM0 7.125H17V17.2188C17 18.2021 16.1842 19 15.1786 19H1.82143C0.815848 19 0 18.2021 0 17.2188V7.125ZM2.42857 10.0938V11.2812C2.42857 11.6078 2.70179 11.875 3.03571 11.875H4.25C4.58393 11.875 4.85714 11.6078 4.85714 11.2812V10.0938C4.85714 9.76719 4.58393 9.5 4.25 9.5H3.03571C2.70179 9.5 2.42857 9.76719 2.42857 10.0938ZM7.28571 10.0938V11.2812C7.28571 11.6078 7.55893 11.875 7.89286 11.875H9.10714C9.44107 11.875 9.71429 11.6078 9.71429 11.2812V10.0938C9.71429 9.76719 9.44107 9.5 9.10714 9.5H7.89286C7.55893 9.5 7.28571 9.76719 7.28571 10.0938ZM12.75 9.5C12.4161 9.5 12.1429 9.76719 12.1429 10.0938V11.2812C12.1429 11.6078 12.4161 11.875 12.75 11.875H13.9643C14.2982 11.875 14.5714 11.6078 14.5714 11.2812V10.0938C14.5714 9.76719 14.2982 9.5 13.9643 9.5H12.75ZM2.42857 14.8438V16.0312C2.42857 16.3578 2.70179 16.625 3.03571 16.625H4.25C4.58393 16.625 4.85714 16.3578 4.85714 16.0312V14.8438C4.85714 14.5172 4.58393 14.25 4.25 14.25H3.03571C2.70179 14.25 2.42857 14.5172 2.42857 14.8438ZM7.89286 14.25C7.55893 14.25 7.28571 14.5172 7.28571 14.8438V16.0312C7.28571 16.3578 7.55893 16.625 7.89286 16.625H9.10714C9.44107 16.625 9.71429 16.3578 9.71429 16.0312V14.8438C9.71429 14.5172 9.44107 14.25 9.10714 14.25H7.89286ZM12.1429 14.8438V16.0312C12.1429 16.3578 12.4161 16.625 12.75 16.625H13.9643C14.2982 16.625 14.5714 16.3578 14.5714 16.0312V14.8438C14.5714 14.5172 14.2982 14.25 13.9643 14.25H12.75C12.4161 14.25 12.1429 14.5172 12.1429 14.8438Z"
                      fill="black"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_23_68">
                      <rect width="17" height="19" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </button>
            </span>
          </div> -->
          <ul class="sensor-popup--data">
            <MeasureButton
              v-for="item in items"
              :key="item.id"
              :item="item"
              :currentMeasure="store.currentSensorPopupMeasures"
              :defaultCurrentMeasure="type || items[0].text"
              @select="(value) => (select = value)"
            />
          </ul>
        </div>
      </template>

      <Chart
        v-if="log.length > 0"
        :model="model"
        :log="log"
        :measurement="measurement"
        :sensor_id="sensor_id"
        :type="type"
      />
      <div class="text-tip">
        <span v-if="isLocationRussion">{{ $t("notice_with_fz") }}</span>
        <span v-else>{{ $t("notice_without_fz") }}</span>

        <h3 v-if="donated_by" style="margin-top: 20px; text-align: right">
          {{ donated_by }}
        </h3>
      </div>
    </div>

    <a
      class="popup__close"
      href="javascript:;"
      @click.stop.prevent="$emit('close')"
    >
      <font-awesome-icon icon="fa-solid fa-xmark" />
    </a>
  </div>
</template>

<script>
import { useStore } from "@/store";
import moment from "moment";
import config from "../../config";
import measurements from "../../measurements";
import { toFixed } from "../../measurements/tools";
import sensors from "../../sensors";
import generate, { getState } from "../../utils/color";
import { hidePath, showPath } from "../../utils/map/marker";
import Chart from "./Chart.vue";
import Copy from "./Copy.vue";
import MeasureButton from "./MeasureButton.vue";
import Bookmark from "./Bookmark.vue";

export default {
  emits: ["close"],
  props: [
    "sender",
    "sensor_id",
    "log",
    "model",
    "address",
    "type",
    "geo",
    "donated_by",
    "currentProvider",
  ],
  components: { MeasureButton, Chart, Copy, Bookmark },
  data() {
    return {
      select: "",
      measurement: this.type,
      isShowPath: false,
      isSuccessCopy: false,
      store: useStore(),
      realtime: this.currentProvider === "realtime",
      start: moment().format("YYYY-MM-DD"),
      maxDate: moment().format("YYYY-MM-DD"),
      isShared: false,
    };
  },
  computed: {
    isLocationRussion() {
      return (
        this.address.country === "Россия" || this.address.country === "Russia"
      );
    },
    measure() {
      return this.items.find((item) => this.select === item.text);
    },

    scale() {
      return generate(
        measurements[this.type.toLowerCase()].colors,
        measurements[this.type.toLowerCase()].range
      );
    },
    hasIcon() {
      return (type) =>
        measurements[type.toLowerCase()] &&
        measurements[type.toLowerCase()].icon;
    },
    icon: function () {
      return (type) => {
        return this.hasIcon(type)
          ? measurements[type.toLowerCase()].icon
          : "vial";
      };
    },
    items() {
      const items = [];
      for (const item of Object.keys(this.last.data)) {
        let scale = null;
        if (
          measurements[item.toLowerCase()] &&
          measurements[item.toLowerCase()].colors
        ) {
          scale = generate(
            measurements[item.toLowerCase()].colors,
            measurements[item.toLowerCase()].range
          );
        }
        items.push({
          id: item,
          title: this.$filters.measurementFormat(this.last.data[item], item),
          text: this.$filters.measurement(item),
          state: getState(
            scale,
            this.last.data[item],
            measurements[item.toLowerCase()]
              ? measurements[item.toLowerCase()].states
              : undefined
          ),
          // icon: `fa-solid fa-${this.icon(item)}`,
          // info: this.$filters.measurementInfo(item),
          // color: scale ? getColor(scale, this.last.data[item]) : "",
        });
      }
      return items;
    },
    classList() {
      return {
        [`sensor-popup__header`]: true,
      };
    },
    measurementFilter(value) {
      return measurements[value.toLowerCase()]?.label || value;
    },
    measurementFormat(value, type) {
      return measurements[type.toLowerCase()]
        ? `${toFixed(value)} ${measurements[type.toLowerCase()].unit}`
        : toFixed(value);
    },
    collapse(value) {
      if (!value) {
        return "";
      }
      return value.slice(0, 6) + "..." + value.slice(-4);
    },
    linkSensor: function () {
      const route = this.$router.resolve({
        name: "main",
        params: {
          provider: this.$route.params.provider || config.DEFAUL_TYPE_PROVIDER,
          type: this.$route.params.type || "pm10",
          zoom: this.$route.params.zoom || config.MAP.zoom,
          lat: this.geo.lat,
          lng: this.geo.lng,
          sensor: this.sensor_id,
        },
      });
      return new URL(route.href, window.location.origin).href;
    },
    link: function () {
      return sensors[this.sensor_id] ? sensors[this.sensor_id].link : "";
    },
    last: function () {
      return this.log[this.log.length - 1];
    },
    date: function () {
      return moment(this.last.timestamp, "X").format("DD.MM.YYYY HH:mm:ss");
    },
    startDate: function () {
      return Number(
        moment(this.start + " 00:00:00", "YYYY-MM-DD HH:mm:ss").format("X")
      );
    },
  },
  methods: {
    // changing icon on copy success
    successCopy() {
      this.isSuccessCopy = true;
      setTimeout(() => {
        this.isSuccessCopy = false;
      }, 2000);
    },
    // share event
    shareData() {
      if (navigator.share && navigator.canShare) {
        navigator
          .share({
            title:
              "Decentralized Sensors Network - map of IoT sensors connected to Web3",
            url: this.linkSensor ? this.linkSensor : this.link,
          })
          .then(() => {
            console.log("Callback after sharing");
          })
          .catch(console.error);
      } else {
        // Implement fallback sharing option
        navigator.clipboard.writeText(this.linkSensor);
        this.isShared = true;
        setTimeout(() => {
          this.isShared = false;
        }, 2000);
      }
    },
  },
  updated() {
    setTimeout(() => {
      this.$refs.content.scrollTop = 0;
    }, 100);
  },
  watch: {
    sensor_id() {
      this.isShowPath = false;
    },
    isShowPath() {
      if (this.isShowPath) {
        showPath(this.sensor_id);
      } else {
        hidePath(this.sensor_id);
      }
    },
  },
};
</script>

<style scoped>
h2 {
  margin-bottom: calc(var(--gap) * 0.7);
}

.sensors-panel {
  position: absolute;
  top: 52px;
  bottom: 0;
  right: 0;
  z-index: 15;
  width: 58%;
}

.sensor-popup.popup-js {
  padding-right: 0 !important;
  color: #000;
  background-color: #fff;
  border-radius: 0;
}

.sensor-popup.container {
  /* padding: calc(var(--gap) * 2); */
  padding: 0;
  padding-bottom: calc(var(--gap) * 6);
  /* overflow: hidden; */
}

.sensor-popup .popup__close {
  left: calc(var(--gap) * -2);
  /* top: var(--gap); */
  top: 1.5rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size);
  background-color: #fff;
  color: #000;
}

.sensor-popup__header {
  min-height: 110px;
  padding: calc(var(--gap) * 2) var(--gap);
  display: flex;
  align-items: center;
  color: #000;
}

.sensor-popup__header a {
  color: inherit;
}

.sensor-popup__header-icon {
  font-size: 3rem;
  margin-right: calc(var(--gap) * 2);
}

.sensor-popup__header-wrapper {
  width: 100%;
}

.sensor-popup--subtitle {
  /* margin-bottom: calc(var(--gap) * 2); */
  display: flex;
  flex-direction: column;
  /* justify-content: space-between; */
  font-family: var(--font-family--normal);
  font-weight: 400;
  text-transform: none;
}

.sensor-popup__header-top-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sensor-popup--subtitle span:not(:last-child) {
  margin-right: var(--gap);
}

.sensor-address {
  display: flex;
  align-items: center;
  margin-bottom: calc(var(--gap) * 0.5);
  font-weight: 400;
  margin-right: auto;
}

.share {
  margin-right: 10px;
  width: 16px;
  height: 22px;
  padding: calc(var(--gap) * 0.3);
  background-image: url("data:image/svg+xml,%3Csvg width='16' height='22' viewBox='0 0 16 22' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 4L10.58 5.42L8.99 3.83V15H7.01V3.83L5.42 5.42L4 4L8 0L12 4ZM16 9V20C16 21.1 15.1 22 14 22H2C0.89 22 0 21.1 0 20V9C0 7.89 0.89 7 2 7H5V9H2V20H14V9H11V7H14C15.1 7 16 7.89 16 9Z' fill='%2303A5ED'/%3E%3C/svg%3E%0A");
  background-size: 16px 22px;
  background-position: center;
  background-repeat: no-repeat;
  border: none;
  cursor: pointer;
}

.share.shared {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%2303a5ed' d='M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z'/%3E%3C/svg%3E");
}

.sensor-popup .sensors-dateselect__calendar input {
  min-width: 145px;
  min-height: 40px;
}

.sensors-dateselect__calendar-button {
  right: 12px;
}

.sensor-address__link {
  position: absolute;
  display: inline-block;
  top: calc(var(--gap) * 2.5);
  right: calc(var(--gap) * 2);
  width: 33px;
  height: 33px;
  background-image: url("data:image/svg+xml,%3Csvg width='19' height='16' viewBox='0 0 19 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg clip-path='url(%23clip0_60_539)'%3E%3Cpath d='M17.5517 8.30142C19.3027 6.58709 19.3027 3.81077 17.5517 2.09643C16.0021 0.579318 13.56 0.382093 11.778 1.62916L11.7284 1.66254C11.2821 1.97506 11.1799 2.58191 11.4991 3.0158C11.8183 3.4497 12.4381 3.55286 12.8813 3.24033L12.9309 3.20696C13.9257 2.51212 15.2862 2.62135 16.1478 3.4679C17.124 4.42368 17.124 5.97114 16.1478 6.92692L12.6705 10.3374C11.6943 11.2932 10.1137 11.2932 9.13751 10.3374C8.27285 9.49084 8.16128 8.15882 8.87099 7.18786L8.90508 7.13932C9.22429 6.70239 9.11892 6.09554 8.67574 5.78605C8.23256 5.47656 7.60963 5.57669 7.29352 6.01058L7.25943 6.05913C5.98258 7.80078 6.18402 10.1917 7.7336 11.7089C9.48462 13.4232 12.3203 13.4232 14.0714 11.7089L17.5517 8.30142ZM1.44883 7.59142C-0.302196 9.30575 -0.302196 12.0821 1.44883 13.7964C2.9984 15.3135 5.44053 15.5107 7.22255 14.2637L7.27213 14.2303C7.71841 13.9178 7.82068 13.3109 7.50147 12.877C7.18226 12.4431 6.56243 12.34 6.11925 12.6525L6.06966 12.6859C5.07483 13.3807 3.71431 13.2715 2.85274 12.4249C1.87651 11.4661 1.87651 9.91867 2.85274 8.96289L6.32999 5.55545C7.30622 4.59967 8.88679 4.59967 9.86303 5.55545C10.7277 6.402 10.8393 7.73402 10.1296 8.70801L10.0955 8.75656C9.77625 9.19349 9.88162 9.80033 10.3248 10.1098C10.768 10.4193 11.3909 10.3192 11.707 9.88529L11.7411 9.83674C13.018 8.09206 12.8165 5.70109 11.2669 4.18398C9.51592 2.46964 6.68019 2.46964 4.92917 4.18398L1.44883 7.59142Z' fill='%2303A3ED'/%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='clip0_60_539'%3E%3Crect width='18.7297' height='14.2703' fill='white' transform='translate(0.135132 0.810852)'/%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E%0A");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 18px 14px;
  border: 2px solid var(--color-blue);
  border-radius: 100%;
  cursor: pointer;
}

.sensor-address__link.copySuccess {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%2303a5ed' d='M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z'/%3E%3C/svg%3E");
}

ul.sensor-popup--data {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  list-style: none;
  /* margin: var(--gap) 0; */
  padding: calc(var(--gap) * 0.7) 0;
  /* border-top: 1px solid var(--color-dark);
      border-bottom: 1px solid var(--color-dark); */
}

ul.sensor-popup--data .icon {
  display: inline-block;
  font-size: calc(var(--gap) * 1.5);
  text-align: center;
  width: calc(var(--gap) * 2.5);
}

.sensor-popup--content {
  height: 80%;
  overflow-y: auto;
  padding: calc(var(--gap) * 2);
  padding-top: 0;
  padding-right: calc(var(--gap) * 2.2);
  padding-bottom: calc(var(--gap) * 2);
  margin-top: var(--gap);
  margin-right: calc(var(--gap) * 2);
  display: flex;
  flex-direction: column;
}

.sensor-popup--content img {
  max-width: 100%;
  width: 100%;
}

.sensor-popup--content-info {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.sensor-popup--content-info .sensors-dateselect__calendar {
  display: inline-block;
}

.text-tip {
  display: flex;
  flex-direction: column;
  font-style: normal;
  font-size: calc(var(--font-size) * 0.7);
  color: #000;
}

.text-tip a {
  margin-top: calc(var(--gap) * 0.5);
  font-weight: 700;
  font-size: calc(var(--font-size) * 0.9);
}

@media screen and (max-width: 1080px) {
  .sensors-panel {
    width: 90%;
  }
}

@media screen and (max-width: 680px) {
  h2 {
    font-size: 1rem;
  }

  .sensors-panel {
    position: absolute;
    top: calc(var(--gap) * 12);
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 20;
    width: 100%;
  }

  .sensor-popup.container {
    padding-bottom: var(--gap);
  }

  .sensor-popup .popup__close {
    left: unset;
    top: -2rem;
    height: 37px;
    font-size: 1.4rem;
    background-color: #fff;
  }

  .sensor-popup__header {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: left;
    padding: var(--gap);
  }

  .sensor-popup__header-top-wrapper {
    /* flex-direction: column; */
    align-items: flex-start;
  }

  .sensor-popup__header-icon {
    font-size: 2rem;
    line-height: 1.5;
    margin-right: 0;
  }

  .sensor-address {
    gap: 10px;
    font-weight: 400;
    font-size: calc(var(--font-size) * 0.8);
    flex-direction: column-reverse;
    align-items: flex-start;
  }

  .sensor-popup--subtitle span:not(:last-child) {
    margin-right: var(--gap);
    align-self: flex-start;
  }

  .sensor-popup .sensors-dateselect__calendar input {
    font-size: 14px;
    height: 32px;
    min-width: 150px;
    /* height: 28px; */
  }

  .sensor-popup .sensors-dateselect__calendar-button {
    top: 8px;
  }

  .sensor-popup--content {
    padding: var(--gap);
    margin-top: 0;
    padding-top: 0;
    flex-direction: column;
    height: 65%;
    padding-bottom: calc(var(--gap) * 4);
  }

  ul.sensor-popup--data {
    gap: calc(var(--gap) * 0.3);
  }
}
</style>
