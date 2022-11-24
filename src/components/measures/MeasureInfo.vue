<template>
  <div>
    <h2 class="subtitle">{{ measure.name }}</h2>
    <p class="text">{{ measure.description }}</p>
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
h2 {
  margin-bottom: 10px;
}
</style>
