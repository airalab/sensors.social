<template>
  <div
    class="sensors-switcher"
    :class="{ disabled: disabled, title__top: disabled }"
    :data-title="disabled ? $t('layer.help') : null"
  >
    <input type="checkbox" id="wind" v-model="control" :disabled="disabled" />
    <label for="wind"></label>
    <span>{{ $t("layer.wind") }}</span>
  </div>
</template>

<script>
import { instanceMap } from "../utils/map/instance";
import { switchLayer } from "../utils/map/wind";

export default {
  props: {
    disabled: {
      default: true,
    },
  },
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
