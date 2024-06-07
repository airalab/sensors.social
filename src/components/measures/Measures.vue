<template>
  <select v-model="type" v-if="store.sensors.length > 0">
    <option v-for="opt in availableoptions" :key="opt.value" :value="opt.value">
      {{ opt.name }}
    </option>
  </select>
</template>

<script>
import { useStore } from "@/store";
import measurements from "../../measurements";
import { getTypeProvider } from "../../utils/utils";

export default {
  props: ["current"],
  data() {
    return {
      type: this.current,
      measurements: Object.entries(measurements),
      store: useStore(),
    };
  },
  computed: {
    availableunits() {
      let bufer = [];
      this.store.sensors.forEach((i) => {
        Object.keys(i.data).forEach((units) => {
          bufer.push(units);
        });
      });
      return [...new Set(bufer)];
    },
    availableoptions() {
      let buffer = [];
      this.availableunits.forEach((i) => {
        if (measurements[i]) {
          buffer.push({ name: measurements[i].label, value: i });
        }
      });
      return buffer;
    },
  },
  watch: {
    type: async function () {
      await this.$router.push({
        name: "main",
        params: {
          provider: getTypeProvider(),
          type: this.type,
          zoom: this.$route.params.zoom,
          lat: this.$route.params.lat,
          lng: this.$route.params.lng,
          sensor: this.$route.params.sensor,
        },
      });
      this.$router.go(0);
    },
  },
};
</script>
