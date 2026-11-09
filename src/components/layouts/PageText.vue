<template>
  <Header />
  <section class="container-pagetext">
    <slot />
  </section>
  <SiteFooter />
</template>

<script setup>
import Header from "../header/Header.vue";
import SiteFooter from "./SiteFooter.vue";
</script>

<style>
.buySensor.footer {
  margin-bottom: 0 !important;
}
</style>
