<template>
  <div class="panel">
    <div
      style="height: 200px; width: 25px; float: left;"
      :style="{ background: `linear-gradient(0deg,${grad})` }"
    ></div>
    <div
      style="
        height: 188px;
        width: 27px;
        float: left;
        position: relative;
        margin-left: 7px;
        font-size: 12px;
        margin-top: 12px;
      "
    >
      <div
        v-for="(item, k) in range"
        :key="k"
        :style="`position: absolute; bottom: ${item[0]}%;`"
      >
        {{ item[1] }}
      </div>
    </div>
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
      range: "",
    };
  },
  mounted() {
    const scaleParams = measurement(this.type);
    const scaleGrad = generate(scaleParams.colors, [
      scaleParams.range[0],
      scaleParams.range[scaleParams.range.length - 1],
    ]);
    this.range = scaleParams.rangeView;
    this.grad = getGradient(scaleGrad, scaleParams.colors.length);
  },
};
</script>

<style scoped>
.panel {
  overflow: hidden;
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 10000000;
  background: rgba(255, 255, 255, 0.7);
  padding: 10px;
  border: 5px solid #e0e0e0;
}
</style>
