import { createRouter, createWebHashHistory } from "vue-router";
import Main from "./views/Main.vue";
import PrivacyPolicy from "./views/PrivacyPolicy.vue";

const router = createRouter({
  history: createWebHashHistory(),
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
  ],
});

export default router;
