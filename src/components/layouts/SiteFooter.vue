<template>
  <component
    :is="onMap ? 'dialog' : 'footer'"
    ref="root"
    class="site-footer"
    :class="{ 'site-footer-sheet': onMap }"
    :aria-labelledby="onMap ? 'site-footer-sheet-title' : undefined"
    @close="closeAbout"
    @click="onSheetClick"
  >
    <div v-if="onMap" class="site-footer-sheet-head">
      <p id="site-footer-sheet-title">{{ $t("footer.more") }}</p>
      <button
        type="button"
        class="site-footer-sheet-close"
        :aria-label="$t('banner.close')"
        @click="closeAbout"
      >
        <font-awesome-icon icon="fa-solid fa-xmark" />
      </button>
    </div>
    <div class="site-footer-in">
      <div class="site-footer-columns">
        <div class="site-footer-brand">
          <router-link to="/" class="site-footer-logo">
            <img src="../../../public/app-icon-512.png" alt="" />
            <span>sensors.social</span>
          </router-link>
          <p>{{ $t("footer.about") }}</p>
          <router-link to="/where-to-buy/" class="site-footer-buy">{{
            $t("Shop sensors")
          }}</router-link>
        </div>

        <nav aria-label="Altruist">
          <h2>Altruist</h2>
          <router-link to="/altruist/insight/">Altruist Insight</router-link>
          <router-link to="/altruist/urban/">Altruist Urban</router-link>
          <router-link to="/altruist/dual/">Altruist Dual</router-link>
          <router-link to="/altruist-device-info/">{{ $t("footer.device") }}</router-link>
          <router-link to="/altruist-setup/">{{ $t("nav.setup") }}</router-link>
          <router-link to="/ai/">{{ $t("nav.ai") }}</router-link>
          <router-link to="/altruist-compare/">{{ $t("footer.compare") }}</router-link>
          <router-link to="/altruist-use-cases/">{{ $t("footer.useCases") }}</router-link>
        </nav>

        <nav :aria-label="$t('footer.data')">
          <h2>{{ $t("footer.data") }}</h2>
          <router-link to="/air-measurements/">{{ $t("footer.measurements") }}</router-link>
          <router-link to="/construction-monitoring/">{{ $t("footer.construction") }}</router-link>
          <router-link to="/noise-data-real-estate/">{{ $t("footer.noise") }}</router-link>
        </nav>

        <nav :aria-label="$t('footer.project')">
          <h2>{{ $t("footer.project") }}</h2>
          <router-link to="/altruist-timeline/">{{ $t("footer.timeline") }}</router-link>
          <router-link to="/blog/">{{ $t("Blog") }}</router-link>
          <router-link to="/support/">{{ $t("Support") }}</router-link>
          <!-- the open-source parts a visitor can run on their own -->
          <h3>GitHub</h3>
          <a
            v-for="repo in repos"
            :key="repo.name"
            :href="`https://github.com/airalab/${repo.name}`"
            target="_blank"
            rel="noopener"
            >{{ $t(repo.label) }}</a
          >
        </nav>

        <nav :aria-label="$t('footer.legal')">
          <h2>{{ $t("footer.legal") }}</h2>
          <router-link to="/privacy-policy/">{{ $t("footer.privacy") }}</router-link>
          <a
            href="https://github.com/airalab/sensors.social/blob/master/NOTICE"
            target="_blank"
            rel="noopener"
            >{{ $t("footer.licences") }}</a
          >
        </nav>
      </div>

      <div class="site-footer-bottom">
        <LicenceLine />
        <p>
          <a :href="releaseUrl" target="_blank" rel="noopener"
            >{{ $t("footer.version") }} {{ version }}</a
          >
          · {{ $t("Secured by") }} Polkadot
        </p>
      </div>
    </div>
  </component>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import { settings } from "@config";
import { version } from "../../../package.json";
import LicenceLine from "../LicenceLine.vue";
import { useAboutSheet, ABOUT_HASH } from "@/composables/useAboutSheet";

const props = defineProps({ onMap: { type: Boolean, default: false } });

const root = ref(null);
const { aboutOpen, openAbout, closeAbout } = useAboutSheet();

// The hash makes the sheet linkable; replaceState keeps vue-router's history state.
const setHash = (on) => {
  const { pathname, search, hash } = window.location;
  if (on === (hash === ABOUT_HASH)) return;
  window.history.replaceState(window.history.state, "", pathname + search + (on ? ABOUT_HASH : ""));
};

watch(aboutOpen, (open) => {
  if (!props.onMap) return;
  const dialog = root.value;
  if (open && !dialog.open) {
    // Opened from the header menu: that popover would otherwise stay on top of the sheet.
    document.getElementById("about")?.hidePopover?.();
    dialog.showModal();
    dialog.scrollTop = 0;
  } else if (!open && dialog.open) {
    dialog.close();
  }
  setHash(open);
});

// The map rewrites its query (lat, lng, zoom) on load and drops the hash; put it back.
const route = useRoute();
watch(
  () => route.fullPath,
  () => {
    if (props.onMap && aboutOpen.value) setHash(true);
  },
  { flush: "post" }
);

// A click on the backdrop lands on the dialog itself, outside its box.
const onSheetClick = (e) => {
  if (!props.onMap || e.target !== root.value) return;
  const r = root.value.getBoundingClientRect();
  const inside =
    e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  if (!inside) closeAbout();
};

onMounted(() => {
  if (props.onMap && window.location.hash === ABOUT_HASH) openAbout();
});

const repos = [
  { name: "sensors.social", label: "footer.repoMap" },
  { name: "altruist-firmware", label: "footer.repoFirmware" },
  { name: "sensors-connectivity", label: "footer.repoConnectivity" },
  { name: "RoSeMAN", label: "footer.repoRoseman" },
];

const releaseUrl = `https://github.com/${settings.REPO_NAME}/releases/tag/v${version}`;
</script>

<style scoped>
.site-footer {
  flex-shrink: 0;
  margin-top: calc(var(--gap) * 3);
  background: var(--color-dark);
  color: var(--color-light);
  text-align: left;
}

.site-footer-in {
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 32px 28px;
}

/* On the map: a sheet over the map instead of a section below it. */
.site-footer-sheet {
  position: fixed;
  inset: auto 0 0;
  width: 100%;
  max-width: none;
  max-height: min(85svh, 760px);
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 16px 16px 0 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  box-shadow: 0 -8px 32px rgb(0 0 0 / 0.35);
}

.site-footer-sheet[open] {
  animation: site-footer-sheet-in 0.22s ease-out;
}

.site-footer-sheet::backdrop {
  background: rgb(0 0 0 / 0.45);
}

@keyframes site-footer-sheet-in {
  from {
    transform: translateY(40px);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-footer-sheet[open] {
    animation: none;
  }
}

.site-footer-sheet-head {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 20px 0 32px;
  background: var(--color-dark);
}

.site-footer-sheet-head p {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
}

.site-footer-sheet-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--color-light);
  font-size: 1.3rem;
  cursor: pointer;
}

.site-footer-sheet-close:hover,
.site-footer-sheet-close:focus-visible {
  background: #2c2c34;
  color: var(--color-green-bright);
}

.site-footer-sheet .site-footer-in {
  padding-top: 16px;
}

.site-footer-columns {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) repeat(4, minmax(0, 1fr));
  gap: 32px;
}

.site-footer a {
  color: var(--color-light);
  text-decoration: none;
}

.site-footer a:hover,
.site-footer a:focus-visible {
  color: var(--color-green-bright);
  text-decoration: underline;
}

.site-footer-brand {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}

.site-footer a.site-footer-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.125rem;
  font-weight: 800;
}

.site-footer-logo img {
  width: 36px;
  height: 36px;
  border-radius: 9px;
}

.site-footer-brand p {
  max-width: 300px;
  margin: 0;
  color: #d0d0d8;
  font-size: 0.95rem;
  line-height: 1.5;
}

.site-footer a.site-footer-buy {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 18px;
  border-radius: 22px;
  background: var(--color-green-bright);
  color: var(--color-dark);
  font-size: 0.95rem;
  font-weight: 800;
}

.site-footer a.site-footer-buy:hover,
.site-footer a.site-footer-buy:focus-visible {
  color: var(--color-dark);
  text-decoration: none;
}

.site-footer nav {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.95rem;
}

.site-footer h2 {
  margin: 0;
  color: var(--color-green-bright);
  font-size: 0.8rem;
  font-weight: 800;
}

.site-footer h3 {
  margin: 8px 0 0;
  color: #9a9aa3;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.site-footer-bottom {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px 24px;
  margin-top: 36px;
  padding-top: 18px;
  border-top: 1px solid #44444c;
  color: #c4c4cc;
  font-size: 0.8rem;
  line-height: 1.45;
}

.site-footer-bottom p {
  margin: 0;
  font-size: inherit;
}

.site-footer-bottom a,
.site-footer-bottom :deep(.licence-line a) {
  color: inherit;
  text-decoration: underline;
}

.site-footer-bottom :deep(.licence-line a:hover),
.site-footer-bottom :deep(.licence-line a:focus-visible) {
  color: var(--color-green-bright);
}

@media screen and (max-width: 900px) {
  .site-footer-sheet {
    max-height: 100svh;
    height: 100svh;
    border-radius: 0;
  }

  .site-footer-sheet-head {
    padding: 8px 8px 0 16px;
  }

  .site-footer-in {
    padding: 32px 16px 24px;
  }

  .site-footer-columns {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px 16px;
  }

  .site-footer-brand {
    grid-column: 1 / -1;
  }

  .site-footer nav {
    gap: 0;
  }

  .site-footer nav a {
    display: flex;
    align-items: center;
    min-height: 44px;
  }
}
</style>
