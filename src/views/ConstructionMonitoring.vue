<template>
  <MetaInfo
    :pageTitle="$t('construction.metaTitle')"
    :pageDescription="$t('construction.metaDescription')"
    pageImage="/og-construction.webp"
  />
  <PageTextLayout>
    <div class="construction">
      <section class="cm-hero">
        <div class="cm-hero-text">
          <div class="cm-eyebrow">{{ $t("construction.eyebrow") }}</div>
          <h1>{{ $t("construction.title") }}</h1>
          <p>{{ $t("construction.subtitle") }}</p>
          <div class="cm-actions">
            <router-link class="cm-button cm-button-primary" to="/">{{
              $t("construction.openMap")
            }}</router-link>
            <a class="cm-button" href="#how" @click.prevent="scrollToHow">{{
              $t("construction.howLink")
            }}</a>
          </div>
        </div>
        <figure class="cm-hero-map">
          <img :src="mapImage" :alt="$t('construction.mapAlt')" width="1160" height="540" />
          <figcaption>{{ $t("construction.mapCaption") }}</figcaption>
        </figure>
      </section>

      <section class="cm-stats">
        <div v-for="stat in stats" :key="stat" class="cm-stat">
          <b>{{ $t(`construction.stat.${stat}.value`) }}</b>
          <span>{{ $t(`construction.stat.${stat}.label`) }}</span>
        </div>
      </section>

      <section class="cm-columns">
        <div>
          <h2>{{ $t("construction.limits.title") }}</h2>
          <p>{{ $t("construction.limits.text") }}</p>
          <div class="cm-limits" role="img" :aria-label="$t('construction.limits.aria')">
            <div v-for="limit in limits" :key="limit.key" class="cm-limit">
              <h3>{{ $t(`construction.limits.${limit.key}`) }}</h3>
              <div class="cm-bar-row">
                <div class="cm-bar-track">
                  <div class="cm-bar" :style="{ width: `${(limit.today / LIMIT_SCALE) * 100}%` }" />
                </div>
                <span>{{ limit.today }} {{ $t("construction.limits.today") }}</span>
              </div>
              <div class="cm-bar-row">
                <div class="cm-bar-track">
                  <div
                    class="cm-bar cm-bar-target"
                    :style="{ width: `${(limit.target / LIMIT_SCALE) * 100}%` }"
                  />
                </div>
                <b>{{ limit.target }} {{ $t("construction.limits.by2030") }}</b>
              </div>
            </div>
            <div class="cm-note">{{ $t("construction.limits.unit") }}</div>
          </div>
        </div>
        <div>
          <h2>{{ $t("construction.problems.title") }}</h2>
          <div class="cm-problems">
            <article v-for="problem in problems" :key="problem.key" class="cm-problem">
              <svg viewBox="0 0 24 24" class="cm-icon" aria-hidden="true">
                <path v-for="path in problem.icon" :key="path" :d="path" />
              </svg>
              <div>
                <h3>{{ $t(`construction.problems.${problem.key}.title`) }}</h3>
                <p>{{ $t(`construction.problems.${problem.key}.text`) }}</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="cm-panel cm-panel-dark">
        <h2>{{ $t("construction.cases.title") }}</h2>
        <div class="cm-cases">
          <article v-for="city in cases" :key="city" class="cm-case">
            <h3>{{ $t(`construction.cases.${city}.name`) }}</h3>
            <p>{{ $t(`construction.cases.${city}.text`) }}</p>
            <p class="cm-case-result">{{ $t(`construction.cases.${city}.result`) }}</p>
          </article>
          <article class="cm-case cm-case-common">
            <h3>{{ $t("construction.cases.common.title") }}</h3>
            <p>{{ $t("construction.cases.common.text") }}</p>
          </article>
        </div>
      </section>

      <section>
        <h2>{{ $t("construction.kpi.title") }}</h2>
        <div class="cm-kpi">
          <div class="cm-kpi-row cm-kpi-head">
            <div />
            <div>{{ $t("construction.kpi.green") }}</div>
            <div>{{ $t("construction.kpi.yellow") }}</div>
            <div>{{ $t("construction.kpi.red") }}</div>
          </div>
          <div v-for="row in kpi" :key="row.key" class="cm-kpi-row">
            <div class="cm-kpi-label">
              {{ $t(`construction.kpi.${row.key}`) }}
              <span>{{ $t(`construction.kpi.${row.unit}`) }}</span>
            </div>
            <div class="cm-zone is-green">{{ row.values[0] }}</div>
            <div class="cm-zone is-yellow">{{ row.values[1] }}</div>
            <div class="cm-zone is-red">{{ row.values[2] }}</div>
          </div>
        </div>
        <div class="cm-outcomes">
          <div class="cm-outcome is-green">
            <h3>{{ $t("construction.kpi.bonusTitle") }}</h3>
            <ul>
              <li v-for="bonus in bonuses" :key="bonus">
                {{ $t(`construction.kpi.bonus.${bonus}`) }}
              </li>
            </ul>
          </div>
          <div class="cm-outcome is-red">
            <h3>{{ $t("construction.kpi.escalationTitle") }}</h3>
            <div class="cm-escalation">
              <template v-for="(step, index) in escalation" :key="step">
                <svg v-if="index" viewBox="0 0 24 24" class="cm-arrow" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
                <span :class="{ 'is-final': index === escalation.length - 1 }">{{
                  $t(`construction.kpi.${step}`)
                }}</span>
              </template>
            </div>
          </div>
        </div>
      </section>

      <section class="cm-panel cm-solution">
        <div class="cm-solution-device">
          <img :src="urbanImage" :alt="$t('construction.solution.urbanAlt')" />
          <ul>
            <li v-for="metric in metrics" :key="metric.key">
              <svg
                viewBox="0 0 24 24"
                :class="['cm-icon', 'cm-icon-small', { 'cm-icon-dust': metric.key === 'dust' }]"
                aria-hidden="true"
              >
                <path v-for="path in metric.icon" :key="path" :d="path" />
              </svg>
              {{ $t(`construction.solution.${metric.key}`) }}
            </li>
          </ul>
        </div>
        <div>
          <h2>{{ $t("construction.solution.title") }}</h2>
          <div v-for="feature in features" :key="feature" class="cm-feature">
            <h3>{{ $t(`construction.solution.${feature}.title`) }}</h3>
            <p>{{ $t(`construction.solution.${feature}.text`) }}</p>
          </div>
        </div>
      </section>

      <section id="how" ref="howSection">
        <h2 class="cm-title-tight">{{ $t("construction.how.title") }}</h2>
        <p class="cm-lead">{{ $t("construction.how.text") }}</p>
        <ol class="cm-steps">
          <li v-for="step in 5" :key="step">
            <span class="cm-step-number">{{ step }}</span>
            {{ $t(`construction.how.step${step}`) }}
          </li>
        </ol>
        <div class="cm-budget">
          <div>
            <div class="cm-budget-label">{{ $t("construction.budget.label") }}</div>
            <div class="cm-budget-value">{{ $t("construction.budget.value") }}</div>
            <div>{{ $t("construction.budget.note") }}</div>
          </div>
          <p>{{ $t("construction.budget.text") }}</p>
        </div>
      </section>

      <section class="cm-panel cm-panel-cta">
        <h2>{{ $t("construction.cta.title") }}</h2>
        <div class="cm-actions">
          <router-link class="cm-button cm-button-dark" to="/">{{
            $t("construction.cta.map")
          }}</router-link>
          <router-link class="cm-button" to="/altruist-device-info/">{{
            $t("construction.cta.about")
          }}</router-link>
        </div>
      </section>
    </div>
  </PageTextLayout>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import MetaInfo from "../components/MetaInfo.vue";
import PageTextLayout from "../components/layouts/PageText.vue";
import mapImage from "@/assets/images/pages/construction-monitoring/map-limassol.webp";
import urbanImage from "@/assets/images/altruist-device/altruist-urban.webp";

const LIMIT_SCALE = 40;

const stats = ["deaths", "london", "checks"];
const limits = [
  { key: "pm10", today: 40, target: 20 },
  { key: "pm25", today: 25, target: 10 },
];
const problems = [
  { key: "snapshots", icon: ["M4 5h16v15H4z", "M4 10h16M9 3v4M15 3v4"] },
  { key: "numbers", icon: ["M4 5h16v11H9l-5 4z", "M9 10h6"] },
  { key: "incentive", icon: ["M3 20h18", "M6 20V9l6-5v16", "M12 12h6v8"] },
];
const cases = ["london", "singapore", "seoul", "hongkong", "stuttgart"];
const kpi = [
  { key: "pm10Day", unit: "unitDust", values: ["< 45", "45–80", "> 80"] },
  { key: "pm10Peak", unit: "unitDust", values: ["< 150", "150–190", "> 190"] },
  { key: "noiseDay", unit: "unitNoise", values: ["< 70", "70–75", "> 75"] },
  { key: "noiseNight", unit: "unitNoise", values: ["< 50", "50–55", "> 55"] },
];
const bonuses = ["permits", "density", "fees", "deposit"];
const escalation = ["warning", "fine", "stop"];
const metrics = [
  {
    key: "dust",
    icon: ["M6 6v.01M14 5v.01M18 11v.01M9 14v.01M15 18v.01M5 19v.01"],
  },
  { key: "noise", icon: ["M4 10v4h4l5 4V6L8 10z", "M17 9a4 4 0 0 1 0 6"] },
  { key: "climate", icon: ["M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0z"] },
];
const features = ["cloud", "software", "price"];

const router = useRouter();
const howSection = ref(null);

const scrollToHow = () => {
  howSection.value?.scrollIntoView({ behavior: "smooth" });
};

onMounted(() => {
  const waitForMatomo = setInterval(() => {
    if (typeof window.Matomo !== "undefined" && typeof window.Matomo.getTracker === "function") {
      clearInterval(waitForMatomo);

      const trackPage = () => {
        const tracker = window.Matomo.getTracker();
        if (tracker && !tracker.isUserOptedOut()) {
          window._paq.push(["setCustomUrl", router.currentRoute.value.fullPath]);
          window._paq.push(["setDocumentTitle", document.title]);
          window._paq.push(["trackPageView"]);
        }
      };

      trackPage();
    }
  }, 100);
});
</script>

<style scoped>
.construction {
  text-align: left;
}

.construction h1 {
  margin: 0;
  font-size: clamp(2.2rem, 4.6vw, 3.25rem);
  font-weight: 800;
  line-height: 1.08;
}

.construction h2 {
  margin: 0 0 1.25rem;
  font-size: clamp(1.75rem, 3.4vw, 2.4rem);
  font-weight: 800;
  line-height: 1.15;
}

.construction h3 {
  margin: 0 0 0.2rem;
  font-size: 1.15rem;
  font-weight: 800;
}

.construction p {
  margin: 0;
  color: #333;
  font-size: 1rem;
}

.construction img {
  display: block;
  height: auto;
}

.construction li {
  font-size: 1rem;
}

.cm-eyebrow {
  color: #555;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.cm-hero,
.cm-columns,
.cm-solution {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  gap: 2.5rem;
}

.cm-hero {
  align-items: center;
  gap: 2rem;
}

.cm-hero-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.1rem;
}

.construction .cm-hero-text p {
  font-size: 1.2rem;
}

.cm-hero-map {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 0;
  padding: 1rem;
  border-radius: 24px;
  background: var(--color-light-gray);
  color: #444;
  font-size: 0.875rem;
}

.cm-hero-map img {
  width: 100%;
  border-radius: 14px;
}

.cm-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.construction a.cm-button {
  display: inline-flex;
  align-items: center;
  min-height: 52px;
  padding: 0 1.5rem;
  border: 2px solid var(--color-dark);
  border-radius: 26px;
  color: var(--color-dark);
  font-size: 1.05rem;
  font-weight: 700;
  text-decoration: none;
}

.construction a.cm-button-primary {
  background: var(--color-green-bright);
  font-weight: 800;
}

.construction a.cm-button-dark {
  background: var(--color-dark);
  color: var(--color-light);
  font-weight: 800;
}

.cm-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr));
  gap: 0.75rem;
}

.cm-stat {
  padding: 1.25rem;
  border-radius: 16px;
  background: var(--color-light-gray);
  color: #333;
  font-size: 0.95rem;
}

.cm-stat b {
  display: block;
  color: var(--color-dark);
  font-size: 2.35rem;
  font-weight: 800;
  line-height: 1.15;
}

.cm-limits {
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
  margin-top: 1.25rem;
}

.cm-limit {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.cm-bar-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 6rem;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.95rem;
  font-weight: 700;
  white-space: nowrap;
}

.cm-bar {
  height: 28px;
  border-radius: 6px;
  background: #b9b9c8;
}

.cm-bar-target {
  box-sizing: border-box;
  border: 2px solid var(--color-dark);
  background: var(--color-green-bright);
}

.cm-note {
  color: #444;
  font-size: 0.875rem;
}

.cm-problems {
  display: grid;
  gap: 0.75rem;
}

.cm-problem {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  padding: 1.1rem;
  border: 2px solid var(--color-dark);
  border-radius: 16px;
}

.cm-icon {
  flex: none;
  width: 28px;
  height: 28px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.cm-icon-small {
  width: 22px;
  height: 22px;
}

.cm-icon-dust {
  stroke-width: 3.6;
}

.cm-panel {
  padding: clamp(1.5rem, 4vw, 2.75rem);
  border-radius: 28px;
  background: var(--color-light-gray);
}

.cm-panel-dark {
  background: var(--color-dark);
  color: var(--color-light);
}

.cm-panel-cta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.1rem;
  border: 2px solid var(--color-dark);
  background: var(--color-green-bright);
}

.construction .cm-panel-cta h2 {
  margin: 0;
}

.cm-cases {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
  gap: 0.9rem;
}

.cm-case {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1.4rem;
  border-radius: 16px;
  background: #17171c;
}

.construction .cm-case h3 {
  margin: 0;
  font-size: 1.4rem;
}

.construction .cm-case p {
  color: #d0d0d8;
  font-size: 0.95rem;
}

.construction .cm-case .cm-case-result {
  margin-top: auto;
  color: var(--color-green-bright);
  font-size: 1rem;
  font-weight: 700;
}

.cm-case-common {
  background: var(--color-green-bright);
  color: var(--color-dark);
}

.construction .cm-case-common p {
  color: var(--color-dark);
  font-size: 1.05rem;
  font-weight: 500;
}

.cm-kpi {
  display: grid;
  gap: 0.5rem;
}

.cm-kpi-row {
  display: grid;
  grid-template-columns: minmax(6.5rem, 1.7fr) repeat(3, minmax(0, 1fr));
  gap: 0.35rem;
  font-weight: 700;
}

.cm-kpi-head > div {
  padding: 0 0.6rem;
  font-size: 0.95rem;
  font-weight: 800;
}

.cm-kpi-label {
  align-self: center;
  line-height: 1.25;
}

.cm-kpi-label span {
  display: block;
  color: #444;
  font-size: 0.8rem;
  font-weight: 500;
}

.cm-zone {
  padding: 0.75rem 0.6rem;
}

@media (width < 520px) {
  .cm-kpi-row {
    grid-template-columns: minmax(5.4rem, 1.1fr) repeat(3, minmax(0, 1fr));
    font-size: 0.875rem;
  }

  .cm-kpi-head > div {
    padding: 0 0.4rem;
    font-size: 0.8rem;
  }

  .cm-zone {
    padding: 0.75rem 0.4rem;
    white-space: nowrap;
  }
}

.cm-zone.is-green {
  border-radius: 8px 0 0 8px;
  background: #7fdc9f;
}

.cm-zone.is-yellow {
  background: #ffd27a;
}

.cm-zone.is-red {
  border-radius: 0 8px 8px 0;
  background: #ff9f94;
}

.cm-outcomes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  gap: 0.9rem;
  margin-top: 1.25rem;
}

.cm-outcome {
  padding: 1.4rem;
  border-radius: 16px;
}

.construction .cm-outcome h3 {
  margin-bottom: 0.75rem;
  font-size: 1.25rem;
}

.cm-outcome.is-green {
  background: #e3f8ea;
}

.cm-outcome.is-red {
  background: #ffe9e6;
}

.cm-outcome ul {
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.cm-outcome li {
  margin: 0;
}

.cm-escalation {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
}

.cm-escalation span {
  padding: 0.6rem 0.9rem;
  border-radius: 10px;
  background: var(--color-light);
}

.cm-escalation span.is-final {
  background: var(--color-dark);
  color: var(--color-light);
}

.cm-arrow {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.cm-solution {
  align-items: center;
}

.cm-solution-device {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.1rem;
}

.cm-solution-device img {
  width: 260px;
  max-width: 100%;
}

.cm-solution-device ul {
  display: grid;
  gap: 0.6rem;
  width: 100%;
  max-width: 380px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.cm-solution-device li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0;
}

.cm-feature + .cm-feature {
  margin-top: 1.1rem;
}

.construction .cm-title-tight {
  margin-bottom: 0.5rem;
}

.construction .cm-lead {
  font-size: 1.05rem;
}

.cm-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr));
  gap: 0.6rem;
  margin: 1.25rem 0 0;
  padding: 0;
  list-style: none;
}

.cm-steps li {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 1.1rem;
  border: 2px solid var(--color-dark);
  border-radius: 16px;
  font-weight: 500;
}

.cm-step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 36px;
  height: 36px;
  border: 2px solid var(--color-dark);
  border-radius: 18px;
  background: var(--color-green-bright);
  font-weight: 800;
}

.cm-budget {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));
  align-items: center;
  gap: 1.25rem;
  margin-top: 1rem;
  padding: 1.4rem;
  border-radius: 16px;
  background: var(--color-light-gray);
  font-size: 0.95rem;
}

.cm-budget-label {
  color: #444;
  font-size: 0.875rem;
  font-weight: 700;
}

.cm-budget-value {
  font-size: 2.1rem;
  font-weight: 800;
  line-height: 1.2;
}
</style>
