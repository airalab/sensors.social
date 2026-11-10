<template>
  <MetaInfo
    :pageTitle="$t(`landing.${model}.metaTitle`)"
    :pageDescription="$t(`landing.${model}.lead`)"
    :pageImage="page.gallery[0]"
    pageImageWidth="720"
    pageImageHeight="720"
  />

  <header class="lp-top">
    <router-link to="/" class="lp-top__logo">
      <img src="/app-icon-120.png" alt="" width="32" height="32" />
      <span>sensors.social</span>
    </router-link>
    <nav class="lp-top__nav" :aria-label="$t('nav.language')">
      <router-link to="/where-to-buy/" class="lp-top__all">{{
        $t("landing.allDevices")
      }}</router-link>
      <button
        v-for="lang in languages"
        :key="lang.code"
        type="button"
        class="lp-top__lang"
        :class="{ 'is-active': locale === lang.code }"
        :data-locale="lang.code"
        :aria-pressed="locale === lang.code"
        @click="setLocale(lang.code)"
      >
        {{ lang.title }}
      </button>
    </nav>
  </header>

  <main class="lp">
    <section class="lp-hero">
      <div class="lp-gallery" tabindex="0" :aria-label="$t('landing.gallery')">
        <img
          v-for="(src, i) in page.gallery"
          :key="src"
          :src="src"
          :alt="`${product.title} — ${i + 1}`"
          width="720"
          height="720"
          :loading="i === 0 ? 'eager' : 'lazy'"
          :fetchpriority="i === 0 ? 'high' : 'auto'"
          decoding="async"
        />
      </div>

      <div class="lp-buy">
        <p class="lp-kind">{{ $t(`landing.${model}.kind`) }}</p>
        <h1 class="lp-title">{{ product.title }}</h1>
        <p class="lp-lead">{{ $t(`landing.${model}.lead`) }}</p>
        <BuyBlock :product="product" :search="search" />
        <ul class="lp-points">
          <li v-for="n in page.points" :key="n">{{ $t(`landing.${model}.point${n}`) }}</li>
        </ul>
      </div>
    </section>

    <template v-for="block in page.blocks" :key="block.key">
      <section
        v-if="block.type === 'story'"
        class="lp-story"
        :class="{ 'lp-story--dark': block.dark }"
      >
        <img :src="block.img" alt="" loading="lazy" decoding="async" />
        <div class="lp-story__text">
          <h2>{{ $t(`${storyKey(block)}.title`) }}</h2>
          <p>{{ $t(`${storyKey(block)}.text`) }}</p>
          <router-link v-if="block.link" :to="block.link" class="lp-more">
            {{ $t(`${storyKey(block)}.link`) }} →
          </router-link>
        </div>
      </section>

      <section v-else-if="block.type === 'pair'" class="lp-pair">
        <router-link
          v-for="item in block.items"
          :key="item.key"
          :to="item.to"
          class="lp-pair__item"
        >
          <img :src="item.img" alt="" loading="lazy" decoding="async" />
          <h2>{{ $t(`landing.dual.${item.key}.title`) }}</h2>
          <p>{{ $t(`landing.dual.${item.key}.text`) }}</p>
          <span class="lp-more">{{ $t("landing.moreAbout") }} {{ item.name }} →</span>
        </router-link>
      </section>

      <section v-else-if="block.type === 'apps'" class="lp-apps">
        <h2>{{ $t("landing.apps.title") }}</h2>
        <p class="lp-apps__lead">{{ $t("landing.apps.text") }}</p>
        <ol class="lp-apps__list">
          <li v-for="app in apps" :key="app.key">
            <img :src="app.img" alt="" width="300" height="604" loading="lazy" decoding="async" />
            <div>
              <h3>{{ app.name }}</h3>
              <p>{{ $t(`landing.apps.${app.key}`) }}</p>
            </div>
          </li>
        </ol>
        <p class="lp-apps__foot">{{ $t("landing.apps.mqtt") }}</p>
      </section>

      <section v-else-if="block.type === 'figure'" class="lp-figure">
        <h2>{{ $t(`landing.${block.key}.title`, { name: product.title }) }}</h2>
        <p v-if="block.text">{{ $t(`landing.${block.key}.text`) }}</p>
        <a v-for="src in block.imgs" :key="src" :href="src" target="_blank" rel="noopener">
          <img :src="src" alt="" loading="lazy" decoding="async" />
        </a>
      </section>

      <section v-else-if="block.type === 'box'" class="lp-figure">
        <h2>{{ $t("landing.box.title") }}</h2>
        <img :src="block.img" alt="" loading="lazy" decoding="async" />
        <ul class="lp-box">
          <li v-for="item in block.items" :key="item">
            <strong
              >{{
                item === "hood" ? $t("landing.box.hoodName") : altruistProducts[item].title
              }}:</strong
            >
            {{ $t(`landing.box.${item}`) }}
          </li>
        </ul>
        <p class="lp-note">{{ $t("landing.box.note") }}</p>
      </section>

      <section v-else-if="block.type === 'specs'" class="lp-specs">
        <h2>{{ $t("landing.spec.title") }}</h2>
        <div class="lp-specs__grid">
          <dl v-for="device in block.devices" :key="device">
            <dt class="lp-specs__device">{{ altruistProducts[device].title }}</dt>
            <template v-for="row in specRows[device]" :key="row">
              <dt>{{ $t(`landing.spec.${row}`) }}</dt>
              <dd>{{ $t(`landing.spec.${device}.${row}`) }}</dd>
            </template>
          </dl>
        </div>
      </section>
    </template>

    <section class="lp-final">
      <h2>{{ product.title }}</h2>
      <p>{{ $t(`landing.${model}.lead`) }}</p>
      <BuyBlock :product="product" :search="search" />
    </section>
  </main>

  <SiteFooter />
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

import MetaInfo from "../components/MetaInfo.vue";
import SiteFooter from "../components/layouts/SiteFooter.vue";
import BuyBlock from "../components/AltruistBuyBlock.vue";
import { altruistProducts } from "@config/altruistProducts";
import { languages } from "../translate";

import insightG2 from "@/assets/images/altruist-landing/insight-g2.webp";
import insightG3 from "@/assets/images/altruist-landing/insight-g3.webp";
import insightG4 from "@/assets/images/altruist-landing/insight-g4.webp";
import insightG5 from "@/assets/images/altruist-landing/insight-g5.webp";
import urbanG2 from "@/assets/images/altruist-landing/urban-g2.webp";
import urbanG3 from "@/assets/images/altruist-landing/urban-g3.webp";
import urbanG4 from "@/assets/images/altruist-landing/urban-g4.webp";
import urbanG5 from "@/assets/images/altruist-landing/urban-g5.webp";
import dualG2 from "@/assets/images/altruist-landing/dual-g2.webp";
import dualG3 from "@/assets/images/altruist-landing/dual-g3.webp";
import dualG4 from "@/assets/images/altruist-landing/dual-g4.webp";
import dualG5 from "@/assets/images/altruist-landing/dual-g5.webp";

import insightBedroom from "@/assets/images/altruist-landing/insight-bedroom.webp";
import insightPhoto from "@/assets/images/altruist-landing/insight-photo.webp";
import insightNight from "@/assets/images/altruist-landing/insight-night.webp";
import insightInterior from "@/assets/images/altruist-landing/insight-interior.webp";
import insightScheme from "@/assets/images/altruist-landing/insight-scheme.webp";
import insightBox from "@/assets/images/altruist-landing/insight-box.webp";
import urbanStreet from "@/assets/images/altruist-landing/urban-street.webp";
import urbanWindow from "@/assets/images/altruist-landing/urban-window.webp";
import urbanMap from "@/assets/images/altruist-landing/urban-map.webp";
import urbanChart from "@/assets/images/altruist-landing/urban-chart.webp";
import urbanPlacement from "@/assets/images/altruist-landing/urban-placement.webp";
import urbanScheme from "@/assets/images/altruist-landing/urban-scheme.webp";
import urbanBox from "@/assets/images/altruist-landing/urban-box.webp";
import urbanPlants from "@/assets/images/altruist-landing/urban-plants.webp";
import dualRoomStreet from "@/assets/images/altruist-landing/dual-room-street.webp";
import dualInsightBedroom from "@/assets/images/altruist-landing/dual-insight-bedroom.webp";
import dualCompare from "@/assets/images/altruist-landing/dual-compare.webp";
import dualBox from "@/assets/images/altruist-landing/dual-box.webp";
import workshop from "@/assets/images/altruist-landing/workshop.webp";
import appLocal from "@/assets/images/altruist-landing/app-local.webp";
import appHa from "@/assets/images/altruist-landing/app-ha.webp";
import appSensors from "@/assets/images/altruist-landing/app-sensors.webp";

const props = defineProps({
  model: { type: String, required: true },
});

const route = useRoute();
const { locale } = useI18n();

const apps = [
  { key: "local", name: "Altruist.local", img: appLocal },
  { key: "ha", name: "Home Assistant", img: appHa },
  { key: "sensors", name: "sensors.social", img: appSensors },
];

const specRows = {
  insight: ["sensors", "display", "connectivity", "integrations", "power", "size", "range"],
  urban: ["sensors", "display", "connectivity", "integrations", "power", "size", "range"],
};

const workshopBlock = { type: "story", key: "workshop", img: workshop, shared: true };

// Block order follows the agreed mock-up: problem → solution → three apps → trust → details.
// Gallery frames come from the shop cards. The shop's first banners print "No subscriptions
// required", which the copy rules replace with "three apps", so they are left out until redrawn.
const pages = {
  insight: {
    gallery: [insightG2, insightG3, insightG4, insightG5],
    points: [1, 2, 3, 4],
    blocks: [
      { type: "story", key: "problem", img: insightBedroom },
      { type: "story", key: "solution", img: insightPhoto, dark: true },
      { type: "story", key: "night", img: insightNight },
      { type: "apps", key: "apps" },
      { type: "story", key: "smart", img: insightInterior },
      { type: "figure", key: "inside", imgs: [insightScheme] },
      { type: "box", key: "box", img: insightBox, items: ["insight"] },
      { type: "specs", key: "specs", devices: ["insight"] },
      workshopBlock,
    ],
  },
  urban: {
    gallery: [urbanG2, urbanG3, urbanG4, urbanG5],
    points: [1, 2, 3, 4],
    blocks: [
      { type: "story", key: "problem", img: urbanStreet },
      { type: "story", key: "solution", img: urbanWindow },
      { type: "apps", key: "apps" },
      { type: "story", key: "community", img: urbanMap, link: "/" },
      { type: "figure", key: "charts", imgs: [urbanChart], text: true },
      { type: "figure", key: "placement", imgs: [urbanPlacement] },
      { type: "figure", key: "inside", imgs: [urbanScheme] },
      { type: "box", key: "box", img: urbanBox, items: ["urban", "hood"] },
      { type: "specs", key: "specs", devices: ["urban"] },
      workshopBlock,
    ],
  },
  dual: {
    gallery: [dualG2, dualG3, dualG4, dualG5],
    points: [1, 2, 3, 4],
    blocks: [
      { type: "story", key: "problem", img: dualRoomStreet },
      {
        type: "pair",
        key: "pair",
        items: [
          { key: "indoor", name: "Insight", img: dualInsightBedroom, to: "/altruist/insight/" },
          { key: "outdoor", name: "Urban", img: urbanPlants, to: "/altruist/urban/" },
        ],
      },
      { type: "apps", key: "apps" },
      { type: "story", key: "compare", img: dualCompare, link: "/altruist-compare/", dark: true },
      { type: "story", key: "community", img: urbanMap, link: "/" },
      { type: "figure", key: "charts", imgs: [urbanChart], text: true },
      { type: "figure", key: "inside", imgs: [urbanScheme, insightScheme] },
      { type: "box", key: "box", img: dualBox, items: ["urban", "insight", "hood"] },
      { type: "specs", key: "specs", devices: ["urban", "insight"] },
      workshopBlock,
    ],
  },
};

const page = computed(() => pages[props.model]);
const product = computed(() => altruistProducts[props.model]);

// The query string of the ad click; BuyBlock carries its gclid and utm tags to the shop.
const search = computed(() => new URLSearchParams(route.query).toString());

const storyKey = (block) =>
  block.shared ? `landing.${block.key}` : `landing.${props.model}.${block.key}`;

function setLocale(code) {
  locale.value = code;
  localStorage.setItem("locale", code);
}
</script>

<style scoped>
.lp-top {
  box-sizing: border-box;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 10px 16px;
}

.lp-top__logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  color: var(--color-dark);
  text-decoration: none;
}

.lp-top__logo img {
  width: 32px;
  height: 32px;
}

.lp-top__nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.lp-top__all {
  margin-right: 8px;
  white-space: nowrap;
  font-size: 0.95rem;
  font-weight: 700;
}

.lp-top__lang {
  min-width: 44px;
  min-height: 44px;
  border: none;
  border-radius: 8px;
  background: none;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  color: #55555c;
  cursor: pointer;
}

.lp-top__lang.is-active {
  background: var(--color-light-gray-shop);
  color: var(--color-dark);
}

.lp {
  box-sizing: border-box;
  width: 100%;
  --lp-gap: 16px;
  --font-size: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--lp-gap) 48px;
  font-size: 1.05rem;
  line-height: 1.5;
  color: var(--color-dark);
}

.lp h2 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 900;
  line-height: 1.2;
}

.lp p {
  margin: 0;
}

.lp img {
  display: block;
  max-width: 100%;
  height: auto;
  border: none;
  margin: 0;
}

.lp section {
  margin: 0 0 56px;
}

/* --- first screen: gallery, price, purchase --- */
.lp-hero {
  display: grid;
  gap: 16px;
}

.lp-gallery {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 86%;
  gap: 8px;
  margin: 0 calc(var(--lp-gap) * -1);
  padding: 0 var(--lp-gap);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding: 0 var(--lp-gap);
  overscroll-behavior-x: contain;
}

.lp-gallery img {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  background: var(--color-light-gray-shop);
  scroll-snap-align: start;
  object-fit: cover;
}

.lp-kind {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #55555c;
}

.lp-title {
  margin: 0.1rem 0 0.4rem;
  font-size: 2rem;
  font-weight: 900;
  line-height: 1.1;
}

.lp-lead {
  margin-bottom: 1rem !important;
}

.lp-points {
  margin: 1.2rem 0 0;
  padding-left: 1.2rem;
  list-style: disc;
}

.lp-points li + li {
  margin-top: 0.3rem;
}

/* --- story blocks: picture and a short text --- */
.lp-story {
  display: grid;
  gap: 16px;
  align-items: center;
}

.lp-story img {
  width: 100%;
  max-height: 420px;
  border-radius: 12px;
  object-fit: cover;
}

.lp-story--dark img {
  background: #000;
  object-fit: contain;
}

.lp-more {
  display: inline-block;
  margin-top: 0.8rem;
  font-weight: 700;
  color: var(--color-link);
}

.lp-pair {
  display: grid;
  gap: 24px;
}

.lp-pair__item {
  display: block;
  color: inherit;
  text-decoration: none;
}

.lp-pair__item:hover h2,
.lp-pair__item:focus-visible h2 {
  text-decoration: underline;
}

.lp-pair__item img {
  width: 100%;
  aspect-ratio: 4 / 3;
  margin-bottom: 12px;
  border-radius: 12px;
  object-fit: cover;
}

/* --- three apps --- */
.lp-apps {
  padding: 24px 16px;
  border-radius: 16px;
  background: var(--color-light-gray-shop);
}

.lp-apps__lead {
  max-width: 60ch;
}

.lp-apps__list {
  display: grid;
  gap: 20px;
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
}

.lp-apps__list li {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 14px;
  align-items: center;
}

.lp-apps__list img {
  width: 96px;
  border-radius: 10px;
}

.lp-apps__list h3 {
  margin: 0 0 0.2rem;
  font-size: 1.1rem;
  font-weight: 800;
}

.lp-apps__foot {
  margin-top: 20px !important;
  font-weight: 700;
}

/* --- details --- */
.lp-figure img {
  width: 100%;
  max-width: 1000px;
  margin-top: 12px !important;
  border-radius: 12px;
  background: #000;
}

.lp-box {
  margin: 16px 0 0;
  padding-left: 1.2rem;
  list-style: disc;
}

.lp-note {
  margin-top: 0.5rem !important;
  font-size: 0.9rem;
  color: #55555c;
}

.lp-specs__grid {
  display: grid;
  gap: 24px;
}

.lp-specs dl {
  display: grid;
  grid-template-columns: minmax(7rem, 30%) 1fr;
  gap: 8px 16px;
  margin: 0;
}

.lp-specs dt {
  font-weight: 700;
}

.lp-specs dd {
  margin: 0;
}

.lp-specs .lp-specs__device {
  grid-column: 1 / -1;
  font-size: 1.15rem;
  font-weight: 900;
}

.lp-final {
  padding: 24px 16px;
  border-radius: 16px;
  background: var(--color-light-gray-shop);
  text-align: center;
}

.lp-final p {
  max-width: 50ch;
  margin: 0 auto 1rem !important;
}

.lp-final :deep(.buy-block) {
  max-width: 420px;
  margin: 0 auto;
}

@media (min-width: 800px) {
  .lp-top {
    padding: 14px 24px;
  }

  .lp {
    --lp-gap: 24px;
    --font-size: 1.1rem;
  }

  .lp section {
    margin-bottom: 80px;
  }

  .lp h2 {
    font-size: 1.9rem;
  }

  .lp-hero {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    gap: 40px;
    align-items: start;
    padding-top: 16px;
  }

  .lp-gallery {
    grid-auto-columns: 100%;
    margin: 0;
    padding: 0;
    scroll-padding: 0;
  }

  .lp-title {
    font-size: 2.6rem;
  }

  .lp-story {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 48px;
  }

  .lp-story:nth-of-type(even) img {
    order: 2;
  }

  .lp-pair {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .lp-apps {
    padding: 40px;
  }

  .lp-apps__list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .lp-apps__list li {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .lp-apps__list img {
    width: 140px;
  }

  .lp-specs__grid {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 48px;
  }

  .lp-final {
    padding: 48px;
  }
}
</style>
