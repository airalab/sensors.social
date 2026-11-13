// Language lives in the URL: English at /page/, Russian at /ru/page/.
// Plain functions, no Vue, so vite.config.js can use them for prerender and the sitemap.

export const LOCALES = ["en", "ru"];
export const DEFAULT_LOCALE = "en";

const RU_PREFIX = /^\/ru(?=\/|$)/;

export function localeFromPath(path) {
  return RU_PREFIX.test(path) ? "ru" : DEFAULT_LOCALE;
}

export function stripLocale(path) {
  return path.replace(RU_PREFIX, "") || "/";
}

export function withLocale(path, locale) {
  const bare = stripLocale(path);
  if (locale === DEFAULT_LOCALE) return bare;
  return bare === "/" ? `/${locale}/` : `/${locale}${bare}`;
}

// The language the visitor picked with a switch; a link to /ru/ alone does not change it.
export function savedLocale() {
  try {
    const saved = localStorage.getItem("locale");
    return LOCALES.includes(saved) ? saved : null;
  } catch (e) {
    return null;
  }
}
