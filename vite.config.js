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
const LANDING_ROUTES_ALL = [...LANDING_ROUTES, ...LANDING_ROUTES.map((r) => `/ru${r}`)];

// The landings run without the app, so the language links and the "picked Russian before"
// redirect are done here. Both keep the query string: it carries the ad click id.
function landingBoot() {
  return `<script>(function () {
  var withClickIds = ${withClickIds.toString()};
  document.querySelectorAll("a[data-shop]").forEach(function (a) {
    a.href = withClickIds(a.href, location.search);
  });
  document.querySelectorAll("a[data-locale]").forEach(function (a) {
    a.href = a.getAttribute("href").split("?")[0] + location.search + location.hash;
    a.addEventListener("click", function () {
      try { localStorage.setItem("locale", a.dataset.locale); } catch (e) {}
    });
  });
  var saved = null;
  try { saved = localStorage.getItem("locale"); } catch (e) {}
  if (saved === "ru" && !/^\\/ru(\\/|$)/.test(location.pathname)) {
    location.replace("/ru" + location.pathname + location.search + location.hash);
  }
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

// Blog posts get a Russian address only when they have index.ru.md; everything else is
// translated in src/translate/ru.js.
function hasRussian(route) {
  if (!route.startsWith("/blog/")) return true;
  return fs.existsSync(path.resolve(__dirname, "src", route.slice(1), "index.ru.md"));
}

const ruRoute = (route) => (route === "/" ? "/ru" : `/ru${route}`);

function sitemapXml(routes, siteUrl) {
  const loc = (route) => siteUrl + (route === "/" ? "/" : `${route}/`);
  const urls = routes
    .filter((route) => !NOINDEX_ROUTES.includes(route))
    .flatMap((route) => {
      const lastmod = route.startsWith("/blog/") ? blogPostDate(route) : null;
      const versions = hasRussian(route) ? [route, ruRoute(route)] : [route];
      const alternates =
        versions.length > 1
          ? [
              `<xhtml:link rel="alternate" hreflang="en" href="${loc(route)}"/>`,
              `<xhtml:link rel="alternate" hreflang="ru" href="${loc(ruRoute(route))}"/>`,
              `<xhtml:link rel="alternate" hreflang="x-default" href="${loc(route)}"/>`,
            ].join("")
          : "";
      const modified = lastmod ? `<lastmod>${lastmod}</lastmod>` : "";
      return versions.map(
        (version) => `  <url><loc>${loc(version)}</loc>${modified}${alternates}</url>`
      );
    });
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>
`;
}

function stripAppBundle(renderedRoute) {
  if (!LANDING_ROUTES_ALL.includes(renderedRoute.originalRoute.replace(/\/$/, ""))) return;
  let appSrc = null;
  renderedRoute.html = renderedRoute.html
    .replace(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g, (tag, src) => {
      if (src.includes("/assets/index-")) appSrc = src;
      return "";
    })
    .replace(/<link rel="modulepreload"[^>]*>/g, "");
  if (!appSrc) throw new Error(`Landing ${renderedRoute.originalRoute}: app entry not found`);
  renderedRoute.html = renderedRoute.html.replace("</body>", `${landingBoot()}</body>`);
}

// https://vitejs.dev/config/
export default defineConfig(() => {
  // English addresses; the Russian ones are the same under /ru.
  const pageRoutes = [
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
  ];
  const prerenderRoutes = [
    ...pageRoutes,
    ...pageRoutes.filter(hasRussian).map(ruRoute),
    ...NOINDEX_ROUTES,
    "/ru/login",
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
          const xml = sitemapXml(pageRoutes, "https://sensors.social");
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
