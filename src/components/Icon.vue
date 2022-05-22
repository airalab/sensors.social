<template>
  <span v-if="hasIcon" class="icon"
    ><i :class="`fa-solid fa-${icon}`"></i
  ></span>
</template>

<script>
import { measurements } from "../utils/measurement";

export default {
  props: ["type"],
  computed: {
    hasIcon() {
      return measurements[this.type] && measurements[this.type].icon;
    },
    icon: function () {
      return measurements[this.type].icon;
    },
  },
};
</script>
