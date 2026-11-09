<template>
  <MetaInfo
    :pageTitle="$t('Air quality measurements information')"
    :pageDescription="
      $t(
        'Sensors.social Air Quality Map — an interactive tool for viewing, analyzing, and comparing real-time air quality data from sensors. Get up-to-date information on air conditions in your area.'
      )
    "
    pageImage="/og-air-measurements.webp"
  />
  <PageTextLayout>
    <div class="measures-page">
      <section class="mm-hero">
        <div class="mm-hero-text">
          <div class="mm-eyebrow">{{ $t("measures.eyebrow") }}</div>
          <h1>{{ $t("measures.title") }}</h1>
          <p>{{ $t("measures.subtitle") }}</p>
          <nav class="mm-chips" :aria-label="$t('measures.navLabel')">
            <a
              v-for="group in groups"
              :key="group.id"
              :href="`#group-${group.id}`"
              @click.prevent="scrollToGroup(group.id)"
              >{{ $t(`measures.group.${group.id}.nav`) }}</a
            >
          </nav>
        </div>
        <div class="mm-hero-kit">
          <img :src="bundleImage" :alt="$t('measures.bundleAlt')" />
          <div class="mm-modules">
            <div v-for="module in ['urban', 'insight']" :key="module">
              <b>{{ $t(`measures.${module}.name`) }}</b>
              <span>{{ $t(`measures.${module}.list`) }}</span>
            </div>
          </div>
        </div>
      </section>

      <section v-for="group in groups" :id="`group-${group.id}`" :key="group.id">
        <h2>{{ $t(`measures.group.${group.id}.title`) }}</h2>
        <p class="mm-lead">{{ $t(`measures.group.${group.id}.lead`) }}</p>

        <ol v-if="group.steps" class="mm-steps">
          <li v-for="(step, index) in group.steps" :key="step">
            <span class="mm-step-number">{{ index + 1 }}</span>
            {{ step }}
          </li>
        </ol>

        <figure v-if="group.id === 'dust'" class="mm-sizes">
          <svg viewBox="0 0 200 150" role="img" :aria-label="$t('measures.sizes.aria')">
            <circle cx="75" cy="75" r="70" fill="#3a3a44" />
            <circle cx="165" cy="60" r="10" fill="#ffb36b" />
            <circle cx="165" cy="105" r="2.5" fill="#c6ff6b" />
          </svg>
          <div class="mm-sizes-text">
            <b class="mm-sizes-title">{{ $t("measures.sizes.title") }}</b>
            <div>
              <b>{{ $t("measures.sizes.hair") }}</b
              >, {{ $t("measures.sizes.hairSize") }}
            </div>
            <div class="is-pm10"><b>PM10</b>, {{ $t("measures.sizes.pm10") }}</div>
            <div class="is-pm25"><b>PM2.5</b>, {{ $t("measures.sizes.pm25") }}</div>
          </div>
        </figure>

        <div v-if="group.id === 'noise'" class="mm-everyday">
          <div v-for="level in everydayNoise" :key="level.key">
            <b>{{ level.db }} {{ $t("measures.everyday.unit") }}</b>
            <span>{{ $t(`measures.everyday.${level.key}`) }}</span>
          </div>
        </div>

        <div class="mm-cards">
          <article v-for="card in group.cards" :id="card.id" :key="card.id" class="mm-card">
            <div class="mm-card-head">
              <svg
                viewBox="0 0 24 24"
                :class="['mm-icon', { 'mm-icon-dust': card.icon === ICONS.dust }]"
                aria-hidden="true"
              >
                <path :d="card.icon" />
              </svg>
              <div>
                <h3>{{ card.title }}</h3>
                <div v-if="card.subtitle" class="mm-card-subtitle">{{ card.subtitle }}</div>
              </div>
            </div>
            <p v-for="text in card.paragraphs" :key="text">{{ text }}</p>
            <div class="mm-zones">
              <div
                v-for="zone in card.zones"
                :key="zone.label"
                :class="{ 'is-light-text': zone.lightText }"
                :style="{ backgroundColor: zone.color }"
              >
                <b>{{ zone.label }}</b>
                {{ zone.range }}
              </div>
            </div>
            <div v-if="card.who" class="mm-who">{{ $t(card.who) }}</div>
            <details v-for="section in card.sections" :key="section.title" class="mm-advice">
              <summary>
                <span>{{ section.title }}</span>
                <svg viewBox="0 0 24 24" class="mm-chevron" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <ul>
                <li v-for="item in section.items" :key="item">{{ item }}</li>
              </ul>
            </details>
          </article>
        </div>
      </section>

      <section class="mm-cta">
        <h2>{{ $t("measures.cta.title") }}</h2>
        <div class="mm-actions">
          <router-link class="mm-button mm-button-dark" to="/">{{
            $t("measures.cta.map")
          }}</router-link>
          <router-link class="mm-button" to="/altruist-device-info/">{{
            $t("measures.cta.about")
          }}</router-link>
        </div>
      </section>
    </div>
  </PageTextLayout>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import PageTextLayout from "../components/layouts/PageText.vue";
import MetaInfo from "../components/MetaInfo.vue";
import measurements from "../measurements";
import bundleImage from "@/assets/images/altruist-device/Altruist-bundle.webp";

const { locale, t } = useI18n();

const ICONS = {
  gauge: "M4 17a8 8 0 1 1 16 0M12 17l4-6",
  dust: "M6 6v.01M14 5v.01M18 11v.01M9 14v.01M15 18v.01M5 19v.01",
  cloud: "M7 19a4 4 0 0 1-.5-8 6 6 0 0 1 11.5-1 4.5 4.5 0 0 1-1 9z",
  noise: "M4 10v4h4l5 4V6L8 10zM17 9a4 4 0 0 1 0 6",
  temperature: "M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0z",
  drop: "M12 3s7 7 7 12a7 7 0 0 1-14 0c0-5 7-12 7-12z",
  radiation:
    "M12 12v.01M12 4a8 8 0 0 1 7 4l-4 2.5M12 4a8 8 0 0 0-7 4l4 2.5M8 18.5l2-3.5M16 18.5l-2-3.5",
};

const GROUPS = [
  { id: "aqi", cards: [{ key: "aqi", icon: ICONS.gauge, stepsFromFirstSection: true }] },
  {
    id: "dust",
    cards: [
      { key: "pm25", icon: ICONS.dust, who: "measures.who.pm25" },
      { key: "pm10", icon: ICONS.dust, who: "measures.who.pm10" },
    ],
  },
  { id: "indoor", cards: [{ key: "co2", icon: ICONS.cloud }] },
  {
    id: "noise",
    cards: [
      { key: "noiseavg", icon: ICONS.noise, fullNameAsTitle: true },
      { key: "noisemax", icon: ICONS.noise, fullNameAsTitle: true },
    ],
  },
  {
    id: "climate",
    cards: [
      { key: "temperature", icon: ICONS.temperature },
      { key: "humidity", icon: ICONS.drop },
      { key: "pressure", icon: ICONS.gauge },
    ],
  },
  {
    id: "radiation",
    cards: [
      { key: "gc", icon: ICONS.radiation },
      { key: "dose_rate_nsv_h", icon: ICONS.radiation },
    ],
  },
];

const everydayNoise = [
  { key: "quiet", db: "30–40" },
  { key: "talk", db: "60" },
  { key: "street", db: "70–80" },
  { key: "peaks", db: "85" },
];

// Zone colors are shared with the map; these are dark enough to need white text.
const LIGHT_TEXT_ZONES = new Set([
  "var(--measure-darkred)",
  "var(--measure-darkblue)",
  "#7a00da",
  "#1d66af",
  "#1d41af",
  "#411daf",
  "#661daf",
]);

const translated = (value) => value?.[locale.value] ?? value?.en;

const displayUnit = (unit) => (unit ?? "").replace("m3", "m³").replace("μ", "µ");

const zoneRange = (measurement, zone) => {
  const unit = displayUnit(measurement.unit);
  if (measurement.zoneLabelsAreRanges) return unit;
  if (typeof zone.valueMax === "number")
    return `${t("scales.upto")} ${zone.valueMax} ${unit}`.trim();
  return t("scales.above");
};

const splitDescription = (description) => {
  const paragraphs = [];
  const sections = [];
  description.forEach((block) => {
    if (block.tag === "p") paragraphs.push(translated(block.text));
    if (block.tag === "subtitle") sections.push({ title: translated(block.text), items: [] });
    if (block.tag === "ul") sections[sections.length - 1].items = translated(block.items);
  });
  return { paragraphs, sections };
};

const buildCard = ({ key, icon, who, fullNameAsTitle }) => {
  const measurement = measurements[key];
  const shortName = translated(measurement.nameshort);
  const fullName = translated(measurement.name);
  return {
    id: key.toUpperCase(),
    icon,
    who,
    title: fullNameAsTitle ? fullName : shortName,
    subtitle: !fullNameAsTitle && fullName !== shortName ? fullName : "",
    ...splitDescription(measurement.description),
    zones: measurement.zones.map((zone) => ({
      label: translated(zone.label),
      range: zoneRange(measurement, zone),
      color: zone.color,
      lightText: LIGHT_TEXT_ZONES.has(zone.color),
    })),
  };
};

const groups = computed(() =>
  GROUPS.map((group) => {
    const cards = group.cards.map(buildCard);
    if (!group.cards.some((card) => card.stepsFromFirstSection)) return { ...group, cards };
    const [{ items: steps }, ...sections] = cards[0].sections;
    return { ...group, steps, cards: [{ ...cards[0], sections }] };
  })
);

const scrollToGroup = (id) => {
  document.getElementById(`group-${id}`)?.scrollIntoView({ behavior: "smooth" });
};

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

      // Track the initial page load
      trackPage();
    }
  }, 100);
});
</script>

<style scoped>
.measures-page {
  text-align: left;
}

.measures-page h1 {
  margin: 0;
  font-size: clamp(2.2rem, 4.6vw, 3.25rem);
  font-weight: 800;
  line-height: 1.08;
}

.measures-page h2 {
  margin: 0 0 0.4rem;
  font-size: clamp(1.75rem, 3.4vw, 2.4rem);
  font-weight: 800;
  line-height: 1.15;
}

.measures-page h3 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 800;
  line-height: 1.2;
}

.measures-page p {
  margin: 0;
  color: #333;
  font-size: 0.95rem;
  overflow-wrap: anywhere;
}

.measures-page li {
  font-size: 0.95rem;
}

.measures-page img {
  display: block;
  height: auto;
}

.mm-eyebrow {
  color: #555;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.mm-hero {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  align-items: center;
  gap: 2rem;
}

.mm-hero-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.1rem;
}

.measures-page .mm-hero-text p {
  font-size: 1.2rem;
}

.mm-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.measures-page .mm-chips a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 1rem;
  border: 2px solid var(--color-dark);
  border-radius: 22px;
  color: var(--color-dark);
  font-size: 0.95rem;
  font-weight: 700;
  text-decoration: none;
}

.mm-hero-kit {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 24px;
  background: var(--color-light-gray);
}

.mm-hero-kit img {
  width: 100%;
  max-width: 300px;
  align-self: center;
}

.mm-modules {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr));
  gap: 0.6rem;
}

.mm-modules > div {
  padding: 0.9rem;
  border-radius: 14px;
  background: var(--color-light);
  color: #333;
  font-size: 0.95rem;
}

.mm-modules b {
  display: block;
  color: var(--color-dark);
  font-size: 1.125rem;
  font-weight: 800;
}

.measures-page .mm-lead {
  margin-bottom: 1.1rem;
  font-size: 1.05rem;
}

.mm-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr));
  gap: 0.6rem;
  margin: 0 0 0.9rem;
  padding: 0;
  list-style: none;
}

.mm-steps li {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 1.1rem;
  border-radius: 16px;
  background: var(--color-light-gray);
}

.mm-step-number {
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

.mm-sizes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.75rem;
  margin: 0 0 0.9rem;
  padding: 1.5rem;
  border-radius: 24px;
  background: var(--color-dark);
  color: var(--color-light);
}

.mm-sizes svg {
  flex: none;
  width: 240px;
  max-width: 100%;
  height: auto;
}

.mm-sizes-text {
  display: grid;
  flex: 1 1 260px;
  gap: 0.75rem;
}

.mm-sizes-title {
  font-size: 1.25rem;
  font-weight: 800;
}

.mm-sizes .is-pm10 {
  color: #ffb36b;
}

.mm-sizes .is-pm25 {
  color: var(--color-green-bright);
}

.mm-everyday {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(150px, 100%), 1fr));
  gap: 0.5rem;
  margin-bottom: 0.9rem;
}

.mm-everyday > div {
  padding: 0.9rem;
  border-radius: 14px;
  background: var(--color-light-gray);
  color: #333;
  font-size: 0.95rem;
}

.mm-everyday b {
  display: block;
  color: var(--color-dark);
  font-size: 1.55rem;
  font-weight: 800;
}

.mm-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(420px, 100%), 1fr));
  gap: 0.9rem;
}

.mm-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
  padding: 1.4rem;
  border: 2px solid var(--color-dark);
  border-radius: 20px;
}

.mm-card-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.mm-card-subtitle {
  color: #444;
  font-size: 0.875rem;
}

.mm-icon {
  flex: none;
  width: 30px;
  height: 30px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.mm-icon-dust {
  stroke-width: 3.6;
}

.mm-zones {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(122px, 100%), 1fr));
  gap: 0.25rem;
}

.mm-zones > div {
  padding: 0.5rem;
  border-radius: 6px;
  color: #000;
  font-size: 0.8125rem;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

@media (width < 520px) {
  .mm-zones > div {
    font-size: 0.75rem;
    hyphens: auto;
  }
}

.mm-zones > div.is-light-text {
  color: #fff;
}

.mm-zones b {
  display: block;
}

.mm-who {
  font-size: 0.875rem;
  font-weight: 700;
}

.mm-advice {
  padding-top: 0.4rem;
  border-top: 1px solid var(--surface-border);
}

.mm-advice summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 44px;
  font-weight: 800;
  cursor: pointer;
  list-style: none;
}

.mm-advice summary::-webkit-details-marker {
  display: none;
}

.mm-chevron {
  flex: none;
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.mm-advice[open] .mm-chevron {
  transform: rotate(180deg);
}

.mm-advice ul {
  margin: 0.25rem 0 0;
  padding-left: 1.25rem;
  color: #333;
}

.mm-advice li {
  margin: 0;
}

.mm-cta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.1rem;
  padding: clamp(1.5rem, 4vw, 2.5rem);
  border: 2px solid var(--color-dark);
  border-radius: 28px;
  background: var(--color-green-bright);
}

.measures-page .mm-cta h2 {
  margin: 0;
}

.mm-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.measures-page a.mm-button {
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

.measures-page a.mm-button-dark {
  background: var(--color-dark);
  color: var(--color-light);
  font-weight: 800;
}
</style>
