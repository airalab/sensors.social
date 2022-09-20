<template>
  <div class="sensors-panel-section">
    <section class="sensors-data">
      <div>
        <div class="sensors-select">
          <select v-model="type">
            <option
              v-for="(measurement, k) in measurements"
              :key="k"
              :value="measurement[0]"
            >
              {{ measurement[1] }}
            </option>
          </select>
          <i class="fa-solid fa-sort-down"></i>
        </div>

        <!-- <div class="text-small">{{ unit }}</div> -->
      </div>
    </section>

    <section>
      <Color :type="type.toLowerCase()" />
    </section>

    <section class="sensors-data">
      <a href="javascript:;" @click.stop.prevent="$emit('modal', 'info')">
        <i class="fa-solid fa-circle-info"></i>
      </a>
    </section>
  </div>
</template>

<script>
import { measurements } from "../utils/measurement";
import Color from "./Color";

export default {
  props: ["current"],
  components: {
    Color,
  },
  data() {
    return {
      type: this.current,
      measurements: Object.entries(measurements)
        .map((item) => {
          return item[1].colors ? [item[0], item[1].label] : null;
        })
        .filter((item) => item),
    };
  },
  computed: {
    unit() {
      return measurements[this.current].unit;
    },
  },
  watch: {
    type: function () {
      this.$router.push({
        name: "main",
        params: {
          provider: this.$route.params.provider || "ipfs",
          type: this.type,
          zoom: this.$route.params.zoom,
          lat: this.$route.params.lat,
          lng: this.$route.params.lng,
          sensor: this.$route.params.sensor,
        },
      });
      window.location.reload(false);
    },
  },
};
</script>
