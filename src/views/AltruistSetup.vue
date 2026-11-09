<template>
  <MetaInfo
    :pageTitle="$t('Altruist Setup Guide — Urban & Insight')"
    :pageDescription="
      $t(
        'Step-by-step setup instructions for Altruist Urban outdoor sensor and Altruist Insight indoor monitor. Connect to Wi-Fi, configure GPS, and join the open sensor map.'
      )
    "
    pageImage="/og-altruist-setup.webp"
  />
  <PageTextLayout>
    <div class="setup">
      <section class="st-hero">
        <div class="st-hero-text">
          <div class="st-eyebrow">{{ $t("setup.eyebrow") }}</div>
          <h1>{{ $t("setup.title") }}</h1>
          <p>{{ $t("setup.subtitle") }}</p>
          <ul class="st-needs">
            <li v-for="need in needs" :key="need.key">
              <svg viewBox="0 0 24 24" class="st-icon" aria-hidden="true">
                <path :d="need.icon" />
              </svg>
              {{ $t(`setup.need.${need.key}`) }}
            </li>
          </ul>
        </div>
        <div class="st-picker">
          <h2>{{ $t("setup.which") }}</h2>
          <div class="st-picker-options">
            <button
              v-for="option in DEVICES"
              :id="option.id"
              :key="option.id"
              type="button"
              :aria-pressed="device === option.id"
              :class="{ 'is-selected': device === option.id }"
              @click="device = option.id"
            >
              <img :src="option.image" alt="" />
              <b>{{ option.name }}</b>
              <span>{{ $t(`setup.${option.id}.kind`) }}</span>
            </button>
          </div>
        </div>
      </section>

      <nav class="st-steps-nav" :aria-label="$t('setup.stepsNav')">
        <a
          v-for="step in 4"
          :key="step"
          :href="`#step-${step}`"
          @click.prevent="scrollToStep(step)"
          >{{ $t(`setup.nav.step${step}`) }}</a
        >
      </nav>

      <section class="st-steps">
        <article id="step-1" class="st-step">
          <div class="st-step-text">
            <span class="st-number">1</span>
            <h2>{{ $t("setup.step1.title") }}</h2>
            <p>{{ $t("setup.step1.text") }}</p>
          </div>
          <img class="st-step-small" :src="images.power" :alt="$t('setup.step1.alt')" />
        </article>

        <article id="step-2" class="st-step">
          <div class="st-step-text">
            <span class="st-number">2</span>
            <h2>{{ $t("setup.step2.title") }}</h2>
            <ol>
              <li>{{ $t("setup.step2.scan") }}</li>
              <li>{{ $t("setup.step2.password") }}</li>
            </ol>
            <code class="st-password">123456789</code>
          </div>
          <img class="st-step-small" :src="images.join" :alt="$t('setup.step2.alt')" />
        </article>

        <article id="step-3" class="st-step">
          <div class="st-step-text">
            <span class="st-number">3</span>
            <h2>{{ $t("setup.step3.title") }}</h2>
            <ol>
              <li>
                {{ $t("setup.step3.open") }}
                <code>192.168.4.1</code>
              </li>
              <li>{{ $t("setup.step3.wifi") }}</li>
              <li>{{ $t("setup.save") }}</li>
              <li>{{ $t("setup.step3.connected") }}</li>
            </ol>
            <div class="st-tip">
              <b>{{ $t("setup.step3.tipTitle") }}</b> {{ $t("setup.step3.tip") }}
            </div>
          </div>
          <img :src="images.wifi" :alt="$t('setup.step3.alt')" />
        </article>

        <article id="step-4" class="st-step st-step-wide">
          <div class="st-step-head">
            <span class="st-number">4</span>
            <h2>{{ $t("setup.step4.title") }}</h2>
          </div>
          <div class="st-tip">
            <b>{{ $t("setup.step4.tipTitle") }}</b> {{ $t("setup.step4.tip") }}
          </div>
          <div class="st-step-pair">
            <div>
              <p>{{ $t("setup.step4.open") }}</p>
              <img :src="images.config" :alt="$t('setup.step4.configAlt')" />
            </div>
            <div>
              <p>
                {{ $t("setup.step4.gps") }}
                <a
                  href="https://www.latlong.net/convert-address-to-lat-long.html"
                  target="_blank"
                  rel="noopener"
                  >latlong.net</a
                >. {{ $t("setup.save") }}
              </p>
              <img :src="images.gps" :alt="$t('setup.step4.gpsAlt')" />
            </div>
          </div>
        </article>

        <div class="st-done">
          <div>
            <h2>{{ $t("setup.done.title") }}</h2>
            <p>{{ $t("setup.done.text") }}</p>
          </div>
          <router-link class="st-button st-button-dark" to="/">{{
            $t("setup.done.map")
          }}</router-link>
        </div>

        <details class="st-diagram">
          <summary>
            <span>{{ $t("setup.diagram.summary") }}</span>
            <svg viewBox="0 0 24 24" class="st-chevron" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </summary>
          <img :src="images.full" :alt="$t('setup.diagram.alt')" />
          <a class="st-button" :href="images.pdf" target="_blank">{{ $t("setup.pdf") }}</a>
        </details>
      </section>

      <section class="st-two">
        <article v-if="device === 'urban'" class="st-card">
          <h2>{{ $t("setup.mounting.title") }}</h2>
          <img :src="images.extra" :alt="$t('setup.mounting.alt')" />
          <ul>
            <li v-for="item in MOUNTING" :key="item">{{ $t(`setup.mounting.${item}`) }}</li>
          </ul>
        </article>
        <article v-else class="st-card">
          <h2>{{ $t("setup.display.title") }}</h2>
          <img :src="images.extra" :alt="$t('setup.display.alt')" />
          <p>{{ $t("setup.display.text") }}</p>
          <ul>
            <li>{{ $t("setup.display.leds") }}</li>
            <li>{{ $t("setup.display.buttons") }}</li>
          </ul>
        </article>
        <article class="st-card">
          <h2>{{ $t("setup.ha.title") }}</h2>
          <img :src="images.ha" :alt="$t('setup.ha.alt')" />
          <p>{{ $t("setup.ha.text") }}</p>
          <a
            href="https://wiki.robonomics.network/docs/altruist/#home-assistant"
            target="_blank"
            rel="noopener"
            >{{ $t("setup.ha.link") }}</a
          >
        </article>
      </section>

      <section v-if="device === 'urban'" id="uv-cover" class="st-step">
        <div class="st-step-text">
          <h2>{{ $t("setup.cover.title") }}</h2>
          <p>{{ $t("setup.cover.text") }}</p>
          <p>
            <b>{{ $t("setup.cover.boxLabel") }}</b> {{ $t("setup.cover.box") }}
          </p>
          <a class="st-button" href="/altruist-uv-cover.pdf" target="_blank">{{
            $t("setup.cover.pdf")
          }}</a>
        </div>
        <img class="st-step-small" :src="coverDiagram" :alt="$t('setup.cover.alt')" />
      </section>

      <section id="specs">
        <h2 class="st-specs-title">{{ $t("setup.specs.title") }}</h2>
        <div class="st-two">
          <div class="st-card st-spec">
            <h3>Altruist Urban</h3>
            <dl>
              <div>
                <dt>{{ $t("setup.specs.power") }}</dt>
                <dd>5V (USB-C)</dd>
              </div>
              <div>
                <dt>{{ $t("setup.specs.wireless") }}</dt>
                <dd>Wi-Fi 2.4 GHz (802.11 b/g/n)</dd>
              </div>
              <div>
                <dt>{{ $t("setup.specs.sensors") }}</dt>
                <dd>
                  SDS011: PM2.5 / PM10 (µg/m³)<br />
                  BME280: {{ $t("setup.specs.climate") }}<br />
                  ICS43434: {{ $t("setup.specs.noise") }}
                </dd>
              </div>
              <div>
                <dt>{{ $t("setup.specs.box") }}</dt>
                <dd>{{ $t("setup.specs.urbanBox") }}</dd>
              </div>
            </dl>
          </div>
          <div class="st-card st-spec">
            <h3>Altruist Insight</h3>
            <dl>
              <div>
                <dt>{{ $t("setup.specs.power") }}</dt>
                <dd>5V (USB-C)</dd>
              </div>
              <div>
                <dt>{{ $t("setup.specs.wireless") }}</dt>
                <dd>Wi-Fi 2.4 GHz (802.11 b/g/n)</dd>
              </div>
              <div>
                <dt>{{ $t("setup.specs.sensors") }}</dt>
                <dd>
                  SCD41: CO₂ (ppm)<br />
                  BME680: {{ $t("setup.specs.climate") }}
                </dd>
              </div>
              <div>
                <dt>{{ $t("setup.specs.box") }}</dt>
                <dd>{{ $t("setup.specs.insightBox") }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section class="st-help">
        <div>
          <h2>{{ $t("setup.help.title") }}</h2>
          <p>{{ $t("setup.help.text") }}</p>
        </div>
        <div class="st-actions">
          <router-link class="st-button st-button-bright" to="/ai/">{{ $t("nav.ai") }}</router-link>
          <a
            class="st-button st-button-light"
            href="https://support.cyberpunks.shop"
            target="_blank"
            rel="noopener"
            >{{ $t("setup.help.support") }}</a
          >
        </div>
      </section>
    </div>
  </PageTextLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import MetaInfo from "../components/MetaInfo.vue";
import PageTextLayout from "../components/layouts/PageText.vue";

import urbanProduct from "@/assets/images/altruist-device/altruist-urban.webp";
import insightProduct from "@/assets/images/altruist-device/altruist-insight.webp";

import urbanFull from "@/assets/images/pages/altruist-setup/altruist-setup-urban.webp";
import urbanPower from "@/assets/images/pages/altruist-setup/urban-1.webp";
import urbanJoin from "@/assets/images/pages/altruist-setup/urban-2.webp";
import urbanWifi from "@/assets/images/pages/altruist-setup/urban-3.webp";
import urbanConfig from "@/assets/images/pages/altruist-setup/urban-4a.webp";
import urbanGps from "@/assets/images/pages/altruist-setup/urban-4b.webp";
import urbanHa from "@/assets/images/pages/altruist-setup/urban-ha.webp";
import urbanMount from "@/assets/images/pages/altruist-setup/urban-mount.webp";

import insightFull from "@/assets/images/pages/altruist-setup/altruist-setup-insight.webp";
import insightPower from "@/assets/images/pages/altruist-setup/insight-1.webp";
import insightJoin from "@/assets/images/pages/altruist-setup/insight-2.webp";
import insightWifi from "@/assets/images/pages/altruist-setup/insight-3.webp";
import insightConfig from "@/assets/images/pages/altruist-setup/insight-4a.webp";
import insightGps from "@/assets/images/pages/altruist-setup/insight-4b.webp";
import insightHa from "@/assets/images/pages/altruist-setup/insight-ha.webp";
import insightDisplay from "@/assets/images/pages/altruist-setup/insight-display.webp";

import coverDiagram from "@/assets/images/pages/altruist-setup/cover-install-diagram.webp";

const DEVICES = [
  { id: "urban", name: "Urban", image: urbanProduct },
  { id: "insight", name: "Insight", image: insightProduct },
];

const IMAGES = {
  urban: {
    full: urbanFull,
    pdf: "/altruist-urban-setup.pdf",
    power: urbanPower,
    join: urbanJoin,
    wifi: urbanWifi,
    config: urbanConfig,
    gps: urbanGps,
    ha: urbanHa,
    extra: urbanMount,
  },
  insight: {
    full: insightFull,
    pdf: "/altruist-insight-setup.pdf",
    power: insightPower,
    join: insightJoin,
    wifi: insightWifi,
    config: insightConfig,
    gps: insightGps,
    ha: insightHa,
    extra: insightDisplay,
  },
};

const needs = [
  { key: "power", icon: "M13 2L4 14h7l-1 8 9-12h-7z" },
  {
    key: "wifi",
    icon: "M2 9a15 15 0 0 1 20 0M5.5 13a10 10 0 0 1 13 0M9 16.5a5 5 0 0 1 6 0M12 20v.01",
  },
  { key: "device", icon: "M7 2h10v20H7zM11 18h2" },
];

const MOUNTING = ["optional", "height", "tape", "visor"];

const route = useRoute();
const router = useRouter();
const device = ref("urban");
const images = computed(() => IMAGES[device.value]);

watch(
  () => route.hash,
  (hash) => {
    if (hash === "#insight") device.value = "insight";
    if (hash === "#urban" || hash === "#uv-cover") device.value = "urban";
  },
  { immediate: true }
);

const scrollToStep = (step) => {
  document.getElementById(`step-${step}`)?.scrollIntoView({ behavior: "smooth" });
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
.setup {
  text-align: left;
}

.setup h1 {
  margin: 0;
  font-size: clamp(2.2rem, 4.6vw, 3.25rem);
  font-weight: 800;
  line-height: 1.08;
}

.setup h2 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1.2;
}

.setup h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
}

.setup p {
  margin: 0;
  color: #333;
  font-size: 1.05rem;
}

.setup li {
  margin: 0;
  font-size: 1.05rem;
}

.setup img {
  display: block;
  width: 100%;
  height: auto;
}

.st-eyebrow {
  color: #555;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.st-hero {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  align-items: center;
  gap: 2rem;
}

.st-hero-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.1rem;
}

.setup .st-hero-text p {
  font-size: 1.2rem;
}

.st-needs {
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.st-needs li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.st-icon {
  flex: none;
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.setup .st-picker h2 {
  margin-bottom: 0.6rem;
  font-size: 1.1rem;
}

.st-picker-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.st-picker-options button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 1rem;
  border: 3px solid var(--color-light-gray);
  border-radius: 20px;
  background: var(--color-light-gray);
  color: var(--color-dark);
  font: inherit;
  font-size: 0.875rem;
  cursor: pointer;
}

.st-picker-options button.is-selected {
  border-color: var(--color-dark);
  background: #e9ffc9;
}

.st-picker-options b {
  font-size: 1.25rem;
  font-weight: 800;
}

.setup .st-picker-options img {
  max-width: 180px;
}

.st-steps-nav {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(150px, 100%), 1fr));
  gap: 0.5rem;
}

.setup .st-steps-nav a {
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  background: var(--color-dark);
  color: var(--color-light);
  font-size: 0.95rem;
  font-weight: 700;
  text-decoration: none;
}

.st-steps {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.st-step {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  border: 2px solid var(--color-dark);
  border-radius: 20px;
}

.st-step-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.6rem;
}

.st-step-text ol {
  display: grid;
  gap: 0.4rem;
  margin: 0;
  padding-left: 1.25rem;
  color: #333;
}

.setup .st-step-small {
  max-width: 400px;
  justify-self: center;
}

.st-number {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 44px;
  height: 44px;
  border: 2px solid var(--color-dark);
  border-radius: 22px;
  background: var(--color-green-bright);
  font-size: 1.25rem;
  font-weight: 800;
}

.st-password {
  padding: 0.5rem 1rem;
  border-radius: 10px;
  background: var(--color-dark);
  color: var(--color-green-bright);
  font-size: 1.4rem;
  font-weight: 700;
}

.st-tip {
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  background: #fff4d6;
  font-size: 0.95rem;
}

.st-step-wide {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1.1rem;
}

.st-step-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.st-step-pair {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(380px, 100%), 1fr));
  gap: 1.25rem;
}

.st-step-pair > div {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-width: 0;
}

.st-done,
.st-help {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.9rem;
  padding: 1.5rem;
  border-radius: 20px;
}

.st-done {
  border: 2px solid var(--color-dark);
  background: var(--color-green-bright);
}

.setup .st-done p {
  color: var(--color-dark);
}

.st-help {
  padding: clamp(1.5rem, 4vw, 2.5rem);
  border-radius: 28px;
  background: var(--color-dark);
  color: var(--color-light);
}

.setup .st-help p {
  color: #d0d0d8;
}

.st-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.setup a.st-button {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  min-height: 48px;
  padding: 0 1.25rem;
  border: 2px solid var(--color-dark);
  border-radius: 24px;
  color: var(--color-dark);
  font-weight: 700;
  text-decoration: none;
}

.setup a.st-button-dark {
  background: var(--color-dark);
  color: var(--color-light);
  font-weight: 800;
}

.setup a.st-button-bright {
  border-color: var(--color-green-bright);
  background: var(--color-green-bright);
  font-weight: 800;
}

.setup a.st-button-light {
  border-color: var(--color-light);
  color: var(--color-light);
}

.st-diagram {
  padding: 0.25rem 1.25rem;
  border-radius: 16px;
  background: var(--color-light-gray);
}

.st-diagram summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
  font-weight: 800;
  cursor: pointer;
  list-style: none;
}

.st-diagram summary::-webkit-details-marker {
  display: none;
}

.st-diagram[open] {
  padding-bottom: 1.25rem;
}

.st-diagram[open] img {
  margin-bottom: 0.9rem;
}

.st-diagram[open] .st-chevron {
  transform: rotate(180deg);
}

.st-chevron {
  flex: none;
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.st-two {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(420px, 100%), 1fr));
  gap: 1rem;
}

.st-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
  margin: 0;
  padding: 1.5rem;
  border-radius: 20px;
  background: var(--color-light-gray);
}

.st-card img {
  border-radius: 12px;
}

.st-card ul {
  display: grid;
  gap: 0.4rem;
  margin: 0;
  padding-left: 1.25rem;
  color: #333;
}

.setup .st-specs-title {
  margin-bottom: 1rem;
  font-size: clamp(1.75rem, 3.4vw, 2.4rem);
}

.st-spec dl {
  display: grid;
  gap: 0.75rem;
  margin: 0;
}

.st-spec dt {
  font-weight: 800;
}

.st-spec dd {
  margin: 0;
  color: #333;
}
</style>
