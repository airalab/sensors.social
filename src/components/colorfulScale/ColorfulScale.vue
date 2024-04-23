<template>
  <div class="colorful-scale">
    <ColorfulScaleItem
      v-for="measure in measurementsColors"
      :key="measure.id"
      :measure="measure"
      :type="type"
    />
  </div>
</template>

<script>
import { useStore } from "@/store";
import ColorfulScaleItem from "./ColorfulScaleItem.vue";

export default {
  components: { ColorfulScaleItem },

  props: ["type"],

  data() {
    return {
      measurementsColors: [
        {
          id: 0,
          name: "PM10",
          sub: "10",
          colors: [
            {
              color: "green",
              text: "0-50 µg/m³",
            },
            {
              color: "blue",
              text: "51-100 µg/m³",
            },
            {
              color: "orange",
              text: "101-250 µg/m³",
            },
            {
              color: "red",
              text: "251-350 µg/m³",
            },
            {
              color: "purple",
              text: "> 351 µg/m³",
            },
          ],
        },
        {
          id: 1,
          name: "PM2.5",
          sub: "2.5",
          colors: [
            {
              color: "green",
              text: "0-35 µg/m³",
            },
            {
              color: "blue",
              text: "36-70 µg/m³",
            },
            {
              color: "orange",
              text: "70-150 µg/m³",
            },
            {
              color: "red",
              text: "151-250 µg/m³",
            },
            {
              color: "purple",
              text: "> 251 µg/m³",
            },
          ],
        },
        {
          id: 2,
          name: "CO",
          colors: [
            {
              color: "green",
              text: "0-2 mg/m³",
            },
            {
              color: "blue",
              text: "2-4 mg/m³",
            },
            {
              color: "red",
              text: "4-14 mg/m³",
            },
            {
              color: "purple",
              text: "> 14 mg/m³",
            },
          ],
        },
        {
          id: 3,
          name: "GO",
          colors: [
            {
              color: "green",
              text: "0.01 µSv/h and below",
            },
            {
              color: "blue",
              text: "0.01-0.1 µSv/h",
            },
            {
              color: "orange",
              text: "0.1-1 µSv/h",
            },
            {
              color: "red",
              text: "1-10 µSv/h",
            },
            {
              color: "purple",
              text: "> 10 µSv/h",
            },
          ],
        },
        {
          id: 4,
          name: "Tmp",
          colors: [
            {
              color: "purple",
              text: "-10°C / 14°F and below ",
            },
            {
              color: "navy",
              text: "-10 to 0°C / 14 to 32°F",
            },
            {
              color: "blue",
              text: "0 to 10°C / 32-50°F ",
            },
            {
              color: "green",
              text: "10 to 25°C / 50-77°F",
            },
            {
              color: "orange",
              text: "25°C / 77°F and above",
            },
          ],
        },
        {
          id: 5,
          name: "HM",
          colors: [
            {
              color: "red",
              text: "< 30%",
            },
            {
              color: "orange",
              text: "30 - 40% ",
            },
            {
              color: "blue",
              text: "40 - 60%",
            },
            {
              color: "navy",
              text: "60 - 70%",
            },
            {
              color: "purple",
              text: "> 70%",
            },
          ],
        },
        {
          id: 6,
          name: "NH3",
          sub: "3",
        },
        {
          id: 7,
          name: "NO2",
          sub: "2",
        },
      ],
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
  z-index: 7;
}
</style>
