<template>
  <marquee
    class="panel"
    @mouseover="paused = true"
    @mouseleave="paused = false"
  >
    <div class="item" v-for="sender in Object.keys(this.points)" :key="sender">
      <span class="sender"
        ><Avatar :address="sender" class="icon" />{{
          sender.slice(0, 6) + "..." + sender.slice(-4)
        }}</span
      >
      > pm2,5: {{ points[sender]["PM2.5"] }} , pm10: {{ points[sender].PM10 }}
    </div>
  </marquee>
</template>

<script>
import Avatar from "./Avatar.vue";

export default {
  props: ["points"],
  components: { Avatar },
  data() {
    return {
      paused: false,
    };
  },
};
</script>

<style scoped>
.panel {
  overflow: hidden;
  position: absolute;
  top: 0;
  right: 0;
  z-index: 10000000;
  background: rgba(255, 255, 255, 0.9);
  border: 5px solid #e0e0e0;
  height: 14px;
  width: 100%;
  padding: 5px;
  font-size: 12px;
}
.item {
  display: inline;
  padding: 0 10px;
}
.item:not(:first-child) {
  border-left: 1px solid #9e9e9e;
}
.icon {
  width: 14px;
  border-radius: 50%;
  vertical-align: bottom;
  margin-right: 4px;
}
</style>
