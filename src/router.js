import { createRouter, createWebHashHistory } from "vue-router";
import Main from "./views/Main.vue";
import PrivacyPolicy from "./views/PrivacyPolicy.vue";
import AirMeasurements from "./views/AirMeasurements.vue";

const router = createRouter({
  history: createWebHashHistory(),
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, top: 30 };
    }
  },
  routes: [
    {
      path: "/:provider?/:type?/:zoom?/:lat?/:lng?/:sensor?",
      name: "main",
      component: Main,
      props: (route) => {
        return Object.fromEntries(
          Object.entries(route.params).filter(([_, v]) => v !== "")
        );
      },
    },
    {
      path: "/privacy-policy/",
      name: "privacy-policy",
      component: PrivacyPolicy,
    },
    {
      path: "/air-measurements/",
      name: "air-measurements",
      component: AirMeasurements,
    },
  ],
});

export default router;
