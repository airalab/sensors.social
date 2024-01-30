<template>
  <Header :localeCurrent="$i18n.locale" />
  <section class="air-measurements">
    <h1>Air measurements information</h1>

    <div class="air-measurements__wrapper">
      <h2 class="air-measurements__subtitle">PM<sub>10</sub> particles</h2>
      <p class="air-measurements__descr">
        {{ $t("measures.PM10") }}
      </p>
      <h3>{{ $t("measures.pollutionScale") }}</h3>
      <ul>
        <li>{{ $t("measures.pollutionScalePM10.1") }}</li>
        <li>{{ $t("measures.pollutionScalePM10.2") }}</li>
        <li>{{ $t("measures.pollutionScalePM10.3") }}</li>
        <li>{{ $t("measures.pollutionScalePM10.4") }}</li>
        <li>{{ $t("measures.pollutionScalePM10.5") }}</li>
      </ul>
      <h3>{{ $t("measures.recommendations") }}</h3>
      <p>{{ $t("measures.recsPM10Text") }}</p>
      <ol>
        <li>{{ $t("measures.recsPM10.1") }}</li>
        <li>{{ $t("measures.recsPM10.2") }}</li>
        <li>{{ $t("measures.recsPM10.3") }}</li>
        <li>{{ $t("measures.recsPM10.4") }}</li>
        <li>{{ $t("measures.recsPM10.5") }}</li>
      </ol>
    </div>

    <div class="air-measurements__wrapper">
      <h2 class="air-measurements__subtitle">PM<sub>2.5</sub> particles</h2>
      <p class="air-measurements__descr">
        {{ $t("measures.PM25") }}
      </p>
      <h3>{{ $t("measures.pollutionScale") }}</h3>
      <ul>
        <li>{{ $t("measures.pollutionScalePM25.1") }}</li>
        <li>{{ $t("measures.pollutionScalePM25.2") }}</li>
        <li>{{ $t("measures.pollutionScalePM25.3") }}</li>
        <li>{{ $t("measures.pollutionScalePM25.4") }}</li>
        <li>{{ $t("measures.pollutionScalePM25.5") }}</li>
        <li>{{ $t("measures.pollutionScalePM25.6") }}</li>
        <li>{{ $t("measures.pollutionScalePM25.7") }}</li>
      </ul>
      <h3>{{ $t("measures.recommendations") }}</h3>
      <p>{{ $t("measures.recsPM25Text") }}</p>
      <ol>
        <li>{{ $t("measures.recsPM25.1") }}</li>
        <li>{{ $t("measures.recsPM25.2") }}</li>
        <li>{{ $t("measures.recsPM25.3") }}</li>
        <li>{{ $t("measures.recsPM25.4") }}</li>
        <li>{{ $t("measures.recsPM25.5") }}</li>
      </ol>
    </div>

    <div class="air-measurements__wrapper">
      <h2 class="air-measurements__subtitle">CO</h2>
      <p class="air-measurements__descr">
        {{ $t("measures.CO") }}
      </p>
      <h3>{{ $t("measures.pollutionScale") }}</h3>
      <ul>
        <li>{{ $t("measures.pollutionScaleCO.1") }}</li>
        <li>{{ $t("measures.pollutionScaleCO.2") }}</li>
        <li>{{ $t("measures.pollutionScaleCO.3") }}</li>
        <li>{{ $t("measures.pollutionScaleCO.4") }}</li>
      </ul>
      <h3>{{ $t("measures.recommendations") }}</h3>
      <p>{{ $t("measures.recsCOText") }}</p>
      <ol>
        <li>{{ $t("measures.recsCO.1") }}</li>
        <li>{{ $t("measures.recsCO.2") }}</li>
        <li>{{ $t("measures.recsCO.3") }}</li>
        <li>{{ $t("measures.recsCO.4") }}</li>
        <li>{{ $t("measures.recsCO.5") }}</li>
      </ol>
      <p>{{ $t("measures.recsCOText2") }}</p>
    </div>

    <div class="air-measurements__wrapper">
      <h2 class="air-measurements__subtitle">GO</h2>
      <p class="air-measurements__descr">
        {{ $t("measures.GO") }}
      </p>
      <h3>{{ $t("measures.pollutionScale") }}</h3>
      <ul>
        <li>{{ $t("measures.pollutionScaleGO.1") }}</li>
        <li>{{ $t("measures.pollutionScaleGO.2") }}</li>
        <li>{{ $t("measures.pollutionScaleGO.3") }}</li>
        <li>{{ $t("measures.pollutionScaleGO.4") }}</li>
        <li>{{ $t("measures.pollutionScaleGO.5") }}</li>
      </ul>
      <p>{{ $t("measures.pollutionScaleGOText") }}</p>
      <h3>{{ $t("measures.recommendations") }}</h3>
      <p>{{ $t("measures.recsGOText") }}</p>
    </div>

    <div class="air-measurements__wrapper">
      <h2 class="air-measurements__subtitle">NH<sub>3</sub></h2>
      <p class="air-measurements__descr">
        Ammonia. It is capable of causing toxic pulmonary edema and severe
        damage to the nervous system when inhaled. The maximum single
        concentration is 0.2 mg/m3, the average daily concentration is 0.4
        mg/m3.
      </p>
    </div>

    <div class="air-measurements__wrapper">
      <h2 class="air-measurements__subtitle">NO<sub>2</sub></h2>
      <p class="air-measurements__descr">
        Nitrogen oxide. Poisonous red-brown gas with a sharp unpleasant odor or
        yellowish liquid. The source is the combustion of various types of fuel.
        NO2 in the atmosphere can cause acid rain and irritation of mucous
        membranes. The maximum single concentration is 0.085 mg/m3, the average
        daily concentration is 0.4 mg/m3.
      </p>
    </div>

    <div class="air-measurements__wrapper">
      <h2 class="air-measurements__subtitle">Tmp</h2>
      <p class="air-measurements__descr">
        {{ $t("measures.TMP") }}
      </p>
      <h3>{{ $t("measures.pollutionScale") }}</h3>
      <ul>
        <li>{{ $t("measures.pollutionScaleTMP.1") }}</li>
        <li>{{ $t("measures.pollutionScaleTMP.2") }}</li>
        <li>{{ $t("measures.pollutionScaleTMP.3") }}</li>
        <li>{{ $t("measures.pollutionScaleTMP.4") }}</li>
        <li>{{ $t("measures.pollutionScaleTMP.5") }}</li>
      </ul>
      <h3>{{ $t("measures.recommendations") }}</h3>
      <p>{{ $t("measures.recsTMPText") }}</p>
      <ol>
        <li>{{ $t("measures.recsTMP1.1") }}</li>
        <li>{{ $t("measures.recsTMP1.2") }}</li>
      </ol>
      <p>{{ $t("measures.recsTMPText2") }}</p>
      <ol>
        <li>{{ $t("measures.recsTMP2.1") }}</li>
        <li>{{ $t("measures.recsTMP2.2") }}</li>
        <li>{{ $t("measures.recsTMP2.3") }}</li>
      </ol>
    </div>
    <div class="air-measurements__wrapper">
      <h2 class="air-measurements__subtitle">HM</h2>
      <p class="air-measurements__descr">
        {{ $t("measures.HM") }}
      </p>
      <h3>{{ $t("measures.pollutionScale") }}</h3>
      <p>{{ $t("measures.pollutionScaleHMText") }}</p>
      <ul>
        <li>{{ $t("measures.pollutionScaleHM.1") }}</li>
        <li>{{ $t("measures.pollutionScaleHM.2") }}</li>
        <li>{{ $t("measures.pollutionScaleHM.3") }}</li>
        <li>{{ $t("measures.pollutionScaleHM.4") }}</li>
        <li>{{ $t("measures.pollutionScaleHM.5") }}</li>
      </ul>
      <p>{{ $t("measures.pollutionScaleHMText2") }}</p>
      <h3>{{ $t("measures.recommendations") }}</h3>
      <p>{{ $t("measures.recsHMText") }}</p>
      <ol>
        <li>{{ $t("measures.recsHM1.1") }}</li>
        <li>{{ $t("measures.recsHM1.2") }}</li>
        <li>{{ $t("measures.recsHM1.3") }}</li>
      </ol>
      <p>{{ $t("measures.recsHMText2") }}</p>
      <ol>
        <li>{{ $t("measures.recsHM2.1") }}</li>
        <li>{{ $t("measures.recsHM2.2") }}</li>
        <li>{{ $t("measures.recsHM2.3") }}</li>
        <li>{{ $t("measures.recsHM2.4") }}</li>
        <li>{{ $t("measures.recsHM2.5") }}</li>
      </ol>
    </div>
  </section>
</template>

<script>
import Header from "../components/header/Header.vue";

export default {
  components: { Header },
};
</script>

<style scoped>
.air-measurements {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  background-color: var(--color-light);
  color: var(--color-dark);
}

.air-measurements h1 {
  margin-bottom: calc(var(--gap) * 2);
}

.air-measurements h2,
.air-measurements h3 {
  font-size: var(--font-size);
  font-weight: 700;
}

.air-measurements p {
  font-size: calc(var(--font-size) * 0.9);
}

.air-measurements__wrapper:not(:last-of-type) {
  margin-bottom: 3rem;
}

.air-measurements ol,
.air-measurements ul {
  padding-left: calc(var(--gap) * 2);
}

.air-measurements ul {
  list-style: disc;
}
</style>
