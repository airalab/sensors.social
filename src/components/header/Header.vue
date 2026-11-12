<template>
  <header :class="`route-${route.name || route.path.replaceAll('/', '-')}`">
    <TopStrip v-if="route.name === 'main'" />
    <div class="header-content flexline space-between">
      <div class="flexline align-start">
        <router-link to="/" class="appicon">
          <img :alt="settings.TITLE" src="../../../public/app-icon-512.png" />
        </router-link>
        <ServiceStatus />
      </div>

      <div class="flexline header-actions">
        <a
          href="/where-to-buy/"
          class="button button-outlined shop-button button-round-outline-brightgreen"
        >
          <font-awesome-icon icon="fa-solid fa-bag-shopping" aria-hidden="true" />
          <span class="shop-full">{{ $t("Shop sensors") }}</span>
          <span class="shop-short">{{ $t("nav.buy") }}</span>
        </a>

        <button
          class="popovercontrol button-round-outline"
          popovertarget="about"
          :aria-label="$t('nav.menu')"
          :aria-expanded="menuOpen ? 'true' : 'false'"
        >
          <!-- stays a ☰: under the backdrop a × here looked disabled and sat right under the strip's × -->
          <font-awesome-icon icon="fa-solid fa-bars" />
        </button>

        <button
          class="popovercontrol button-round-outline bookmarksbutton"
          :class="{ active: bookmarksCount > 0 }"
          popovertarget="bookmarks"
        >
          <font-awesome-icon icon="fa-solid fa-bookmark" />
          <span class="button-round-outline__badge" v-if="bookmarksCount > 0">{{
            bookmarksCount
          }}</span>
        </button>

        <Login v-if="settings.SERVICES.accounts" />
      </div>
    </div>

    <div
      id="about"
      class="popover popover-top-right"
      popover
      @toggle="menuOpen = $event.newState === 'open'"
    >
      <div class="menu-head">
        <span class="menu-title">{{ $t("nav.menu") }}</span>
        <select v-model="locale" class="menu-locale" :aria-label="$t('nav.language')">
          <option v-for="lang in locales" :key="lang.code" :value="lang.code">
            {{ lang.title }}
          </option>
        </select>
        <button
          type="button"
          class="menu-close"
          popovertarget="about"
          popovertargetaction="hide"
          :aria-label="$t('banner.close')"
          :title="$t('banner.close')"
        >
          <font-awesome-icon icon="fa-solid fa-xmark" />
        </button>
      </div>

      <nav class="menu-links" :aria-label="$t('nav.menu')">
        <router-link class="menu-link menu-link-buy" to="/where-to-buy/">{{
          $t("Where to buy")
        }}</router-link>
        <router-link class="menu-link" to="/ai/">{{ $t("nav.ai") }}</router-link>
        <router-link class="menu-link" to="/altruist-device-info/">{{
          $t("nav.aboutAltruist")
        }}</router-link>
        <div class="menu-models" role="group" :aria-label="$t('nav.altruistModels')">
          <router-link to="/altruist/insight/">Insight</router-link>
          <router-link to="/altruist/urban/">Urban</router-link>
          <router-link to="/altruist/dual/">Dual</router-link>
        </div>
        <router-link class="menu-link" to="/altruist-setup/">{{ $t("nav.setup") }}</router-link>
        <router-link class="menu-link" to="/blog/">{{ $t("Blog") }}</router-link>
        <router-link class="menu-link" to="/support/">{{ $t("Support") }}</router-link>
        <a
          v-if="route.name === 'main'"
          class="menu-link"
          href="#about-project"
          aria-haspopup="dialog"
          @click.prevent="openAbout"
          >{{ $t("footer.more") }}</a
        >
      </nav>

      <LicenceLine class="menu-licence" />
    </div>

    <div id="bookmarks" class="popover-top-right popover" popover>
      <h3>{{ $t("bookmarks.listtitle") }}</h3>
      <div class="bookmarks-content">
        <Bookmarks />
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { languages } from "@/translate";
import { settings } from "@config";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

import { useBookmarks } from "@/composables/useBookmarks";

import LicenceLine from "../LicenceLine.vue";
import Login from "./Login.vue";
import ServiceStatus from "./ServiceStatus.vue";
import TopStrip from "../TopStrip.vue";
import Bookmarks from "@/components/Bookmarks.vue";
import { useAboutSheet } from "@/composables/useAboutSheet";

const { locale: i18nLocale } = useI18n();
const route = useRoute();

const locale = ref(localStorage.getItem("locale") || i18nLocale.value || "en");
const locales = languages || ["en"];
const { idbBookmarks } = useBookmarks();
const menuOpen = ref(false);
const { openAbout } = useAboutSheet();
const localeComputed = computed(() => locale.value || "en");
// Количество закладок
const bookmarksCount = computed(() => idbBookmarks.value?.length || 0);

watch(
  locale,
  (newValue) => {
    i18nLocale.value = newValue;
    localStorage.setItem("locale", newValue);
  },
  { immediate: true }
);

onMounted(() => {
  // Close all opened details on body click if this is Tooltip

  document.body.onclick = (e) => {
    const current = e.target.closest('details[tabindex="0"]'); //save clicked element to detect if it is our current detail
    document.body.querySelectorAll('details[tabindex="0"]').forEach((e) => {
      if (e !== current) {
        //we need this condition not to break details behavior
        e.open = false;
      }
    });
  };

  // Update for Indiegogo timer hourly
  // timer = setInterval(() => { now.value = new Date() }, 1000 * 60 * 60);
});
</script>

<style scoped>
header {
  left: 0;
  position: sticky;
  top: 0;
  width: 100%;
  z-index: 99;
  pointer-events: none;
  box-shadow: 0 6px 12px -4px rgba(0, 0, 0, 0.12);
}

header.route-altruist-compare {
  position: static;
}

header > * {
  pointer-events: all;
}

/* Popovers live outside the flex row; closed state must not affect header layout */
header > .popover {
  position: fixed;
  margin: 0;
}

.header-content {
  padding: calc(var(--gap) / 2) var(--gap);
  background-color: var(--app-bodybg);
}

@media screen and (max-width: 460px) {
  .latest-updates span {
    display: none;
  }

  .latest-updates {
    padding-left: calc(var(--gap) * 0.75);
    padding-right: calc(var(--gap) * 0.75);
    min-width: 2.6rem;
    justify-content: center;
  }
}

.appicon {
  border-radius: 0.5rem;
  display: block;
  overflow: hidden;
  user-select: none;
  width: 2.5rem;
}

.appicon img {
  display: block;
  max-width: 100%;
}

#about:popover-open {
  width: min(360px, calc(100vw - var(--gap) * 2));
  padding: 14px;
  border-radius: 16px;
}

.menu-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 4px 10px;
}

.menu-title {
  flex: 1 1 auto;
  color: #555;
  font-size: 0.8rem;
  font-weight: 800;
}

.menu-close {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--app-textcolor);
  font-size: 1.2rem;
  cursor: pointer;
}

.menu-close:hover,
.menu-close:focus-visible {
  background: rgba(0, 0, 0, 0.06);
  color: var(--color-link);
}

.menu-head .menu-locale {
  width: auto;
  min-height: 44px;
  height: auto;
}

.menu-links {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.menu-links a.menu-link {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  min-height: 50px;
  margin: 0;
  padding: 0 16px;
  border: 2px solid var(--color-dark);
  border-radius: 14px;
  color: var(--color-dark);
  font-size: 1.06rem;
  font-weight: 700;
  text-decoration: none;
  transition: background-color 0.2s ease-in-out;
}

.menu-links a.menu-link:hover,
.menu-links a.menu-link:focus-visible,
.menu-links a.menu-link-buy {
  background-color: var(--color-green-bright);
}

.menu-links a.menu-link-buy {
  font-weight: 800;
}

.menu-models {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.menu-models a {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border-radius: 999px;
  background-color: var(--color-light-gray-shop);
  color: var(--color-dark);
  font-weight: 700;
  text-decoration: none;
}

.menu-models a:hover,
.menu-models a:focus-visible,
.menu-models a.router-link-active {
  background-color: var(--color-green-bright);
}

.menu-licence {
  margin: 12px 4px 0;
  color: #444;
}

.shop-short {
  display: none;
}

/* - bookmarks button */
.bookmarksbutton.active {
  color: var(--color-orange);
}

.bookmarksbutton.active:hover {
  color: var(--color-orange-dark, #e67e22);
}

/* - bookmarks popup */
#bookmarks {
  padding: 0;
  min-width: 320px;
  max-width: 400px;
  max-height: 500px;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

#bookmarks h3 {
  margin: 0 0 16px 0;
  padding: 16px 16px 0 16px;
  font-size: 1.2em;
  font-weight: 600;
  color: var(--color-text);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding-bottom: 12px;
}

#bookmarks .bookmarks-content {
  padding: 0 16px 16px 16px;
}

/* Стили для элементов внутри закладок */
#bookmarks .bookmarks-content > * {
  margin-bottom: 8px;
}

#bookmarks .bookmarks-content > *:last-child {
  margin-bottom: 0;
}

/* Анимация для счетчика */
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

/* Адаптивность для мобильных */
@media screen and (max-width: 600px) {
  #bookmarks {
    min-width: 280px;
    max-width: calc(100vw - 32px);
    margin: 0 16px;
  }
}
/* - bookmarks button */

@media screen and (width < 600px) {
  .header-actions {
    gap: var(--gap);
  }

  .hidemobiles {
    display: none;
  }
}

@media screen and (width < 700px) {
  .shop-button svg,
  .shop-full {
    display: none;
  }

  .shop-short {
    display: inline;
  }
}

@media screen and (width < 400px) {
  .header-actions .shop-button {
    padding-inline: 0.6rem;
  }
}

@media screen and (width < 500px) {
  #about:popover-open {
    width: calc(100vw - var(--gap) * 2);
  }

  .menu-links a.menu-link {
    min-height: 56px;
    font-size: 1.125rem;
  }
}
</style>

<style>
/* По умолчанию popover backdrop не ч/б (см. base.css).
   Для header popover оставляем grayscale, как было раньше. */
#about:popover-open::backdrop,
#bookmarks:popover-open::backdrop,
#accounts:popover-open::backdrop {
  backdrop-filter: grayscale(1);
}

/* Polyfill fallback: в CSS используется класс `.\:popover-open`. */
#about.\:popover-open::backdrop,
#bookmarks.\:popover-open::backdrop,
#accounts.\:popover-open::backdrop {
  backdrop-filter: grayscale(1);
}
</style>
