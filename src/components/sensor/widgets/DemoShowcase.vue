<template>
  <!-- Compact strip under a chart slide: current unit, or temp + humidity for climate. -->
  <article
    v-if="showNow && nowItem"
    class="demo-now"
    :class="{ 'demo-now--pair': nowParts.length > 1 }"
    :style="{ '--zone-color': nowItem.color }"
  >
    <span class="demo-now__icon" aria-hidden="true">
      <font-awesome-icon :icon="nowItem.icon || 'fa-solid fa-chart-simple'" />
    </span>
    <div
      v-for="part in nowParts"
      :key="`now-part-${part.key}`"
      class="demo-now__item"
      :style="{ '--zone-color': part.color }"
    >
      <span class="demo-now__key">{{ part.name }}</span>
      <span class="demo-now__reading">
        <span class="demo-now__zone">{{ part.zoneLabel }}</span>
        <span class="demo-now__value">{{ part.displayValue }}</span>
        <span v-if="part.unit" class="demo-now__unit">{{ part.unit }}</span>
      </span>
      <span v-if="part.hint" class="demo-now__hint">{{ part.hint }}</span>
    </div>
  </article>

  <!-- First carousel screen: large metric cards. PM2.5 + PM10 share one Air quality card. -->
  <section v-else-if="showMetrics && demoItems.length" class="demo-board">
    <div class="demo-metrics" :class="{ 'demo-metrics--wide': isWide }">
      <!-- `--zone-color` is the measurement zone token, e.g. var(--measure-green). -->
      <article
        v-for="item in demoItems"
        :key="item.key"
        class="demo-metric"
        :class="{
          'demo-metric--pair': isPair(item),
          'demo-metric--pair-inline': isPairInline(item),
          'demo-metric--fill': isFill(item),
          'is-active': !isPair(item) && isActive(item.key),
        }"
        :style="{ '--zone-color': item.color }"
      >
        <header class="demo-metric__head">
          <span class="demo-metric__icon" aria-hidden="true">
            <font-awesome-icon :icon="item.icon || 'fa-solid fa-chart-simple'" />
          </span>
          <span class="demo-metric__title">
            <span class="demo-metric__name">{{ item.name }}</span>
            <span v-if="isAirItem(item)" class="demo-metric__pm-keys">
              ({{ airPartLabels(item) }})
            </span>
          </span>
          <span
            v-if="isAirItem(item)"
            class="demo-metric__aqi"
            :class="{ 'is-empty': !aqiPart }"
            :style="aqiPart ? { '--zone-color': aqiPart.color } : null"
            :title="
              aqiPart
                ? [aqiPart.name, aqiPart.displayValue, aqiPart.zoneLabel].filter(Boolean).join(' ')
                : ''
            "
          >
            <span class="demo-metric__aqi-name">{{ aqiPart?.name || "AQI" }}</span>
            <span class="demo-metric__aqi-value">{{ aqiPart?.displayValue || "—" }}</span>
          </span>
        </header>

        <div class="demo-metric__body" :class="{ 'demo-metric__body--pair': isPair(item) }">
          <button
            v-for="part in metricParts(item)"
            :key="part.key"
            type="button"
            class="demo-metric__hit"
            :class="{
              'demo-metric__half': isPair(item),
              'is-active': isActive(part.key),
            }"
            :style="{ '--zone-color': part.color }"
            :aria-label="metricAriaLabel(item, part)"
            :aria-pressed="isActive(part.key) ? 'true' : 'false'"
            @click="selectMetric(part.key)"
          >
            <span class="demo-metric__value">{{ part.displayValue }}</span>
            <span v-if="part.unit" class="demo-metric__unit-stack">{{ part.unit }}</span>
            <span v-if="part.zoneLabel" class="demo-metric__zone">{{ part.zoneLabel }}</span>
            <span v-if="!isPair(item)" class="demo-metric__track" aria-hidden="true">
              <span class="demo-metric__fill" :style="{ width: `${part.progress ?? 0}%` }"></span>
            </span>
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
/**
 * Demo preview UI.
 * `metrics` — first carousel screen (cards). `now` — strip under a chart slide.
 *
 * Value colors come from `item.color` / `part.color` (zone token from
 * useDemoReadings). Applied as `--zone-color` so numbers, chips, icons and
 * the progress fill share the same `--measure-*` variables as the map.
 */
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useMap } from "@/composables/useMap";
import {
  isDemoPair as isPair,
  demoItemKeys as itemKeys,
  asDemoPart,
} from "@/composables/useDemoReadings";
import { MEASUREMENT_GROUP_LOOKUP } from "@/measurements/groups";
import { aqiFromConc as aqiFromConcUS } from "@/utils/calculations/aqi/us";
import { aqiFromConc as aqiFromConcEU } from "@/utils/calculations/aqi/eu";
import aqiUSZones from "@/measurements/aqi_us";
import aqiEUZones from "@/measurements/aqi_eu";
import aqiMeta from "@/measurements/aqi";

const props = defineProps({
  items: { type: Array, default: () => [] },
  part: {
    type: String,
    default: "metrics",
  },
});

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const mapState = useMap();
const demoItems = computed(() => (Array.isArray(props.items) ? props.items : []));

const showMetrics = computed(() => props.part === "metrics");
const showNow = computed(() => props.part === "now");

function metricParts(item) {
  return isPair(item) ? item.parts : [item];
}

function metricAriaLabel(item, part) {
  if (isPair(item)) {
    return `${item.name}, ${part.name}: ${part.displayValue} ${part.unit}, ${part.zoneLabel}`;
  }
  return `${item.name}: ${part.displayValue} ${part.unit}, ${part.zoneLabel}`;
}

function isClimateItem(item) {
  if (!item || isPair(item)) return false;
  const key = item.key;
  return key === "airtemp" || MEASUREMENT_GROUP_LOOKUP[key] === "climate";
}

/** Match the strip to the chart unit; climate charts show temp + humidity together. */
const nowItem = computed(() => {
  const list = demoItems.value;
  if (!list.length) return null;
  const unit = String(mapState.currentUnit.value || "").toLowerCase();
  const unitGroup = MEASUREMENT_GROUP_LOOKUP[unit] || unit;

  if (unitGroup === "climate" || unit === "airtemp") {
    const climateItems = list.filter(isClimateItem);
    if (climateItems.length > 1) {
      const worst = climateItems.reduce((a, b) =>
        (b.zoneIndex ?? 0) > (a.zoneIndex ?? 0) ? b : a
      );
      return {
        key: "climate",
        name: t("Climate"),
        icon: climateItems[0].icon,
        color: worst.color,
        parts: climateItems.map(asDemoPart),
      };
    }
  }

  const exact = list.find((item) => itemKeys(item).includes(unit));
  if (exact) return exact;
  return (
    list.find((item) =>
      itemKeys(item).some((key) => (MEASUREMENT_GROUP_LOOKUP[key] || key) === unitGroup)
    ) || list[0]
  );
});

const nowParts = computed(() => {
  const item = nowItem.value;
  if (!item) return [];
  if (isPair(item)) return item.parts;
  return [asDemoPart(item)];
});

const pairIndex = computed(() => demoItems.value.findIndex(isPair));

// 3-col grid when the air card is 4th or later (outdoor: temp, humidity, noise, then pressure + air).
const isWide = computed(() => pairIndex.value >= 3);

/** Odd leftover card before Air quality stretches full width on a 2-col grid. */
function isFill(item) {
  const idx = pairIndex.value;
  if (idx <= 0) return false;
  const before = demoItems.value.slice(0, idx);
  if (before.length % 2 === 0) return false;
  return item.key === before[before.length - 1]?.key;
}

/** On a 3-col grid, Air quality sits beside the last single card (span 2). */
function isPairInline(item) {
  if (!isPair(item) || !isWide.value) return false;
  return pairIndex.value % 3 === 1;
}

/** Highlight the card that matches the current map/chart unit (or its group). */
function isActive(key) {
  const unit = String(mapState.currentUnit.value || "").toLowerCase();
  if (unit === key) return true;
  const group = MEASUREMENT_GROUP_LOOKUP[key];
  const unitGroup = MEASUREMENT_GROUP_LOOKUP[unit];
  return Boolean(group && unitGroup && group === unitGroup);
}

function selectMetric(key) {
  mapState.setMapSettings(route, router, { type: key });
}

const localeCode = computed(() => localStorage.getItem("locale") || locale.value || "en");

/** Header chip on the Air quality card from the current PM reading (not a full-day recalc). */
const aqiPart = computed(() => {
  const air = demoItems.value.find(isAirItem);
  const parts = air?.parts || [];
  const version = mapState.aqiVersion.value === "eu" ? "eu" : "us";
  const fromConc = version === "eu" ? aqiFromConcEU : aqiFromConcUS;
  let best = null;
  for (const part of parts) {
    const pollutant = part.key === "pm10" ? "pm10" : part.key === "pm25" ? "pm25" : null;
    if (!pollutant) continue;
    const n = Number(part.value);
    if (!Number.isFinite(n)) continue;
    const idx = fromConc(n, pollutant);
    if (typeof idx !== "number") continue;
    if (best == null || idx > best) best = idx;
  }
  if (best == null) return null;
  const value = best;
  const zones = version === "eu" ? aqiEUZones : aqiUSZones;
  const zone =
    zones.find((row) => typeof row.valueMax === "number" && value <= row.valueMax) ||
    zones[zones.length - 1] ||
    null;
  const loc = localeCode.value;
  return {
    key: "aqi",
    name: aqiMeta.nameshort?.[loc] || aqiMeta.label || "AQI",
    // EEA levels are named, not numbered
    displayValue:
      version === "eu" ? zone?.label?.[loc] || zone?.label?.en || "" : String(Math.round(value)),
    unit: "",
    zoneLabel: zone?.label?.[loc] || zone?.label?.en || "",
    color: zone?.color || "var(--measure-nodata)",
  };
});

function isAirItem(item) {
  return itemKeys(item).some((key) => key === "pm25" || key === "pm10");
}

function airPartLabels(item) {
  return (item.parts || [])
    .map((part) => part.name)
    .filter(Boolean)
    .join(" | ");
}
</script>

<style scoped>
/* Chrome tokens: --color-* / --surface-* from assets/styles/variables.css.
   Reading tint is --zone-color, set in the template from the measurement zone. */
.demo-board,
.demo-now {
  --demo-paper: var(--color-light);
  --demo-ink: var(--color-dark);
  --demo-divider: var(--surface-border-soft);
  --demo-muted: 0.42;
  --demo-shadow: 0 10px 28px color-mix(in srgb, var(--demo-ink) 8%, transparent);
  --demo-shadow-hover: 0 12px 32px color-mix(in srgb, var(--demo-ink) 12%, transparent);
  --demo-value: clamp(2.9rem, 40cqw, 4.85rem);
  --demo-value-pair: clamp(3.5rem, 38cqw, 5.8rem);
  --demo-value-inline: clamp(2.9rem, 38cqw, 4.85rem);
  --demo-card-min: 12.5rem;
  --demo-card-min-pair: 13rem;
  --demo-grid-gap: 0.8rem;
  --demo-ease: color 0.7s ease, background-color 0.7s ease, border-color 0.7s ease,
    box-shadow 0.45s ease;
}

.demo-board {
  container: demo-board / inline-size;
  margin: 0 0 var(--gap);
}

.demo-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
  gap: var(--demo-grid-gap);
}

.demo-metrics--wide {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.demo-metric {
  display: flex;
  flex-direction: column;
  height: auto;
  min-height: var(--demo-card-min);
  min-width: 0;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  background: var(--demo-paper);
  box-shadow: var(--demo-shadow);
  transition: box-shadow 0.45s ease;
}

.demo-metric--pair {
  --demo-value: var(--demo-value-pair);
  grid-column: 1 / -1;
  min-width: 0;
  min-height: var(--demo-card-min-pair);
}

.demo-metric--pair-inline {
  --demo-value: var(--demo-value-inline);
}

.demo-metric--fill {
  grid-column: 1 / -1;
}

.demo-metrics--wide .demo-metric--fill {
  grid-column: auto;
}

.demo-metrics--wide .demo-metric--pair-inline {
  grid-column: span 2;
}

.demo-metric__unit-stack {
  display: flex;
  align-items: baseline;
  justify-content: center;
  font-size: 0.92rem;
  font-weight: 600;
  opacity: var(--demo-muted);
}

@container demo-board (max-width: 475px) {
  .demo-metrics--wide {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media screen and (width < 475px) {
  .demo-metric {
    --demo-card-min: 10.5rem;
    --demo-card-min-pair: 11.5rem;
  }
}

.demo-metric:hover {
  box-shadow: var(--demo-shadow-hover);
}

.demo-metric.is-active,
.demo-metric:has(.is-active) {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--zone-color) 55%, transparent);
}

.demo-metric__head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;
  min-width: 0;
  padding: 0.95rem 1.05rem 0.2rem;
}

.demo-metric__title {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 0.4rem;
  row-gap: 0.05rem;
  min-width: 0;
  flex: 1;
}

.demo-metric__name,
.demo-metric__pm-keys {
  font-weight: 600;
  line-height: 1.2;
  opacity: var(--demo-muted);
}

.demo-metric__name {
  min-width: 0;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.demo-metric__pm-keys {
  flex: 0 1 auto;
  font-size: 0.68rem;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.demo-metric__icon,
.demo-now__icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 50%;
  background: color-mix(in srgb, var(--zone-color) 16%, var(--demo-paper));
  color: var(--zone-color);
  transition: var(--demo-ease);
}

.demo-metric__icon {
  width: 1.7rem;
  height: 1.7rem;
  font-size: 0.74rem;
}

.demo-metric__aqi {
  display: inline-flex;
  align-items: baseline;
  gap: 0.28rem;
  flex: 0 0 auto;
  margin-left: auto;
  padding: 0.12rem 0.42rem;
  border: 1px solid color-mix(in srgb, var(--zone-color) 38%, transparent);
  border-radius: 0;
  background: color-mix(in srgb, var(--zone-color) 12%, var(--demo-paper));
  transition: var(--demo-ease);
}

.demo-metric__aqi.is-empty {
  opacity: 0.35;
}

.demo-metric__aqi-name {
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--demo-ink);
  opacity: var(--demo-muted);
}

.demo-metric__aqi-value {
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--demo-ink);
  opacity: var(--demo-muted);
}

.demo-metric__hit {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.28rem;
  width: 100%;
  min-width: 0;
  margin: 0;
  padding: 0.7rem 1rem 0.85rem;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: center;
  cursor: pointer;
}

.demo-metric__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.demo-metric__body:not(.demo-metric__body--pair) .demo-metric__hit {
  flex: 1;
}

.demo-metric__body--pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.demo-metric__half + .demo-metric__half {
  border-left: 1px solid var(--demo-divider);
}

.demo-metric--pair .demo-metric__half {
  justify-content: center;
  padding: 0.55rem 1rem 0.95rem;
}

.demo-metric__zone {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  margin-top: 0.35rem;
  padding: 0.22rem 0.72rem;
  border: 0;
  border-radius: 0;
  background: color-mix(in srgb, var(--zone-color) 14%, var(--demo-paper));
  color: color-mix(in srgb, var(--zone-color) 72%, var(--demo-ink));
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.2;
  min-width: 7.5ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: var(--demo-ease);
}

.demo-metric__value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  max-width: 100%;
  font-size: var(--demo-value);
  font-weight: 600;
  line-height: 0.92;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--zone-color);
  transition: color 0.7s ease;
}

@container demo-board (max-width: 700px) {
  .demo-metrics {
    --demo-value: clamp(2.7rem, 44cqw, 4.55rem);
    --demo-value-pair: clamp(3.2rem, 36cqw, 5.2rem);
    --demo-value-inline: clamp(2.7rem, 44cqw, 4.55rem);
  }
}

.demo-metric__track {
  align-self: stretch;
  display: block;
  width: 100%;
  height: 6px;
  margin-top: calc(var(--gap) * 0.7);
  overflow: hidden;
  border-radius: 0;
  background: var(--demo-divider);
}

.demo-metric__fill {
  display: block;
  height: 100%;
  min-width: 0.4rem;
  border-radius: 0;
  background: var(--zone-color);
  transition: width 0.8s ease, background-color 0.7s ease;
}

.demo-now {
  container: demo-now / inline-size;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  column-gap: var(--gap);
  row-gap: 0.2rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  flex: 0 0 auto;
  margin-top: 0;
  padding: 1.1rem 1.2rem;
  border: 1px solid var(--demo-divider);
  background: var(--demo-paper);
}

.demo-now--pair {
  grid-template-columns: auto minmax(0, 1fr) minmax(0, 1fr);
}

.demo-now__icon {
  width: 2.35rem;
  height: 2.35rem;
  font-size: 1rem;
}

.demo-now__item {
  display: grid;
  grid-template-rows: auto auto auto;
  gap: 0.08rem;
  min-width: 0;
}

.demo-now--pair .demo-now__item + .demo-now__item {
  padding-left: 0.9rem;
  border-left: 1px solid var(--demo-divider);
}

.demo-now__key {
  font-size: 1rem;
  font-weight: 500;
  opacity: 0.48;
}

.demo-now__reading {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.3rem 0.7rem;
  min-width: 0;
}

.demo-now__zone {
  min-width: 0;
  flex: 1 1 auto;
  font-size: clamp(1.7rem, 6.5cqw, 2.6rem);
  font-weight: 700;
  line-height: 1.1;
  color: color-mix(in srgb, var(--zone-color) 68%, var(--demo-ink));
  transition: color 0.7s ease;
}

.demo-now__value {
  flex: 0 0 auto;
  font-size: clamp(2.15rem, 8cqw, 3.35rem);
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--zone-color);
  transition: color 0.7s ease;
}

.demo-now__unit {
  flex: 0 0 auto;
  font-size: clamp(1.05rem, 2.8cqw, 1.4rem);
  font-weight: 600;
  opacity: 0.5;
  color: var(--zone-color);
  transition: color 0.7s ease;
}

.demo-now__hint {
  font-size: 1.05rem;
  font-weight: 500;
  line-height: 1.3;
  opacity: 0.45;
}

@media screen and (max-width: 700px) {
  .demo-now--pair {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: start;
  }

  .demo-now--pair .demo-now__icon {
    grid-row: 1 / span 2;
  }

  .demo-now--pair .demo-now__item {
    grid-column: 2;
  }

  .demo-now--pair .demo-now__item + .demo-now__item {
    padding-left: 0;
    padding-top: 0.55rem;
    margin-top: 0.45rem;
    border-left: 0;
    border-top: 1px solid var(--demo-divider);
  }
}

@media screen and (max-width: 479px) {
  .demo-now {
    padding: 0.9rem;
    margin-top: 0;
  }

  .demo-now__icon {
    width: 2.1rem;
    height: 2.1rem;
    font-size: 0.9rem;
  }

  .demo-now__hint {
    font-size: 0.95rem;
  }
}
</style>
