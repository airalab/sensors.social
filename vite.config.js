import { fileURLToPath, URL } from "node:url";

import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2}"],
        cleanupOutdatedCaches: false,
        maximumFileSizeToCacheInBytes: 9000000,
      },
      manifest: {
        name: "Decentralized Sensors Network - map of IoT sensors connected to Web3",
        short_name: "Decentralized Sensors Network",
        description:
          "Robonomics team invite you to use new internet technologies for your IoT devices. This map is open source project with aim to present example of using ipfs, ethereum and polkadot tech for Smart cities applications developers",
        theme_color: "#333",
        background_color: "#333",
        display: "standalone",
        icons: [
          {
            purpose: "maskable",
            src: "maskable-icon.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            purpose: "any",
            src: "icon512_rounded.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/256.png",
            sizes: "256x256",
            type: "image/png",
          },
          {
            src: "/192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    target: ["es2020"],
  },
  optimizeDeps: {
    esbuildOptions: {
      target: ["es2020"],
    },
  },
});
