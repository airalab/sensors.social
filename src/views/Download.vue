<template>
  <div class="page">
    <h1>Период</h1>
    <div class="block">
      Начало:
      <input type="date" v-model="start" :max="maxDate" />
    </div>
    <div class="block">
      Конец:
      <input type="date" v-model="end" :max="maxDate" />
    </div>
    <a class="link" :href="link" target="_blank">Сохранить csv</a>
  </div>
</template>

<script>
import moment from "moment";
import config from "../config";

export default {
  data() {
    return {
      start: moment().subtract(6, "days").format("YYYY-MM-DD"),
      end: moment().format("YYYY-MM-DD"),
      maxDate: moment().format("YYYY-MM-DD"),
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
      return `${config.REMOTE_PROVIDER}api/sensor/csv/${this.startTimestamp}/${this.endTimestamp}`;
    },
  },
};
</script>

<style scoped>
.page {
  width: 700px;
  margin: 20px auto;
  text-align: center;
}
.block {
  margin: 10px;
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
</style>
