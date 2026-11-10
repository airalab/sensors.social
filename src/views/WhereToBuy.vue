<template>
  <MetaInfo
    :pageTitle="$t('Where to buy air monitor Altruist')"
    :pageDescription="$t('Official and pinout purchase options for Altruist devices by region.')"
    pageImage="/og-default.webp"
  />
  <PageTextLayout>
    <div class="pagetext-header">
      <h1 class="pagetext-title">{{ $t("Where to buy air monitor Altruist") }}</h1>
      <p class="pagetext-subtitle">{{ $t("buy.subtitle") }}</p>
    </div>

    <div class="buy">
      <a class="local" :href="pinout.href" target="_blank" rel="noopener">
        <img class="local__logo" :src="pinout.image" alt="Pinout" />
        <span class="local__text">
          <strong>{{ $t("buy.cyprus.title") }}</strong>
          <span>{{ $t("buy.cyprus.text") }}</span>
        </span>
        <span class="local__cta">{{ $t("buy.cyprus.cta") }} →</span>
      </a>

      <section class="catalog">
        <article
          v-for="product in products"
          :key="product.id"
          class="product"
          :class="{ 'product--featured': product.featured }"
        >
          <span v-if="product.featured" class="product__badge">{{ $t("buy.badge") }}</span>
          <router-link :to="product.page" class="product__media" tabindex="-1" aria-hidden="true">
            <img :src="product.image" :alt="product.title" loading="lazy" />
          </router-link>
          <div class="product__body">
            <p class="product__kind">{{ product.kind }}</p>
            <h2 class="product__title">
              <router-link :to="product.page">{{ product.title }}</router-link>
            </h2>
            <p class="product__text">{{ product.text }}</p>
            <div class="product__actions">
              <a class="product__buy" :href="product.shop" target="_blank" rel="noopener">
                {{ $t("Buy on Cyberpunks.shop") }}
              </a>
              <div class="product__alt">
                <span>{{ $t("buy.alsoOn") }}</span>
                <a
                  v-for="link in product.amazon"
                  :key="link.href"
                  :href="link.href"
                  target="_blank"
                  rel="noopener"
                  :title="link.hint"
                >
                  {{ link.label }}
                </a>
              </div>
            </div>
          </div>
        </article>
      </section>

      <p class="extras">
        {{ $t("buy.extras") }}
        <a href="https://cyberpunks.shop/" target="_blank" rel="noopener">Cyberpunks.shop →</a>
      </p>
    </div>
  </PageTextLayout>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import MetaInfo from "../components/MetaInfo.vue";
import PageTextLayout from "../components/layouts/PageText.vue";

import dualImage from "@/assets/images/altruist-device/altruist-dual.webp";
import urbanImage from "@/assets/images/altruist-device/altruist-urban.webp";
import insightImage from "@/assets/images/altruist-device/altruist-insight.webp";
import pinoutLogo from "@/assets/images/logos/pinout-logo.png";
import { altruistProducts } from "@config/altruistProducts";

const { t } = useI18n();

const productCatalog = [
  { id: "dual", featured: true, image: dualImage },
  { id: "urban", image: urbanImage },
  { id: "insight", image: insightImage },
].map((item) => ({ ...item, ...altruistProducts[item.id] }));

const products = computed(() =>
  productCatalog.map((item) => ({
    id: item.id,
    featured: item.featured,
    title: t(item.title),
    page: `/altruist/${item.id}/`,
    kind: t(`buy.${item.id}.kind`),
    text: t(`buy.${item.id}.text`),
    image: item.image,
    shop: item.shop,
    amazon: [
      { href: item.amazonUs, label: "Amazon US", hint: t("buy.amazonUs") },
      { href: item.amazonDe, label: "Amazon EU", hint: t("buy.amazonDe") },
    ],
  }))
);

const pinout = {
  href: "https://pinout.cloud/",
  image: pinoutLogo,
};
</script>

<style scoped>
.container-pagetext > .buy {
  max-width: 1100px;
}

.local {
  display: flex;
  align-items: center;
  gap: calc(var(--gap) * 1.2);
  margin: calc(var(--gap) * 0.5) 0 calc(var(--gap) * 1.5);
  padding: 0.9rem 1.2rem;
  border-radius: 12px;
  background: var(--color-light-gray-shop);
  color: var(--color-dark);
  text-decoration: none;
}

.local:hover,
.local:focus-visible {
  text-decoration: none;
  outline: 2px solid var(--color-link);
}

.local__logo {
  width: 120px;
  flex-shrink: 0;
  border: none;
  margin: 0;
}

.local__text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  line-height: 1.35;
}

.local__cta {
  margin-left: auto;
  white-space: nowrap;
  font-weight: 700;
  color: var(--color-link);
}

.catalog {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: calc(var(--gap) * 1.2);
  margin-bottom: calc(var(--gap) * 1.2) !important;
}

.product {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 2px solid var(--color-middle-gray);
  border-radius: 12px;
  overflow: hidden;
  background: var(--color-light);
}

.product--featured {
  border-color: var(--color-dark);
}

.product__badge {
  position: absolute;
  top: 0.7rem;
  left: 0.7rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: var(--color-green-bright);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-dark);
}

.product__media {
  display: grid;
  place-items: center;
  height: 240px;
  padding: 0;
  overflow: hidden;
  background: var(--color-light-gray-shop);
}

.product__media img {
  width: 100%;
  height: 100%;
  min-height: 0;
  transform: scale(1.35);
  object-fit: contain;
  border: none;
  margin: 0;
}

.product__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 1rem 1.1rem 1.1rem;
}

.product__kind {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #6b6b72;
}

.product__title {
  margin: 0.15rem 0 0.4rem;
  font-size: calc(var(--font-size) * 1.35);
  font-weight: 900;
  color: var(--color-dark);
}

.product__title a {
  color: inherit;
  text-decoration: none;
}

.product__title a:hover,
.product__title a:focus-visible {
  text-decoration: underline;
}

.product__text {
  margin: 0 0 1rem;
  font-size: 0.95rem;
  line-height: 1.45;
}

.product__actions {
  margin-top: auto;
}

.product__buy {
  display: block;
  padding: 0.7rem 1rem;
  border-radius: 999px;
  background: var(--color-green-bright);
  color: var(--color-dark);
  font-weight: 700;
  text-align: center;
  text-decoration: none;
}

.product__buy:hover,
.product__buy:focus-visible {
  text-decoration: none;
  filter: brightness(0.95);
}

.product__alt {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.35rem 0.8rem;
  margin-top: 0.6rem;
  font-size: 0.9rem;
}

.product__alt span {
  color: #6b6b72;
}

.product__alt a {
  font-weight: 700;
  color: var(--color-link);
}

.extras {
  margin: 0;
  font-size: 1rem;
  text-align: center;
}

.extras a {
  font-weight: 700;
}

@media (max-width: 900px) {
  .catalog {
    grid-template-columns: 1fr;
  }

  .local {
    flex-wrap: wrap;
  }

  .local__cta {
    margin-left: 0;
  }
}
</style>
