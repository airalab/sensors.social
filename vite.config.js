import { fileURLToPath, URL } from "node:url";

import prerender from "@prerenderer/rollup-plugin";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

// for blog
import Markdown from 'unplugin-vue-markdown/vite'
import fs from "fs"
import path from "path"
import fsp from "fs/promises";
import fg from "fast-glob";
import { withClickIds } from "./src/utils/clickIds.js";

function getBlogRoutes() {
  const postsDir = path.resolve(__dirname, "src/blog")

  return fs
    .readdirSync(postsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => fs.existsSync(path.join(postsDir, entry.name, "index.md")))
    .map((entry) => `/blog/${entry.name}`)
}

// Google Ads landing pages. Their prerendered HTML ships without the 1.4 MB app bundle:
// the page is complete as static HTML, and a few lines of inline script carry the ad click
// id to the shop link. The app loads only for a non-English locale.
const LANDING_ROUTES = ["/altruist/insight", "/altruist/urban", "/altruist/dual"];

function landingBoot(appSrc) {
  return `<script>(function () {
  var withClickIds = ${withClickIds.toString()};
  document.querySelectorAll("a[data-shop]").forEach(function (a) {
    a.href = withClickIds(a.href, location.search);
  });
  var loaded = false;
  function loadApp() {
    if (loaded) return;
    loaded = true;
    var s = document.createElement("script");
    s.type = "module";
    s.crossOrigin = "";
    s.src = ${JSON.stringify(appSrc)};
    document.body.appendChild(s);
  }
  var saved = null;
  try { saved = localStorage.getItem("locale"); } catch (e) {}
  if (saved && saved !== "en") loadApp();
  document.querySelectorAll("[data-locale]").forEach(function (b) {
    b.addEventListener("click", function () {
      try { localStorage.setItem("locale", b.dataset.locale); } catch (e) {}
      if (b.dataset.locale !== "en") loadApp();
    });
  });
})();</script>`;
}

function postProcessRoute(renderedRoute) {
  // GitHub Pages answers every unknown address with /404.html (status 404); the app inside it
  // then routes to the real URL, so client-only pages and the not-found page both work.
  if (renderedRoute.originalRoute === "/404") renderedRoute.outputPath = "404.html";
  stripAppBundle(renderedRoute);
}

// Pages that are for people who already have a link, not for search: they carry noindex
// and stay out of the sitemap.
const NOINDEX_ROUTES = ["/login", "/404"];

function blogPostDate(route) {
  const md = path.resolve(__dirname, "src", `${route.slice(1)}`, "index.md");
  const m = fs.readFileSync(md, "utf8").match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})/m);
  return m ? m[1] : null;
}

function sitemapXml(routes, siteUrl) {
  const urls = routes
    .filter((route) => !NOINDEX_ROUTES.includes(route))
    .map((route) => {
      const loc = siteUrl + (route === "/" ? "/" : `${route}/`);
      const lastmod = route.startsWith("/blog/") ? blogPostDate(route) : null;
      return `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`;
    });
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
}

function stripAppBundle(renderedRoute) {
  if (!LANDING_ROUTES.includes(renderedRoute.originalRoute.replace(/\/$/, ""))) return;
  let appSrc = null;
  renderedRoute.html = renderedRoute.html
    .replace(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g, (tag, src) => {
      if (src.includes("/assets/index-")) appSrc = src;
      return "";
    })
    .replace(/<link rel="modulepreload"[^>]*>/g, "");
  if (!appSrc) throw new Error(`Landing ${renderedRoute.originalRoute}: app entry not found`);
  renderedRoute.html = renderedRoute.html.replace("</body>", `${landingBoot(appSrc)}</body>`);
}

// https://vitejs.dev/config/
export default defineConfig(() => {
  const prerenderRoutes = [
    "/",
    "/privacy-policy",
    "/support",
    "/ai",
    "/air-measurements",
    "/altruist-timeline",
    "/altruist-use-cases",
    "/altruist-compare",
    "/altruist-device-info",
    "/altruist-setup",
    "/where-to-buy",
    "/construction-monitoring",
    "/noise-data-real-estate",
    ...LANDING_ROUTES,
    "/blog",
    // auto-generated blog routes
    ...getBlogRoutes(),
    ...NOINDEX_ROUTES,
  ];

  return {
    base: "/",
    // server: { https: true },
    plugins: [
      vue({include: [/\.vue$/, /\.md$/]}),
      {
        name: "copy-blog-images",
        apply: "build",
        async writeBundle() {
          const blogDir = path.resolve(__dirname, "src/blog");
          const outDir = path.resolve(__dirname, "dist");

          const files = await fg(["**/images/**/*"], {
            cwd: blogDir,
            onlyFiles: true,
            dot: false,
            followSymbolicLinks: true,
          });

          await Promise.all(
            files.map(async (rel) => {
              const src = path.join(blogDir, rel);
              const dst = path.join(outDir, "blog", rel);
              await fsp.mkdir(path.dirname(dst), { recursive: true });
              await fsp.copyFile(src, dst);
            })
          );
        },
      },
      {
        name: "sitemap",
        apply: "build",
        async writeBundle() {
          const xml = sitemapXml(prerenderRoutes, "https://sensors.social");
          await fsp.writeFile(path.resolve(__dirname, "dist", "sitemap.xml"), xml);
        },
      },
      prerender({
        routes: prerenderRoutes,
        renderer: "@prerenderer/renderer-puppeteer",
        postProcess: postProcessRoute,
      }),
        Markdown({
        frontmatter: true
      })
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        "@config": fileURLToPath(new URL("./src/config", import.meta.url)),
      },
    },
    build: {
      target: ["es2020"],
    },
    optimizeDeps: {
      esbuildOptions: {
        target: ["es2020"],
      },
      include: [
        "@fortawesome/fontawesome-svg-core",
        "@fortawesome/free-brands-svg-icons",
        "@fortawesome/free-regular-svg-icons",
        "@fortawesome/free-solid-svg-icons",
        "@fortawesome/vue-fontawesome",
      ],
    },
  };
});
