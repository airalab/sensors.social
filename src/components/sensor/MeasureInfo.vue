<template>
  <div class="sensor-popup-state">
    <div
      class="sensor-popup__wrapper"
      :style="{
        color: state.color,
      }"
    >
      <span class="icon"><font-awesome-icon :icon="state.icon" /></span>
      <h3 class="sensor-popup--state__title">{{ state.title }}</h3>
    </div>
    <p class="sensor-popup--state__descr">{{ state.info }}</p>
  </div>
</template>

<script>
export default {
  props: {
    state: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style>
.sensor-popup-state.popup {
  margin-bottom: var(--gap);
  background-color: transparent;
}

.sensor-popup__wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.sensor-popup--state__title {
  margin-bottom: 0;
  margin-left: 3px;
}

.sensor-popup--state__descr {
  line-height: 1.5;
  font-family: var(--font-family--normal);
  font-weight: 400;
  font-size: 1rem;
  text-transform: none;
}

@media screen and (max-width: 580px) {
  .sensor-popup__wrapper {
    font-size: 1rem;
  }
}
</style>
