<template>
  <div style="margin-left: 20px">
    <div class="sensors-switcher">
      <input
        type="checkbox"
        id="messages"
        v-model="control"
        :disabled="disabled"
      />
      <label for="messages"></label>
    </div>
    &nbsp;
    <div>{{ $t("layer.messages") }}</div>
  </div>
</template>

<script>
import { instanceMap } from "../utils/map/instance";
import { switchMessagesLayer } from "../utils/map/marker";
import config from "../config";

export default {
  props: {
    disabled: {
      default: false,
    },
  },
  data() {
    return {
      control: config.SHOW_MESSAGES,
    };
  },
  watch: {
    control(value) {
      switchMessagesLayer(instanceMap(), value);
    },
  },
};
</script>
