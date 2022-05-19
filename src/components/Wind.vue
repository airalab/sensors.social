<template>
  <div>
    <div class="sensors-switcher">
      <input type="checkbox" id="wind" v-model="control" :disabled="disabled" />
      <label for="wind"></label>
    </div>
    &nbsp;
    <div>{{ $t("layer.wind") }}</div>
  </div>
</template>

<script>
import { instanceMap } from "../utils/map/instance";
import { switchLayer } from "../utils/map/wind";

export default {
  props: ["disabled"],
  data() {
    return {
      control: false,
    };
  },
  watch: {
    control(value) {
      switchLayer(instanceMap(), value);
    },
  },
};
</script>
