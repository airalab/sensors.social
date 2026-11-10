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
    <div class="ticker-window">
      <!-- the list runs twice so the loop has no seam; the copy is hidden from screen readers -->
      <div class="ticker-run" :style="{ animationDuration: `${latest.length * 12}s` }">
        <ul v-for="copy in 2" :key="copy" :aria-hidden="copy === 2 ? 'true' : null">
          <li v-for="post in latest" :key="post.slug">
            <router-link :to="`/blog/${post.slug}`" :tabindex="copy === 2 ? -1 : null">
              <span class="ticker-date">{{ shortDate(post.date) }}</span>
              <span class="ticker-title">{{ post.title }}</span>
            </router-link>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useBlogPosts } from "@/composables/useBlogPosts";

const { posts, currentLocale } = useBlogPosts();
const latest = computed(() => posts.value.slice(0, 5));

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
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
}

.ticker-run {
  display: flex;
  width: max-content;
  height: 100%;
  animation: ticker-scroll linear infinite;
}

/* stops under the pointer and while a link has keyboard focus, so a title can be read and clicked */
.ticker:hover .ticker-run,
.ticker:focus-within .ticker-run {
  animation-play-state: paused;
}

.ticker-run ul {
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ticker-run li {
  display: flex;
  align-items: center;
}

.ticker-run li::after {
  content: "•";
  padding: 0 20px;
  color: var(--color-green-bright);
}

.ticker-run a {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 4px;
  color: var(--color-light);
  font-size: 0.9rem;
  white-space: nowrap;
  text-decoration: none;
}

.ticker-run a:hover,
.ticker-run a:focus-visible {
  color: var(--color-green-bright);
}

.ticker-date {
  color: var(--color-gray);
  font-size: 0.8rem;
}

.ticker-title {
  font-weight: 700;
}

@keyframes ticker-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

/* no motion: the titles stay put and scroll sideways by hand */
@media (prefers-reduced-motion: reduce) {
  .ticker-window {
    overflow-x: auto;
  }

  .ticker-run {
    animation: none;
  }

  .ticker-run ul[aria-hidden] {
    display: none;
  }
}
</style>
