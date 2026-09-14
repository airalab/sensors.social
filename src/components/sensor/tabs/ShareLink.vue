<template>
  <section class="sharelink">
    <h4>{{ $t("Copy link to share") }}</h4>

    <div class="sharelink-copy">
      <Copy
        :msg="generatedLink"
        :title="t('sensorpopup.copyLink') || 'Copy Link'"
        :notify="t('details.copied')"
      />
      <span class="sharelink-preview-url">{{ generatedLink }}</span>
    </div>
  </section>

  <Accordion>
    <template #title>Advanced sharing</template>
    <div class="sharelink-settings">
      <div>
        <div class="sharelink-settings-item">
          <div>
            <label>
              <input type="checkbox" v-model="includeProvider" />
              {{ t("sensorpopup.provider") || "Provider" }}
            </label>
          </div>
          <select v-model="selectedProvider" :disabled="!includeProvider">
            <option value="realtime">Realtime</option>
            <option value="remote">Remote</option>
          </select>
        </div>

        <div class="sharelink-settings-item">
          <div>
            <label>
              <input type="checkbox" v-model="includeSensor" />
              {{ t("sensorpopup.infosensorid") || "Sensor" }}
            </label>
          </div>
          <select
            v-model="selectedSensor"
            :disabled="!includeSensor || sensorSelectOptions.length === 0"
          >
            <option v-for="opt in sensorSelectOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <div class="sharelink-settings-hint">
            {{
              includeSensor
                ? t("Share link will open selected sensor popup") ||
                  "Share link will open selected sensor popup"
                : t("Share by owner only (no sensor parameter)") ||
                  "Share by owner only (no sensor parameter)"
            }}
          </div>
        </div>

        <div class="sharelink-settings-item">
          <div>
            <label>
              <input type="checkbox" v-model="includeType" />
              {{ t("sensorpopup.type") || "Measurement Type" }}
            </label>
          </div>
          <select v-model="selectedType" :disabled="!includeType">
            <option v-for="option in typeOptions" :key="option.value" :value="option.value">
              {{ option.name }}
            </option>
          </select>
        </div>

        <div class="sharelink-settings-item" v-if="selectedProvider !== 'realtime'">
          <div>
            <label>
              <input type="checkbox" v-model="includeDate" />
              {{ t("sensorpopup.date") || "Date" }}
            </label>
          </div>
          <input type="date" v-model="selectedDate" :max="maxDate" :disabled="!includeDate" />
        </div>

        <button
          @click.prevent="handleShareLink"
          class="button sharelink-action"
          :title="t('sensorpopup.sharelink')"
        >
          <font-awesome-icon icon="fa-solid fa-link" v-if="!state.shareLinkCopied" />
          <font-awesome-icon icon="fa-solid fa-check" v-else />
          <span class="sharelink-label">{{ t("sensorpopup.copyLink") || "Copy Link" }}</span>
        </button>
      </div>
    </div>
  </Accordion>

  <div class="og-preview-card" v-if="ogPreviewData">
    <div class="og-preview-image">
      <img :src="ogPreviewData.image" :alt="ogPreviewData.title" />
    </div>
    <div class="og-preview-content">
      <div class="og-preview-site">{{ ogPreviewData.siteName }}</div>
      <div class="og-preview-title">{{ ogPreviewData.title }}</div>
      <div class="og-preview-description">{{ ogPreviewData.description }}</div>
      <div class="og-preview-url">{{ ogPreviewData.url }}</div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onBeforeUnmount, getCurrentInstance, watch, inject } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { SENSOR_PAGE_META_KEY } from "@/composables/useSensorPageMeta";
import { dayISO } from "../../../utils/date";
import measurements from "../../../measurements";
import { settings } from "@config";
import Copy from "../../controls/Copy.vue";
import Accordion from "../../controls/Accordion.vue";

const props = defineProps({
  log: {
    type: Array,
    default: () => [],
  },
  point: {
    type: Object,
    default: () => null,
  },
});

const state = reactive({
  shareLinkCopied: false,
});
const timer = ref(null);

const { t, locale } = useI18n();
const { proxy } = getCurrentInstance();
const route = useRoute();

// Выбранные значения
const selectedProvider = ref(route.query.provider || "realtime");
const selectedType = ref(route.query.type || "pm10");
const selectedDate = ref(route.query.date || dayISO());
const selectedSensor = ref("");

// Флаги для включения параметров в URL
// Default share style:
// - always include concrete `sensor=` by default so a pasted link opens the popup immediately
// - user can still uncheck "Sensor" to share by owner only
const includeSensor = ref(true);
const includeProvider = ref(!!route.query.provider);
const includeType = ref(!!route.query.type);
// Date is opt-in: a shared link should show current data unless the user pins a day explicitly.
const includeDate = ref(false);

// Получаем доступные типы из данных сенсора
const availableTypes = computed(() => {
  const typesSet = new Set();

  if (Array.isArray(props.log) && props.log.length > 0) {
    props.log.forEach((item) => {
      if (item?.data) {
        Object.keys(item.data).forEach((key) => {
          typesSet.add(key.toLowerCase());
        });
      }
    });

    // Добавляем AQI если есть данные PM2.5 и PM10
    const hasPM25 = props.log.some((item) => item?.data?.pm25);
    const hasPM10 = props.log.some((item) => item?.data?.pm10);
    if (hasPM25 && hasPM10) {
      typesSet.add("aqi");
    }
  }

  return typesSet;
});

// Опции для выбора типа данных - только те, что есть в сенсоре
const typeOptions = computed(() => {
  const currentLocale = locale.value || "en";

  return Array.from(availableTypes.value)
    .filter((key) => measurements[key]) // Проверяем, что тип существует в measurements
    .map((key) => {
      const info = measurements[key];
      return {
        value: key,
        name:
          info.nameshort?.[currentLocale] ||
          info.name?.[currentLocale] ||
          info.label ||
          key.toUpperCase(),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
});

// Максимальная дата (сегодня)
const maxDate = computed(() => dayISO());

// Синхронизируем с текущим URL при монтировании
watch(
  () => route.query.provider,
  (newProvider) => {
    if (newProvider) {
      selectedProvider.value = newProvider;
      includeProvider.value = true;
    }
  },
  { immediate: true }
);

watch(
  () => route.query.type,
  (newType) => {
    if (newType && availableTypes.value.has(newType.toLowerCase())) {
      selectedType.value = newType;
      includeType.value = true;
    }
  },
  { immediate: true }
);

// Если выбранный тип недоступен, выбираем первый доступный
watch(
  typeOptions,
  (options) => {
    if (options.length > 0 && !availableTypes.value.has(selectedType.value.toLowerCase())) {
      selectedType.value = options[0].value;
    }
  },
  { immediate: true }
);

watch(
  () => route.query.date,
  (newDate) => {
    if (newDate) {
      selectedDate.value = newDate;
    }
  },
  { immediate: true }
);

// Генерируем ссылку на основе выбранных параметров
const generatedLink = computed(() => {
  const queryParams = new URLSearchParams();

  // Add owner only if we actually have it (legacy sensors keep old URL)
  const owner = props.point?.owner ? String(props.point.owner).trim() : "";
  if (owner) {
    queryParams.set("owner", owner);
  }

  // Include sensor only if explicitly enabled (or legacy fallback will enable it).
  const sensorId = String(selectedSensor.value || "").trim();
  if (includeSensor.value && sensorId) {
    queryParams.set("sensor", sensorId);
  }

  // Добавляем выбранный тип данных только если чекбокс отмечен
  if (includeType.value && selectedType.value) {
    queryParams.set("type", selectedType.value);
  }

  // Добавляем выбранный провайдер только если чекбокс отмечен
  if (includeProvider.value && selectedProvider.value) {
    queryParams.set("provider", selectedProvider.value);
  }

  // Добавляем дату только если чекбокс отмечен и провайдер не realtime
  if (includeDate.value && selectedProvider.value !== "realtime" && selectedDate.value) {
    queryParams.set("date", selectedDate.value);
  }

  const queryString = queryParams.toString();
  const shareBase = String(settings?.SHARE_URL || "").replace(/\/$/, "");
  const useShareBase = Boolean(shareBase && includeSensor.value && sensorId);
  const baseUrl = useShareBase ? shareBase : window.location.origin + route.path;
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
});

const activeSensorId = computed(() =>
  String(route.query.sensor || props.point?.sensor_id || "").trim()
);

const sensorSelectOptions = computed(() => {
  const active = activeSensorId.value;
  const list = Array.isArray(props.point?.ownerSensorsWithData)
    ? props.point.ownerSensorsWithData
    : [];
  const ids = new Set();
  if (active) ids.add(active);
  for (const o of list) {
    // show only sensors that actually have data
    if (o?.hasData !== true) continue;
    const id = String(o?.id || "").trim();
    if (id) ids.add(id);
  }
  return Array.from(ids).map((id) => ({
    value: id,
    label: id === active ? `${id} (active)` : id,
  }));
});

// Keep selected sensor in sync with active sensor
watch(
  activeSensorId,
  (sid) => {
    // Always default to include the specific sensor so the link deep-links to the popup.
    includeSensor.value = true;
    if (sid) selectedSensor.value = sid;
  },
  { immediate: true }
);

const pageMeta = inject(SENSOR_PAGE_META_KEY, null);

function readMetaContent(selector) {
  if (typeof document === "undefined") return "";
  return document.querySelector(selector)?.getAttribute("content") || "";
}

// Preview matches MetaInfo (reactive when sensor / address / URL params change).
const ogPreviewData = computed(() => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return {
    siteName:
      readMetaContent('meta[property="og:site_name"]') ||
      settings?.SITE_NAME ||
      "Sensors.social",
    title:
      pageMeta?.pageTitle?.value ||
      readMetaContent('meta[property="og:title"]') ||
      (typeof document !== "undefined" ? document.title : "") ||
      settings?.TITLE ||
      "",
    description:
      pageMeta?.pageDescription?.value ||
      readMetaContent('meta[name="description"]') ||
      readMetaContent('meta[property="og:description"]') ||
      settings?.DESC ||
      "",
    image:
      readMetaContent('meta[property="og:image"]') ||
      (origin ? `${origin}/og-default.webp` : "/og-default.webp"),
    url: generatedLink.value,
  };
});

const resetState = (delay = 2000) => {
  if (timer.value) {
    clearTimeout(timer.value);
  }
  timer.value = setTimeout(() => {
    state.shareLinkCopied = false;
    timer.value = null;
  }, delay);
};

const copyToClipboard = async (value) => {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "readonly");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
};

const handleShareLink = async () => {
  try {
    await copyToClipboard(generatedLink.value);
    state.shareLinkCopied = true;
    resetState();
    proxy?.$notify?.({
      position: "top right",
      text: t("details.copied"),
    });
  } catch (error) {
    console.warn("Failed to copy link:", error);
  }
};

onBeforeUnmount(() => {
  if (timer.value) clearTimeout(timer.value);
});
</script>

<style scoped>
.sharelink {
  margin-bottom: calc(var(--gap) * 3);
}

.sharelink-copy {
  display: flex;
  align-items: center;
}

.sharelink-preview-url {
  font-family: monospace;
  font-size: 0.85em;
  word-break: break-all;
}

.og-preview-card {
  border: 1px solid var(--color-gray, #e0e0e0);
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--color-light, #fff);
  max-width: 100%;
}

.og-preview-image {
  width: 100%;
  height: 300px;
  overflow: hidden;
  background-color: var(--color-gray, #f0f0f0);
  display: flex;
  align-items: center;
  justify-content: center;
}

.og-preview-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.og-preview-content {
  padding: var(--gap);
  display: flex;
  flex-direction: column;
  gap: calc(var(--gap) * 0.5);
}

.og-preview-site {
  font-size: 0.75em;
  color: var(--color-gray, #666);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.og-preview-title {
  font-size: 1em;
  font-weight: bold;
  color: var(--color-dark, #333);
  line-height: 1.3;
}

.og-preview-description {
  font-size: 0.85em;
  color: var(--color-gray, #666);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.og-preview-url {
  font-size: 0.75em;
  color: var(--color-gray, #999);
  font-family: monospace;
  word-break: break-all;
  margin-top: calc(var(--gap) * 0.5);
}

.sharelink-settings {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr)) auto;
  gap: calc(var(--gap) * 2);
  align-items: end;
}

@media screen and (width < 950px) {
  .sharelink-settings {
    grid-template-columns: 1fr;
    align-items: stretch;
    gap: calc(var(--gap) * 2);
  }
}

.sharelink-settings-item {
  display: flex;
  flex-direction: column;
  gap: calc(var(--gap) * 0.5);
}

.sharelink-settings-hint {
  font-size: 0.8em;
  color: var(--color-gray, #666);
  line-height: 1.2;
}

.sharelink-advanced {
  display: grid;
  gap: calc(var(--gap) * 1.2);
}

.sharelink-presets {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--gap) * 0.5);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: rgba(0, 0, 0, 0.02);
  border-radius: 999px;
  padding: 6px 10px;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}

.chip:hover {
  background: rgba(0, 0, 0, 0.04);
  transform: translateY(-1px);
}

.chip.active {
  border-color: rgba(80, 120, 255, 0.55);
  background: rgba(80, 120, 255, 0.1);
  box-shadow: 0 0 0 1px rgba(80, 120, 255, 0.2);
}

.sharelink-action {
  white-space: nowrap;
  height: 44px;
  align-self: end;
  padding-left: calc(var(--gap) * 1);
  padding-right: calc(var(--gap) * 1);
}

.sharelink-label {
  margin-left: calc(var(--gap) * 0.45);
}

@media screen and (width < 950px) {
  .sharelink-action {
    width: fit-content;
    justify-self: start;
    align-self: start;
  }
}

.sharelink-settings-item label {
  display: flex;
  align-items: center;
  gap: calc(var(--gap) * 0.5);
  font-size: 0.9em;
  font-weight: 700;
  cursor: pointer;
}

.sharelink-settings-item label input[type="checkbox"] {
  cursor: pointer;
}
</style>
