<template>
  <MetaInfo
    :pageTitle="$t('Where to buy air monitor Altruist')"
    :pageDescription="$t('Official and pinout purchase options for Altruist devices by region.')"
    pageImage="/og-default.webp"
  />
  <PageTextLayout>
    <div class="pagetext-header">
      <h1 class="pagetext-title">{{ $t("Where to buy air monitor Altruist") }}</h1>
      <p class="pagetext-subtitle">
        {{
          $t(
            "Two-module environment monitoring kit for indoors and outdoors — for those who care about health. You track your pulse, HRV, sleep phases. To achieve the best recovery results — you need to account for sleep conditions and the environment you live in."
          )
        }}
      </p>
    </div>

    <section class="catalog">
      <article v-for="product in products" :key="product.id" class="product">
        <div class="product__media">
          <img :src="product.image" :alt="product.title" loading="lazy" />
        </div>
        <h2 class="product__title">{{ product.title }}</h2>
        <ul class="product__links">
          <li v-for="link in product.links" :key="`${product.id}-${link.label}`">
            <a :href="link.href" target="_blank" rel="noopener">{{ link.label }}</a>
          </li>
        </ul>
      </article>
    </section>

    <a class="pinout" :href="pinout.href" target="_blank" rel="noopener">
      <span class="pinout__brand">
        <img class="pinout__mark" :src="pinout.image" alt="pinout logo" />
      </span>
      <span class="pinout__link">{{ pinout.label }}</span>
    </a>
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
import accessoriesImage from "@/assets/images/altruist-device/repair-kit-for-urban.webp";
import pinoutLogo from "@/assets/images/logos/pinout-logo.png";

const { t } = useI18n();

const productCatalog = [
  {
    id: "dual",
    titleKey: "Altruist Dual",
    image: dualImage,
    links: {
      cyberpunks: "https://cyberpunks.shop/altruist-dual",
      amazonUs: "https://www.amazon.com/dp/B0GXKZG4D4?th=1",
      amazonDe: "https://www.amazon.de/dp/B0GXKZG4D4?th=1",
    },
  },
  {
    id: "urban",
    titleKey: "Altruist Urban",
    image: urbanImage,
    links: {
      cyberpunks: "https://cyberpunks.shop/altruist-urban",
      amazonUs: "https://www.amazon.com/dp/B0GWR3HDPD?th=1",
      amazonDe: "https://www.amazon.de/dp/B0GXF54G56",
    },
  },
  {
    id: "insight",
    titleKey: "Altruist Insight",
    image: insightImage,
    links: {
      cyberpunks: "https://cyberpunks.shop/altruist-insight",
      amazonUs: "https://www.amazon.com/dp/B0HCCMWJVW?th=1",
      amazonDe: "https://www.amazon.de/dp/B0HCCKJ2YN?th=1",
    },
  },
  {
    id: "accessories",
    titleKey: "Other accessories",
    image: accessoriesImage,
    links: {
      cyberpunks: "https://cyberpunks.shop/",
    },
  },
];

const linkLabels = {
  cyberpunks: () => t("Cyberpunks.shop (Worldwide)"),
  amazonUs: () => t("Amazon USA"),
  amazonDe: () => t("Amazon DE (available for Cyprus)"),
};

const products = computed(() =>
  productCatalog.map((item) => ({
    id: item.id,
    title: t(item.titleKey),
    image: item.image,
    links: Object.entries(item.links).map(([key, href]) => ({
      href,
      label: linkLabels[key]?.() ?? key,
    })),
  }))
);

const pinout = computed(() => ({
  name: "Pinout",
  href: "https://pinout.cloud/",
  image: pinoutLogo,
  label: t("Altruist Air Quality Sensors with Installation & Setup on Cyprus"),
}));
</script>

<style scoped>
.catalog {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: calc(var(--gap) * 3);
  row-gap: calc(var(--gap) * 1.8);
  margin-top: calc(var(--gap) * 0.5);
  margin-bottom: calc(var(--gap) * 1.5) !important;
}

.product__media {
  display: grid;
  place-items: center;
  min-height: 280px;
  padding: calc(var(--gap) * 1.15) calc(var(--gap) * 1.4);
  background: var(--color-light-gray-shop);
  border-radius: 10px;
}

.product__media img {
  max-width: 100%;
  object-fit: contain;
  image-rendering: auto;
  border: none;
  margin: 0;
}

.product__title {
  margin: calc(var(--gap) * 0.85) 0 0;
  font-size: calc(var(--font-size) * 1.5);
  font-weight: 900;
  text-align: center;
  color: var(--color-dark);
}

.product__links {
  list-style: none;
  margin: calc(var(--gap) * 0.35) auto 0;
  padding: 0;
  font-weight: 700;
}

.product__links li:not(:last-child) {
  border-bottom: 3px dashed var(--color-middle-gray);
}

.product__links a {
  display: block;
  padding: 0.55rem 0.4rem;
  text-align: center;
  color: var(--color-link);
  text-decoration: none;
}

.product__links a:hover,
.product__links a:focus-visible {
  color: var(--color-link-hover);
}

.pinout {
  display: flex;
  align-items: center;
  gap: calc(var(--gap) * 1.2);
  margin-top: calc(var(--gap) * 2);
  padding: 0.95rem 1.25rem;
  border: 2px solid var(--color-dark);
  border-radius: 10px;
  background: var(--color-light);
  text-decoration: none;
  color: inherit;
}

.pinout:hover,
.pinout:focus-visible {
  text-decoration: none;
}

.pinout__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.pinout__mark {
  width: 100%;
  max-width: 210px;
  object-fit: contain;
  object-position: left center;
  border: none;
  margin: 0;
  flex-shrink: 0;
}

.pinout__link {
  margin-left: auto;
  font-size: calc(var(--font-size) * 1.3);
  color: var(--color-link);
  font-weight: 600;
}

.pinout:hover .pinout__link,
.pinout:focus-visible .pinout__link {
  color: var(--color-link-hover);
}

@media (max-width: 900px) {
  .catalog {
    grid-template-columns: 1fr;
    column-gap: 0;
  }

  .pinout {
    flex-wrap: wrap;
  }

  .pinout__link {
    flex: 1 1 100%;
    text-align: left;
    margin-left: 0;
    font-size: calc(var(--font-size) * 1);
  }
}
</style>
