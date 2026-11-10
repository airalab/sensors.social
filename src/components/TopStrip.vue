<template>
  <div v-if="activeBanner || !tickerHidden" class="top-strip">
    <div v-if="activeBanner" class="top-strip-banner">
      <component
        :is="isInternal ? 'router-link' : 'a'"
        v-if="activeBanner.link"
        class="top-strip-banner-link"
        v-bind="linkProps"
      >
        <span class="top-strip-banner-text">{{ pick(activeBanner.text) }}</span>
        <span v-if="activeBanner.cta" class="top-strip-banner-cta"
          >{{ pick(activeBanner.cta) }} <span aria-hidden="true">→</span></span
        >
      </component>
      <span v-else class="top-strip-banner-text">{{ pick(activeBanner.text) }}</span>
      <button
        type="button"
        class="top-strip-close"
        :aria-label="$t('banner.close')"
        :title="$t('banner.close')"
        @click="dismiss"
      >
        ×
      </button>
    </div>
    <div v-else class="top-strip-ticker">
      <BlogTicker class="top-strip-ticker-run" />
      <button
        type="button"
        class="top-strip-close"
        :aria-label="$t('ticker.hide')"
        :title="$t('ticker.hide')"
        @click="hideTicker"
      >
        ×
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * Strip above the map: a banner from config/banner.js while one is on, otherwise the blog ticker.
 * A closed banner stays closed for that visitor (localStorage, keyed by banner id).
 * The ticker has its own close: hidden for good in that browser, the strip goes away;
 * a new banner still shows, since banners are rare and switched on on purpose.
 */
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { banner } from "@config";
import BlogTicker from "./BlogTicker.vue";

const { locale } = useI18n();
const STORAGE_KEY = "banner.dismissed";
const TICKER_KEY = "ticker.hidden";

const read = (key) => {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode: remembered for this visit only */
  }
};

const dismissed = ref(read(STORAGE_KEY));
const tickerHidden = ref(read(TICKER_KEY) === "1");

const activeBanner = computed(() => {
  if (!banner?.id || !banner?.text) return null;
  if (dismissed.value === banner.id) return null;
  const now = Date.now();
  if (banner.from && now < new Date(banner.from).getTime()) return null;
  if (banner.until && now >= new Date(banner.until).getTime()) return null;
  return banner;
});

const pick = (value) => {
  if (!value || typeof value === "string") return value || "";
  const lang = String(locale.value || "en").split("-")[0];
  return value[lang] || value.en || Object.values(value)[0] || "";
};

const isInternal = computed(() => String(activeBanner.value?.link || "").startsWith("/"));
const linkProps = computed(() =>
  isInternal.value
    ? { to: activeBanner.value.link }
    : { href: activeBanner.value.link, target: "_blank", rel: "noopener" }
);

const dismiss = () => {
  dismissed.value = banner.id;
  write(STORAGE_KEY, banner.id);
};

const hideTicker = () => {
  tickerHidden.value = true;
  write(TICKER_KEY, "1");
};
</script>

<style scoped>
.top-strip {
  height: var(--map-top-strip, 36px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: var(--app-bodybg);
  color: var(--app-textcolor);
  overflow: hidden;
}

.top-strip-ticker {
  display: flex;
  align-items: stretch;
  height: 100%;
}

.top-strip-ticker-run {
  flex: 1 1 auto;
}

.top-strip-banner {
  display: flex;
  align-items: stretch;
  height: 100%;
  background: var(--color-green-bright);
  color: var(--color-dark);
}

.top-strip-banner-link,
.top-strip-banner > .top-strip-banner-text {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-width: 0;
  padding: 0 12px;
  color: inherit;
  font-size: 0.95rem;
  text-decoration: none;
}

.top-strip-banner-text {
  overflow: hidden;
  font-weight: 700;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.top-strip-banner-cta {
  flex-shrink: 0;
  font-weight: 800;
  text-decoration: underline;
}

.top-strip-banner-link:hover .top-strip-banner-cta,
.top-strip-banner-link:focus-visible .top-strip-banner-cta {
  text-decoration: none;
}

.top-strip-close {
  flex-shrink: 0;
  width: 40px;
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
}

.top-strip-close:hover,
.top-strip-close:focus-visible {
  color: var(--color-link);
}

.top-strip-banner .top-strip-close:hover,
.top-strip-banner .top-strip-close:focus-visible {
  color: inherit;
  opacity: 0.6;
}
</style>
