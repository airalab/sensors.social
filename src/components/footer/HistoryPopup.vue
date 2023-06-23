<template>
  <div id="history" class="popup-js container" :class="{ active: isActive }">
    <div class="history__wrapper">
      <label for="location">{{ $t("history.city") }}:</label>
      <div class="sensors-select sensors-select-border">
        <select v-model="city">
          <template v-for="(country, key) in Object.keys(cities)" :key="key">
            <option disabled style="text-transform: lowercase">
              {{ country }}
            </option>
            <template
              v-for="(state, key2) in Object.keys(cities[country])"
              :key="key2"
            >
              <option disabled style="text-transform: lowercase">
                &nbsp;&nbsp;&nbsp;&nbsp;{{ state }}
              </option>
              <option
                v-for="(city, key3) in cities[country][state]"
                :value="city"
                :key="key3"
              >
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {{ city }}
              </option>
            </template>
          </template>
        </select>
        <font-awesome-icon icon="fa-solid fa-sort" />
      </div>
    </div>

    <div class="history__wrapper">
      <label for="period">{{ $t("history.period") }}:</label>

      <div class="sensors-select sensors-select-border">
        <select id="period" v-model="period">
          <option
            v-for="item in timePeriod"
            :value="item.value"
            :key="item.value"
          >
            {{ item.title }}
          </option>
        </select>
        <font-awesome-icon icon="fa-solid fa-sort" />
      </div>
      <div class="dataPicker" v-if="period === 'chooseDates'">
        <input type="date" v-model="start" :max="maxDate" />
        <input type="date" v-model="end" :max="maxDate" />
      </div>
    </div>

    <!-- класс loading задает стили  во время обработки запроса  -->
    <!-- класс success задает стили  для успешного запроса  -->
    <a :href="link" target="_blank" class="history__save">
      <span class="history__save-content">
        <font-awesome-icon icon="fa-solid fa-download" />
        {{ $t("history.download") }}
      </span>

      <!-- индикатор загрузки -->
      <font-awesome-icon icon="fa-solid fa-compass" spin />

      <!-- запрос успешно выполнился -->
      <font-awesome-icon icon="fa-solid fa-check" />
    </a>

    <a
      class="popup__close"
      href="javascript:;"
      @click="() => $emit('toggleIsActive')"
    >
      <font-awesome-icon icon="fa-solid fa-xmark"></font-awesome-icon>
    </a>
  </div>
</template>

<script>
import axios from "axios";
import moment from "moment";
import config from "../../config";

export default {
  props: {
    isActive: {
      type: Boolean,
    },
  },
  data() {
    return {
      start: moment().subtract(1, "days").format("YYYY-MM-DD"),
      end: moment().format("YYYY-MM-DD"),
      maxDate: moment().format("YYYY-MM-DD"),
      cities: {},
      city: "",

      timePeriod: [
        {
          title: this.$t("history.currentDay"),
          value: "24hours",
        },
        {
          title: this.$t("history.currentMonth"),
          value: "currentMonth",
        },
        {
          title: this.$t("history.chooseDates"),
          value: "chooseDates",
        },
      ],
      period: "24hours",
    };
  },
  computed: {
    startTimestamp: function () {
      return Number(
        moment(this.start + " 00:00:00", "YYYY-MM-DD HH:mm:ss").format("X")
      );
    },
    endTimestamp: function () {
      return Number(
        moment(this.end + " 23:59:59", "YYYY-MM-DD HH:mm:ss").format("X")
      );
    },
    link() {
      return `${config.REMOTE_PROVIDER}api/sensor/csv/${this.startTimestamp}/${this.endTimestamp}/${this.city}`;
    },
  },
  watch: {
    period(newPeriod) {
      if (newPeriod === "24hours") {
        this.start = moment().format("YYYY-MM-DD");
        this.end = moment().format("YYYY-MM-DD");
      } else if (newPeriod === "currentMonth") {
        this.start = moment().subtract(1, "month").format("YYYY-MM-DD");
        this.end = moment().format("YYYY-MM-DD");
      }
    },
  },
  async created() {
    const result = await axios(`${config.REMOTE_PROVIDER}api/sensor/cities`);
    this.cities = result.data.result;
    const country = Object.keys(this.cities);
    const state = Object.keys(this.cities[country[0]]);
    this.city = this.cities[country[0]][state[0]][0];
  },
};
</script>

<style>
#history.container {
  padding: calc(var(--gap) * 3) calc(var(--gap) * 2);
  padding-top: calc(var(--gap) * 4);
  min-height: 320px;
  height: 100%;
  border-radius: 28px;
}

#history .popup__close {
  display: block;
  top: calc(var(--gap) * 0.8);
  right: calc(var(--gap) * 0.8);
}

#history input {
  text-transform: uppercase;
  border: 2px solid var(--color-dark);
  color: var(--color-dark);
  background-color: var(--color-light);
}

#history .sensors-select-border {
  border: 2px solid var(--color-dark);
  color: var(--color-dark);
  background-color: var(--color-light);
}

#history select {
  width: 100%;
}

.history__wrapper {
  display: flex;
  flex-direction: column;
  margin-bottom: var(--gap);
}

.history__wrapper:last-of-type {
  margin-bottom: var(--gap);
}

.history__wrapper label {
  font-family: var(--font-family--normal);
  font-size: 0.8rem;
  line-height: 1.5;
  font-style: italic;
  color: var(--color-dark);
  text-transform: none;
}

.history__save {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.history__save .history__save-content {
  color: var(--color-blue) !important;
}

.history__save .fa-check,
.history__save .fa-compass {
  display: none;
}

.history__save.loading {
  pointer-events: none;
}

.history__save.loading .history__save-content {
  opacity: 0.3;
  color: var(--color-dark);
}

.history__save.loading .fa-compass {
  margin-left: auto;
  display: inline-block;
  color: var(--color-green);
}

.history__save.success .fa-check {
  display: inline-block;
  color: var(--color-green);
}

.dataPicker {
  margin-top: var(--gap);
}

/* стили для vue2-datepicker */

.dataPicker .mx-datepicker-range {
  width: 250px;
}
.mx-input {
  font-size: 1rem;
  font-family: var(--font-family--black);
  border: 2px solid var(--color-dark);
  color: var(--color-dark);
  background-color: var(--color-light);
  padding: 0.3rem 1rem;
  border-radius: 4px;
}

.mx-input-wrapper svg {
  color: var(--color-dark);
}

@media screen and (max-width: 680px) {
  #history.container {
    padding-top: calc(var(--gap) * 2);
  }

  .dataPicker .mx-datepicker-range {
    width: 100%;
  }
}
</style>
