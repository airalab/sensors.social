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
    <!-- the same quiet block as on the cyberpunks.shop product cards (airalab/cyberpunks.shop#59) -->
    <section class="buy-block__ai">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ff33a8"
        stroke-width="2"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
        <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
      </svg>
      <div>
        <b>{{ $t("landing.askAiTitle") }}</b>
        <span>{{ $t("landing.askAiText", { name: product.title }) }}</span>
        <router-link :to="`/ai/?product=${product.id}`"
          >{{ $t("landing.askAiLink") }} →</router-link
        >
      </div>
    </section>
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

.buy-block__ai {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  margin: 0.2rem 0 0.6rem;
  padding: 0.25rem 0.4rem;
  font-size: 0.95rem;
  line-height: 1.45;
  text-align: left;
}

.buy-block__ai svg {
  flex-shrink: 0;
  margin-top: 0.15rem;
}

.buy-block__ai div {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.buy-block__ai a {
  align-self: flex-start;
  padding: 0.2rem 0;
  font-weight: 700;
  color: var(--color-dark);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.buy-block__trust {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  text-align: center;
  color: #55555c;
}
</style>
