import Vue from "vue";
import VueRouter from "vue-router";
import Main from "./views/Main.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/:provider?/:type?/:zoom?/:lat?/:lng?",
    name: "main",
    component: Main,
    props: true,
  },
];

const router = new VueRouter({
  routes,
});

export default router;
