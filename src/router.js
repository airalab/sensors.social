import { createRouter, createWebHashHistory } from "vue-router";
import Main from "./views/Main.vue";

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
  ],
});

export default router;
