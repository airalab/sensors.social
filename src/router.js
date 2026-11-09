import { createRouter, createWebHistory } from "vue-router";
import AiAssistant from "./views/AiAssistant.vue";
import AirMeasurements from "./views/AirMeasurements.vue";
import AltruistCompare from "./views/AltruistCompare.vue";
import AltruistTimeline from "./views/AltruistTimeline.vue";
import AltruistUseCases from "./views/AltruistUseCases.vue";
import AltruistDeviceInfo from "./views/AltruistDeviceInfo.vue";
import AltruistSetup from "./views/AltruistSetup.vue";
import WhereToBuy from "./views/WhereToBuy.vue";
import ConstructionMonitoring from "./views/ConstructionMonitoring.vue";
import NoiseDataRealEstate from "./views/NoiseDataRealEstate.vue";
import Login from "./views/Login.vue";
import Main from "./views/Main.vue";
import PrivacyPolicy from "./views/PrivacyPolicy.vue";
import Support from "./views/Support.vue";
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
      path: "/",
      // path: "/:provider?/:type?/:zoom?/:lat?/:lng?/:sensor?",
      name: "main",
      component: Main,
    },
    {
      path: "/privacy-policy/",
      name: "privacy-policy",
      component: PrivacyPolicy,
    },
    {
      path: "/support/",
      name: "support",
      component: Support,
    },
    {
      path: "/ai/",
      name: "ai",
      component: AiAssistant,
    },
    {
      path: "/air-measurements/",
      name: "air-measurements",
      component: AirMeasurements,
    },
    {
      path: "/altruist-use-cases/",
      name: "altruist-use-cases",
      component: AltruistUseCases,
    },
    {
      path: "/altruist-timeline/",
      name: "altruist-timeline",
      component: AltruistTimeline,
    },
    {
      path: "/altruist-compare/",
      name: "altruist-compare",
      component: AltruistCompare,
    },
    {
      path: "/altruist-device-info/",
      name: "altruist-device-info",
      component: AltruistDeviceInfo,
    },
    {
      path: "/altruist-setup/",
      name: "altruist-setup",
      component: AltruistSetup,
    },
    {
      path: "/where-to-buy/",
      name: "where-to-buy",
      component: WhereToBuy,
    },
    {
      path: "/construction-monitoring/",
      name: "construction-monitoring",
      component: ConstructionMonitoring,
    },
    {
      path: "/noise-data-real-estate/",
      name: "noise-data-real-estate",
      component: NoiseDataRealEstate,
    },
    {
      path: "/login/",
      name: "login",
      component: Login,
    },
      {
      path: "/blog",
      name: "blog",
      component: Blog
    },
    {
      path: "/blog/:slug",
      name: "blog-post",
      component: BlogPost
    }
    // {
    //   path: "/embed/sensor/:id/",
    //   name: "sensor-embed",
    //   component: SensorEmbed,
    // },
  ],
});

// Support old urls
(async () => {
  if (window.location.hash) {
    const routes = router.options.routes.map((item) => item.path.split("/")[1]);
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
