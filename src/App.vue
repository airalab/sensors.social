<script setup>
import { RouterView } from "vue-router";
</script>

<template>
  <RouterView />
  <notifications :classes="['notify', 'vue-notification']" />
</template>

<style>
.notify {
  font-size: 20px !important;
  font-weight: bold;
}
</style>
