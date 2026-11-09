<template>
  <MetaInfo
    :pageTitle="$t('Altruist & sensors.social — Environment Monitoring Kit')"
    :pageDescription="
      $t(
        'Two-module environment monitoring kit for indoors and outdoors. Open-source hardware and software for those who care about health, sleep quality, and the air they breathe.'
      )
    "
    pageImage="/og-altruist-info.webp"
  />
  <PageTextLayout>
    <div class="deviceinfo">
      <section class="di-hero">
        <div class="di-hero-text">
          <div class="di-eyebrow">{{ $t("deviceinfo.eyebrow") }}</div>
          <h1>{{ $t("deviceinfo.title") }}</h1>
          <p>{{ $t("deviceinfo.subtitle") }}</p>
          <div class="di-actions">
            <router-link class="di-button di-button-buy" to="/where-to-buy/">{{
              $t("Where to buy")
            }}</router-link>
            <router-link class="di-button" to="/altruist-setup/">{{
              $t("deviceinfo.howSetup")
            }}</router-link>
          </div>
        </div>
        <div class="di-hero-photo">
          <img :src="bundleImage" :alt="$t('deviceinfo.bundleAlt')" />
        </div>
      </section>

      <section class="di-stats">
        <div v-for="stat in stats" :key="stat" class="di-stat">
          <b>{{ $t(`deviceinfo.stat.${stat}.value`) }}</b>
          <span>{{ $t(`deviceinfo.stat.${stat}.label`) }}</span>
        </div>
      </section>

      <section>
        <h2>{{ $t("deviceinfo.modules") }}</h2>
        <div class="di-modules">
          <article v-for="module in modules" :key="module.key" class="di-module">
            <img :src="module.image" :alt="$t(`deviceinfo.${module.key}.alt`)" />
            <div class="di-eyebrow">{{ $t(`deviceinfo.${module.key}.place`) }}</div>
            <h3>{{ $t(`deviceinfo.${module.key}.name`) }}</h3>
            <p class="di-question">{{ $t(`deviceinfo.${module.key}.question`) }}</p>
            <ul>
              <li v-for="[icon, label] in module.metrics" :key="label">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path :d="ICONS[icon]" />
                </svg>
                {{ $t(`deviceinfo.${module.key}.${label}`) }}
              </li>
            </ul>
          </article>
        </div>
      </section>

      <section class="di-panel di-panel-dark">
        <h2>{{ $t("deviceinfo.when") }}</h2>
        <div class="di-grid">
          <div v-for="[action, tone] in actions" :key="action" class="di-action" :class="tone">
            <span>{{ $t(`deviceinfo.action.${action}.if`) }}</span>
            <b>{{ $t(`deviceinfo.action.${action}.then`) }}</b>
            <span>{{ $t(`deviceinfo.action.${action}.why`) }}</span>
          </div>
        </div>
      </section>

      <section>
        <h2>{{ $t("deviceinfo.who") }}</h2>
        <div class="di-grid">
          <div v-for="item in audiences" :key="item" class="di-card">
            <h3>{{ $t(`deviceinfo.audience.${item}.title`) }}</h3>
            <p>{{ $t(`deviceinfo.audience.${item}.text`) }}</p>
          </div>
        </div>
      </section>

      <section>
        <h2>{{ $t("deviceinfo.compare") }}</h2>
        <p>{{ $t("deviceinfo.compareLead") }}</p>
        <div class="di-table">
          <table>
            <thead>
              <tr>
                <th>{{ $t("deviceinfo.table.product") }}</th>
                <th>{{ $t("deviceinfo.table.indoor") }}</th>
                <th>{{ $t("deviceinfo.table.outdoor") }}</th>
                <th>{{ $t("deviceinfo.table.noise") }}</th>
                <th>{{ $t("deviceinfo.table.bundle") }}</th>
                <th>{{ $t("deviceinfo.table.price") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr class="di-table-own">
                <td>Altruist Bundle</td>
                <td>CO2, t, RH</td>
                <td>PM2.5/10, t, RH, {{ $t("deviceinfo.table.noiseWord") }}</td>
                <td>{{ $t("deviceinfo.table.yes") }}</td>
                <td>{{ $t("deviceinfo.table.yes") }}</td>
                <td>
                  <router-link to="/where-to-buy/">{{ $t("deviceinfo.table.shop") }}</router-link>
                </td>
              </tr>
              <tr v-for="[name, indoor, outdoor, noise, bundle, price] in competitors" :key="name">
                <td>{{ name }}</td>
                <td>{{ indoor }}</td>
                <td>{{ outdoor || $t("deviceinfo.table.no") }}</td>
                <td>
                  {{ noise ? $t("deviceinfo.table.indoorNoise") : $t("deviceinfo.table.no") }}
                </td>
                <td>{{ bundle ? $t("deviceinfo.table.yes") : $t("deviceinfo.table.no") }}</td>
                <td>{{ price }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="di-panel">
        <h2>{{ $t("deviceinfo.open") }}</h2>
        <p>{{ $t("deviceinfo.openLead") }}</p>
        <div class="di-layers">
          <div v-for="layer in layers" :key="layer" class="di-layer">
            <span>{{ $t(`deviceinfo.layer.${layer}.step`) }}</span>
            <b>{{ $t(`deviceinfo.layer.${layer}.name`) }}</b>
            <span>{{ $t(`deviceinfo.layer.${layer}.tech`) }}</span>
          </div>
        </div>
        <p>
          {{ $t("deviceinfo.integrations") }}
          <router-link to="/blog/altruist-open-end-to-end/">{{
            $t("deviceinfo.openArticle")
          }}</router-link>
        </p>
      </section>

      <section>
        <h2>{{ $t("deviceinfo.history") }}</h2>
        <ol class="di-history">
          <li v-for="year in history" :key="year">
            <b>{{ $t(`deviceinfo.year.${year}.when`) }}</b>
            <span>{{ $t(`deviceinfo.year.${year}.what`) }}</span>
          </li>
        </ol>
        <p>
          <router-link to="/altruist-timeline/">{{ $t("deviceinfo.fullTimeline") }}</router-link>
        </p>
      </section>

      <section class="di-panel di-panel-cta">
        <h2>{{ $t("deviceinfo.cta") }}</h2>
        <router-link class="di-button di-button-dark" to="/where-to-buy/">{{
          $t("Where to buy")
        }}</router-link>
      </section>
    </div>
  </PageTextLayout>
</template>

<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import MetaInfo from "../components/MetaInfo.vue";
import PageTextLayout from "../components/layouts/PageText.vue";
import bundleImage from "@/assets/images/altruist-device/Altruist-bundle.webp";
import urbanImage from "@/assets/images/altruist-device/altruist-urban.webp";
import insightImage from "@/assets/images/altruist-device/altruist-insight.webp";

const ICONS = {
  dust: "M6 7h.01M14 5h.01M18 11h.01M9 13h.01M15 18h.01M5 19h.01",
  temperature: "M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0z",
  noise: "M4 10v4h4l5 4V6L8 10zM17 9a4 4 0 0 1 0 6",
  pressure: "M4 17a8 8 0 1 1 16 0M12 17l4-6",
  co2: "M7 19a4 4 0 0 1-.5-8 6 6 0 0 1 11.5-1 4.5 4.5 0 0 1-1 9z",
  humidity: "M12 3s7 7 7 12a7 7 0 0 1-14 0c0-5 7-12 7-12z",
  display: "M3 5h18v14H3zM7 9h6M7 13h10",
};

const stats = ["measured", "sensors", "years", "open"];
const modules = [
  {
    key: "urban",
    image: urbanImage,
    metrics: [
      ["dust", "dust"],
      ["temperature", "tempHumidity"],
      ["noise", "noise"],
      ["pressure", "pressure"],
    ],
  },
  {
    key: "insight",
    image: insightImage,
    metrics: [
      ["co2", "co2"],
      ["temperature", "temperature"],
      ["humidity", "humidity"],
      ["display", "display"],
    ],
  },
];
const actions = [
  ["open", "is-open"],
  ["close", "is-close"],
  ["noise", "is-noise"],
];
const audiences = ["health", "asthma", "children", "realEstate", "automation", "civic"];
const competitors = [
  ["Ultrahuman Home", "CO2, PM, VOC, noise", null, "indoor", false, "$349"],
  ["IQAir Bundle", "PM2.5, CO2, t, RH", "PM, t, RH", false, true, "~$600"],
  ["AirGradient (2 pcs)", "PM, CO2, VOC, NOx", "PM, CO2, VOC, NOx", false, false, "~$455"],
  ["Awair Element", "CO2, PM, VOC, t, RH", null, false, false, "$150"],
  ["Airthings View Plus", "Radon, PM, CO2, VOC", null, false, false, "$299"],
];
const layers = ["device", "delivery", "record", "storage", "you"];
const history = ["2017", "2019", "2021", "2022", "2026"];

const router = useRouter();

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
.deviceinfo {
  text-align: left;
}

.deviceinfo h1 {
  margin: 0;
  font-size: clamp(2.3rem, 5vw, 3.5rem);
  font-weight: 800;
  line-height: 1.08;
}

.deviceinfo h2 {
  margin: 0 0 1.4rem;
  font-size: clamp(1.75rem, 3.4vw, 2.4rem);
  font-weight: 800;
  line-height: 1.15;
}

.deviceinfo h3 {
  margin: 0 0 0.35rem;
  font-size: 1.2rem;
  font-weight: 800;
}

.deviceinfo p {
  font-size: 1.05rem;
}

.deviceinfo img {
  height: auto;
}

.di-eyebrow {
  color: #555;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.di-hero {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  align-items: center;
  gap: 2rem;
}

.di-hero-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.1rem;
}

.di-hero-text p {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.di-hero-photo {
  display: flex;
  justify-content: center;
  padding: 1.75rem;
  border-radius: 24px;
  background: var(--color-light-gray);
}

.di-hero-photo img {
  width: 100%;
  max-width: 440px;
}

.di-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.deviceinfo a.di-button {
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

.deviceinfo a.di-button-buy {
  background: var(--color-green-bright);
  font-weight: 800;
}

.deviceinfo a.di-button-dark {
  background: var(--color-dark);
  color: var(--color-light);
  font-weight: 800;
}

.di-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(160px, 100%), 1fr));
  gap: 0.75rem;
}

.di-stat,
.di-card {
  padding: 1.25rem;
  border-radius: 16px;
  background: var(--color-light-gray);
}

.di-stat b {
  display: block;
  font-size: 2.1rem;
  font-weight: 800;
  line-height: 1.2;
}

.di-stat span,
.di-card p {
  margin: 0;
  color: #333;
  font-size: 0.95rem;
}

.di-modules,
.di-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));
  gap: 1rem;
}

.di-module {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.5rem;
  border: 2px solid var(--color-dark);
  border-radius: 20px;
}

.di-module img {
  width: 320px;
  max-width: 100%;
  align-self: center;
}

.deviceinfo .di-module h3 {
  margin: 0;
  font-size: 1.6rem;
}

.deviceinfo .di-question {
  margin: 0;
  font-size: 1.1rem;
  font-style: italic;
}

.di-module ul {
  display: grid;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.di-module li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0;
  font-size: 1rem;
}

.di-module svg {
  flex: none;
  width: 22px;
  height: 22px;
}

.di-panel {
  padding: 2.5rem clamp(1.25rem, 4vw, 2.5rem);
  border-radius: 24px;
  background: var(--color-light-gray);
}

.di-panel-dark {
  background: var(--color-dark);
  color: var(--color-light);
}

.di-panel-cta {
  background: var(--color-green-bright);
  text-align: center;
}

.di-action {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 1.4rem;
  border-radius: 16px;
  background: #17171c;
  color: #d0d0d8;
  font-size: 0.95rem;
}

.di-action b {
  font-size: 1.55rem;
  font-weight: 800;
  line-height: 1.2;
}

.is-open b {
  color: var(--color-green-bright);
}

.is-close b {
  color: #ffb36b;
}

.is-noise b {
  color: #8fc6ff;
}

.di-table {
  overflow-x: auto;
}

.di-table table {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
  font-size: 0.95rem;
  text-align: left;
}

.di-table th,
.di-table td {
  padding: 0.7rem 0.75rem;
  border-bottom: 1px solid var(--surface-border);
}

.di-table th {
  border-bottom: 2px solid var(--color-dark);
}

.di-table-own {
  background: #e9ffc9;
  font-weight: 700;
}

.di-layers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(190px, 100%), 1fr));
  gap: 0.6rem;
  margin-bottom: 1.2rem;
}

.di-layer {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border: 2px solid var(--color-dark);
  border-radius: 14px;
  background: var(--color-light);
  color: #333;
  font-size: 0.875rem;
}

.di-layer:last-child {
  background: var(--color-green-bright);
}

.di-layer b {
  color: var(--color-dark);
  font-size: 1.125rem;
  font-weight: 800;
}

.di-history {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(170px, 100%), 1fr));
  gap: 0.9rem;
  margin: 0 0 1.2rem;
  padding: 0;
  list-style: none;
}

.di-history li {
  margin: 0;
  padding-top: 0.6rem;
  border-top: 3px solid var(--color-dark);
  color: #333;
  font-size: 0.875rem;
}

.di-history b {
  display: block;
  color: var(--color-dark);
  font-size: 1.125rem;
  font-weight: 800;
}
</style>
