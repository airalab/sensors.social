<template>
  <div id="measuresPopup" class="sensors-panel container">
    <button class="header__close-popup" @click="$emit('toggleClose')"></button>
    <div class="popup__content">
      <h2>{{ $t("measures.popupTitle") }}</h2>
      <ColorfulScaleItem
        v-for="measure in measurementsColors"
        :key="measure.id"
        :measure="measure"
      />
      <router-link
        class="measures-popup__page-link"
        target="_blank"
        :to="{ name: 'air-measurements' }"
      >
        {{ $t("measures.popupPage") }}
      </router-link>
    </div>
  </div>
</template>

<script>
import ColorfulScaleItem from "../colorfulScale/ColorfulScaleItem.vue";

export default {
  components: { ColorfulScaleItem },

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
              text: this.$t("measures.pollutionScalePM10.1"),
            },
            {
              color: "blue",
              text: this.$t("measures.pollutionScalePM10.2"),
            },
            {
              color: "orange",
              text: this.$t("measures.pollutionScalePM10.3"),
            },
            {
              color: "red",
              text: this.$t("measures.pollutionScalePM10.4"),
            },
            {
              color: "purple",
              text: this.$t("measures.pollutionScalePM10.5"),
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
              text: this.$t("measures.pollutionScalePM25.1"),
            },
            {
              color: "blue",
              text: this.$t("measures.pollutionScalePM25.2"),
            },
            {
              color: "orange",
              text: this.$t("measures.pollutionScalePM25.3"),
            },
            {
              color: "red",
              text: this.$t("measures.pollutionScalePM25.4"),
            },
            {
              color: "purple",
              text: this.$t("measures.pollutionScalePM25.5"),
            },
          ],
        },
        {
          id: 2,
          name: "CO",
          colors: [
            {
              color: "green",
              text: this.$t("measures.pollutionScaleCO.1"),
            },
            {
              color: "blue",
              text: this.$t("measures.pollutionScaleCO.2"),
            },
            {
              color: "red",
              text: this.$t("measures.pollutionScaleCO.3"),
            },
            {
              color: "purple",
              text: this.$t("measures.pollutionScaleCO.4"),
            },
          ],
        },
        {
          id: 3,
          name: "GO",
          colors: [
            {
              color: "green",
              text: this.$t("measures.pollutionScaleGO.1"),
            },
            {
              color: "blue",
              text: this.$t("measures.pollutionScaleGO.2"),
            },
            {
              color: "orange",
              text: this.$t("measures.pollutionScaleGO.3"),
            },
            {
              color: "red",
              text: this.$t("measures.pollutionScaleGO.4"),
            },
          ],
        },
        {
          id: 4,
          name: "Tmp",
          colors: [
            {
              color: "purple",
              text: this.$t("measures.pollutionScaleTMP.1"),
            },
            {
              color: "navy",
              text: this.$t("measures.pollutionScaleTMP.2"),
            },
            {
              color: "blue",
              text: this.$t("measures.pollutionScaleTMP.3"),
            },
            {
              color: "green",
              text: this.$t("measures.pollutionScaleTMP.4"),
            },
            {
              color: "orange",
              text: this.$t("measures.pollutionScaleTMP.5"),
            },
          ],
        },
        {
          id: 5,
          name: "HM",
          colors: [
            {
              color: "red",
              text: this.$t("measures.pollutionScaleHM.1"),
            },
            {
              color: "orange",
              text: this.$t("measures.pollutionScaleHM.2"),
            },
            {
              color: "blue",
              text: this.$t("measures.pollutionScaleHM.3"),
            },
            {
              color: "navy",
              text: this.$t("measures.pollutionScaleHM.4"),
            },
            {
              color: "purple",
              text: this.$t("measures.pollutionScaleHM.5"),
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
    };
  },
};
</script>

<style scope>
#measuresPopup {
  display: flex;
  flex-direction: column;
}

#measuresPopup a {
  cursor: pointer;
}

#measuresPopup .popup__content {
  max-height: calc(100vh - 240px);
  padding-top: var(--gap);
  padding-left: calc(var(--gap) * 2);
  padding-right: calc(var(--gap) * 2);
}

#measuresPopup .header__close-popup {
  position: absolute;
  top: var(--gap);
  right: 30px;
}

#measuresPopup h2 {
  font-weight: 900;
  max-width: 80%;
  font-size: calc(var(--font-size) * 1.5);
  margin-bottom: calc(var(--gap) * 2);
}

.measures-popup__page-link {
  text-transform: none;
  padding-bottom: 20px;
}

@media screen and (max-width: 640px) {
  #measuresPopup h2 {
    font-size: calc(var(--font-size) * 1.2);
  }

  #measuresPopup .popup__content {
    max-height: calc(100vh - 300px);
  }
}
</style>
