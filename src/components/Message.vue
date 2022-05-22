<template>
  <div>
    <h2>{{ data.username }}</h2>
    <div class="sensor-popup--subtitle">
      <span><i class="fa-solid fa-stopwatch"></i> {{ dateMsg }}</span>
    </div>
    <div style="margin-top: 30px">
      <p>{{ data.message }}</p>
    </div>
  </div>
</template>

<script>
import moment from "moment";

export default {
  props: ["data"],
  computed: {
    dateMsg: function () {
      return moment(this.data.timestamp, "X").format("DD.MM.YYYY HH:mm:ss");
    },
  },
};
</script>
