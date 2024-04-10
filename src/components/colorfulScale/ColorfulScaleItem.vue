<template>
  <div
    class="colorful-scale__wrapper"
    v-if="
      type !== 'temperature'
        ? type === measure.name.toLowerCase().replace('.', '')
        : measure.name.toLowerCase() === 'tmp'
    "
  >
    <div class="colorful-scale__title">
      <span>
        {{ measure.name.replace(".", "").replace(/[0-9]/g, "")
        }}<sub>{{ measure.sub ?? measure.sub }}</sub>
      </span>
      <router-link :to="{ name: 'air-measurements', hash: `#${measure.name}` }"
        >Learn more</router-link
      >
    </div>
    <router-link
      v-for="color in measure.colors"
      :key="color.color"
      :to="{ name: 'air-measurements', hash: `#${measure.name}` }"
      :class="`colorful-scale__text colorful-scale__text--${color.color}`"
      >{{ color.text }}</router-link
    >
  </div>
</template>

<script>
export default {
  props: {
    measure: {
      type: Object,
      required: true,
    },
    type: {
      type: String,
    },
  },

  data() {
    return {};
  },
};
</script>

<style scoped>
.colorful-scale__wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: calc(var(--gap) * 0.5);
  z-index: 10;
}

.colorful-scale__title {
  display: flex;
  flex-direction: column;
  font-weight: 900;
  padding: calc(var(--gap) * 0.4);
  text-transform: none;
  color: var(--color-dark);
  background-color: var(--color-light);
  border-radius: 3px;
}

.colorful-scale__title a {
  font-size: calc(var(--font-size) * 0.8);
}

.colorful-scale__text {
  padding: calc(var(--gap) * 0.5) calc(var(--gap) * 0.9);
  font-weight: 600;
  text-transform: none;
  /* font-size: calc(var(--font-size) * 0.8); */
  border-radius: 3px;
  color: var(--color-light);
}

.colorful-scale__text--green {
  background-color: var(--color-green);
}

.colorful-scale__text--orange {
  background-color: var(--color-orange);
}

.colorful-scale__text--red {
  background-color: var(--color-bright-red);
}

.colorful-scale__text--blue {
  background-color: var(--color-teal);
}

.colorful-scale__text--orange {
  background-color: var(--color-orange);
}

.colorful-scale__text--navy {
  background-color: var(--color-navy);
}

.colorful-scale__text--purple {
  background-color: var(--color-purple);
}

@media screen and (max-width: 480px) {
  .colorful-scale__text {
    padding: calc(var(--gap) * 0.3);
    font-size: calc(var(--font-size) * 0.6);
  }
}
</style>
