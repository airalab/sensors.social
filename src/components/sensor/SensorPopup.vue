<template>
  <div
    class="container sensor-popup sensors-panel sensors-panel--center-right active popup-js"
  >
    <div :class="classList">
      <div class="sensor-popup__header-icon">
        <font-awesome-icon :icon="`fa-solid fa-face-${stateIcon}`" />
      </div>
      <div class="sensor-popup__header-wrapper">
        <h2>
          {{ $t("details.sensor") }}
          <Copy :msg="sensor_id" :title="`Sensor id: ${sensor_id}`">
            {{ $filters.collapse(sensor_id) }}
          </Copy>
        </h2>

        <div class="sensor-popup--subtitle">
          <span>
            <font-awesome-icon icon="fa-solid fa-stopwatch" /> {{ date }}
          </span>
          <span v-if="address">
            <font-awesome-icon icon="fa-solid fa-location-dot" />
            {{ address.address.join(", ") }}
          </span>
          <span>
            <a class="copy" :href="linkSensor" target="_blank">
              <font-awesome-icon
                icon="fa-solid fa-arrow-up-right-from-square"
              />
            </a>
          </span>

          <span v-if="link">
            <a :href="link" target="_blank">{{ link }}</a>
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
        <MeasureInfo v-if="measure" :state="measure" />
        <ul class="sensor-popup--data">
          <MeasureButton
            v-for="item in items"
            :key="item.id"
            :item="item"
            @select="(value) => (select = value)"
          />
        </ul>
      </template>

      <Chart
        v-if="log.length > 0"
        :model="model"
        :log="log"
        :measurement="measurement"
        :sensor_id="sensor_id"
      />

      <div class="text-tip">
        <span v-if="isLocationRussion">{{ $t("notice_with_fz") }}</span>
        <span v-else>{{ $t("notice_without_fz") }}</span>
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
import moment from "moment";
import config from "../../config";
import sensors from "../../sensors";
import generate, { getColor, getState } from "../../utils/color";
import { hidePath, showPath } from "../../utils/map/marker";
import { getStateIcon, measurements, toFixed } from "../../utils/measurement";
import Chart from "./Chart.vue";
import Copy from "./Copy.vue";
import MeasureButton from "./MeasureButton.vue";
import MeasureInfo from "./MeasureInfo.vue";

export default {
  emits: ["close"],
  props: ["sender", "sensor_id", "log", "model", "address", "type", "geo"],
  components: { MeasureButton, MeasureInfo, Chart, Copy },
  data() {
    return {
      select: "",
      measurement: this.type,
      isShowPath: false,
    };
  },
  computed: {
    isLocationRussion() {
      return (
        this.address.country === "Россия" ||
        this.address.country === "Russia" ||
        this.address.country === "Ρωσία"
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
    state() {
      if (this.select) {
        return this.measure.state;
      }
      return getState(this.scale, this.last.data[this.type]);
    },
    stateIcon() {
      return getStateIcon(this.state);
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
          icon: `fa-solid fa-${this.icon(item)}`,
          info: this.$filters.measurementInfo(item),
          state: getState(
            scale,
            this.last.data[item],
            measurements[item.toLowerCase()]
              ? measurements[item.toLowerCase()].states
              : undefined
          ),
          color: scale ? getColor(scale, this.last.data[item]) : "",
        });
      }
      return items;
    },
    classList() {
      return {
        [`sensor-popup__header`]: true,
        [`sensor-popup__header--${this.state}`]: this.state,
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
      return this.$router.resolve({
        name: "main",
        params: {
          provider: this.$route.params.provider || "remote",
          type: this.$route.params.type || "pm10",
          zoom: this.$route.params.zoom || config.MAP.zoom,
          lat: this.geo.lat,
          lng: this.geo.lng,
          sensor: this.sensor_id,
        },
      }).href;
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
  top: 40px;
  bottom: 0;
  right: 0;
  z-index: 14;
  width: 48%;
}

.sensor-popup.popup-js {
  padding-right: 0 !important;
  background-color: var(--sensor-popup-bg);
}

.sensor-popup.container {
  /* padding: calc(var(--gap) * 2); */
  padding: 0;
  padding-bottom: calc(var(--gap) * 6);
  /* overflow: hidden; */
}

.sensor-popup .popup__close {
  right: calc(var(--gap) * 2);
  /* top: var(--gap); */
  top: 1.5rem;
  color: #fff;
}

/* SENSOR POPUP */

.sensor-popup__header {
  min-height: 110px;
  padding: calc(var(--gap) * 2) var(--gap);
  display: flex;
  align-items: center;
  color: #fff;
}

.sensor-popup__header-wrapper .fa-copy {
  margin-left: var(--gap);
}

.sensor-popup__header--neutral {
  background-color: #747a80;
}

.sensor-popup__header--good {
  background-color: var(--color-green);
}

.sensor-popup__header--attention {
  background-color: var(--color-orange);
}

.sensor-popup__header--danger {
  background-color: var(--color-red);
}

.sensor-popup__header a {
  color: inherit;
}

.sensor-popup__header-icon {
  font-size: 3rem;
  margin-right: calc(var(--gap) * 2);
}
.sensor-popup--subtitle {
  /* margin-bottom: calc(var(--gap) * 2); */
  display: flex;
  align-items: center;
  /* justify-content: space-between; */
  font-family: var(--font-family--normal);
  text-transform: none;
}

.sensor-popup--subtitle span:not(:last-child) {
  margin-right: calc(var(--gap) * 2);
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
}

.sensor-popup--content img {
  max-width: 100%;
  width: 100%;
}
/* SENSOR POPUP end */

@media screen and (max-width: 1080px) {
  .sensors-panel {
    width: 90%;
  }
}

@media screen and (max-width: 580px) {
  h2 {
    font-size: 1rem;
  }

  .sensors-panel {
    position: absolute;
    top: calc(var(--gap) * 16);
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9;
    width: 100%;
  }

  .sensor-popup.container {
    /* padding-left: var(--gap);
      padding-right: var(--gap) !important; */
    padding-bottom: calc(var(--gap) * 5);
    /* overflow: hidden; */
  }

  .sensor-popup .popup__close {
    right: var(--gap);
  }

  .sensor-popup__header {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--gap);
  }

  .sensor-popup__header-icon {
    font-size: 2rem;
    line-height: 1.5;
    margin-right: 0;
  }

  .sensor-popup--subtitle span:not(:last-child) {
    margin-right: var(--gap);
  }
}
</style>
