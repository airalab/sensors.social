<template>
  <div class="measures__item">
    <b
      >You selected to show
      {{ measure.length && measure[0].name }} measurements:</b
    >
    <p class="text">{{ measure.length && $t(measure[0].description) }}</p>

    <router-link class="nav__link" :to="{ name: 'air-measurements' }">
      Read about measurements and air indicators more
    </router-link>

    <hr />
    <span
      >This information holds no legal validity and is intended solely for
      personal use.</span
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
  },
};
</script>

<style scoped>
.measures__item {
  font-size: calc(var(--font-size) * 0.8);
  text-transform: none;
}

b,
a {
  display: inline-block;
  margin-bottom: var(--gap);
}

a {
  margin-bottom: calc(var(--gap) * 1.5);
}

span {
  display: inline-block;
  padding-top: var(--gap);
  font-weight: 300;
}
</style>
