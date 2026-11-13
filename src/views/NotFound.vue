<template>
  <MetaInfo :pageTitle="$t('notfound.title')" noindex />
  <PageTextLayout>
    <div class="pagetext-prose">
      <section class="pagetext-header">
        <div class="pagetext-eyebrow">404</div>
        <h1 class="pagetext-title">{{ $t("notfound.title") }}</h1>
        <p class="pagetext-subtitle">{{ $t("notfound.text") }}</p>
      </section>
      <p class="notfound-links">
        <router-link to="/">{{ $t("notfound.map") }}</router-link>
        <router-link to="/blog/">{{ $t("notfound.blog") }}</router-link>
      </p>
    </div>
  </PageTextLayout>
</template>

<script setup>
import MetaInfo from "../components/MetaInfo.vue";
import PageTextLayout from "../components/layouts/PageText.vue";
</script>

<style scoped>
.notfound-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap);
}
</style>
