<template>
  <div class="colorful-scale">
    <ColorfulScaleItem
      v-for="color in colors"
      :key="color.color"
      :color="color"
      @click="open"
      :isActive="isActive"
    />

    <div class="measures-popup popup-wrapper">
      <MeasuresPopup
        :type="type"
        :isActive="isActive"
        @toggleIsActive="close"
      />
    </div>
  </div>
</template>

<script>
import { useStore } from "@/store";
import MeasuresPopup from "../measures/MeasuresPopup.vue";
import ColorfulScaleItem from "./ColorfulScaleItem.vue";

export default {
  components: { ColorfulScaleItem, MeasuresPopup },

  props: ["type"],

  data() {
    return {
      colors: [
        {
          color: "green",
          icon: "smile_icon",
          text: "Fine",
        },
        {
          color: "orange",
          icon: "neutral_icon",
          text: "May need attention",
        },
        {
          color: "red",
          icon: "upset_icon",
          text: "Be careful",
        },
      ],
      isActive: false,
      store: useStore(),
    };
  },

  methods: {
    open() {
      this.isActive = true;
      this.store.colorMap();
    },
    close() {
      this.isActive = false;
      this.store.removeColorMap();
    },
  },
};
</script>

<style scoped>
.colorful-scale {
  position: relative;
  width: max-content;
  z-index: 18;
}

.measures-popup {
  top: -20px;
  left: -10px;
  z-index: 0;
}

@media screen and (max-width: 680px) {
}

@media screen and (max-width: 400px) {
  .measures-popup {
    top: calc(var(--gap) * 6);
    left: var(--gap);
    right: 3rem;
    position: fixed;
  }
}
</style>
