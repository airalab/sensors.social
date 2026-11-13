import { createRouter, createWebHistory, START_LOCATION } from "vue-router";
import { i18n } from "./plugins/i18n";
import { localeFromPath, savedLocale, withLocale } from "./utils/localePath";
import AiAssistant from "./views/AiAssistant.vue";
import AirMeasurements from "./views/AirMeasurements.vue";
import AltruistCompare from "./views/AltruistCompare.vue";
import AltruistTimeline from "./views/AltruistTimeline.vue";
import AltruistUseCases from "./views/AltruistUseCases.vue";
import AltruistDeviceInfo from "./views/AltruistDeviceInfo.vue";
import AltruistSetup from "./views/AltruistSetup.vue";
import AltruistLanding from "./views/AltruistLanding.vue";
import WhereToBuy from "./views/WhereToBuy.vue";
import ConstructionMonitoring from "./views/ConstructionMonitoring.vue";
import NoiseDataRealEstate from "./views/NoiseDataRealEstate.vue";
import Login from "./views/Login.vue";
import Main from "./views/Main.vue";
import PrivacyPolicy from "./views/PrivacyPolicy.vue";
import Support from "./views/Support.vue";
import NotFound from "./views/NotFound.vue";
// import SensorEmbed from "./views/SensorEmbed.vue";

// blog
import Blog from './views//Blog.vue';
import BlogPost from './components/blog/BlogPost.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, top: 30 };
    }
  },
  routes: [
    {
      path: "/:lang(ru)?",
      // path: "/:provider?/:type?/:zoom?/:lat?/:lng?/:sensor?",
      name: "main",
      component: Main,
    },
    {
      path: "/:lang(ru)?/privacy-policy/",
      name: "privacy-policy",
      component: PrivacyPolicy,
    },
    {
      path: "/:lang(ru)?/support/",
      name: "support",
      component: Support,
    },
    {
      path: "/:lang(ru)?/ai/",
      name: "ai",
      component: AiAssistant,
    },
    {
      path: "/:lang(ru)?/air-measurements/",
      name: "air-measurements",
      component: AirMeasurements,
    },
    {
      path: "/:lang(ru)?/altruist-use-cases/",
      name: "altruist-use-cases",
      component: AltruistUseCases,
    },
    {
      path: "/:lang(ru)?/altruist-timeline/",
      name: "altruist-timeline",
      component: AltruistTimeline,
    },
    {
      path: "/:lang(ru)?/altruist-compare/",
      name: "altruist-compare",
      component: AltruistCompare,
    },
    {
      path: "/:lang(ru)?/altruist-device-info/",
      name: "altruist-device-info",
      component: AltruistDeviceInfo,
    },
    {
      path: "/:lang(ru)?/altruist-setup/",
      name: "altruist-setup",
      component: AltruistSetup,
    },
    {
      path: "/:lang(ru)?/altruist/insight/",
      name: "altruist-insight",
      component: AltruistLanding,
      props: { model: "insight" },
    },
    {
      path: "/:lang(ru)?/altruist/urban/",
      name: "altruist-urban",
      component: AltruistLanding,
      props: { model: "urban" },
    },
    {
      path: "/:lang(ru)?/altruist/dual/",
      name: "altruist-dual",
      component: AltruistLanding,
      props: { model: "dual" },
    },
    {
      path: "/:lang(ru)?/where-to-buy/",
      name: "where-to-buy",
      component: WhereToBuy,
    },
    {
      path: "/:lang(ru)?/construction-monitoring/",
      name: "construction-monitoring",
      component: ConstructionMonitoring,
    },
    {
      path: "/:lang(ru)?/noise-data-real-estate/",
      name: "noise-data-real-estate",
      component: NoiseDataRealEstate,
    },
    {
      path: "/:lang(ru)?/login/",
      name: "login",
      component: Login,
    },
      {
      path: "/:lang(ru)?/blog",
      name: "blog",
      component: Blog
    },
    {
      path: "/:lang(ru)?/blog/:slug",
      name: "blog-post",
      component: BlogPost
    },
    // GitHub Pages serves dist/404.html for any unknown address; the app then lands here.
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: NotFound,
    },
    // {
    //   path: "/embed/sensor/:id/",
    //   name: "sensor-embed",
    //   component: SensorEmbed,
    // },
  ],
});

// Language. The address is the source of truth: /ru/… is Russian, everything else English.
// - First load: a /ru/ address shows Russian; an English address sends a visitor who
//   picked Russian with the switch before to the /ru/ version.
// - Inside the app the current language is kept, so links and router.push() calls written
//   as English paths land on the page in the language the visitor is reading.
// - ?lang=en|ru (the shop links to /ai/ with it) switches explicitly.
router.beforeEach((to, from) => {
  const urlLocale = localeFromPath(to.path);
  const queryLocale = ["en", "ru"].includes(to.query.lang) ? to.query.lang : null;

  let locale;
  if (queryLocale) locale = queryLocale;
  else if (from === START_LOCATION) locale = urlLocale === "ru" ? "ru" : savedLocale() || "en";
  else locale = i18n.global.locale.value;

  if (queryLocale) {
    try {
      localStorage.setItem("locale", queryLocale);
    } catch (e) {
      /* private mode */
    }
  }
  i18n.global.locale.value = locale;

  if (locale !== urlLocale || queryLocale) {
    const query = { ...to.query };
    delete query.lang;
    return { path: withLocale(to.path, locale), query, hash: to.hash, replace: true };
  }
});

// <router-link> builds its href with router.resolve(). Giving it the current language here
// means every link in the app points to /ru/… on Russian pages, also in the prerendered
// HTML that search engines read, without touching each link.
const resolveRoute = router.resolve.bind(router);
router.resolve = (to, current) => {
  const resolved = resolveRoute(to, current);
  const locale = i18n.global.locale.value;
  if (locale === "en" || localeFromPath(resolved.path) === locale) return resolved;
  if (resolved.name === "not-found") return resolved;
  return resolveRoute(
    { path: withLocale(resolved.path, locale), query: resolved.query, hash: resolved.hash },
    current
  );
};

// Support old urls
(async () => {
  // Old hash-mode urls look like #/provider/type/zoom/lat/lng/sensor. Any other
  // hash is an anchor on the current page and must stay where it is.
  if (window.location.hash.startsWith("#/")) {
    const routes = router.options.routes.map(
      (item) => item.path.replace("/:lang(ru)?", "").split("/")[1]
    );
    const [, provider, type, zoom, lat, lng, sensor] = window.location.hash.split("/");
    if (routes.includes(provider)) {
      window.location.href = `${provider}/`;
      return;
    }
    const options = {
      name: "main",
      query: {
        provider: provider,
        type: type,
        zoom: zoom,
        lat: lat,
        lng: lng,
        sensor: sensor,
      },
    };
    window.location.href = router.resolve(options).href;
  }
})();

export default router;
