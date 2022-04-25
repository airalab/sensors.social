<template>
  <div class="sensors-panel-status">
    <div class="sensors-panel-status--numbers">
      <div v-for="(item, k) in range" :key="k" :style="{ color: colors[k] }">
        {{ item[1] }}
      </div>
    </div>
    <div
      class="sensors-panel-status--color"
      :style="{ background: `linear-gradient(90deg,${grad})` }"
    ></div>
  </div>
</template>

<script>
import generate, { getGradient } from "../utils/color";
import measurement from "../utils/measurement";

export default {
  props: ["type"],
  data() {
    return {
      grad: "",
      colors: "",
      range: "",
    };
  },
  mounted() {
    const scaleParams = measurement(this.type);
    const scaleGrad = generate(scaleParams.colors, [
      scaleParams.range[0],
      scaleParams.range[scaleParams.range.length - 1],
    ]);
    this.range = scaleParams.rangeView.reverse();
    this.grad = getGradient(scaleGrad, scaleParams.colors.length);
    this.colors = scaleParams.colors;
  },
};
</script>
