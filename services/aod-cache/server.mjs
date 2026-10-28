/* eslint-env node */

import path from "node:path";
import { fileURLToPath } from "node:url";

import { createServer } from "./http.mjs";
import { AodCache, configFromEnv } from "./lib.mjs";

const serviceDir = path.dirname(fileURLToPath(import.meta.url));
const config = configFromEnv({
  ...process.env,
  CACHE_DIR: process.env.CACHE_DIR || path.join(serviceDir, "cache"),
});
const cache = new AodCache(config);

await cache.init();
const server = createServer(cache);
server.listen(config.port, "127.0.0.1", () => {
  console.log(`AOD cache listening on http://127.0.0.1:${config.port}`);
  if (config.prefetchEnabled) {
    cache.reconcilePrefetch().catch((error) => console.error("Initial prefetch failed", error));
  }
});

const timer = config.prefetchEnabled
  ? setInterval(() => {
      cache.reconcilePrefetch().catch((error) => console.error("Scheduled prefetch failed", error));
    }, 10 * 60_000)
  : null;
timer?.unref();

function shutdown() {
  if (timer) clearInterval(timer);
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
