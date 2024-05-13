<template>
  <select v-model="type" v-if="store.sensors.length > 0">
    <option v-for="opt in availableoptions" :key="opt.value" :value="opt.value">{{opt.name}}</option>
  </select>
</template>

<script>
import measurements from "../../measurements";
import { useStore } from "@/store";

export default {
  props: ["current"],
  data() {
    return {
      type: this.current,
      measurements: Object.entries(measurements),
      store: useStore()
    };
  },
  computed: {
    availableunits() {
      let bufer = []
      this.store.sensors.forEach( i => {
        Object.keys(i.data).forEach(units => {
          bufer.push(units)
        })
      })
      return [...new Set(bufer)]
    },
    availableoptions() {
      let buffer = []
      this.availableunits.forEach(i => {
        buffer.push({name: measurements[i].label, value: i})
      })
      return buffer
    }
  },
  watch: {
    type: async function () {
      await this.$router.push({
        name: "main",
        params: {
          provider: this.$route.params.provider || "realtime",
          type: this.type,
          zoom: this.$route.params.zoom,
          lat: this.$route.params.lat,
          lng: this.$route.params.lng,
          sensor: this.$route.params.sensor,
        },
      });
      this.$router.go(0);
    }
  }
};
</script>
