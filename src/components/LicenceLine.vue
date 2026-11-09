<template>
  <p class="licence-line">
    {{ $t("Map data") }} ©
    <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">{{
      $t("OpenStreetMap contributors")
    }}</a>
    · {{ $t("Sensor data") }} © {{ $t("sensors.social contributors") }},
    <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener"
      >ODbL 1.0</a
    >
    · {{ $t("Code") }}:
    <a
      href="https://github.com/airalab/sensors.social/blob/master/NOTICE"
      target="_blank"
      rel="noopener"
      >AGPL-3.0</a
    >
  </p>
</template>

<style scoped>
.licence-line {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.45;
}
</style>
