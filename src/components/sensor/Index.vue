<template>
  <div class="popup-js active">
    
    <div class="sensor-header">
      <div v-if="!isBookmarked && !showBookmarkForm" class="title title-bookmark-no">
        <button
          v-if="hasAddress"
          type="button"
          class="button"
          :aria-label="t('sensorpopup.bookmarkbutton')"
          :title="t('sensorpopup.bookmarkbutton')"
          @click.prevent="openAddForm"
        >
          <font-awesome-icon icon="fa-solid fa-bookmark" />
        </button>

        <h3 class="sensor-header__address">
          <template v-if="hasAddress">{{ displayAddress }}</template>
          <span v-else-if="isAddressLoading" class="sensor-header__address-skeleton" aria-hidden="true"></span>
          <span v-else class="sensor-header__address-missing">{{ headerFallbackLabel }}</span>
        </h3>
      </div>

      <div v-else-if="showBookmarkForm" class="title title-bookmark-add">
        <button
          type="button"
          class="button button-clean"
          :aria-label="t('sensorpopup.editbookmark')"
          :title="t('sensorpopup.editbookmark')"
          @click.prevent="cancelForm"
        >
          <font-awesome-icon icon="fa-solid fa-reply" />
        </button>

        <form @submit.prevent="saveBookmark">
          <input
            v-model="bookmarkName"
            type="text"
            :placeholder="t('sensorpopup.bookmarkplaceholder')"
          />
          <div>
            <button
              type="submit"
              class="button"
              :aria-label="t('sensorpopup.bookmarkbutton')"
              :title="t('sensorpopup.bookmarkbutton')"
            >
              <font-awesome-icon icon="fa-solid fa-floppy-disk" />
            </button>
            <button
              v-if="isBookmarked"
              type="button"
              class="button button-red"
              :aria-label="t('sensorpopup.deletebookmark')"
              :title="t('sensorpopup.deletebookmark')"
              @click.prevent="deleteBookmark"
            >
              <font-awesome-icon icon="fa-solid fa-trash" />
            </button>
          </div>
        </form>

        <div class="text-small sensor-header__address">
          <template v-if="hasAddress">{{ displayAddress }}</template>
          <span v-else-if="isAddressLoading" class="sensor-header__address-skeleton sensor-header__address-skeleton--sub" aria-hidden="true"></span>
          <span v-else class="sensor-header__address-missing sensor-header__address-missing--sub">{{ headerFallbackLabel }}</span>
        </div>
      </div>

      <div v-else class="title title-bookmark-added">
        <h3>
          <button
            type="button"
            :aria-label="t('sensorpopup.editbookmark')"
            :title="t('sensorpopup.editbookmark')"
            @click.prevent="startEditing"
          >
            <font-awesome-icon icon="fa-solid fa-bookmark" />
            {{ bookmarkName }}
          </button>
        </h3>

        <div class="text-small sensor-header__address">
          <template v-if="hasAddress">{{ displayAddress }}</template>
          <span v-else-if="isAddressLoading" class="sensor-header__address-skeleton sensor-header__address-skeleton--sub" aria-hidden="true"></span>
          <span v-else class="sensor-header__address-missing sensor-header__address-missing--sub">{{ headerFallbackLabel }}</span>
        </div>
      </div>

      <button @click.prevent="closesensor" aria-label="Close sensor" class="close">
        <font-awesome-icon icon="fa-solid fa-xmark" />
      </button>
    </div>

    <div class="scrollable-y" :class="{ 'scrollable-y--kiosk': isDemo && activeTab === 'chart' }">
      <div v-show="activeTab === 'chart'" class="tab-content" :class="isDemo ? 'demo-tab' : 'chart-tab'">
        <div v-if="!isDemo && latestStoryInPeriod" class="story-day">
          <div class="story-day__content">
            <div
              class="story-day-icon"
              :style="{ '--story-color': iconColor(latestStoryInPeriod.iconId) }"
            >
              <font-awesome-icon
                v-if="latestStoryInPeriod.icon"
                :icon="latestStoryInPeriod.icon"
                class="story-day-fa"
                :style="{ color: iconColor(latestStoryInPeriod.iconId) }"
              />
            </div>
            <div class="story-day-body">
              <p class="story-day-body__time">{{ formatStoryDateTime(latestStoryInPeriod) }}</p>
              <p class="story-day-body__text">
                {{ latestStoryInPeriod.message || latestStoryInPeriod.comment }}
              </p>
            </div>
          </div>
          <button
            v-if="isAccountsEnabled"
            type="button"
            class="button button-round-outline"
            @click.prevent="activeTab = 'edit'"
            :title="$t('sensorpopup.allStories')"
          >
            <font-awesome-icon icon="fa-solid fa-comment" />
            <span class="button-round-outline__badge blue">{{ sensorStoriesTotalCount }}</span>
          </button>
        </div>

        <Data :point="point" :log="log" v-model:demo="isDemo" />
      </div>

      <div v-if="isStoriesEnabled && isAccountsEnabled && activeTab === 'edit'" class="tab-content">
        <EditStory
          v-if="sensor_id"
          :sensor-id="sensor_id"
          :owner="owner"
          :geo="geo"
          @open-chart="activeTab = 'chart'"
        />
      </div>

      <div v-show="activeTab === 'sharelink'" class="tab-content">
        <ShareLink :log="log" :point="point" :sensor-id="sensor_id" :owner="owner" :geo="geo" />
      </div>
    </div>

    <div class="sensor-panel">
      <button
        class="panel-button"
        :class="{ active: activeTab === 'chart' }"
        @click.prevent="activeTab = 'chart'"
        :title="'Data'"
      >
        <font-awesome-icon icon="fa-solid fa-chart-line" />
        <span>Data</span>
      </button>

      <button
        v-if="isAccountsEnabled && isStoriesEnabled"
        class="panel-button"
        :class="{ active: activeTab === 'edit' }"
        @click.prevent="activeTab = 'edit'"
        :title="t('sensorpopup.edit') || 'Edit'"
      >
        <font-awesome-icon icon="fa-regular fa-comment" />
        <span>Stories</span>
      </button>

      <button
        class="panel-button"
        :class="{ active: activeTab === 'sharelink' }"
        @click.prevent="activeTab = 'sharelink'"
        :title="t('sensorpopup.sharedefault')"
      >
        <font-awesome-icon icon="fa-solid fa-qrcode" />
        <span>{{ t("sensorpopup.shareTab") }}</span>
      </button>
    </div>


  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount, inject } from "vue";
import { useI18n } from "vue-i18n";
import { useMap } from "@/composables/useMap";
import { useSensors, isSensorAddressReady } from "@/composables/useSensors";
import { sensorName } from "@/utils/addressNames";
import { useLogGeoAddresses, LOG_GEO_ADDRESSES_KEY } from "@/composables/useLogGeoAddresses";
import { getStoriesForSensor, isStoryHidden, storiesLocalKeys } from "@/composables/useStories";
import { useSensorBookmark } from "@/composables/useBookmarks";
import { settings } from "@config";
import { dayISO, getPeriodBounds } from "@/utils/date";

import Data from "./tabs/Data.vue";
import ShareLink from "./tabs/ShareLink.vue";
import EditStory from "./tabs/EditStory.vue";

const props = defineProps({
  point: Object,
});

const emit = defineEmits(["close"]);

const { t, locale } = useI18n();
const mapState = useMap();

const localeComputed = computed(() => localStorage.getItem("locale") || locale.value || "en");
const sensorsUI = useSensors();

const point = computed(() => props.point?.value ?? props.point ?? null);

const log = computed(() => (Array.isArray(point.value?.logs) ? point.value.logs : null));

const injectedGeoAddresses = inject(LOG_GEO_ADDRESSES_KEY, null);
const sensorGeo = computed(() => point.value?.geo ?? null);
const logGeoAddresses =
  injectedGeoAddresses ??
  useLogGeoAddresses(log, localeComputed, sensorGeo);

const displayAddress = computed(() => logGeoAddresses.headerAddress.value);
const hasAddress = computed(() => isSensorAddressReady(displayAddress.value));
const headerFallbackLabel = computed(() => {
  const id = sensorName(point.value?.sensor_id);
  return id ? t("sensorpopup.sensorIdHeader", { id }) : "";
});
const isAddressLoading = computed(
  () => logGeoAddresses.loading.value && !displayAddress.value
);

// Активная вкладка
const TAB_STORAGE_KEY = "sensorPopupTab";
const DEMO_STORAGE_KEY = "sensorPopupDemo";

function readStoredDemo() {
  try {
    if (localStorage.getItem(TAB_STORAGE_KEY) === "demo") {
      localStorage.setItem(DEMO_STORAGE_KEY, "1");
      localStorage.setItem(TAB_STORAGE_KEY, "chart");
      return true;
    }
    return localStorage.getItem(DEMO_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

const activeTab = ref("chart");
const isDemo = ref(readStoredDemo());

watch(isDemo, (on) => {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, on ? "1" : "0");
  } catch {
    /* ignore quota / private mode */
  }
});

// Проверяем, включен ли сервис accounts
const isAccountsEnabled = computed(() => settings?.SERVICES?.accounts === true);
const isStoriesEnabled = computed(() => settings?.SERVICES?.stories !== false);

const ICON_COLORS = {
  heat: "#ff6b6b",
  cold: "#7ad9e8",
  smog: "#9aa7b1",
  wind: "#76a7ff",
  noise: "#c58bff",
  storm: "#b39ddb",
  rain: "#7fbfff",
  sun: "#ffd36e",
  fire: "#ffb26b",
  co2: "#b08a7a",
  note: "#7fcf9a",
};

function iconColor(id) {
  return ICON_COLORS[id] || "currentColor";
}

/** Milliseconds for display/sort: publish time, else createdAt. */
function storyTimestampMs(s) {
  if (!s) return null;
  const ts = s.timestamp != null ? Number(s.timestamp) : null;
  if (ts != null && !Number.isNaN(ts)) return ts < 1e12 ? ts * 1000 : ts;
  if (s.createdAt) {
    const t = new Date(s.createdAt).getTime();
    if (!Number.isNaN(t)) return t;
  }
  return null;
}

/** Calendar day of the story (event `date` or day of `timestamp`) for period filter. */
function storyEventDayISO(s) {
  if (!s) return null;
  const d = s.date != null && String(s.date).trim() !== "" ? String(s.date).trim() : null;
  if (d) return d;
  const ms = storyTimestampMs(s);
  if (ms == null) return null;
  try {
    return dayISO(ms);
  } catch {
    return null;
  }
}

function formatStoryDateTime(s) {
  const ms = storyTimestampMs(s);
  if (ms == null) return "—";
  const loc = String(locale.value || "en");
  const fmtLoc = loc === "ru" ? "ru-RU" : "en-GB";
  return new Intl.DateTimeFormat(fmtLoc, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ms));
}

/** Bump on `stories_updated` so counts/lists refresh after localStorage writes. */
const storiesRefreshTick = ref(0);

/** Stories in selected timeline period (day / week / month), newest first, not hidden. */
const storiesInSelectedPeriod = computed(() => {
  storiesRefreshTick.value;
  const sid = sensor_id.value;
  const date = mapState.currentDate?.value;
  const modeRaw = mapState.timelineMode?.value || "day";
  const mode = modeRaw === "realtime" ? "day" : modeRaw;
  if (!sid || !date) return [];

  const { start, end } = getPeriodBounds(date, mode);
  const startDay = dayISO(start * 1000);
  const endDay = dayISO(end * 1000);

  const list = getStoriesForSensor(sid);
  const inPeriod = (s) => {
    const eventIso = storyEventDayISO(s);
    if (!eventIso) return false;
    return eventIso >= startDay && eventIso <= endDay;
  };

  const matches = (Array.isArray(list) ? list : []).filter((s) => inPeriod(s) && !isStoryHidden(s));
  matches.sort((a, b) => (storyTimestampMs(b) || 0) - (storyTimestampMs(a) || 0));
  return matches;
});

/** Последняя (самая новая) история за выбранный период. */
const latestStoryInPeriod = computed(() => storiesInSelectedPeriod.value[0] || null);

/** Всего историй по датчику (localStorage), без скрытых. */
const sensorStoriesTotalCount = computed(() => {
  storiesRefreshTick.value;
  const sid = sensor_id.value;
  if (!sid) return 0;
  const list = getStoriesForSensor(sid);
  return (Array.isArray(list) ? list : []).filter((s) => s && !isStoryHidden(s)).length;
});

// Порядок табов для навигации клавиатурой (edit только если accounts включен)
const tabsOrder = computed(() => {
  const base = ["chart", "sharelink"];
  if (isAccountsEnabled.value) {
    base.push("edit");
  }
  return base;
});

// Функция для переключения табов клавиатурой
const handleKeydown = (event) => {
  // Проверяем, что нажата стрелка влево или вправо
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    // Предотвращаем стандартное поведение (прокрутку страницы)
    event.preventDefault();

    const currentIndex = tabsOrder.value.indexOf(activeTab.value);
    if (currentIndex === -1) return;

    let nextIndex;
    if (event.key === "ArrowLeft") {
      // Переход к предыдущему табу (циклически)
      nextIndex = currentIndex === 0 ? tabsOrder.value.length - 1 : currentIndex - 1;
    } else {
      // Переход к следующему табу (циклически)
      nextIndex = currentIndex === tabsOrder.value.length - 1 ? 0 : currentIndex + 1;
    }

    activeTab.value = tabsOrder.value[nextIndex];
  }
};

const sensor_id = computed(() => point.value?.sensor_id || null);

const {
  isBookmarked,
  bookmarkName,
  showBookmarkForm,
  openAddForm,
  startEditing,
  cancelForm,
  saveBookmark,
  deleteBookmark,
} = useSensorBookmark(point, {
  defaultName: () => displayAddress.value || sensor_id.value || "",
});

const geo = computed(() => point.value?.geo || { lat: 0, lng: 0 });

const owner = computed(() => point.value?.owner || null);

const closesensor = () => {
  // Просто эмитим событие закрытия - всю логику обрабатывает Main.vue
  emit("close");
};

/**
 * Генерирует ссылку на карту в зависимости от устройства
 * @param {number} lat - Широта
 * @param {number} lon - Долгота
 * @param {string} [label="Sensor"] - Подпись для метки
 * @returns {string} URL ссылки на карту
 */
function getMapLink(lat, lon, label = "Sensor") {
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);

  if (isIOS) {
    return `https://maps.apple.com/?ll=${lat},${lon}&q=${encodeURIComponent(label)}`;
  }
  if (isAndroid) {
    return `geo:${lat},${lon}?q=${lat},${lon}(${encodeURIComponent(label)})`;
  }
  return `https://www.google.com/maps?q=${lat},${lon}`;
}

function bumpStoriesRefresh() {
  storiesRefreshTick.value += 1;
}

onMounted(() => {
  // Инициализация компонента
  // Добавляем обработчик клавиатуры для переключения табов
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener(storiesLocalKeys.STORIES_UPDATED_EVENT, bumpStoriesRefresh);
});

onBeforeUnmount(() => {
  // Удаляем обработчик клавиатуры при размонтировании
  window.removeEventListener("keydown", handleKeydown);
  window.removeEventListener(storiesLocalKeys.STORIES_UPDATED_EVENT, bumpStoriesRefresh);
});

// Watcher для изменений даты (из UI или внешних источников)
watch(
  () => mapState.currentDate.value,
  async (newDate, oldDate) => {
    if (!newDate || oldDate === undefined || newDate === oldDate) return;
    const sid = sensor_id.value;
    if (!sid || !sensorsUI.isSensorOpen(sid)) return;
    sensorsUI.clearSensorLogs(sid);
    await sensorsUI.updateSensorLogs(sid);
  }
);

// Timeline mode log reload + map rebundle: owned by Timeline.vue handleTimelineModeChange.

// URL обновление теперь происходит только в Main.vue
// Здесь оставляем только UI-специфичную логику
</script>

<style scoped>

.popup-js.active {
  container: popup / inline-size;
  background: var(--color-light);
  border-radius: 0;
  bottom: 0;
  box-sizing: border-box;
  color: var(--color-dark);
  display: flex;
  flex-direction: column;
  position: absolute;
  right: 0;
  top: 0;
  width: 80vw;
  max-width: 1000px;
  z-index: 100;
  box-shadow: -6px 0 12px -4px rgba(0, 0, 0, 0.3);
}

.scrollable-y {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
  padding-left: var(--gap);
  padding-right: var(--gap);
}

.scrollable-y--kiosk {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.scrollable-y--kiosk .demo-tab {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  min-height: auto;
  padding-bottom: calc(var(--gap) * 1.1);
}

.scrollable-y--kiosk .demo-tab > * {
  flex: 0 0 auto;
  min-height: auto;
  display: flex;
  flex-direction: column;
}

.sensor-header {
  --close-size: calc(var(--font-size) * 2);
  flex-shrink: 0;
  text-align: center;
  position: relative;
  background-color: var(--color-light);
  padding: var(--gap);
  border-bottom: 2px solid var(--color-dark);
}

.sensor-header .title {
  padding-right: calc(var(--close-size) + var(--gap)*2);
}

.sensor-header h3 {
  margin-bottom: 0;
}

.sensor-header .close {
  border: 0;
  cursor: pointer;
  position: absolute;
  right: var(--gap);
  top: var(--gap);
}

.sensor-header .close .fa-xmark {
  height: var(--close-size);
}

.sensor-header .title-bookmark-no {
  display: flex;
  gap: var(--gap);
  align-items: center;
  justify-content: center;
}

.sensor-header__address {
  flex: 1;
  min-width: 0;
  text-align: center;
}

.sensor-header__address-skeleton {
  display: block;
  width: min(100%, 18rem);
  height: 1.35em;
  margin: 0 auto;
  border-radius: var(--radius-sm);
  background: linear-gradient(90deg, #f0f0f0, #e0e0e0, #f0f0f0);
  background-size: 200% 100%;
  animation: panel-skeleton-loading 1.5s infinite;
}

.sensor-header__address-skeleton--sub {
  width: min(100%, 14rem);
  height: 1em;
}

.sensor-header__address-missing {
  display: block;
  color: var(--color-text-muted, #888);
  font-weight: normal;
  font-style: italic;
}

.sensor-header__address-missing--sub {
  font-size: inherit;
}

.sensor-header .title-bookmark-add {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: var(--gap) calc(var(--gap) * 0.5);
}

.sensor-header .title-bookmark-add form {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--gap);
  min-width: 0;
}

.sensor-header .title-bookmark-add form input {
  width: 100%;
  min-width: 0;
}

.sensor-header .title-bookmark-add form > div {
  display: flex;
  align-items: center;
  gap: calc(var(--gap) * 0.5);
}

.sensor-header .title-bookmark-add form .button {
  height: 40px;
  padding-left: calc(var(--app-inputpadding) * 1.2);
  padding-right: calc(var(--app-inputpadding) * 1.2);
}

.sensor-header .title-bookmark-add .text-small {
  grid-column: 1 / -1;
}

.sensor-header .title-bookmark-added h3 button {
  background: none;
  border: 0;
  cursor: pointer;
  font: inherit;
  font-weight: inherit;
  color: inherit;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: calc(var(--gap) * 0.5);
  max-width: 100%;
  text-align: center;
}

.sensor-header .text-small {
  font-size: 0.85em;
  opacity: 0.75;
}


/* Стили скелетона для заглушки графика */
.chart-skeleton {
  height: 300px;
  width: 100%;
  background: linear-gradient(90deg, #f0f0f0, #e0e0e0, #f0f0f0);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

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

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Стили заглушки для текста */
.skeleton-text {
  display: inline-block;
  height: 1em;
  width: 100%;
  background: linear-gradient(90deg, #f0f0f0, #e0e0e0, #f0f0f0);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}


/* + scales */
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
/* - scales */

/* + realtime */
/* removed .rt-title indicator styles (not used) */
.rt-time {
  font-size: 0.8em;
  font-weight: 300;
}
.rt-unit,
.rt-number {
  font-size: 0.8em;
  font-weight: 900;
}

.rt-number {
  color: var(--color-blue);
}

/* - realtime */

.sensor-info {
  text-align: center;
}

.sensor-panel {
  flex-shrink: 0;
  display: flex;
  justify-content: space-around;
  gap: calc(var(--gap) * 0.5);
  flex-wrap: wrap;
  border-top: 2px solid var(--color-dark);
  background-color: var(--color-light);
  box-shadow: 0 -6px 12px 0 rgba(0, 0, 0, 0.1);
}

.panel-button {
  background: transparent;
  border: none !important;
  cursor: pointer;
  padding: calc(var(--gap) * 0.5) calc(var(--gap) * 1.5);
  color: var(--color-text);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  top: 2px;
  font-size: calc(var(--font-size) * 1.2);
  gap: calc(var(--gap) * 0.5);
  font-weight: 600;
}

.panel-button:hover {
  color: var(--color-link);
}

.panel-button.active {
  color: var(--color-link);
  border-bottom: 2px solid var(--color-link);
}

.panel-button svg {
  width: 1.2em;
  height: 1.2em;
}

.tab-content {
  --tab-offset-x: 0;
  --tab-offset-y: calc(var(--gap) * 3);
  padding: var(--tab-offset-y) var(--tab-offset-x);
  position: relative;
}

.chart-tab {
  padding-top: calc(var(--tab-offset-y) * 0.65);
}

.demo-tab {
  padding-top: calc(var(--gap) * 1.35);
}

.story-day {
  --story-icon-size: 3rem;
  padding: calc(var(--gap) / 2);
  background-color: var(--color-light-gray);
  border: 1px solid var(--color-middle-gray);
  border-radius: var(--radius-sm);
  margin-bottom: var(--gap);
  display: grid;
  grid-template-columns: auto var(--story-icon-size);
  align-items: center;
}

.story-day__content {
  display: grid;
  grid-template-columns: var(--story-icon-size) auto;
  gap: var(--gap);
  align-items: center;
}

.story-day-icon {
  width: var(--story-icon-size);
  height: var(--story-icon-size);
  border-radius: calc(var(--story-icon-size) / 2);
  background: color-mix(in srgb, var(--story-color, var(--color-blue)) 14%, transparent);
  border: 1px solid
    color-mix(in srgb, var(--story-color, var(--color-blue)) 28%, rgba(0, 0, 0, 0.08));
  display: grid;
  place-items: center;
}

.story-day__content p {
  margin-bottom: 0.2rem;
}

.story-day-body__time {
  font-weight: 600;
}

.sensor-info-desc {
  text-align: center;
}

@media screen and (width < 700px) {

  .popup-js.active {
    left: 0;
    width: 100%;
    top: 0;
  }


  .panel-button, .panel-button span {
    display: block;
  }

}
</style>
