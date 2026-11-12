<template>
  <div class="analytics-tab" :class="{ 'analytics-tab--demo': isDemo }">
    <div class="panel" :class="{ 'panel--demo': isDemo }">
      <div class="panel-start">
        <SensorPicker
          v-if="isSensorPickerReady"
          :point="point"
          :log="log"
          :variant="isDemo ? 'demo' : 'data'"
        />
        <div v-else class="panel-skeleton panel-skeleton--trigger" aria-hidden="true" />
      </div>

      <Timeline v-if="!isDemo" :log="log" :point="point" />

      <div v-if="isDemo && chartHasData" class="demo-pager" :class="{ 'is-paused': demoPaused }">
        <div
          class="demo-pager__bar"
          role="progressbar"
          :aria-label="t('sensorpopup.demo_progress')"
          :aria-valuemin="0"
          :aria-valuemax="100"
          :aria-valuenow="demoProgressNow"
        >
          <span
            :key="`progress-top-${progressTick}-${demoSlide}`"
            class="demo-pager__fill"
            :style="{ '--demo-ms': `${demoDuration()}ms` }"
          />
        </div>
        <div class="demo-pager__dots" role="tablist" :aria-label="t('sensorpopup.demo_pager')">
          <button
            v-for="(slide, index) in demoSlides"
            :key="`${slide.kind}-${slide.key}`"
            type="button"
            class="demo-pager__dot"
            :class="{
              'is-on': demoSlide === index,
              'is-done': demoSlide > index,
            }"
            :aria-label="demoSlideLabel(slide, index)"
            :aria-selected="demoSlide === index ? 'true' : 'false'"
            @click="goToSlide(index)"
          />
        </div>
      </div>

      <template v-if="!isDemo">
        <div class="panel-end">
          <button
            v-if="ownerKey"
            type="button"
            class="panel-trigger panel-trigger--owner"
            popovertarget="data-owner-popover"
          >
            <div class="panel-list__media panel-list__media--round" aria-hidden="true">
              <img v-if="ownerAvatar" :src="ownerAvatar" alt="" />
            </div>
            <div class="panel-list__text">
              <b class="panel-list__title">{{ t("sensorpopup.infosensorowner") }}</b>
              <span class="panel-list__meta">{{ ownerName(ownerKey) }}</span>
            </div>
            <font-awesome-icon
              icon="fa-solid fa-caret-down"
              class="panel-trigger__caret"
              aria-hidden="true"
            />
          </button>
          <div
            v-else-if="isOwnerLoading && sensorType !== 'diy'"
            class="panel-skeleton panel-skeleton--trigger"
            aria-hidden="true"
          />
          <div v-else-if="sensorType === 'diy'" class="panel-owner-spacer" aria-hidden="true" />
          <div
            v-else
            class="panel-trigger panel-trigger--owner panel-trigger--placeholder"
            aria-hidden="true"
          >
            <div class="panel-list__media panel-list__media--round" />
            <div class="panel-list__text">
              <b class="panel-list__title">{{ t("sensorpopup.infosensorowner") }}</b>
              <span class="panel-list__meta">{{ ownerPlaceholderMeta }}</span>
            </div>
            <font-awesome-icon
              icon="fa-solid fa-caret-down"
              class="panel-trigger__caret"
              aria-hidden="true"
            />
          </div>
        </div>
        <div id="data-owner-popover" class="popover panel-popover panel-popover--end" popover>
          <div class="panel-list__item panel-list__item--static">
            <div class="panel-list__media panel-list__media--round" aria-hidden="true">
              <img v-if="ownerAvatar" :src="ownerAvatar" alt="" />
            </div>
            <div class="panel-list__text">
              <b class="panel-list__title">{{ t("sensorpopup.infosensorowner") }}</b>
              <span class="panel-list__meta">{{ ownerName(ownerKey) }}</span>
            </div>
          </div>
          <p v-if="isOwnerLoggedIn" class="panel-popover__footer">
            {{ t("Share your insights with the community!") }}
          </p>
          <p v-else class="panel-popover__footer">
            {{ t("To add info and stories") }}
            <router-link to="/login/">{{ t("Login") }}</router-link>
          </p>
        </div>
      </template>
    </div>

    <div v-if="isDemo && demoScreen === 'readings'" class="demo-stage">
      <section class="demo-screen demo-screen--readings">
        <DemoShowcase part="metrics" :items="demoItems" />
      </section>
    </div>

    <template v-if="!isDemo || demoScreen === 'charts'">
      <section
        v-if="
          !isDemo &&
          mapState.currentProvider.value !== 'realtime' &&
          mapState.timelineMode.value === 'day' &&
          isPMHealthy
        "
        class="aqi-wrap"
      >
        <AQI :logs="log" />
      </section>

      <section class="chart-wrap">
        <div v-if="showLogsProgress" class="logs-progress">
          <div class="logs-progress-bar">
            <span :style="{ width: `${logsProgressPercent}%` }"></span>
          </div>
          <div class="logs-progress-meta">
            <span>{{ logsProgressLabel }}</span>
            <span>{{ timelineModeLabel }}</span>
          </div>
        </div>

        <div
          v-if="chartHasData"
          class="chart-area"
          :class="{ 'chart-area--locked': showEncryptedLoginNotice }"
        >
          <ChartHealthWarning
            v-if="!isDemo"
            :log="log"
            :sensor-id="point?.sensor_id"
            :legend-key="chartActiveLegendKey"
          />
          <Chart
            :log="log"
            :log-revision="chartLogRevision"
            :geo-addresses="chartGeoAddresses"
            :show-geo-in-tooltip="showChartGeoInTooltip"
            :address-for-timestamp="chartAddressForTimestamp"
            @active-legend-change="chartActiveLegendKey = $event"
          />
          <div
            v-if="showEncryptedLoginNotice"
            class="chart-encrypted-overlay"
            role="status"
            aria-live="polite"
          >
            <div class="chart-encrypted-overlay__card">
              <font-awesome-icon
                icon="fa-solid fa-lock"
                class="chart-encrypted-overlay__icon"
                aria-hidden="true"
              />
              <p class="chart-encrypted-overlay__text">
                {{
                  encryptedNoticeIsLogin
                    ? t("sensorpopup.encrypted_login_notice")
                    : t("sensorpopup.encrypted_decrypt_pending")
                }}
              </p>
              <router-link to="/login/" class="chart-encrypted-overlay__cta">
                {{ t("Login") }}
              </router-link>
            </div>
          </div>
        </div>
        <div v-else-if="showNoDataMessage" class="no-data-message">
          {{ $t("No data available") }}
        </div>
        <div v-else-if="!chartHasData" class="chart-skeleton"></div>
      </section>

      <DemoShowcase v-if="isDemo" part="now" :items="demoItems" />
    </template>

    <label v-if="chartHasData" class="demo-switch" :title="t('sensorpopup.demo_toggle')">
      <input
        v-model="isDemo"
        type="checkbox"
        role="switch"
        :aria-label="t('sensorpopup.demo_toggle')"
      />
      <span class="demo-switch__track" aria-hidden="true"></span>
      <span class="demo-switch__text">{{ t("sensorpopup.demo") }}</span>
    </label>

    <section v-if="!isDemo || demoScreen === 'readings'" class="info-wrap">
      <div v-if="units && scales && scales.length > 0" class="scales-block">
        <p class="scales-title">{{ t("scales.title") }}</p>
        <div class="scalegrid">
          <div v-for="item in scales" :key="item.label">
            <template v-if="item?.zones && (item.name || item.label)">
              <p>
                <b v-if="item.name">
                  {{ item.nameshort[localeComputed] }}
                </b>
                <b v-else>{{ item.label }}</b>
                <template v-if="item.unit && item.unit !== ''"> ({{ item.unit }}) </template>
              </p>
              <template v-for="zone in item.zones" :key="zone.color">
                <div
                  class="scales-color"
                  v-if="zone.color && zone.label"
                  :style="`--color: ${zone.color}`"
                >
                  <b>
                    {{ zone.label[localeComputed] ? zone.label[localeComputed] : zone.label.en }}
                  </b>
                  <template v-if="!item.zoneLabelsAreRanges">
                    (<template v-if="typeof zone.valueMax === 'number'">
                      {{ t("scales.upto") }} {{ zone.valueMax }}
                    </template>
                    <template v-else>{{ t("scales.above") }}</template
                    >)
                  </template>
                </div>
              </template>
              <p v-if="item.scaleNote" class="textsmall">
                {{ item.scaleNote[localeComputed] || item.scaleNote.en }}
              </p>
            </template>
          </div>
        </div>
      </div>

      <div
        v-if="!isDemo && showLogsHealthUserhideNotice"
        class="logs-health-warning-banner logs-health-userhide-notice"
      >
        <div>
          {{ t("logs_health_device_hid_warnings") }}
          <a href="#" role="button" @click.prevent="onShowSensorWarningsAgain">
            {{ t("logs_health_show_warnings_for_period") }}
          </a>
        </div>
      </div>

      <p class="textsmall" v-if="!isDemo && hasLogs">
        <template v-if="isRussia">{{ t("notice_with_fz") }}</template>
        <template v-else>{{ t("notice_without_fz") }}</template>
      </p>
    </section>
  </div>
</template>

<script setup>
import { ownerName } from "@/utils/addressNames";
import { computed, ref, watch, inject, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { useMap } from "@/composables/useMap";
import {
  useSensors,
  isPanelSensorPickerReady,
  isPanelOwnerLoading,
  resolveSensorType,
  isOwnerAccountLoggedIn,
} from "@/composables/useSensors";
import { useAccounts } from "@/composables/useAccounts";
import { getAvatar } from "@/utils/avatarGenerator";
import {
  clearAllLogsHealthUserHide,
  loadLogsHealth,
  useLogsHealth,
} from "@/utils/calculations/sensor/logs_health.js";
import measurements from "../../../measurements";
import { MEASUREMENT_GROUP_LOOKUP, MEASUREMENT_GROUPS } from "@/measurements/groups";
import { bagHasEncryptedForLegend, logHasEncryptedForLegend } from "@/utils/sensorValueCrypto";
import { useDemoReadings, demoChartTypes } from "@/composables/useDemoReadings";

import AQI from "../widgets/AQI.vue";
import DemoShowcase from "../widgets/DemoShowcase.vue";
import Chart from "../widgets/Chart.vue";
import ChartHealthWarning from "../widgets/ChartHealthWarning.vue";
import { LOG_GEO_ADDRESSES_KEY } from "@/composables/useLogGeoAddresses";
import SensorPicker from "../widgets/SensorPicker.vue";
import Timeline from "../widgets/Timeline.vue";
// import NativeShare from "../widgets/NativeShare.vue";

const props = defineProps({
  point: Object,
  log: Array,
  demo: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:demo"]);

const isDemo = computed({
  get: () => props.demo,
  set: (value) => emit("update:demo", Boolean(value)),
});

const { t } = useI18n();
const mapState = useMap();
const accountStore = useAccounts();
const localeComputed = computed(() => localStorage.getItem("locale") || "en");
const { logsProgress, runLogsHealth } = useSensors();
const { logsHealth, logsHealthMeta } = useLogsHealth();
const logGeoAddresses = inject(LOG_GEO_ADDRESSES_KEY, null);
const chartGeoAddresses = computed(() => logGeoAddresses?.geoAddresses?.value || {});
const showChartGeoInTooltip = computed(() => Boolean(logGeoAddresses?.showGeoInTooltip?.value));
const chartAddressForTimestamp = (...args) => logGeoAddresses?.addressForTimestamp?.(...args);

const ownerKey = computed(() => String(props.point?.owner || "").trim());
const ownerAvatar = ref(null);
// placeholder text only sets the skeleton width
const ownerPlaceholderMeta = "Woolly Pony";

const isSensorPickerReady = computed(() => isPanelSensorPickerReady(props.point));
const isOwnerLoading = computed(() => isPanelOwnerLoading(props.point));
const sensorType = computed(() => resolveSensorType(props.point, props.log));

const { demoItems } = useDemoReadings(
  () => props.log,
  () => props.point
);

// Carousel: screen 0 = metric cards (15s), then one chart per group (5s each).
const DEMO_SCREEN_MS = 15000;
const DEMO_CHART_MS = 5000;
const demoSlide = ref(0);
const progressTick = ref(0);
const demoPaused = ref(false);
let demoTimer = 0;

const demoSlides = computed(() => {
  // Dust/climate/noise collapse to one slide each (see demoChartTypes).
  const types = demoChartTypes(demoItems.value);
  return [{ kind: "readings", key: "readings" }, ...types.map((key) => ({ kind: "chart", key }))];
});

const demoScreen = computed(() => (demoSlide.value === 0 ? "readings" : "charts"));

function demoDuration(index = demoSlide.value) {
  return index === 0 ? DEMO_SCREEN_MS : DEMO_CHART_MS;
}

const demoProgressNow = computed(() => {
  const total = demoSlides.value.length;
  if (!total) return 0;
  return Math.round(((demoSlide.value + 1) / total) * 100);
});

function demoSlideLabel(slide, index) {
  const total = demoSlides.value.length;
  const n = t("sensorpopup.demo_screen_n", { current: index + 1, total });
  if (slide.kind === "readings") {
    return `${t("sensorpopup.demo_screen_readings")}, ${n}`;
  }
  const group = MEASUREMENT_GROUP_LOOKUP[slide.key];
  const groupLabel =
    group && MEASUREMENT_GROUPS[group]?.labelKey ? t(MEASUREMENT_GROUPS[group].labelKey) : "";
  const meta = measurements[slide.key];
  const loc = localeComputed.value;
  const name =
    groupLabel ||
    meta?.nameshort?.[loc] ||
    meta?.nameshort?.en ||
    t("sensorpopup.demo_screen_charts");
  return `${name}, ${n}`;
}

function stopDemoCarousel() {
  window.clearTimeout(demoTimer);
  demoTimer = 0;
}

function queueDemo(fn, ms) {
  stopDemoCarousel();
  demoTimer = window.setTimeout(fn, ms);
}

function applySlide(index) {
  const slides = demoSlides.value;
  if (!slides.length) return;
  const i = ((index % slides.length) + slides.length) % slides.length;
  demoSlide.value = i;
  const slide = slides[i];
  // Switch the chart group locally. Do not touch the URL: setMapSettings(type)
  // would refetch maxdata and rebuild every map marker on each slide.
  if (slide.kind === "chart" && slide.key) {
    mapState.setCurrentUnit(slide.key);
  }
}

function restartProgress() {
  progressTick.value += 1;
}

function goToSlide(index) {
  applySlide(index);
  restartProgress();
  if (!document.hidden && isDemo.value) queueDemo(nextSlide, demoDuration());
}

function nextSlide() {
  goToSlide(demoSlide.value + 1);
}

function startDemoCarousel() {
  stopDemoCarousel();
  if (!isDemo.value) return;
  applySlide(demoSlide.value);
  restartProgress();
  if (document.hidden) {
    demoPaused.value = true;
    return;
  }
  demoPaused.value = false;
  queueDemo(nextSlide, demoDuration());
}

function onDemoVisibility() {
  if (document.hidden) {
    demoPaused.value = true;
    stopDemoCarousel();
    return;
  }
  startDemoCarousel();
}

watch(
  isDemo,
  (on) => {
    if (on) {
      demoSlide.value = 0;
      startDemoCarousel();
      document.addEventListener("visibilitychange", onDemoVisibility);
    } else {
      stopDemoCarousel();
      document.removeEventListener("visibilitychange", onDemoVisibility);
      demoSlide.value = 0;
      demoPaused.value = false;
    }
  },
  { immediate: true }
);

watch(
  () => demoSlides.value.length,
  (len) => {
    if (!isDemo.value || !len) return;
    if (demoSlide.value >= len) goToSlide(0);
  }
);

onBeforeUnmount(() => {
  stopDemoCarousel();
  document.removeEventListener("visibilitychange", onDemoVisibility);
});

const isOwnerLoggedIn = computed(() => {
  const accounts = Array.isArray(accountStore.accounts?.value) ? accountStore.accounts.value : [];
  return isOwnerAccountLoggedIn(accounts, ownerKey.value, props.point?.sensor_id);
});

watch(
  ownerKey,
  async (addr) => {
    ownerAvatar.value = addr ? await getAvatar(addr, 44) : null;
  },
  { immediate: true }
);

const chartLogRevision = computed(() => props.point?._decryptRev ?? props.point?._logsKey ?? "");

const chartActiveLegendKey = ref(null);

const activeChartLegend = computed(
  () => chartActiveLegendKey.value || mapState.currentUnit.value || null
);

const activeLegendHasEncryptedValues = computed(() => {
  const legend = activeChartLegend.value;
  if (!legend) return false;
  if (logHasEncryptedForLegend(props.log, legend)) return true;
  return (
    bagHasEncryptedForLegend(props.point?.data, legend) ||
    bagHasEncryptedForLegend(props.point?.maxdata, legend)
  );
});

const showEncryptedLoginNotice = computed(() => {
  if (!Boolean(ownerKey.value) || !activeLegendHasEncryptedValues.value) return false;
  return true;
});

const encryptedNoticeIsLogin = computed(
  () => showEncryptedLoginNotice.value && !isOwnerLoggedIn.value
);

const logsHealthSensorUserHide = computed(() =>
  Boolean(
    logsHealthMeta.value?.userhide &&
      logsHealthMeta.value?.sensorId != null &&
      String(logsHealthMeta.value.sensorId) === String(props.point?.sensor_id)
  )
);

const logsHealthReloadContext = () => ({
  currentDate: mapState.currentDate.value,
  timelineMode: mapState.timelineMode.value,
});

const onShowSensorWarningsAgain = async () => {
  const id = props.point?.sensor_id;
  if (!id || !runLogsHealth.value) return;
  await clearAllLogsHealthUserHide(id);
  await loadLogsHealth(id, props.log, logsHealthReloadContext());
};

const hasLogs = computed(() => Array.isArray(props.log) && props.log.length > 0);

// Same source as `log` from parent: `null` = loading → skeleton; `[]` = empty → message; data → chart
const chartHasData = computed(() => Array.isArray(props.log) && props.log.length > 0);

watch(
  () => chartHasData.value,
  (hasData) => {
    if (!hasData) chartActiveLegendKey.value = null;
  }
);

/** Только глобальный userhide по сенсору (record.userhide). Ссылка по-прежнему снимает все userhide (дни + корень). */
const showLogsHealthUserhideNotice = computed(
  () => runLogsHealth.value && hasLogs.value && chartHasData.value && logsHealthSensorUserHide.value
);

const showNoDataMessage = computed(() => {
  // `null` = still loading → skeleton (not this message).
  // `[]` = fetch finished with no points → "No data available".
  // Realtime: keep skeleton until _logsKey is set (API finished and sensor is live).
  if (!Array.isArray(props.log) || props.log.length > 0) return false;
  if (
    mapState.currentProvider.value === "realtime" &&
    mapState.timelineMode.value === "realtime" &&
    !props.point?._logsKey
  ) {
    return false;
  }
  return true;
});

// Проверяем, здоровы ли данные PM (для отображения AQI)
const isPMHealthy = computed(() => {
  if (!runLogsHealth.value) return true;
  if (!logsHealth.value) return true;
  return logsHealth.value.pm?.healthy !== false;
});

const showLogsProgress = computed(() => {
  const progress = logsProgress.value;
  if (!progress || !progress.active) return false;
  return ["week", "month"].includes(progress.mode) && mapState.timelineMode.value === progress.mode;
});

const logsProgressPercent = computed(() => {
  const progress = logsProgress.value;
  return progress?.percent || 0;
});

const logsProgressLabel = computed(() => {
  const progress = logsProgress.value;
  if (!progress || !progress.totalDays) return "";
  return `${progress.loadedDays}/${progress.totalDays}`;
});

const timelineModeLabel = computed(() => {
  const mode = mapState.timelineMode.value;
  if (mode === "week") return "Week";
  if (mode === "month") return "Month";
  return mode;
});

const isRussia = computed(() => {
  const address = props.point?.address || "";
  return /^(RU|Россия|Russia|, RU|, Россия|, Russia)/i.test(address);
});

const units = ref([]);

const scales = computed(() => {
  const buffer = [];
  Object.keys(measurements).forEach((key) => {
    if (units.value.some((unit) => unit === key)) {
      if (measurements[key].zones) {
        buffer.push(measurements[key]);
      }
    }
  });

  return buffer.sort((a, b) => {
    const nameA = a.nameshort[localeComputed.value] || "";
    const nameB = b.nameshort[localeComputed.value] || "";
    return nameA.localeCompare(nameB);
  });
});

/**
 * Строит список доступных единиц измерения на основе данных логов
 * @returns {Array} Отсортированный массив единиц измерения
 */
function buildUnitsList() {
  const set = new Set();
  if (!Array.isArray(props.log)) return Array.from(set);

  props.log.forEach((item) => {
    if (item?.data) Object.keys(item.data).forEach((u) => set.add(u.toLowerCase()));
  });

  // Добавляем AQI если есть данные PM2.5 и PM10
  const hasPM25 = props.log.some((item) => item?.data?.pm25);
  const hasPM10 = props.log.some((item) => item?.data?.pm10);
  if (hasPM25 && hasPM10) {
    set.add("aqi");
  }

  return Array.from(set).sort();
}

// Обновляем units при смене датчика или логов
watch(
  () => [props.point?.sensor_id, props.log],
  () => {
    if (!Array.isArray(props.log) || props.log.length === 0) {
      units.value = [];
      return;
    }
    units.value = buildUnitsList();
  },
  { immediate: true }
);
</script>

<style scoped>
.no-data-message {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 1rem;
  text-align: center;
  padding: 2rem;
}

.chart-skeleton {
  height: 300px;
  width: 100%;
  background: linear-gradient(90deg, #f0f0f0, #e0e0e0, #f0f0f0);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.analytics-tab--demo {
  display: flex;
  flex-direction: column;
  position: relative;
}

.demo-stage {
  flex: 0 0 auto;
  position: relative;
}

.demo-screen--readings {
  display: flex;
  flex-direction: column;
  gap: calc(var(--gap) * 0.85);
}

.demo-screen--readings :deep(.demo-board) {
  flex: 0 0 auto;
}

.demo-screen--readings :deep(.demo-metrics) {
  align-content: start;
}

/* Header pager: inactive gray from --color-dark, fill/active from --color-blue. */
.demo-pager {
  --pager-inactive: color-mix(in srgb, var(--color-dark) 14%, transparent);
  --pager-track: color-mix(in srgb, var(--color-dark) 10%, transparent);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-self: stretch;
  align-self: center;
  gap: 0.35rem;
  width: 100%;
  min-width: 0;
}

.demo-pager__bar {
  width: 100%;
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--pager-track);
}

.demo-pager__fill {
  display: block;
  width: 0;
  height: 100%;
  border-radius: inherit;
  background: var(--color-blue);
  animation: demo-pager-fill var(--demo-ms, 5s) linear forwards;
}

.demo-pager.is-paused .demo-pager__fill {
  animation-play-state: paused;
}

@keyframes demo-pager-fill {
  to {
    width: 100%;
  }
}

.demo-pager__dots {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.2rem;
}

.demo-pager__dot {
  display: grid;
  place-items: center;
  width: 1.45rem;
  height: 1.45rem;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.demo-pager__dot::after {
  content: "";
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 999px;
  background: var(--pager-inactive);
  transition:
    width 0.28s ease,
    height 0.28s ease,
    background-color 0.28s ease,
    transform 0.28s ease;
}

.demo-pager__dot.is-done::after {
  background: color-mix(in srgb, var(--color-blue) 55%, var(--pager-inactive));
}

.demo-pager__dot.is-on::after {
  width: 1.15rem;
  height: 0.42rem;
  background: var(--color-blue);
}

.demo-pager__dot:hover::after {
  transform: scale(1.18);
}

.demo-pager__dot.is-on:hover::after {
  transform: none;
}

.demo-pager__dot:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: 1px;
  border-radius: 999px;
}

@media screen and (max-width: 900px) {
  .demo-pager {
    gap: 0.5rem;
  }

  .demo-pager__bar {
    height: 8px;
  }

  .demo-pager__dots {
    gap: 0.28rem;
  }

  .demo-pager__dot {
    width: 2.55rem;
    height: 2.55rem;
  }

  .demo-pager__dot::after {
    width: 0.78rem;
    height: 0.78rem;
  }

  .demo-pager__dot.is-on::after {
    width: 1.9rem;
    height: 0.78rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .demo-pager__fill {
    animation: none;
    width: 100%;
    opacity: 0.45;
  }

  .demo-pager__dot::after {
    transition: none;
  }

  .demo-pager__dot.is-on::after {
    width: 0.78rem;
  }
}

.analytics-tab--demo .chart-wrap {
  margin-top: 0;
  flex: 0 1 auto;
  min-height: 0;
}

.analytics-tab--demo :deep(.demo-now) {
  flex: 0 0 auto;
  min-width: 0;
  max-width: 100%;
  margin-top: var(--gap);
}

.panel--demo {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(9rem, 18rem);
  align-items: center;
  column-gap: 1.25rem;
  margin-bottom: calc(var(--gap) * 1.15);
}

@media screen and (max-width: 560px) {
  .panel--demo {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 0.7rem;
  }
}

.panel-start {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.45rem;
  flex: 0 0 auto;
  max-width: 100%;
}

.panel-start :deep(.sensor-picker),
.panel-start :deep(.panel-trigger--sensor) {
  max-width: 100%;
}

.panel-end {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  flex: 0 0 auto;
  max-width: 100%;
}

.demo-switch {
  display: flex;
  align-items: center;
  align-self: flex-end;
  gap: 0.4rem;
  width: fit-content;
  margin-top: calc(var(--gap) * 1.75);
  margin-left: auto;
  cursor: pointer;
  user-select: none;
}

.demo-switch input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

.demo-switch__track {
  position: relative;
  width: 2rem;
  height: 1.15rem;
  flex: 0 0 auto;
  border: 1px solid var(--surface-border);
  border-radius: 999px;
  background: var(--color-light-gray);
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.demo-switch__track::after {
  content: "";
  position: absolute;
  top: 1px;
  left: 1px;
  width: 0.85rem;
  height: 0.85rem;
  border-radius: 50%;
  background: var(--color-light);
  border: 1px solid var(--surface-border-soft);
  transition: transform 0.15s ease;
}

.demo-switch input:checked + .demo-switch__track {
  background: color-mix(in srgb, var(--color-link) 28%, var(--color-light));
  border-color: var(--color-link);
}

.demo-switch input:checked + .demo-switch__track::after {
  transform: translateX(0.82rem);
}

.demo-switch input:focus-visible + .demo-switch__track {
  outline: 2px solid var(--color-link);
  outline-offset: 2px;
}

.demo-switch__text {
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1;
}

.analytics-tab--demo :deep(.panel-trigger--sensor) {
  background: transparent;
  border-color: transparent;
  padding: 0;
}

.analytics-tab--demo :deep(.panel-trigger--sensor .panel-list__title) {
  font-size: 1.12rem;
  font-weight: 800;
}

.analytics-tab--demo :deep(.panel-trigger--sensor .panel-list__meta) {
  font-size: 0.82rem;
}

.analytics-tab--demo :deep(.panel-trigger--sensor .panel-list__text) {
  display: flex;
  flex-direction: column;
}

/* - Top panel */
.panel-trigger--owner {
  anchor-name: --data-owner-trigger;
}

@supports (position-anchor: --data-owner-trigger) {
  .panel-popover--end {
    position-anchor: --data-owner-trigger;
    top: anchor(bottom);
    right: anchor(right);
    left: auto;
    margin-top: 10px;
  }
}
/* - Top panel */

.aqi-wrap {
  margin-bottom: var(--gap);
}

.scales-block {
  margin-bottom: calc(var(--gap) * 2);
}

.scales-title {
  font-weight: 600;
  margin-bottom: var(--gap);
}

.scalegrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--gap);
  font-size: 0.8em;
}

.scalegrid:not(:last-child) {
  margin-bottom: calc(var(--gap) * 2);
}

.scalegrid p {
  margin-bottom: calc(var(--gap) * 0.5);
}

.scales-color {
  position: relative;
  padding-left: calc(var(--gap) * 2);
  hyphens: auto;
}

.scales-color:before {
  content: "";
  display: block;
  position: absolute;
  background-color: var(--color);
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--gap);
}

.logs-progress {
  margin-bottom: calc(var(--gap) * 1.5);
  display: flex;
  flex-direction: column;
  gap: calc(var(--gap) * 0.5);
}

.logs-progress-bar {
  height: 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.logs-progress-bar span {
  display: block;
  height: 100%;
  background: var(--color-dark);
  transition: width 0.2s ease;
}

.logs-progress-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8em;
  color: var(--color-dark);
}

.chart-area {
  position: relative;
}

.chart-area--locked :deep(.chart-section-chart),
.chart-area--locked :deep(.custom-legend) {
  filter: blur(2px);
  pointer-events: none;
  user-select: none;
}

.chart-encrypted-overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--gap);
  background: color-mix(in srgb, var(--color-light, #fff) 35%, transparent);
  backdrop-filter: blur(1px);
}

.chart-encrypted-overlay__card {
  max-width: 22rem;
  padding: calc(var(--gap) * 1.5);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--color-light, #fff) 92%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-dark, #222) 12%, transparent);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.chart-encrypted-overlay__icon {
  font-size: 1.4rem;
  color: var(--color-dark);
  margin-bottom: calc(var(--gap) * 0.75);
}

.chart-encrypted-overlay__text {
  margin: 0 0 var(--gap);
  font-size: 0.95em;
  line-height: 1.45;
  color: var(--color-dark);
}

.chart-encrypted-overlay__cta {
  display: inline-block;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  background: var(--color-blue);
  color: #fff;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9em;
}

.chart-encrypted-overlay__cta:hover {
  filter: brightness(0.95);
}

.logs-health-warning-banner {
  padding: var(--gap);
  border-radius: var(--radius-sm);
  background-color: color-mix(in srgb, var(--color-orange) 22%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-orange) 45%, transparent);
  margin-bottom: var(--gap);
}

.logs-health-warning-banner a {
  color: var(--color-blue);
  font-size: 0.85em;
}

.logs-health-userhide-notice {
  font-size: 0.9em;
}

.bugged-sensor {
  flex-direction: column;
}

.bugged-sensor-data {
  text-align: center;
}

.bugged-sensor h3 {
  margin-bottom: 0.2rem;
}

.info-wrap {
  margin-top: calc(var(--gap) * 1.25);
  display: flex;
  flex-direction: column;
  gap: var(--gap);
}

@media screen and (width < 500px) {
  .info-wrap {
    margin-top: calc(var(--gap) * 1.75);
    gap: calc(var(--gap) * 1.5);
  }
}
</style>
