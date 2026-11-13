<template>
  <MetaInfo
    :pageTitle="$t('seo.blogTitle')"
    :pageDescription="
      $t(
        'Curious about your environmental insights? So are we.Measure it, test it, and have fun discovering what’s floating around you.'
      )
    "
    pageImage="/og-blog.webp"
  />
  <PageTextLayout>
    <div class="blog-list">
      <div class="pagetext-header">
        <div class="pagetext-eyebrow">sensors.social</div>
        <h1 class="pagetext-title">{{ $t("Blog") }}</h1>
        <p class="pagetext-subtitle">
          {{
            $t(
              "Curious about your environmental insights? So are we. Measure it, test it, and have fun discovering what’s floating around you."
            )
          }}
        </p>
      </div>
      <div class="blog-list__grid" :class="posts.length < 3 ? 'blog-list__grid--small' : ''">
        <router-link
          v-for="post in posts"
          :key="post.slug"
          :to="`/blog/${post.slug}/`"
          class="blog-list__card ui-surface"
        >
          <img :src="post.cover_image" />

          <div class="blog-list__card-content">
            <h2>{{ post.title }}</h2>
            <p>{{ post.description }}</p>
            <div class="blog-list__meta-row">
              <small class="blog-list__date">{{ formatDate(post.date, currentLocale) }}</small>
              <ul v-if="post.tags?.length" class="blog-tags blog-tags--list">
                <li v-for="tag in post.tags" :key="tag" class="blog-tag">{{ tag }}</li>
              </ul>
            </div>
          </div>
        </router-link>
      </div>
    </div>
  </PageTextLayout>
</template>

<script setup>
import MetaInfo from "../components/MetaInfo.vue";
import PageTextLayout from "../components/layouts/PageText.vue";
import { formatDate } from "@/utils/formatDate";
import { useBlogPosts } from "@/composables/useBlogPosts";

const { posts, currentLocale } = useBlogPosts();
</script>

<style scoped>
.blog-list {
  padding-bottom: calc(var(--gap) * 1.5);
}

.blog-list .pagetext-header {
  max-width: 52ch;
}

.blog-list__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(470px, 1fr));
  gap: calc(var(--gap) * 1.5);
}

.blog-list__grid--small {
  grid-template-columns: minmax(470px, 1200px);
  justify-content: center;
}

.blog-list__card {
  display: grid;
  grid-template-rows: 250px 1fr;
  overflow: hidden;
  position: relative;

  text-decoration: none;
  color: inherit;
}

.blog-list__card::before {
  content: "";
  position: absolute;
  inset: -2px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 180ms ease;
  background: linear-gradient(
    120deg,
    color-mix(in srgb, var(--color-teal), transparent 20%),
    color-mix(in srgb, var(--color-blue), transparent 35%),
    transparent 70%
  );
}

.blog-list__card::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--color-teal), transparent 5%),
    color-mix(in srgb, var(--color-blue), transparent 25%)
  );
  opacity: 0;
  transition: opacity 180ms ease;
  pointer-events: none;
}

.blog-list__card:hover,
.blog-list__card:focus-visible {
  outline: none;
  color: inherit;
}

.blog-list__card:hover::before,
.blog-list__card:focus-visible::before {
  opacity: 0.12;
}

.blog-list__card:hover::after,
.blog-list__card:focus-visible::after {
  opacity: 1;
}

.blog-list__card img {
  width: 100%;
  height: 250px;
  object-fit: cover;
  display: block;
  background: var(--surface-bg-soft);
  transition: filter 220ms ease;
}

.blog-list__card:hover img,
.blog-list__card:focus-visible img {
  filter: none;
}

.blog-list__card-content {
  padding: calc(var(--gap) * 1);
  display: grid;
  gap: calc(var(--gap) * 0.6);
}

.blog-list__card h2 {
  margin: 0;
  font-size: calc(var(--font-size) * 1.18);
  line-height: 1.25;
  overflow-wrap: anywhere;
  hyphens: auto;
}

.blog-list__card p {
  margin: 0;
  color: color-mix(in srgb, var(--app-textcolor), transparent 28%);
  font-size: calc(var(--font-size) * 0.98);
  line-height: 1.45;
}

.blog-list__card small {
  color: color-mix(in srgb, var(--app-textcolor), transparent 52%);
  font-size: calc(var(--font-size) * 0.9);
}

.blog-list__meta-row {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: calc(var(--gap) * 0.5);
}

.blog-list__date {
  white-space: nowrap;
  margin: 0;
}

:deep(.blog-tags--list) {
  margin-left: auto;
  justify-content: flex-end;
}

@media (prefers-reduced-motion: reduce) {
  .blog-list__card img {
    transition: none;
  }

  .blog-list__card:hover img,
  .blog-list__card:focus-visible img {
    filter: none;
  }
}

@media screen and (max-width: 520px) {
  .blog-list__grid {
    grid-template-columns: 1fr;
    gap: calc(var(--gap) * 1.1);
  }

  .blog-list__card {
    grid-template-rows: 190px 1fr;
  }

  .blog-list__card img {
    height: 190px;
  }

  .blog-list__card-content {
    padding: calc(var(--gap) * 0.85);
    gap: calc(var(--gap) * 0.5);
  }

  .blog-list__card h2 {
    font-size: calc(var(--font-size) * 1.08);
  }

  .blog-list__card p {
    font-size: calc(var(--font-size) * 0.95);
  }

  .blog-list__meta-row {
    flex-wrap: wrap;
    justify-content: flex-start;
    row-gap: calc(var(--gap) * 0.35);
    column-gap: calc(var(--gap) * 0.6);
  }

  .blog-list__date {
    order: 2;
    white-space: normal;
  }

  :deep(.blog-tags--list) {
    order: 1;
    margin-left: 0;
    justify-content: flex-start;
  }
}
</style>
