<template>
  <Header :localeCurrent="$i18n.locale" />
  <section class="air-measurements">
    <h1>Air measurements information</h1>

    <div class="air-measurements__wrapper" id="PM10">
      <div class="air-measurements__header">
        <h2 class="air-measurements__subtitle">PM<sub>10</sub> particles</h2>
        <p class="air-measurements__descr">
          {{ $t("measures.PM10") }}
        </p>
      </div>
      <div class="air-measurements__content">
        <ul>
          <li class="green">{{ $t("measures.pollutionScalePM10.1") }}</li>
          <li class="blue">{{ $t("measures.pollutionScalePM10.2") }}</li>
          <li class="orange">{{ $t("measures.pollutionScalePM10.3") }}</li>
          <li class="red">{{ $t("measures.pollutionScalePM10.4") }}</li>
          <li class="purple">{{ $t("measures.pollutionScalePM10.5") }}</li>
        </ul>
        <div class="air-measurements__recs">
          <p>{{ $t("measures.recsPM10Text") }}</p>
          <ol>
            <li>{{ $t("measures.recsPM10.1") }}</li>
            <li>{{ $t("measures.recsPM10.2") }}</li>
            <li>{{ $t("measures.recsPM10.3") }}</li>
            <li>{{ $t("measures.recsPM10.4") }}</li>
            <li>{{ $t("measures.recsPM10.5") }}</li>
          </ol>
        </div>
      </div>
    </div>

    <div class="air-measurements__wrapper" id="PM2.5">
      <div class="air-measurements__header">
        <h2 class="air-measurements__subtitle">PM<sub>2.5</sub> particles</h2>
        <p class="air-measurements__descr">
          {{ $t("measures.PM25") }}
        </p>
      </div>
      <div class="air-measurements__content">
        <ul>
          <li class="green">{{ $t("measures.pollutionScalePM25.1") }}</li>
          <li class="blue">{{ $t("measures.pollutionScalePM25.2") }}</li>
          <li class="orange">{{ $t("measures.pollutionScalePM25.3") }}</li>
          <li class="red">{{ $t("measures.pollutionScalePM25.4") }}</li>
          <li class="purple">{{ $t("measures.pollutionScalePM25.5") }}</li>
        </ul>
        <div class="air-measurements__recs">
          <p>{{ $t("measures.recsPM25Text") }}</p>
          <ol>
            <li>{{ $t("measures.recsPM25.1") }}</li>
            <li>{{ $t("measures.recsPM25.2") }}</li>
            <li>{{ $t("measures.recsPM25.3") }}</li>
            <li>{{ $t("measures.recsPM25.4") }}</li>
            <li>{{ $t("measures.recsPM25.5") }}</li>
          </ol>
        </div>
      </div>
    </div>

    <div class="air-measurements__wrapper" id="CO">
      <div class="air-measurements__header">
        <h2 class="air-measurements__subtitle">CO</h2>
        <p class="air-measurements__descr">
          {{ $t("measures.CO") }}
        </p>
      </div>
      <div class="air-measurements__content">
        <ul>
          <li class="green">{{ $t("measures.pollutionScaleCO.1") }}</li>
          <li class="blue">{{ $t("measures.pollutionScaleCO.2") }}</li>
          <li class="red">{{ $t("measures.pollutionScaleCO.3") }}</li>
          <li class="purple">{{ $t("measures.pollutionScaleCO.4") }}</li>
        </ul>
        <div class="air-measurements__recs">
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
      </div>
    </div>

    <div class="air-measurements__wrapper" id="GO">
      <div class="air-measurements__header">
        <h2 class="air-measurements__subtitle">GO (Radiation)</h2>
        <p class="air-measurements__descr">
          {{ $t("measures.GO") }}
        </p>
      </div>
      <div class="air-measurements__content">
        <ul>
          <li class="green">{{ $t("measures.pollutionScaleGO.1") }}</li>
          <li class="blue">{{ $t("measures.pollutionScaleGO.2") }}</li>
          <li class="orange">{{ $t("measures.pollutionScaleGO.3") }}</li>
          <li class="red">{{ $t("measures.pollutionScaleGO.4") }}</li>
          <li class="purple">{{ $t("measures.pollutionScaleGO.5") }}</li>
        </ul>
        <div class="air-measurements__recs">
          <p>{{ $t("measures.pollutionScaleGOText") }}</p>
          <p>{{ $t("measures.recsGOText") }}</p>
        </div>
      </div>
    </div>

    <div class="air-measurements__wrapper" id="Tmp">
      <div class="air-measurements__header">
        <h2 class="air-measurements__subtitle">Tmp</h2>
        <p class="air-measurements__descr">
          {{ $t("measures.TMP") }}
        </p>
      </div>
      <div class="air-measurements__content">
        <ul>
          <li class="purple">{{ $t("measures.pollutionScaleTMP.1") }}</li>
          <li class="navy">{{ $t("measures.pollutionScaleTMP.2") }}</li>
          <li class="blue">{{ $t("measures.pollutionScaleTMP.3") }}</li>
          <li class="green">{{ $t("measures.pollutionScaleTMP.4") }}</li>
          <li class="orange">{{ $t("measures.pollutionScaleTMP.5") }}</li>
        </ul>
        <div class="air-measurements__recs">
          <p>{{ $t("measures.recsTMPText") }}</p>
          <ol class="mb">
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
      </div>
    </div>
    <div class="air-measurements__wrapper" id="HM">
      <div class="air-measurements__header">
        <h2 class="air-measurements__subtitle">HM</h2>
        <p class="air-measurements__descr">
          {{ $t("measures.HM") }}
        </p>
      </div>
      <div class="air-measurements__content">
        <ul>
          <li class="red">{{ $t("measures.pollutionScaleHM.1") }}</li>
          <li class="orange">{{ $t("measures.pollutionScaleHM.2") }}</li>
          <li class="blue">{{ $t("measures.pollutionScaleHM.3") }}</li>
          <li class="navy">{{ $t("measures.pollutionScaleHM.4") }}</li>
          <li class="purple">{{ $t("measures.pollutionScaleHM.5") }}</li>
        </ul>
        <div class="air-measurements__recs">
          <p class="mb">{{ $t("measures.pollutionScaleHMText2") }}</p>
          <p>{{ $t("measures.recsHMText") }}</p>
          <ol class="mb">
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
      </div>
    </div>

    <div class="air-measurements__wrapper air-measurements__header" id="NH3">
      <h2 id="NH3" class="air-measurements__subtitle">NH<sub>3</sub></h2>
      <p class="air-measurements__descr">
        Ammonia. It is capable of causing toxic pulmonary edema and severe
        damage to the nervous system when inhaled. The maximum single
        concentration is 0.2 mg/m3, the average daily concentration is 0.4
        mg/m3.
      </p>
    </div>
    <div class="air-measurements__wrapper air-measurements__header" id="NO2">
      <h2 id="NO2" class="air-measurements__subtitle">NO<sub>2</sub></h2>
      <p class="air-measurements__descr">
        Nitrogen oxide. Poisonous red-brown gas with a sharp unpleasant odor or
        yellowish liquid. The source is the combustion of various types of fuel.
        NO2 in the atmosphere can cause acid rain and irritation of mucous
        membranes. The maximum single concentration is 0.085 mg/m3, the average
        daily concentration is 0.4 mg/m3.
      </p>
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
.mb {
  margin-bottom: calc(var(--gap) * 2) !important;
}

.air-measurements {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  background-color: var(--color-light);
  color: var(--color-dark);
}

.air-measurements h1 {
  max-width: 800px;
  margin: 0 auto;
  margin-bottom: calc(var(--gap) * 3);
  font-weight: 900;
  text-transform: uppercase;
}

.air-measurements h2,
.air-measurements h3 {
  font-size: var(--font-size);
  font-weight: 900;
}

.air-measurements__header p {
  font-size: calc(var(--font-size) * 0.9);
  font-weight: 500;
  line-height: 1.7;
}

.air-measurements__wrapper:not(:last-of-type) {
  margin-bottom: 5rem;
}

.air-measurements__header {
  max-width: 800px;
  margin: 0 auto;
  margin-bottom: calc(var(--gap) * 2);
}

.air-measurements__content {
  display: grid;
  grid-template-columns: 350px 630px;
  justify-content: center;
  gap: calc(var(--gap) * 2);
  font-weight: 500;
}

.air-measurements__recs {
  font-size: calc(var(--font-size) * 0.9);
}

.air-measurements ol {
  padding-left: calc(var(--gap) * 1.5);
  margin-bottom: calc(var(--gap) * 0.5);
}

.air-measurements ul li {
  width: 100%;
  padding: calc(var(--gap) * 0.5) calc(var(--gap) * 0.9);
  color: var(--color-light);
  font-size: calc(var(--font-size) * 0.8);
  font-weight: 900;
}

.air-measurements .green {
  background-color: var(--color-green);
}

.air-measurements .blue {
  background-color: var(--color-teal);
}

.air-measurements .navy {
  background-color: var(--color-navy);
}

.air-measurements .orange {
  background-color: var(--color-orange);
}

.air-measurements .red {
  background-color: var(--color-bright-red);
}

.air-measurements .purple {
  background-color: var(--color-purple);
}

@media screen and (max-width: 880px) {
  .air-measurements__content {
    grid-template-columns: 1fr;
    gap: var(--gap);
  }
}
</style>
