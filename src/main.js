import { Buffer } from "buffer";
import { createApp } from "vue";
import App from "./App.vue";
import { usePlugins } from "./plugins";

import "./assets/styles/main.css";

window.Buffer = Buffer;

const app = createApp(App);
usePlugins(app);

app.mount("#app");
