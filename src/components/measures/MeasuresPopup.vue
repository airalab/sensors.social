<template>
  <div
    id="measures"
    class="sensors-panel popup-js container"
    :class="{ active: isActive }"
  >
    <div class="measures__wrapper">
      <MeasureInfo :measure="measure" />

      <a
        class="popup__close"
        href="javascript:;"
        @click="() => $emit('toggleIsActive')"
      >
        <font-awesome-icon icon="fa-solid fa-xmark"></font-awesome-icon>
      </a>
    </div>
  </div>
</template>

<script>
import MeasureInfo from "./MeasureInfo.vue";

export default {
  components: { MeasureInfo },

  props: {
    isActive: {
      type: Boolean,
    },
    type: {
      type: String,
    },
  },

  data() {
    return {
      measures: [
        {
          id: 0,
          name: "PM10",
          description: this.$t("measures.PM10"),
        },
        {
          id: 1,
          name: "PM2.5",
          description: this.$t("measures.PM25"),
        },
        {
          id: 2,
          name: "CO",
          description: this.$t("measures.CO"),
        },
        {
          id: 3,
          name: "NH3",
          description: this.$t("measures.NH3"),
        },
        {
          id: 4,
          name: "NO2",
          description: this.$t("measures.NO2"),
        },
        {
          id: 5,
          name: "Tmp",
          description: this.$t("measures.TMP"),
        },
      ],
    };
  },
  computed: {
    measure() {
      return this.measures.filter((measure) => {
        if (this.$props.type === "temperature") {
          return measure.name.toLowerCase() === "tmp";
        } else {
          return (
            measure.name.toLowerCase().replace(".", "") ===
            this.$props.type.toLowerCase()
          );
        }
      });
    },
  },
};
</script>

<style scoped>
#measures.container {
  padding-top: calc(var(--gap) * 9);
  padding-bottom: 3rem;
  padding-right: 0.7rem !important;
  min-width: 320px;
  width: 100%;
}

.measures__list {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.measures__wrapper {
  padding-right: 2rem;
  height: 308px;
  overflow-y: auto;
}

.popup__close {
  font-size: calc(var(--gap) * 1.2);
  width: 32px;
  height: 32px;
  right: calc(var(--gap) * -1.8);
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-light);
}

@media screen and (max-width: 400px) {
  .measures__list {
    flex-wrap: wrap;
  }
}
</style>
