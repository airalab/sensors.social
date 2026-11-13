import { useRoute, useRouter } from "vue-router";

import { i18n } from "@/plugins/i18n";
import { withLocale } from "@/utils/localePath";

// Language switch: the other language lives at another address (/ru/… or /…), so a switch
// is a navigation, and the choice is remembered for the next visit to an English address.
export function useLocaleSwitch() {
  const route = useRoute();
  const router = useRouter();

  // Plain string, not router.resolve(): that one adds the current language to every link.
  function hrefFor(code) {
    const query = new URLSearchParams(route.query).toString();
    // Trailing slash: GitHub Pages serves /page/ and would redirect /page to it.
    const path = route.path.endsWith("/") ? route.path : `${route.path}/`;
    return withLocale(path, code) + (query ? `?${query}` : "") + (route.hash || "");
  }

  function switchLocale(code) {
    if (code === i18n.global.locale.value) return;
    const href = hrefFor(code);
    try {
      localStorage.setItem("locale", code);
    } catch (e) {
      /* private mode */
    }
    i18n.global.locale.value = code;
    router.push(href);
  }

  return { hrefFor, switchLocale };
}
