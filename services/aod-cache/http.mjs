/* eslint-env node */

import http from "node:http";

import { RequestError } from "./lib.mjs";

function sendJson(response, status, value) {
  const body = Buffer.from(JSON.stringify(value));
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": body.length,
    "access-control-allow-origin": "*",
    "cache-control": "no-store",
  });
  response.end(body);
}

export function createServer(aodCache) {
  return http.createServer(async (request, response) => {
    response.setHeader("access-control-allow-origin", "*");
    if (request.method === "OPTIONS") {
      response.writeHead(204, { "access-control-allow-methods": "GET, OPTIONS" });
      response.end();
      return;
    }

    const url = new URL(request.url, "http://localhost");
    const pathname = url.pathname.startsWith("/aod/")
      ? url.pathname.slice("/aod".length)
      : url.pathname;
    try {
      if (request.method === "GET" && pathname === "/health") {
        sendJson(response, 200, await aodCache.stats());
        return;
      }
      if (request.method !== "GET" || (pathname !== "/wms" && pathname !== "/")) {
        throw new RequestError(404, "Not found");
      }

      const parsed = aodCache.parse(url);
      const result = await aodCache.get(parsed);
      response.writeHead(200, {
        "content-type": "image/png",
        "content-length": result.body.length,
        "cache-control": "public, max-age=10800",
        "x-aod-cache": result.cache,
        "access-control-allow-origin": "*",
      });
      response.end(result.body);
    } catch (error) {
      const status = error instanceof RequestError ? error.status : 500;
      sendJson(response, status, { error: error.message || "Internal server error" });
    }
  });
}
