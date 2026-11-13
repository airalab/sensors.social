<template>
  <div class="ticker">
    <router-link to="/blog/" class="ticker-label">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        aria-hidden="true"
      >
        <path d="M4 5h11a3 3 0 0 1 3 3v11H7a3 3 0 0 1-3-3z" />
        <path d="M8 9h6M8 13h6" />
      </svg>
      {{ $t("Blog") }}
    </router-link>
    <!-- static: the newest post first; the rest are reached with the arrows or a sideways swipe -->
    <div ref="windowEl" class="ticker-window" @scroll.passive="updateEnds">
      <ul class="ticker-list">
        <li v-for="post in latest" :key="post.slug">
          <router-link :to="`/blog/${post.slug}/`">
            <span class="ticker-date">{{ shortDate(post.date) }}</span>
            <span class="ticker-title">{{ post.title }}</span>
          </router-link>
        </li>
      </ul>
    </div>
    <div v-if="!atStart || !atEnd" class="ticker-arrows">
      <button
        type="button"
        class="ticker-arrow"
        :disabled="atStart"
        :aria-label="$t('ticker.prev')"
        :title="$t('ticker.prev')"
        @click="page(-1)"
      >
        ‹
      </button>
      <button
        type="button"
        class="ticker-arrow"
        :disabled="atEnd"
        :aria-label="$t('ticker.next')"
        :title="$t('ticker.next')"
        @click="page(1)"
      >
        ›
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { useBlogPosts } from "@/composables/useBlogPosts";

const { posts, currentLocale } = useBlogPosts();
const latest = computed(() => posts.value.slice(0, 5));

const windowEl = ref(null);
const atStart = ref(true);
const atEnd = ref(true);

const updateEnds = () => {
  const el = windowEl.value;
  if (!el) return;
  atStart.value = el.scrollLeft <= 1;
  atEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
};

// One click moves by most of the visible width, so the next title starts near the left edge.
const page = (dir) => {
  const el = windowEl.value;
  el?.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
};

let resize = null;
onMounted(() => {
  updateEnds();
  resize = new ResizeObserver(updateEnds);
  if (windowEl.value) resize.observe(windowEl.value);
});
onBeforeUnmount(() => resize?.disconnect());
watch(latest, () => nextTick(updateEnds));

const shortDate = (date) =>
  new Intl.DateTimeFormat(currentLocale.value === "ru" ? "ru-RU" : "en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
</script>

<style scoped>
.ticker {
  display: flex;
  align-items: stretch;
  min-width: 0;
  height: 100%;
}

.ticker-label {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  background: var(--color-green-bright);
  color: var(--color-dark);
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-decoration: none;
}

.ticker-window {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  min-width: 0;
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
}

.ticker-window::-webkit-scrollbar {
  display: none;
}

/* .ticker raises specificity over the global ul:not(:last-child) margin */
.ticker .ticker-list {
  display: flex;
  align-items: center;
  width: max-content;
  margin: 0;
  padding: 0 0 0 12px;
  list-style: none;
}

/* the site-wide li rule adds a bottom margin and its own font size, which lifts the titles off centre */
.ticker-list li {
  display: flex;
  align-items: center;
  margin: 0;
  font-size: inherit;
}

.ticker-list li:not(:last-child)::after {
  content: "•";
  padding: 0 20px;
  color: var(--color-link);
}

.ticker-list a {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--app-textcolor);
  font-size: 0.9rem;
  white-space: nowrap;
  text-decoration: none;
}

.ticker-list a:hover,
.ticker-list a:focus-visible {
  color: var(--color-link);
}

.ticker-date {
  color: var(--color-gray);
  font-size: 0.8rem;
}

.ticker-title {
  font-weight: 700;
}

.ticker-arrows {
  display: flex;
  flex-shrink: 0;
  align-items: stretch;
  border-left: 1px solid rgba(0, 0, 0, 0.08);
}

.ticker-arrow {
  width: 32px;
  border: 0;
  background: transparent;
  color: var(--app-textcolor);
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
}

.ticker-arrow:hover:not(:disabled),
.ticker-arrow:focus-visible {
  color: var(--color-link);
}

.ticker-arrow:disabled {
  opacity: 0.3;
  cursor: default;
}

@media (prefers-reduced-motion: reduce) {
  .ticker-window {
    scroll-behavior: auto;
  }
}
</style>
