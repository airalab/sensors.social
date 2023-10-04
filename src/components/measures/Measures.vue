<template>
  <div class="measures">
    <div class="sensors-select sensors-select-border">
      <select v-model="type">
        <option
          v-for="(measurement, k) in measurements"
          :key="k"
          :value="measurement[0]"
        >
          {{ measurement[1] }}
        </option>
      </select>
      <font-awesome-icon icon="fa-solid fa-sort" />
    </div>

    <a
      href="javascript:;"
      class="info-link"
      @click="toggleIsActive"
      :class="{ active: isActive }"
    >
      <font-awesome-icon icon="fa-solid fa-circle-info" />
    </a>

    <div class="measures-popup popup-wrapper">
      <MeasuresPopup :isActive="isActive" @toggleIsActive="toggleIsActive" />
    </div>
  </div>
</template>

<script>
import { measurements } from "../../utils/measurement";
import MeasuresPopup from "./MeasuresPopup.vue";

export default {
  props: ["current"],
  components: {
    MeasuresPopup,
  },
  data() {
    return {
      isActive: false,
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
    },
  },
  methods: {
    toggleIsActive() {
      this.isActive = !this.isActive;
    },
  },
};
</script>

<style scoped>
.measures {
  position: relative;
  display: inline-flex;
  width: max-content;
  align-items: center;
  z-index: 11;
  margin-bottom: 2rem;
}

.measures .sensors-select {
  margin-right: var(--gap);
}

.measures .fa-circle-info {
  font-size: 2.7rem;
  border: 4px solid #fff;
  border-radius: 100%;
}

.measures .info-link {
  position: relative;
  z-index: 11;
  transition: color 0.33s ease-in-out;
  color: #000;
}

.measures .info-link::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 38px;
  height: 38px;
  background: #fff;
  border-radius: 100%;
  z-index: -1;
}

.measures .info-link.active {
  color: var(--color-blue);
}

.measures-popup {
  top: calc(var(--gap) * 2);
  left: calc(var(--gap) * 8);
  z-index: 10;
}

@media screen and (max-width: 680px) {
  .measures-popup {
    top: calc(var(--gap) * 4);
    left: 0px;
    /* right: 0px; */
  }
}

@media screen and (max-width: 400px) {
  .measures-popup {
    top: calc(var(--gap) * 13);
    left: var(--gap);
    right: var(--gap);
    position: fixed;
  }
}
</style>
