<template>
  <div
    id="measures"
    class="sensors-panel popup-js container"
    :class="{ active: isActive }"
  >
    <ul class="measures__list">
      <MeasureButton
        v-for="measure in measures"
        :key="measure"
        :measure="measure"
        @select="(value) => (select = value)"
      />
    </ul>

    <div class="measures__wrapper">
      <MeasureInfo v-if="measure" :measure="measure" />

      <a
        class="popup__close"
        href="javascript:;"
        @click="() => $emit('toggleIsActive')"
      >
        <font-awesome-icon icon="fa-solid fa-xmark"></font-awesome-icon>
      </a>
    </div>
  </div>
</template>

<script>
import MeasureButton from "./MeasureButton.vue";
import MeasureInfo from "./MeasureInfo.vue";

export default {
  components: { MeasureButton, MeasureInfo },

  props: {
    isActive: {
      type: Boolean,
    },
  },

  data() {
    return {
      select: "PM10",
      measures: ["PM10", "PM2.5", "CO", "NH3", "NO2", "Tmp"],
    };
  },
  computed: {
    measure() {
      return {
        name: this.select,
        description: this.$t(`measures.${this.select.replace(".", "")}`),
      };
    },
  },
};
</script>

<style scoped>
#measures.container {
  padding-top: calc(var(--gap) * 1.5);
  padding-bottom: 3rem;
  padding-right: 1rem !important;
  max-width: 380px;
  width: 100%;
}

.measures__list {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.measures__wrapper {
  padding-right: 2rem;
  height: 230px;
  overflow-y: auto;
}

@media screen and (max-width: 400px) {
  .measures__list {
    flex-wrap: wrap;
  }
}
</style>
