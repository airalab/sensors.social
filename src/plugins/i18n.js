import { createI18n } from "vue-i18n";

import messages from "../translate";
import { DEFAULT_LOCALE, localeFromPath, savedLocale } from "../utils/localePath";

// The URL decides the language (/ru/… is Russian); on an unprefixed address the router
// sends a visitor who picked Russian before to the /ru/ version. See src/router.js.
function initialLocale() {
  const fromUrl = localeFromPath(window.location.pathname);
  if (fromUrl !== DEFAULT_LOCALE) return fromUrl;
  return savedLocale() || DEFAULT_LOCALE;
}

export const i18n = createI18n({
  legacy: false, // обязательно отключаем legacy‑режим для Composition API
  locale: initialLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages,
});

export function useI18n(app) {
  app.use(i18n);
}
