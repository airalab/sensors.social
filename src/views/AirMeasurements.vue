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
    <div class="pagetext-prose">
      <div class="pagetext-header">
        <div class="pagetext-eyebrow">sensors.social</div>
        <h1 class="pagetext-title">{{ $t("measures.title") }}</h1>
      </div>

      <section v-for="(measurement, key) in measurements" :key="key" :id="key.toUpperCase()">
        <template
          v-if="
            measurement?.nameshort && measurement?.description && measurement?.description !== ''
          "
        >
          <h2>
            {{ measurement?.nameshort?.[locale] }}
            <span
              v-if="
                measurement.name?.[locale] &&
                measurement.name?.[locale] !== measurement?.nameshort?.[locale]
              "
              >{{ measurement.name?.[locale] }}</span
            >
          </h2>

          <div v-if="measurement?.zones" class="measures">
            <div
              v-for="(zone, index) in measurement.zones"
              :key="index"
              :style="{ backgroundColor: zone.color }"
            >
              <b>
                {{ zone.label[locale] ? zone.label[locale] : zone.label.en }}
              </b>
              <span v-if="measurement.zoneLabelsAreRanges">{{ measurement.unit }}</span>
              <span v-else-if="typeof zone.valueMax === 'number'">
                {{ $t("scales.upto") }} {{ zone.valueMax }}
                <template v-if="measurement.unit && measurement.unit !== ''">
                  {{ " " + measurement.unit }}
                </template>
              </span>
              <span v-else>{{ $t("scales.above") }}</span>
            </div>
          </div>

          <template v-if="measurement?.description && Array.isArray(measurement?.description)">
            <template v-for="(block, idx) in measurement.description" :key="idx">
              <h4 v-if="block.tag === 'subtitle'">
                {{ block.text?.[locale] ?? block.text?.en }}
              </h4>

              <p v-if="block.tag === 'p'">
                {{ block.text?.[locale] ?? block.text?.en }}
              </p>

              <ul v-else-if="block.tag === 'ul'">
                <li v-for="(item, i) in block.items?.[locale] ?? block.items?.en" :key="i">
                  {{ item }}
                </li>
              </ul>
            </template>
          </template>
        </template>
      </section>
    </div>
  </PageTextLayout>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import PageTextLayout from "../components/layouts/PageText.vue";
import MetaInfo from "../components/MetaInfo.vue";
import measurements from "../measurements";

const { locale } = useI18n();
const currentLocale = ref(locale.value);

watch(locale, (newLocale) => {
  currentLocale.value = newLocale;
});

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
h2 span {
  font-size: 60%;
  display: block;
}

.measures {
  --font-size: 1rem;
  --gap: 1rem;

  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--gap);
  margin-bottom: var(--gap);
}

.measures div {
  color: #fff;
  padding: var(--gap) calc(var(--gap) * 2);
}

.measures span {
  display: block;
}

@media (max-width: 860px) {
  .measures {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 520px) {
  .measures {
    grid-template-columns: 1fr;
  }
}
</style>
