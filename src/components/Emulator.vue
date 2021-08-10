<template>
  <div class="panel">
    <button :class="win ? 'min' : 'max'" @click="minimize">
      {{ win ? "&utrif;" : "&dtrif;" }}
    </button>
    <h4 class="title">History</h4>
    <div v-show="win">
      <div style="text-align: left; margin-bottom: 10px;">
        <div class="field">
          Start:
          <v-date-picker
            v-model="start"
            is24hr
            mode="dateTime"
            :model-config="modelConfig"
          >
            <template v-slot="{ inputValue, inputEvents, togglePopover }">
              <div class="field-calendar">
                <input
                  class="input-calendar"
                  :value="inputValue"
                  @input="inputEvents.input"
                  @change="inputEvents.change"
                  @keyup="inputEvents.keyup"
                  :disabled="status > 0"
                />
                <button
                  class="btn-calendar"
                  @click="togglePopover({ placement: 'auto-start' })"
                  :disabled="status > 0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    class="w-4 h-4 fill-current"
                  >
                    <path
                      d="M1 4c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4zm2 2v12h14V6H3zm2-6h2v2H5V0zm8 0h2v2h-2V0zM5 9h2v2H5V9zm0 4h2v2H5v-2zm4-4h2v2H9V9zm0 4h2v2H9v-2zm4-4h2v2h-2V9zm0 4h2v2h-2v-2z"
                    ></path>
                  </svg>
                </button>
              </div>
            </template>
          </v-date-picker>
        </div>
        <div class="field">
          End:
          <v-date-picker
            v-model="end"
            is24hr
            mode="dateTime"
            :model-config="modelConfig"
          >
            <template v-slot="{ inputValue, inputEvents, togglePopover }">
              <div class="field-calendar">
                <input
                  class="input-calendar"
                  :value="inputValue"
                  @input="inputEvents.input"
                  @change="inputEvents.change"
                  @keyup="inputEvents.keyup"
                  :disabled="status > 0"
                />
                <button
                  class="btn-calendar"
                  @click="togglePopover({ placement: 'auto-start' })"
                  :disabled="status > 0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    class="w-4 h-4 fill-current"
                  >
                    <path
                      d="M1 4c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4zm2 2v12h14V6H3zm2-6h2v2H5V0zm8 0h2v2h-2V0zM5 9h2v2H5V9zm0 4h2v2H5v-2zm4-4h2v2H9V9zm0 4h2v2H9v-2zm4-4h2v2h-2V9zm0 4h2v2h-2v-2z"
                    ></path>
                  </svg>
                </button>
              </div>
            </template>
          </v-date-picker>
        </div>
        <div class="field">
          Speed:<br />
          <select v-model="speed">
            <option value="60">1 мин/сек</option>
            <option value="600">10 мин/сек</option>
            <option value="3600">1 час/сек</option>
            <option value="21600">6 часов/сек</option>
            <option value="86400">1 сутки/сек</option>
          </select>
        </div>
      </div>
      <div style="margin: 10px 0;">
        <button class="btn" @click="run" v-if="status === 0">Start</button>
        <button class="btn" v-else-if="status === 3" disabled>Load...</button>
        <template v-else>
          <button class="btn" @click="play" v-if="status === 2">Play</button>
          <button class="btn" @click="pause" v-if="status === 1">Pause</button>
          <button class="btn" @click="stop">Stop</button>
        </template>
      </div>
      <div v-if="(status == 1 || status == 2) && time > 0" class="time">
        {{ timeFormat }}
      </div>
      <a class="link" :href="$provider.exportUrl(startTimestamp, endTimestamp)">
        Download data in csv format
      </a>
    </div>
  </div>
</template>

<script>
import moment from "moment";

export default {
  props: ["time", "status"],
  data() {
    return {
      modelConfig: {
        type: "string",
        mask: "DD.MM.YYYY HH:mm:00",
      },
      start: moment().subtract(1, "day").format("DD.MM.YYYY HH:mm:00"),
      end: moment().format("DD.MM.YYYY HH:mm:00"),
      speed: 3600,
      interval: 1000,
      win: true,
    };
  },
  computed: {
    timeFormat: function () {
      return moment(this.time, "X").format("DD.MM.YYYY HH:mm:ss");
    },
    startTimestamp: function () {
      return Number(moment(this.start, "DD.MM.YYYY HH:mm:ss").format("X"));
    },
    endTimestamp: function () {
      return Number(moment(this.end, "DD.MM.YYYY HH:mm:ss").format("X"));
    },
  },
  methods: {
    run() {
      this.$emit("start", {
        start: this.startTimestamp,
        end: this.endTimestamp,
        speed: Number(this.speed),
        interval: Number(this.interval),
      });
    },
    stop() {
      this.$emit("stop");
    },
    pause() {
      this.$emit("pause");
    },
    play() {
      this.$emit("play");
    },
    minimize() {
      this.win = !this.win;
    },
  },
};
</script>

<style scoped>
.panel {
  /* overflow: hidden; */
  width: 230px;
  position: absolute;
  top: 108px;
  left: 0;
  z-index: 10000000;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border: 5px solid #e0e0e0;
}
.title {
  font-size: 14px;
  margin: 10px;
}
.link {
  color: #54bcda;
}
.time {
  font-size: 12px;
  font-weight: bold;
  margin: 10px 0;
}
.field {
  margin-bottom: 5px;
  /* overflow: hidden; */
  font-size: 12px;
}
/* .field input,
.field select {
  float: right;
  margin-left: 10px;
} */
.min,
.max {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 20px;
  border: 0;
  width: 30px;
  text-align: center;
}
.min {
  background: #6186ff;
  color: #fff;
}
.max {
  background: #d32b7f;
  color: #fff;
}
.min:hover,
.max:hover {
  cursor: pointer;
}
.min:focus,
.max:focus {
  outline: 0;
}
.btn {
  padding: 11px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  background-color: #fff;
  border: 1px solid #a2a2a2;
  border-radius: 2px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
}
.btn:focus {
  outline: 0;
}
.btn.active {
  background-color: #eee;
  color: black;
  cursor: pointer;
}
.btn.error {
  background-color: #ffc2c2;
  border-color: #b34848;
}
.btn:hover {
  background-color: #eee;
}
.btn:not(:first-child) {
  margin-left: -2px;
}
.btn:disabled {
  cursor: not-allowed;
}
input,
select {
  width: 100%;
  padding: 11px;
  font-size: 14px;
  font-weight: bold;
  background-color: #fff;
  border: 1px solid #a2a2a2;
  border-radius: 2px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
}
input:focus,
select:focus {
  outline: 0;
}
.btn-calendar {
  width: 34px;
  height: 38px;
  border: 0;
  position: absolute;
  top: 1px;
  left: 1px;
}
.btn-calendar:focus {
  outline: 0;
}
.input-calendar {
  padding-left: 40px;
  box-sizing: border-box;
}
.field-calendar {
  position: relative;
  width: 100%;
}
</style>
