<template>
  <aside v-if="area" class="feeds-prompt" role="dialog" :aria-label="$t('feeds.title')">
    <img class="feeds-prompt__icon" :src="icon" alt="" width="32" height="32" />
    <div class="feeds-prompt__text">
      <p class="feeds-prompt__title">{{ $t("feeds.title") }}</p>
      <p>
        {{ $t("feeds.offer", { network: networkName, place: area.name, count: area.stations }) }}
      </p>
      <div class="feeds-prompt__actions">
        <button type="button" class="button button-green" @click="$emit('accept')">
          {{ $t("feeds.show") }}
        </button>
        <button type="button" class="button" @click="$emit('decline')">
          {{ $t("feeds.hide") }}
        </button>
      </div>
    </div>
    <button
      type="button"
      class="feeds-prompt__close"
      :aria-label="$t('feeds.later')"
      @click="$emit('later')"
    >
      ×
    </button>
  </aside>
</template>

<script setup>
import { settings } from "@config";

import { computed } from "vue";

const props = defineProps({ area: { type: Object, default: null } });
defineEmits(["accept", "decline", "later"]);

const icon = settings.FEEDS?.icon || settings.GOV_STATIONS?.icon;

/** "IRCEL-CELINE, Belgium" over Belgium reads "IRCEL-CELINE": the place is already named. */
const networkName = computed(() => {
  const net = props.area?.feed?.network || "";
  const place = props.area?.name || "";
  return place && net.endsWith(`, ${place}`) ? net.slice(0, -place.length - 2) : net;
});
</script>

<style scoped>
.feeds-prompt {
  position: fixed;
  left: 50%;
  bottom: calc(var(--app-footer-height, 70px) + 16px);
  transform: translateX(-50%);
  z-index: 1200;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  width: min(440px, calc(100vw - 32px));
  padding: 14px 40px 14px 14px;
  border-radius: 12px;
  background: var(--color-light, #fff);
  color: var(--color-dark, #111);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.25);
  font-size: 0.9rem;
  line-height: 1.35;
}
.feeds-prompt__icon {
  flex: 0 0 auto;
  border-radius: 50%;
}
.feeds-prompt__title {
  font-weight: 700;
  margin: 0 0 4px;
}
.feeds-prompt p {
  margin: 0;
}
.feeds-prompt__actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.feeds-prompt__close {
  position: absolute;
  top: 6px;
  right: 8px;
  border: 0;
  background: none;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
}
</style>
