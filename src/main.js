import { Buffer } from "buffer";
import { createApp } from "vue";
import VueMatomo from "vue-matomo";
import App from "./App.vue";
import { usePlugins } from "./plugins";

import "./assets/styles/main.css";

window.Buffer = Buffer;

const app = createApp(App).use(VueMatomo, {
  host: "https://matomo.robonomics.network/",
  siteId: 5,
}); // matomo analytics
usePlugins(app);

app.mount("#app");
