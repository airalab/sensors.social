<template>
  <div class="page">
    <h1>Период</h1>
    <table>
      <tr>
        <td style="text-align: right; width: 50%">Город:</td>
        <td style="text-align: left">
          <select v-model="city">
            <option v-for="(item, key) in cities" :value="item" :key="key">
              {{ item }}
            </option>
          </select>
        </td>
      </tr>
      <tr>
        <td style="text-align: right">Начало:</td>
        <td style="text-align: left">
          <input type="date" v-model="start" :max="maxDate" />
        </td>
      </tr>
      <tr>
        <td style="text-align: right">Конец:</td>
        <td style="text-align: left">
          <input type="date" v-model="end" :max="maxDate" />
        </td>
      </tr>
    </table>
    <a class="link" :href="link" target="_blank">Сохранить csv</a>
  </div>
</template>

<script>
import axios from "axios";
import moment from "moment";
import config from "../config";

export default {
  data() {
    return {
      start: moment().subtract(6, "days").format("YYYY-MM-DD"),
      end: moment().format("YYYY-MM-DD"),
      maxDate: moment().format("YYYY-MM-DD"),
      cities: [],
      city: "",
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
  async created() {
    const result = await axios(`${config.REMOTE_PROVIDER}api/sensor/cities`);
    this.cities = result.data.result;
    this.city = this.cities[0];
  },
};
</script>

<style scoped>
.page {
  width: 700px;
  margin: 20px auto;
  text-align: center;
}
.link {
  border: 1px solid rgb(0, 217, 255);
  padding: 15px;
  display: block;
  width: 200px;
  margin: 0 auto;
  font-weight: bold;
}
.link:hover {
  background: rgb(121, 201, 255);
  color: #fff;
}
table {
  width: 100%;
  margin: 20px 0;
}
table td {
  padding: 10px;
}
select {
  border: 1px solid var(--color-dark);
  background-color: var(--color-light);
  padding: 0.5rem 1rem;
  border-radius: 4px;
}
</style>
