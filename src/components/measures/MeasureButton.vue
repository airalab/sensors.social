<template>
  <li v-if="measure !== 'NH3' && measure !== 'NO2'" class="measures__item">
    <a
      href="javascript:;"
      @click="$emit('select', measure)"
      class="measures__link"
      >{{ measure }}</a
    >
  </li>
  <li v-else class="measures__item">
    <a
      href="javascript:;"
      @click="$emit('select', measure)"
      class="measures__link"
    >
      {{ measure.slice(0, -1) }}<sub>{{ measure.slice(-1) }}</sub>
    </a>
  </li>
</template>

<script>
export default {
  emits: ["select"],
  props: {
    measure: {
      type: String,
      required: true,
    },
  },
};
</script>

<style scoped>
.measures__item {
  margin-right: 20px;
  text-transform: none;
}

.measures__link {
  font-family: var(--font-family--normal);
}
</style>
