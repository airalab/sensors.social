import { computed } from "vue";
import { useI18n } from "vue-i18n";

// Every post with its frontmatter, bundled once and shared by the blog list and the map's ticker.
const modules = import.meta.glob("../blog/**/index*.md", { eager: true });

function coverUrl(raw, slug, path) {
  if (!raw) return "";
  const normalized = raw.startsWith("./") ? raw.slice(2) : raw;
  if (import.meta.env.PROD && normalized.startsWith("images/"))
    return `/blog/${slug}/${normalized}`;
  return new URL(raw, new URL(path, import.meta.url)).href;
}

// Published posts, newest first, each in the visitor's language when a translation exists.
export function useBlogPosts() {
  const { locale } = useI18n();
  const currentLocale = computed(() => locale.value || localStorage.getItem("locale") || "en");

  const posts = computed(() => {
    const bySlug = new Map(); // slug -> Map(locale -> post)

    for (const [p, mod] of Object.entries(modules)) {
      const m = p.match(/blog\/(.*?)\/index(?:\.([a-z]{2}))?\.md$/);
      const slug = m?.[1];
      const lang = m?.[2] || "en";
      if (!slug) continue;

      const frontmatter = mod ?? {};
      const post = {
        slug,
        ...frontmatter,
        cover_image: coverUrl(frontmatter.cover_image, slug, p),
        default: mod?.default,
        _lang: lang,
      };
      if (!bySlug.has(slug)) bySlug.set(slug, new Map());
      bySlug.get(slug).set(lang, post);
    }

    const list = [];
    for (const byLocale of bySlug.values()) {
      const picked =
        byLocale.get(currentLocale.value) ||
        byLocale.get(currentLocale.value?.split("-")?.[0]) ||
        byLocale.get("en");
      if (!picked?.published) continue;
      list.push(picked);
    }

    list.sort((a, b) => new Date(b.date) - new Date(a.date));
    return list;
  });

  return { posts, currentLocale };
}
