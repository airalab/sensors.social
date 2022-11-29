<template>
  <div class="colorful-scale">
    <ColorfulScaleItem
      v-for="color in colors"
      :key="color.color"
      :color="color"
    />
  </div>
</template>

<script>
import ColorfulScaleItem from "./ColorfulScaleItem.vue";

export default {
  components: { ColorfulScaleItem },

  data() {
    return {
      colors: [
        {
          color: "green",
          icon: "fa-face-smile",
        },
        // {
        //   color: "yellow",
        //   icon: "fa-face-meh"
        // },
        {
          color: "orange",
          icon: "fa-face-frown-open",
        },
        {
          color: "red",
          icon: "fa-face-dizzy",
        },
      ],
    };
  },
};
</script>

<style scoped>
.colorful-scale {
  position: relative;
  z-index: 8;
  width: max-content;
}
</style>
