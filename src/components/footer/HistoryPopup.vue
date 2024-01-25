<template>
  <div id="history" class="popup-js container" :class="{ active: isActive }">
    <span class="history__import-data">Import data</span>
    <div class="history__wrapper">
      <!-- <label for="location">{{ $t("history.city") }}:</label> -->
      <div class="sensors-select sensors-select-border">
        <select v-model="city" class="sensors-select-city">
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
      <!-- <label for="period">{{ $t("history.period") }}:</label> -->

      <div class="sensors-select sensors-select-border sensors-select-period">
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
        <!-- <font-awesome-icon icon="fa-solid fa-download" /> -->
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
      <!-- <svg
        width="13"
        height="13"
        viewBox="0 0 13 13"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clip-path="url(#clip0_408_165)">
          <path
            d="M4.2432 3.24483C3.96708 2.96871 3.52092 2.96871 3.2448 3.24483C2.96868 3.52095 2.96868 3.96711 3.2448 4.24323L5.49119 6.48962L3.2448 8.73602C2.96868 9.01214 2.96868 9.4583 3.2448 9.73442C3.52092 10.0105 3.96708 10.0105 4.2432 9.73442L6.48959 7.48802L8.73599 9.73442C9.01211 10.0105 9.45827 10.0105 9.73439 9.73442C10.0105 9.4583 10.0105 9.01214 9.73439 8.73602L7.48799 6.48962L9.73439 4.24323C10.0105 3.96711 10.0105 3.52095 9.73439 3.24483C9.45827 2.96871 9.01211 2.96871 8.73599 3.24483L6.48959 5.49123L4.2432 3.24483Z"
            fill="black"
          />
        </g>
        <defs>
          <clipPath id="clip0_408_165">
            <rect
              width="9.17767"
              height="9.17767"
              fill="white"
              transform="translate(0 6.48962) rotate(-45)"
            />
          </clipPath>
        </defs>
      </svg> -->
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
    try {
      const result = await axios.get(
        `${config.REMOTE_PROVIDER}api/sensor/cities`
      );
      this.cities = result.data.result;
      const country = Object.keys(this.cities);
      const state = Object.keys(this.cities[country[0]]);
      this.city = this.cities[country[0]][state[0]][0];
    } catch (error) {
      console.log(error.message);
    }
  },
};
</script>

<style>
#history.container {
  padding: calc(var(--gap) * 1) calc(var(--gap) * 2);
  /* padding-top: calc(var(--gap) * 4); */
  min-height: 180px;
  height: 100%;
  border-radius: 0;
}

.history__import-data {
  display: inline-block;
  padding-left: 15px;
  margin-bottom: var(--gap);
  text-transform: none;
  font-size: var(--font-size);
  background-image: url("data:image/svg+xml,%3Csvg width='7' height='8' viewBox='0 0 7 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3.08782 7.83249C3.31559 8.05572 3.6855 8.05572 3.91327 7.83249L6.8288 4.97522C7.05658 4.752 7.05658 4.38948 6.8288 4.16626C6.60103 3.94303 6.23112 3.94303 6.00334 4.16626L4.08274 6.05027V0.571454C4.08274 0.255369 3.82216 0 3.49963 0C3.1771 0 2.91653 0.255369 2.91653 0.571454V6.04848L0.995924 4.16804C0.768149 3.94482 0.398241 3.94482 0.170465 4.16804C-0.0573101 4.39127 -0.0573101 4.75378 0.170465 4.97701L3.08599 7.83428L3.08782 7.83249Z' fill='black'/%3E%3C/svg%3E%0A");
  background-size: 10px 10px;
  background-position: left;
  background-repeat: no-repeat;
}

.dark .history__import-data {
  background-image: url("data:image/svg+xml,%3Csvg width='7' height='8' viewBox='0 0 7 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3.08782 7.83249C3.31559 8.05572 3.6855 8.05572 3.91327 7.83249L6.8288 4.97522C7.05658 4.752 7.05658 4.38948 6.8288 4.16626C6.60103 3.94303 6.23112 3.94303 6.00334 4.16626L4.08274 6.05027V0.571454C4.08274 0.255369 3.82216 0 3.49963 0C3.1771 0 2.91653 0.255369 2.91653 0.571454V6.04848L0.995924 4.16804C0.768149 3.94482 0.398241 3.94482 0.170465 4.16804C-0.0573101 4.39127 -0.0573101 4.75378 0.170465 4.97701L3.08599 7.83428L3.08782 7.83249Z' fill='white'/%3E%3C/svg%3E%0A");
}

#history .popup__close {
  display: block;
  top: calc(var(--gap) * -1.5);
  right: 0;
  width: 26px;
  height: 27px;
  background-image: url("data:image/svg+xml, %3Csvg width='13' height='13' viewBox='0 0 13 13' fill='none' xmlns='http://www.w3.org/2000/svg' %3E%3Cg clip-path='url(%23clip0_408_165)'%3E%3Cpath d='M4.2432 3.24483C3.96708 2.96871 3.52092 2.96871 3.2448 3.24483C2.96868 3.52095 2.96868 3.96711 3.2448 4.24323L5.49119 6.48962L3.2448 8.73602C2.96868 9.01214 2.96868 9.4583 3.2448 9.73442C3.52092 10.0105 3.96708 10.0105 4.2432 9.73442L6.48959 7.48802L8.73599 9.73442C9.01211 10.0105 9.45827 10.0105 9.73439 9.73442C10.0105 9.4583 10.0105 9.01214 9.73439 8.73602L7.48799 6.48962L9.73439 4.24323C10.0105 3.96711 10.0105 3.52095 9.73439 3.24483C9.45827 2.96871 9.01211 2.96871 8.73599 3.24483L6.48959 5.49123L4.2432 3.24483Z' fill='black' /%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='clip0_408_165'%3E%3Crect width='9.17767' height='9.17767' fill='white' transform='translate(0 6.48962) rotate(-45)' /%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-color: var(--color-light);
}

.dark #history .popup__close {
  background-image: url("data:image/svg+xml, %3Csvg width='13' height='13' viewBox='0 0 13 13' fill='none' xmlns='http://www.w3.org/2000/svg' %3E%3Cg clip-path='url(%23clip0_408_165)'%3E%3Cpath d='M4.2432 3.24483C3.96708 2.96871 3.52092 2.96871 3.2448 3.24483C2.96868 3.52095 2.96868 3.96711 3.2448 4.24323L5.49119 6.48962L3.2448 8.73602C2.96868 9.01214 2.96868 9.4583 3.2448 9.73442C3.52092 10.0105 3.96708 10.0105 4.2432 9.73442L6.48959 7.48802L8.73599 9.73442C9.01211 10.0105 9.45827 10.0105 9.73439 9.73442C10.0105 9.4583 10.0105 9.01214 9.73439 8.73602L7.48799 6.48962L9.73439 4.24323C10.0105 3.96711 10.0105 3.52095 9.73439 3.24483C9.45827 2.96871 9.01211 2.96871 8.73599 3.24483L6.48959 5.49123L4.2432 3.24483Z' fill='white' /%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='clip0_408_165'%3E%3Crect width='9.17767' height='9.17767' fill='white' transform='translate(0 6.48962) rotate(-45)' /%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E");
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
  border: none;
}

.sensors-select-city {
  background-image: url("data:image/svg+xml,%3Csvg width='15' height='19' viewBox='0 0 15 19' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8.42578 18.5729C10.4297 16.1843 15 10.3952 15 7.14342C15 3.19966 11.6406 0 7.5 0C3.35938 0 0 3.19966 0 7.14342C0 10.3952 4.57031 16.1843 6.57422 18.5729C7.05469 19.1421 7.94531 19.1421 8.42578 18.5729ZM7.5 4.76228C8.88086 4.76228 10 5.82821 10 7.14342C10 8.45862 8.88086 9.52456 7.5 9.52456C6.11914 9.52456 5 8.45862 5 7.14342C5 5.82821 6.11914 4.76228 7.5 4.76228Z' fill='black'/%3E%3C/svg%3E%0A");
  background-size: 15px 20px;
  background-position: 0px;
  background-repeat: no-repeat;
}

.dark .sensors-select-city {
  background-image: url("data:image/svg+xml,%3Csvg width='15' height='19' viewBox='0 0 15 19' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8.42578 18.5729C10.4297 16.1843 15 10.3952 15 7.14342C15 3.19966 11.6406 0 7.5 0C3.35938 0 0 3.19966 0 7.14342C0 10.3952 4.57031 16.1843 6.57422 18.5729C7.05469 19.1421 7.94531 19.1421 8.42578 18.5729ZM7.5 4.76228C8.88086 4.76228 10 5.82821 10 7.14342C10 8.45862 8.88086 9.52456 7.5 9.52456C6.11914 9.52456 5 8.45862 5 7.14342C5 5.82821 6.11914 4.76228 7.5 4.76228Z' fill='white'/%3E%3C/svg%3E%0A");
}

.sensors-select-period {
  background-image: url("data:image/svg+xml, %3Csvg width='17' height='19' viewBox='0 0 17 19' fill='none' xmlns='http://www.w3.org/2000/svg' %3E%3Cg clip-path='url(%23clip0_23_68)'%3E%3Cpath d='M4.85714 0C5.52879 0 6.07143 0.530664 6.07143 1.1875V2.375H10.9286V1.1875C10.9286 0.530664 11.4712 0 12.1429 0C12.8145 0 13.3571 0.530664 13.3571 1.1875V2.375H15.1786C16.1842 2.375 17 3.17285 17 4.15625V5.9375H0V4.15625C0 3.17285 0.815848 2.375 1.82143 2.375H3.64286V1.1875C3.64286 0.530664 4.18549 0 4.85714 0ZM0 7.125H17V17.2188C17 18.2021 16.1842 19 15.1786 19H1.82143C0.815848 19 0 18.2021 0 17.2188V7.125ZM2.42857 10.0938V11.2812C2.42857 11.6078 2.70179 11.875 3.03571 11.875H4.25C4.58393 11.875 4.85714 11.6078 4.85714 11.2812V10.0938C4.85714 9.76719 4.58393 9.5 4.25 9.5H3.03571C2.70179 9.5 2.42857 9.76719 2.42857 10.0938ZM7.28571 10.0938V11.2812C7.28571 11.6078 7.55893 11.875 7.89286 11.875H9.10714C9.44107 11.875 9.71429 11.6078 9.71429 11.2812V10.0938C9.71429 9.76719 9.44107 9.5 9.10714 9.5H7.89286C7.55893 9.5 7.28571 9.76719 7.28571 10.0938ZM12.75 9.5C12.4161 9.5 12.1429 9.76719 12.1429 10.0938V11.2812C12.1429 11.6078 12.4161 11.875 12.75 11.875H13.9643C14.2982 11.875 14.5714 11.6078 14.5714 11.2812V10.0938C14.5714 9.76719 14.2982 9.5 13.9643 9.5H12.75ZM2.42857 14.8438V16.0312C2.42857 16.3578 2.70179 16.625 3.03571 16.625H4.25C4.58393 16.625 4.85714 16.3578 4.85714 16.0312V14.8438C4.85714 14.5172 4.58393 14.25 4.25 14.25H3.03571C2.70179 14.25 2.42857 14.5172 2.42857 14.8438ZM7.89286 14.25C7.55893 14.25 7.28571 14.5172 7.28571 14.8438V16.0312C7.28571 16.3578 7.55893 16.625 7.89286 16.625H9.10714C9.44107 16.625 9.71429 16.3578 9.71429 16.0312V14.8438C9.71429 14.5172 9.44107 14.25 9.10714 14.25H7.89286ZM12.1429 14.8438V16.0312C12.1429 16.3578 12.4161 16.625 12.75 16.625H13.9643C14.2982 16.625 14.5714 16.3578 14.5714 16.0312V14.8438C14.5714 14.5172 14.2982 14.25 13.9643 14.25H12.75C12.4161 14.25 12.1429 14.5172 12.1429 14.8438Z' fill='black' /%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='clip0_23_68'%3E%3Crect width='17' height='19' fill='white' /%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E");
  background-size: 15px 20px;
  background-position: 10px;
  background-repeat: no-repeat;
}

.dark .sensors-select-period {
  background-image: url("data:image/svg+xml, %3Csvg width='17' height='19' viewBox='0 0 17 19' fill='none' xmlns='http://www.w3.org/2000/svg' %3E%3Cg clip-path='url(%23clip0_23_68)'%3E%3Cpath d='M4.85714 0C5.52879 0 6.07143 0.530664 6.07143 1.1875V2.375H10.9286V1.1875C10.9286 0.530664 11.4712 0 12.1429 0C12.8145 0 13.3571 0.530664 13.3571 1.1875V2.375H15.1786C16.1842 2.375 17 3.17285 17 4.15625V5.9375H0V4.15625C0 3.17285 0.815848 2.375 1.82143 2.375H3.64286V1.1875C3.64286 0.530664 4.18549 0 4.85714 0ZM0 7.125H17V17.2188C17 18.2021 16.1842 19 15.1786 19H1.82143C0.815848 19 0 18.2021 0 17.2188V7.125ZM2.42857 10.0938V11.2812C2.42857 11.6078 2.70179 11.875 3.03571 11.875H4.25C4.58393 11.875 4.85714 11.6078 4.85714 11.2812V10.0938C4.85714 9.76719 4.58393 9.5 4.25 9.5H3.03571C2.70179 9.5 2.42857 9.76719 2.42857 10.0938ZM7.28571 10.0938V11.2812C7.28571 11.6078 7.55893 11.875 7.89286 11.875H9.10714C9.44107 11.875 9.71429 11.6078 9.71429 11.2812V10.0938C9.71429 9.76719 9.44107 9.5 9.10714 9.5H7.89286C7.55893 9.5 7.28571 9.76719 7.28571 10.0938ZM12.75 9.5C12.4161 9.5 12.1429 9.76719 12.1429 10.0938V11.2812C12.1429 11.6078 12.4161 11.875 12.75 11.875H13.9643C14.2982 11.875 14.5714 11.6078 14.5714 11.2812V10.0938C14.5714 9.76719 14.2982 9.5 13.9643 9.5H12.75ZM2.42857 14.8438V16.0312C2.42857 16.3578 2.70179 16.625 3.03571 16.625H4.25C4.58393 16.625 4.85714 16.3578 4.85714 16.0312V14.8438C4.85714 14.5172 4.58393 14.25 4.25 14.25H3.03571C2.70179 14.25 2.42857 14.5172 2.42857 14.8438ZM7.89286 14.25C7.55893 14.25 7.28571 14.5172 7.28571 14.8438V16.0312C7.28571 16.3578 7.55893 16.625 7.89286 16.625H9.10714C9.44107 16.625 9.71429 16.3578 9.71429 16.0312V14.8438C9.71429 14.5172 9.44107 14.25 9.10714 14.25H7.89286ZM12.1429 14.8438V16.0312C12.1429 16.3578 12.4161 16.625 12.75 16.625H13.9643C14.2982 16.625 14.5714 16.3578 14.5714 16.0312V14.8438C14.5714 14.5172 14.2982 14.25 13.9643 14.25H12.75C12.4161 14.25 12.1429 14.5172 12.1429 14.8438Z' fill='white' /%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='clip0_23_68'%3E%3Crect width='17' height='19' fill='white' /%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E");
}

#period {
  padding-left: 30px;
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
  justify-content: center;
  padding: 0.4rem;
  color: var(--color-light);
  background-color: var(--color-blue);
  text-align: center;
  border-radius: 4px;
}

.history__save .history__save-content {
  color: var(--color-light) !important;
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
  font-family: var(--font-family--normal);
  font-weight: 700;
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
