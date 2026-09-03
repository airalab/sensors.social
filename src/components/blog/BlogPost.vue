<template>
  <MetaInfo :pageTitle="postTitle" :pageDescription="postDescription" :pageImage="coverUrl" />
  <PageTextLayout>
    <article v-if="postVisible" class="blog-post">
      <header class="blog-post__hero">
        <router-link class="blog-post__backlink" to="/blog/">{{
          $t("← Back to Blog")
        }}</router-link>
        <img v-if="coverUrl" :src="coverUrl" class="blog-post__cover" />
        <div class="blog-post__hero-content">
          <h1>{{ postTitle }}</h1>
          <p class="blog-post__meta">
            {{ formatRelative(postDate, currentLocale) }} • {{ readingTime }}
          </p>
          <ul v-if="postTags.length" class="blog-tags blog-tags--post">
            <li v-for="tag in postTags" :key="tag" class="blog-tag">{{ tag }}</li>
          </ul>
        </div>
      </header>

      <p v-if="postAbstract" class="blog-post__abstract">
        {{ postAbstract }}
      </p>

      <div class="blog-post__content text-all">
        <component :is="postComponent" />
      </div>
    </article>

    <div v-else class="blog-post__not-found">
      <h1>{{ $t("Post not found") }}</h1>
    </div>
  </PageTextLayout>
</template>

<script setup>
import { computed, nextTick, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

import MetaInfo from "../MetaInfo.vue";
import PageTextLayout from "../layouts/PageText.vue";
import { formatReadingTime, formatRelative } from "@/utils/formatDate";

const route = useRoute();
const { locale } = useI18n();
const currentLocale = computed(() => locale.value || localStorage.getItem("locale") || "en");

const modules = import.meta.glob("../../blog/**/index*.md", { eager: true });
const rawModules = import.meta.glob("../../blog/**/index*.md", { eager: true, as: "raw" });

function readingTimeFromText(text) {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);

  return formatReadingTime(minutes, currentLocale.value);
}

const matchedEntry = computed(() => {
  const slug = route.params.slug;
  if (!slug) return null;

  const candidates = Object.entries(modules).filter(([p]) => p.includes(`/blog/${slug}/index`));
  if (!candidates.length) return null;

  const want = currentLocale.value;
  const wantShort = want?.split("-")?.[0];
  const pick =
    candidates.find(([p]) => p.endsWith(`index.${want}.md`)) ||
    (wantShort ? candidates.find(([p]) => p.endsWith(`index.${wantShort}.md`)) : null) ||
    candidates.find(([p]) => p.endsWith("index.en.md")) ||
    candidates.find(([p]) => p.endsWith("index.md")) ||
    candidates[0];

  return pick ? { path: pick[0], mod: pick[1] } : null;
});

const readingTime = computed(() => {
  if (!matchedEntry.value) return "";

  const path = matchedEntry.value.path;

  return path ? readingTimeFromText(rawModules[path]) : "";
});

const postMod = computed(() => matchedEntry.value?.mod ?? null);

const frontmatter = computed(() => postMod.value ?? {});
const postComponent = computed(() => postMod.value?.default ?? null);
const postTitle = computed(() => frontmatter.value?.title ?? "");
const postDate = computed(() => frontmatter.value?.date ?? "");
const postTags = computed(() => frontmatter.value?.tags ?? []);
const postAbstract = computed(() => frontmatter.value?.abstract ?? "");
const postDescription = computed(() => frontmatter.value?.description ?? "");
const postVisible = computed(() => frontmatter.value?.published ?? false);

const coverUrl = computed(() => {
  const raw = frontmatter.value?.cover_image;
  const path = matchedEntry.value?.path;
  if (!raw || !path) return "";

  if (import.meta.env.PROD) {
    const slug = route.params.slug;
    if (typeof slug === "string") {
      const normalized = raw.startsWith("./") ? raw.slice(2) : raw;
      if (normalized.startsWith("images/")) {
        return `/blog/${slug}/${normalized}`;
      }
    }
  }

  return new URL(raw, new URL(path, import.meta.url)).href;
});

function applyExternalLinkTargets() {
  const root = document.querySelector(".blog-post__content");
  if (!root) return;

  const links = root.querySelectorAll("a[href]");
  for (const a of links) {
    const href = a.getAttribute("href") || "";
    if (!/^https?:\/\//i.test(href)) continue;

    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
  }
}

function applyBlogImagePaths() {
  if (!import.meta.env.PROD) return;

  const slug = route.params.slug;
  if (typeof slug !== "string") return;

  const root = document.querySelector(".blog-post__content");
  if (!root) return;

  const imgs = root.querySelectorAll("img[src]");
  for (const img of imgs) {
    const src = img.getAttribute("src") || "";
    if (!src) continue;
    if (/^(https?:)?\/\//i.test(src)) continue;
    if (src.startsWith("data:")) continue;
    if (src.startsWith("/")) continue;

    const normalized = src.startsWith("./") ? src.slice(2) : src;
    if (!normalized.startsWith("images/")) continue;

    img.setAttribute("src", `/blog/${slug}/${normalized}`);
  }
}

onMounted(async () => {
  await nextTick();
  applyExternalLinkTargets();
  applyBlogImagePaths();
});

watch(
  () => matchedEntry.value?.path,
  async () => {
    await nextTick();
    applyExternalLinkTargets();
    applyBlogImagePaths();
  }
);
</script>

<style>
/* Tall/portrait photos stay on screen; wide composites still fill the column */
.blog-post__content img {
  width: auto;
  max-width: 100%;
  max-height: min(80vh, 880px);
  height: auto;
  object-fit: contain;
  display: block;
  margin-inline: auto;
}

.blog-post__content img[src$="waterfall-party.webp"],
.blog-post__content img[src$="vertical.webp"] {
  width: 100%;
  border: none;
}

/* Wide two-panel photos should fill the column, not shrink to the portrait cap */
.blog-post .blog-img-wide > p > img {
  width: 100%;
  max-width: 100%;
  max-height: none;
}

/* A QR code is read by a phone camera, not by eye, so it gains nothing from
   being full width — it just fills the whole viewport and pushes the text
   explaining it off the screen. Selected by wrapper class rather than by file
   name, because the build hashes image file names (images/qr.png is served as
   /assets/qr-f821f375.png). */
.blog-post .qr > p > img {
  width: auto;
  max-width: min(100%, 320px);
  height: auto;
  display: block;
  margin-inline: auto;
}

.blog-post__content a > img {
  cursor: pointer;
}

/* A 16:9 embed that keeps its ratio while the column resizes. The padding-bottom
   trick is used rather than aspect-ratio because the surrounding layout already
   relies on percentage padding elsewhere and this matches it. */
.blog-post .video-embed {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  margin: calc(var(--gap) * 1.25) 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-dark);
}

.blog-post .video-embed iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

/* A quoted post from X, rendered statically. The official embed is not usable
   here: a <script> inside compiled Markdown never executes, and a widget that
   fetches its own content would leave the prerendered page empty. */
.blog-post .tweet-card {
  border: 1px solid var(--surface-border-soft);
  border-radius: var(--radius-md);
  padding: calc(var(--gap) * 1.1) calc(var(--gap) * 1.25);
  margin: calc(var(--gap) * 1.25) 0;
}

.blog-post .tweet-card__head {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
}

.blog-post .tweet-card__author {
  font-weight: 600;
}

.blog-post .tweet-card__handle {
  color: color-mix(in srgb, var(--app-textcolor), transparent 45%);
  font-size: 0.9em;
}

.blog-post .tweet-card__text {
  margin: 0;
}

.blog-post .tweet-card__link {
  display: inline-block;
  margin-top: 0.7rem;
  font-size: 0.9em;
  color: var(--color-link);
}

.blog-post .grid > p {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap);
}

.blog-post .grid.grid-3 > p {
  grid-template-columns: 1fr 1fr;
  justify-items: center;
  align-items: start;
}

/* Phone screenshots: keep portrait shots readable but not huge on desktop */
.blog-post .grid.grid-3 > p > img:nth-of-type(-n + 2) {
  width: auto;
  max-width: min(100%, 380px);
  max-height: min(680px, 75vh);
  height: auto;
  object-fit: contain;
  margin-inline: auto;
}

/* Third screenshot: full-width row under the two mobile shots */
.blog-post .grid.grid-3 > p > img:nth-of-type(3) {
  grid-column: 1 / -1;
  width: 100%;
  max-width: 100%;
  max-height: none;
}

@media (max-width: 630px) {
  .blog-post .grid > p,
  .blog-post .grid.grid-3 > p {
    grid-template-columns: 1fr;
  }

  .blog-post .grid.grid-3 > p > img:nth-of-type(-n + 2) {
    max-width: min(100%, 360px);
    max-height: min(640px, 75vh);
  }

  .blog-post .grid.grid-3 > p > img:nth-of-type(3) {
    grid-column: auto;
  }
}
</style>

<style scoped>
.blog-post {
  max-width: 1200px;
  margin: 0 auto;
}

.blog-post__backlink {
  display: inline-flex;
  width: fit-content;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.92);
  font-weight: 800;
  letter-spacing: 0.01em;
  position: absolute;
  top: calc(var(--gap) * 0.75);
  left: calc(var(--gap) * 0.9);
  z-index: 3;
  padding: 0.35rem 0.55rem;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.16);
  transition: opacity 0.18s ease;
  will-change: opacity;
}

.blog-post__backlink:hover {
  opacity: 0.75;
}

.blog-post__hero {
  position: relative;
  overflow: hidden;
  margin-bottom: calc(var(--gap) * 2.5);
  border: 1px solid var(--surface-border-soft);
  background: var(--surface-bg-soft);

  width: 100vw;
  max-width: 100vw;
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
  border-left-width: 0;
  border-right-width: 0;
}

.blog-post__hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.12), transparent 42%);
  animation: blog-hero-float 8s infinite ease-in-out;
  z-index: 0;
}

@keyframes blog-hero-float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}

.blog-post__hero::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.22), transparent);
  z-index: 1;
}

.blog-post__hero-content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: calc(var(--gap) * 0.25);
  padding: calc(var(--gap) * 0.5) calc(var(--gap) * 1);
  padding-top: clamp(3.25rem, 8vh, 4.5rem); /* reserve space for backlink */
  overflow: auto;
  color: var(--color-light);
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.65), 0 1px 2px rgba(0, 0, 0, 0.35);
  z-index: 2;
}

.blog-post__hero h1 {
  font-size: clamp(1.55rem, 4.2vw, 2.4rem);
  line-height: 1.15;
  overflow-wrap: anywhere;
  word-break: normal;
  hyphens: auto;
  margin: 0;
}

@media (max-width: 630px) {
  .blog-post__hero h1 {
    max-width: 28ch;
  }
}

.blog-post__cover {
  width: 100%;
  object-fit: cover;
  object-position: center;
  filter: brightness(0.65) saturate(1.05);
  display: block;
}

@media (max-width: 630px) {
  .blog-post__cover {
    height: clamp(320px, 75vh, 520px);
  }
}

.blog-post__meta {
  opacity: 1;
  font-size: calc(var(--font-size) * 0.95);
  font-weight: 700;
  display: inline-flex;
  width: fit-content;
  padding: 0.22rem 0.55rem;
  margin-top: calc(var(--gap) * 0.25);
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.22);
}

p.blog-post__meta {
  margin-bottom: calc(var(--gap) * 0.25);
}

.blog-post__abstract {
  margin: calc(var(--gap) * 1.25) 0 calc(var(--gap) * 1.75);
  padding: calc(var(--gap) * 1) calc(var(--gap) * 1.1);
  position: relative;

  border-radius: 0;
  background: radial-gradient(
      color-mix(in srgb, var(--app-textcolor), transparent 94%) 1px,
      transparent 1px
    ),
    radial-gradient(
      800px 220px at 10% 10%,
      color-mix(in srgb, var(--app-textcolor), transparent 94%),
      transparent 60%
    ),
    color-mix(in srgb, var(--app-bodybg), transparent 3%);
  background-size: 18px 18px, auto, auto;
  background-position: 0 0, 0 0, 0 0;

  font-size: calc(var(--font-size) * 0.98);
  line-height: 1.65;
  font-weight: 400;
  font-style: italic;
  letter-spacing: 0.005em;
  color: color-mix(in srgb, var(--app-textcolor), transparent 8%);
  text-align: center;
}

.blog-post__abstract::before {
  content: "“";
  position: absolute;
  top: calc(var(--gap) * 0.35);
  left: calc(var(--gap) * 0.5);
  font-size: calc(var(--font-size) * 3.2);
  line-height: 1;
  color: color-mix(in srgb, var(--color-blue), transparent 78%);
  font-style: normal;
  font-weight: 900;
  pointer-events: none;
}

.blog-post__abstract::after {
  content: "”";
  position: absolute;
  bottom: calc(var(--gap) * 0.35);
  right: calc(var(--gap) * 0.5);
  font-size: calc(var(--font-size) * 3.2);
  line-height: 1;
  color: color-mix(in srgb, var(--color-blue), transparent 78%);
  font-style: normal;
  font-weight: 900;
  pointer-events: none;
}

.blog-post__content {
  /* text-all typography is shared in `src/assets/styles/layout.css` */
  max-width: 76ch;
  margin-left: auto;
  margin-right: auto;
}

@media (prefers-reduced-motion: reduce) {
  .blog-post__hero::before {
    animation: none;
  }
}
</style>
