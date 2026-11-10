<template>
  <div class="buy-block">
    <p class="buy-block__price">
      {{ product.price }}
      <span>{{ $t("landing.priceNote") }}</span>
    </p>
    <!-- data-shop marks the link that carries the ad click id; the prerendered page rewrites it -->
    <a class="buy-block__shop" :href="shopHref" data-shop target="_blank" rel="noopener">
      {{ $t("Buy on Cyberpunks.shop") }}
    </a>
    <p class="buy-block__alt">
      <span>{{ $t("buy.alsoOn") }}</span>
      <a :href="product.amazonUs" target="_blank" rel="noopener" :title="$t('buy.amazonUs')"
        >Amazon US</a
      >
      <a :href="product.amazonDe" target="_blank" rel="noopener" :title="$t('buy.amazonDe')"
        >Amazon EU</a
      >
    </p>
    <p class="buy-block__trust">{{ $t("landing.trust") }}</p>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { withClickIds } from "@/utils/clickIds";

const props = defineProps({
  product: { type: Object, required: true },
  search: { type: String, default: "" },
});

const shopHref = computed(() => withClickIds(props.product.shop, props.search));
</script>

<style scoped>
.buy-block__price {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.2rem 0.6rem;
  margin: 0 0 0.8rem;
  font-size: 1.8rem;
  font-weight: 900;
  line-height: 1.1;
}

.buy-block__price span {
  font-size: 0.85rem;
  font-weight: 400;
  color: #55555c;
}

.buy-block__shop {
  display: block;
  padding: 0.85rem 1rem;
  border-radius: 999px;
  background: var(--color-green-bright);
  color: var(--color-dark);
  font-size: 1.1rem;
  font-weight: 800;
  text-align: center;
  text-decoration: none;
}

.buy-block__shop:hover,
.buy-block__shop:focus-visible {
  text-decoration: none;
  filter: brightness(0.95);
}

.buy-block__alt {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.2rem 0.4rem;
  margin: 0.4rem 0 0;
  font-size: 0.95rem;
}

.buy-block__alt span {
  color: #55555c;
}

.buy-block__alt a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 0.4rem;
  font-weight: 700;
  color: var(--color-link);
}

.buy-block__trust {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  text-align: center;
  color: #55555c;
}
</style>
