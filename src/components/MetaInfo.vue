<template></template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useHead } from "@vueuse/head";
import { useI18n } from "vue-i18n";

import { settings } from "@config";
import { withLocale } from "@/utils/localePath";

const { locale: i18nLocale } = useI18n();

const props = defineProps({
  pageTitle: { type: String },
  pageDescription: { type: String },
  pageImage: { type: String },
  pageImageWidth: { type: String },
  pageImageHeight: { type: String },
  noindex: { type: Boolean, default: false },
  // false when the Russian address shows the English text (a post without index.ru.md):
  // then the page points search engines to the English original and claims no translation.
  translated: { type: Boolean, default: true },
});

const route = useRoute();
// One address per page and language for search engines: no query string (map state, ad
// click ids) and always a trailing slash, because GitHub Pages serves /page/ and redirects
// /page to it.
const pathWithSlash = computed(() => (route.path.endsWith("/") ? route.path : `${route.path}/`));
const siteUrl = settings?.SITE_URL || "";
const urlFor = (locale) => siteUrl + withLocale(pathWithSlash.value, locale);

const canonicalUrl = computed(() =>
  props.translated ? siteUrl + pathWithSlash.value : urlFor("en")
);

const links = computed(() => {
  if (props.noindex) return [];
  const list = [{ rel: "canonical", href: canonicalUrl.value }];
  if (props.translated) {
    list.push(
      { rel: "alternate", hreflang: "en", href: urlFor("en") },
      { rel: "alternate", hreflang: "ru", href: urlFor("ru") },
      { rel: "alternate", hreflang: "x-default", href: urlFor("en") }
    );
  }
  return list;
});

const locale = computed(() => {
  return i18nLocale.value || localStorage.getItem("locale") || "en";
});

const ogdata = computed(() => ({
  site_name: settings?.SITE_NAME || "Sensors map",
  title: props.pageTitle || settings?.TITLE || settings?.SITE_NAME || "Sensors map",
  description: props.pageDescription || settings?.DESC || null,
  image: props.pageImage || null,
  image_width: props.pageImage ? props.pageImageWidth || "1280" : null,
  image_height: props.pageImage ? props.pageImageHeight || "765" : null,
  twitter: settings?.TWITTER || null,
}));

const getAbsoluteImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  const baseUrl =
    settings?.SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
  return `${baseUrl}${imagePath}`;
};

const meta = computed(() => {
  const d = ogdata.value;
  return [
    d.description && { name: "description", content: d.description },
    props.noindex && { name: "robots", content: "noindex" },

    { property: "og:type", content: "website" },
    d.site_name && { property: "og:site_name", content: d.site_name },
    d.title && { property: "og:title", content: d.title },
    d.description && { property: "og:description", content: d.description },
    d.image && { property: "og:image", content: getAbsoluteImageUrl(d.image) },
    d.image && d.image_width && { property: "og:image:width", content: d.image_width },
    d.image && d.image_height && { property: "og:image:height", content: d.image_height },
    { property: "og:url", content: canonicalUrl.value },
    { property: "og:locale", content: locale.value === "ru" ? "ru_RU" : "en_US" },

    { name: "twitter:card", content: "summary_large_image" },
    d.title && { name: "twitter:title", content: d.title },
    d.image && { name: "twitter:image", content: getAbsoluteImageUrl(d.image) },
    d.description && { name: "twitter:description", content: d.description },
    d.twitter && { name: "twitter:site", content: d.twitter },
    d.twitter && { name: "twitter:creator", content: d.twitter },
  ].filter(Boolean);
});

useHead({
  title: () => ogdata.value.title,
  htmlAttrs: {
    lang: () => locale.value,
    dir: "ltr",
  },
  meta: () => meta.value,
  link: () => links.value,
});
</script>
