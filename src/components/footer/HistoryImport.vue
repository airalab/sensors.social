<template>
    <form :action="link">
        <section>
            <select v-model="city" class="block">
                <optgroup :label="country" v-for="(country, key) in Object.keys(cities)" :key="key">
                    <template v-for="(state, key2) in Object.keys(cities[country])" :key="key2">
                        <option v-for="(city, key3) in cities[country][state]" :value="city" :key="key3">{{ city }}</option>
                    </template>
                </optgroup>
            </select>
        </section>

        <section>
            <select v-model="period" class="block">
                <option
                    v-for="item in timePeriod"
                    :value="item.value"
                    :key="item.value"
                >
                    {{ item.title }}
                </option>
            </select>
        </section>

        <section class="flexline" v-if="period === 'chooseDates'">
            <input type="date" v-model="start" :max="maxDate" />
            –
            <input type="date" v-model="end" :max="maxDate" />
        </section>

        <section>
            <input type="submit" :value="$t('history.button')" class="block" />
        </section>
    </form>
</template>

<script>
import axios from "axios";
import moment from "moment";
import config from "../../config";

export default {
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
}
</script>