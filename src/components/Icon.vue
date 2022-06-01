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
      return (
        measurements[this.type.toLowerCase()] &&
        measurements[this.type.toLowerCase()].icon
      );
    },
    icon: function () {
      return measurements[this.type.toLowerCase()].icon;
    },
  },
};
</script>
