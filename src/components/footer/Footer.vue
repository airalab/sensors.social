<template>
  <div class="mapcontrols">
    <div class="flexline footercontrol-wide">
      <ToggleButton
        v-if="settings.WIND_PROVIDER"
        :model-value="wind"
        @update:modelValue="onWindToggle"
        icon-class="fa-solid fa-wind"
        class="wind-toggle"
        :disabled="!windAllowed"
        :label="$t('layer.wind')"
      />

      <ToggleButton
        v-if="settings.AOD_WMS"
        :model-value="aod"
        @update:modelValue="onAodToggle"
        icon-class="fa-solid fa-smog"
        class="aod-toggle"
        :disabled="!aodAllowed"
        :label="$t('layer.aod')"
        :title="aodAllowed ? $t('layer.aodHint') : $t('layer.aodUnavailable')"
      />

      <ToggleButton
        v-if="settings.FIRES"
        :model-value="fires"
        @update:modelValue="onFiresToggle"
        icon-class="fa-solid fa-fire"
        class="fires-toggle"
        :disabled="!firesAllowed"
        :label="$t('layer.fires')"
        :title="firesAllowed ? $t('layer.firesHint') : $t('layer.firesUnavailable')"
      />

      <ToggleButton
        v-if="hasMessagesData"
        v-model="messages"
        :icon-class="messages ? 'fa-solid fa-comment' : 'fa-regular fa-comment'"
        class="messages-toggle"
        :label="$t('layer.messages')"
      />

      <div id="historyimport" class="popover-bottom-left popover" popover>
        <section>
          <h3>{{ $t("history.title") }}</h3>
          <HistoryImport />
        </section>
      </div>
      <button
        class="popovercontrol button-round-outline button-round-outline-labeled"
        popovertarget="historyimport"
      >
        <font-awesome-icon icon="fa-solid fa-download" />
        <span>{{ $t("history.reports") }}</span>
      </button>
    </div>

    <div class="flexline footercontrol-wide mapcontrols-primary">
      <ProviderType />

      <!-- выбор даты -->
      <input type="date" v-model="start" :max="maxDate" :disabled="realtime" />

      <!-- выбор измерения -->
      <select v-model="type" v-if="availableOptions?.length > 0">
        <option v-for="opt in availableOptions" :key="opt.value" :value="opt.value">
          {{ opt.name }}
        </option>
      </select>
    </div>

    <div class="footercontrol-narrow">
      <div id="mapsettings" class="popover-bottom-left popover" popover>
        <section>
          <h3>Map settings</h3>

          <div class="mapsettings-content">

            <!-- выбор даты -->
            <input type="date" v-model="start" :max="maxDate" :disabled="realtime" />

            <div class="flexline">
              <ProviderType />

              <!-- выбор измерения -->
              <select v-model="type" v-if="sensorsUI.sensors.length > 0 && availableOptions?.length > 0">
                <option v-for="opt in availableOptions" :key="opt.value" :value="opt.value">
                  {{ opt.name }}
                </option>
              </select>
            </div>

            <div class="flexline">
              <ToggleButton
                v-if="settings.WIND_PROVIDER"
                :model-value="wind"
                @update:modelValue="onWindToggle"
                icon-class="fa-solid fa-wind"
                class="wind-toggle"
                :disabled="!windAllowed"
                :label="$t('layer.wind')"
              />

              <ToggleButton
                v-if="settings.AOD_WMS"
                :model-value="aod"
                @update:modelValue="onAodToggle"
                icon-class="fa-solid fa-smog"
                class="aod-toggle"
                :disabled="!aodAllowed"
                :label="$t('layer.aod')"
                :title="aodAllowed ? $t('layer.aodHint') : $t('layer.aodUnavailable')"
              />

              <ToggleButton
                v-if="settings.FIRES"
                :model-value="fires"
                @update:modelValue="onFiresToggle"
                icon-class="fa-solid fa-fire"
                class="fires-toggle"
                :disabled="!firesAllowed"
                :label="$t('layer.fires')"
                :title="firesAllowed ? $t('layer.firesHint') : $t('layer.firesUnavailable')"
              />

              <ToggleButton
                v-if="hasMessagesData"
                v-model="messages"
                :icon-class="messages ? 'fa-solid fa-comment' : 'fa-regular fa-comment'"
                class="messages-toggle"
                :label="$t('layer.messages')"
              />
            </div>

            <Accordion>
              <template #title>{{ $t("history.title") }}</template>
              <HistoryImport />
            </Accordion>
          </div>
        </section>
      </div>
      <button class="button-round-outline popovercontrol" popovertarget="mapsettings">
        <font-awesome-icon icon="fa-solid fa-gear" />
      </button>
    </div>

    <div class="flexline">
      <div class="mapcontrols-geo">
        <button
          v-if="settings.MAP?.theme?.satellite"
          @click="toggleMapTheme"
          :title="mapTheme === 'satellite' ? 'Switch to default theme' : 'Switch to satellite view'"
        >
          <font-awesome-icon
            :icon="mapTheme === 'default' ? 'fa-solid fa-satellite' : 'fa-regular fa-map'"
          />
        </button>

        <button
          v-if="geoavailable"
          class="geolocation"
          @click.prevent="centerOnUser"
          :area-label="$t('showlocation')"
          :title="geoisloading ? $t('locationloading') : $t('showlocation')"
        >
          <font-awesome-icon icon="fa-solid fa-location-arrow" :fade="geoisloading" />

          <div
            class="geolocation-tip"
            v-if="geomsg !== ''"
            :class="geomsgopened ? 'opened' : 'closed'"
          >
            {{ geomsg }}
            <font-awesome-icon
              icon="fa-solid fa-xmark"
              class="geolocation-tipclose"
              @click.stop="geomsg = ''"
            />
          </div>
        </button>

        <button @click="zoomOut" :disabled="isMinZoom" title="Zoom out">
          <font-awesome-icon icon="fa-solid fa-minus" />
        </button>

        <button @click="zoomIn" :disabled="isMaxZoom" title="Zoom in">
          <font-awesome-icon icon="fa-solid fa-plus" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, defineProps, defineEmits, reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { dayISO, dayBoundsUnix, parseInputDate } from "@/utils/date";
import { settings } from "@config";
import HistoryImport from "./HistoryImport.vue";
import ToggleButton from "../controls/ToggleButton.vue";
import { instanceMap } from "../../utils/map/map";
import { resolveMapColorScheme } from "../../utils/map/themeScheme";
import { initWindLayer, switchWindLayer, destroyWindLayer } from "../../utils/map/wind";
import { switchAodLayer, isAodAvailable } from "../../utils/map/aod";
import { switchFiresLayer, isFiresAvailable } from "../../utils/map/fires";
import measurements from "../../measurements";
import { sortMapLayerUnits } from "../../measurements/tools";
// import { getTypeProvider } from "../../utils/utils"; // deprecated
import {
  listMeasurementsOnMap,
  collectUnitsFromMapSensors,
  sensorFetchBoundsForDate,
} from "../../utils/map/sensors/requests";
import ProviderType from "../ProviderType.vue";
// import { setMapSettings, getPriorityValue } from "../../utils/utils"; // Перенесено в useMap

import { useMap } from "@/composables/useMap";
import { useMessages } from "../../composables/useMessages";
import { useSensors } from "../../composables/useSensors";
import Accordion from "../controls/Accordion.vue";

// Переменные для геолокации (должны быть объявлены рано для CSS v-bind)
const geomsg = ref("");
const geomsgopened = ref(false);
const geomsgopenedtime = ref(5000); // 5 seconds
const geomsgopenedtimer = ref(null);

// props и emits
const props = defineProps({
  geoavailable: {
    type: Boolean,
    default: false,
  },
  geoisloading: {
    type: Boolean,
    default: false,
  },
  mapRef: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["center-on-user", "opengeotip", "clickMessage"]);

// инстансы
const mapState = useMap();
const router = useRouter();
const route = useRoute();
const { locale: i18nLocale, t } = useI18n();

// состояние
const start = ref(route.query.date || mapState.currentDate.value || dayISO());
const maxDate = ref(dayISO());
const realtime = computed(() => mapState.currentProvider.value === "realtime");
const readWindPref = () => {
  try {
    const stored = localStorage.getItem("wind");
    // По умолчанию считаем, что пользователь ветром не “отключал”
    return stored === null ? true : stored === "true";
  } catch (e) {
    // Если localStorage недоступен — не ограничиваем доступ
    return true;
  }
};
const wind = ref(readWindPref());
const isToday = computed(() => start.value === dayISO());
const windAllowed = computed(() => realtime.value || isToday.value);
const messages = ref(settings.SERVICES?.messages || false);
const readAodPref = () => {
  try {
    const stored = localStorage.getItem("aod");
    // По умолчанию включён, как ветер; выключение пользователем запоминаем
    return stored === null ? true : stored === "true";
  } catch (e) {
    return true;
  }
};
const aod = ref(readAodPref());
const aodAllowed = computed(() => isAodAvailable(start.value));
const readFiresPref = () => {
  try {
    // По умолчанию выключен: точки пожаров отвлекают от датчиков
    return localStorage.getItem("fires") === "true";
  } catch (e) {
    return false;
  }
};
const fires = ref(readFiresPref());
const firesAllowed = computed(() => isFiresAvailable(start.value));

// Computed для проверки, есть ли данные сообщений для отображения
const hasMessagesData = computed(() => {
  return settings.SERVICES?.messages && messagesUI.hasMessages;
});

// Инициализируем useMessages и useSensors
const localeComputed = computed(() => {
  return i18nLocale.value || localStorage.getItem("locale") || "en";
});
const messagesUI = reactive(useMessages(localeComputed));
const sensorsUI = reactive(useSensors());

// выбор измерения
const type = computed({
  get: () => mapState.currentUnit.value,
  set: (val) => {
    mapState.setMapSettings(route, router, { type: val });
  },
});
const availableUnits = ref(["pm10"]);
const locale = computed(() => {
  return i18nLocale.value || localStorage.getItem("locale") || "en";
});

// Check if localStorage is available
const isLocalStorageAvailable = () => {
  try {
    const test = "localStorage_test";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

const availableOptions = computed(() => {
  let opts = availableUnits.value
    .map((key) => {
      const info = measurements[key];
      if (!info) {
        return null;
      }
      return {
        value: key,
        name: info.nameshort?.[locale.value] || info.label,
      };
    })
    .filter((item) => Boolean(item));

  // Remove legacy / map-unavailable options
  opts = opts.filter((opt) => opt.value !== "noise" && opt.value !== "aqi");

  return opts;
});

const pickFallbackUnit = (units) => {
  if (units.includes("pm10")) return "pm10";
  if (units.includes("pm25")) return "pm25";
  return units[0] || "pm10";
};

const ensureValidUnitSelection = (units) => {
  const current = type.value;
  if (current === "aqi" || !units.includes(current)) {
    type.value = pickFallbackUnit(units);
  }
};

/** Remote: maxdata on map. Realtime: live sensors on map. */
const loadAvailableUnits = async () => {
  try {
    let units;
    if (realtime.value) {
      units = collectUnitsFromMapSensors(sensorsUI.sensors);
    } else {
      const { end } = sensorFetchBoundsForDate(start.value);
      units = await listMeasurementsOnMap(start.value, end);
    }
    availableUnits.value = sortMapLayerUnits(units.length > 0 ? units : ["pm10"]);
    ensureValidUnitSelection(availableUnits.value);
  } catch (e) {
    console.error("Failed to load available measurements:", e);
  }
};

const onAodToggle = (enabled) => {
  aod.value = enabled;
  try {
    localStorage.setItem("aod", String(enabled));
  } catch (e) {
    // Если localStorage недоступен — работаем без сохранения
  }
};

const onFiresToggle = (enabled) => {
  fires.value = enabled;
  try {
    localStorage.setItem("fires", String(enabled));
  } catch (e) {
    // Если localStorage недоступен — работаем без сохранения
  }
};

// type теперь computed, поэтому watcher не нужен

// type теперь computed, поэтому синхронизация не нужна

watch(start, async (newDate) => {
  // Безопасно парсим дату из input
  const parsedDate = parseInputDate(newDate);

  // Устанавливаем новую дату и синхронизируем
  mapState.setMapSettings(route, router, { date: parsedDate });

  if (!realtime.value) {
    void loadAvailableUnits();
  }

  // Если слой сообщений включен, обновляем данные
  if (messages.value) {
    try {
      const startTimestamp = dayBoundsUnix(parsedDate).start;
      const endTimestamp = dayBoundsUnix(parsedDate).end;
      await messagesUI.loadMessages(startTimestamp, endTimestamp);
    } catch (error) {
      console.error("Failed to update messages for new date:", error);
    }
  }
});

// Watcher для изменений даты извне (например, из SensorPopup)
watch(
  () => mapState.currentDate.value,
  (newDate) => {
    if (newDate && newDate !== start.value) {
      start.value = newDate;
    }
  }
);
// Watcher для canHistory убран - инициализация теперь происходит в Main.vue
// Это предотвращает дублирующиеся вызовы handlerHistory

// Computed для получения актуальной даты (используем уже синхронизированное значение из mapState)
const currentDate = computed(() => {
  return mapState.currentDate.value;
});

// Единый watcher для синхронизации даты из любого источника
watch(
  currentDate,
  (newDate) => {
    if (newDate && newDate !== start.value) {
      start.value = newDate;
    }
  },
  { immediate: true }
);
// Логика слоя ветра: включаем только когда разрешено (realtime или "сегодня")
watch(
  [wind, windAllowed],
  async ([enabled, allowed]) => {
    let map = null;
    try {
      map = instanceMap();
    } catch {
      // Map isn't ready yet (init happens in Map component). We'll retry on mount.
      return;
    }

    if (enabled && allowed && settings.WIND_PROVIDER) {
      try {
        await initWindLayer();
        switchWindLayer(map, true);
      } catch (error) {
        console.error("Failed to initialize wind layer:", error);
        // Не ломаем поведение UI: просто выключаем слой
        destroyWindLayer();
      }
    } else {
      // Когда ветер запрещен (не realtime и не сегодня) — скрываем слой.
      // Когда `enabled=false` — дополнительно чистим ресурсы.
      switchWindLayer(map, false);
      if (!enabled) destroyWindLayer();
    }
  },
  { immediate: true }
);

// Слой AOD (пыль и дым из CAMS): следует за выбранной датой, WMS хранит только последние дни
watch(
  [aod, start],
  ([enabled, date]) => {
    let map = null;
    try {
      map = instanceMap();
    } catch {
      // Map isn't ready yet; onMounted retries.
      return;
    }
    switchAodLayer(map, enabled, date);
  },
  { immediate: true }
);

// Слой пожаров (VIIRS из NASA GIBS): следует за выбранной датой, архив с июля 2025
watch(
  [fires, start],
  ([enabled, date]) => {
    let map = null;
    try {
      map = instanceMap();
    } catch {
      // Map isn't ready yet; onMounted retries.
      return;
    }
    switchFiresLayer(map, enabled, date);
  },
  { immediate: true }
);

// watch(messages, (v) => switchMessagesLayer(instanceMap(), v));

watch(
  () => mapState.currentProvider.value,
  () => {
    void loadAvailableUnits();
  }
);

watch(
  () => sensorsUI.sensors,
  () => {
    if (realtime.value) void loadAvailableUnits();
  },
  { deep: true }
);

// загрузка списка измерений из API
onMounted(async () => {
  try {
    // Инициализируем ключ в localStorage, чтобы поведение было стабильным
    // даже при отсутствии записи у пользователя.
    if (isLocalStorageAvailable()) {
      const stored = localStorage.getItem("wind");
      if (stored === null) localStorage.setItem("wind", "true");
    }

    await loadAvailableUnits();
    ensureValidUnitSelection(availableUnits.value);

    // На старте компонента поднимаем ветер, если пользователь его не отключал
    // и текущий режим разрешает показывать (realtime или "сегодня").
    if (wind.value && windAllowed.value && settings.WIND_PROVIDER) {
      // Небольшая задержка для инициализации карты
      setTimeout(async () => {
        if (instanceMap()) {
          try {
            await initWindLayer();
            switchWindLayer(instanceMap(), true);
          } catch (error) {
            console.error("Failed to initialize wind layer on mount:", error);
            // UI state оставляем: просто не показываем слой
            destroyWindLayer();
          }
        }
      }, 500); // Увеличиваем задержку для гарантии инициализации карты
    }

    if (aod.value && settings.AOD_WMS) {
      setTimeout(() => {
        try {
          switchAodLayer(instanceMap(), aod.value, start.value);
        } catch (error) {
          console.error("Failed to initialize AOD layer on mount:", error);
        }
      }, 500);
    }

    if (fires.value && settings.FIRES) {
      setTimeout(() => {
        try {
          switchFiresLayer(instanceMap(), fires.value, start.value);
        } catch (error) {
          console.error("Failed to initialize fires layer on mount:", error);
        }
      }, 500);
    }

    // Инициализируем слой сообщений если поддерживается
    if (settings.SERVICES?.messages) {
      setTimeout(async () => {
        if (instanceMap()) {
          try {
            // Инициализируем слой сообщений
            messagesUI.initMessagesLayer((messageData) => {
              // Обработчик клика по маркеру сообщения
              handleMessageClick(messageData);
            });

            // Загружаем сообщения за текущий период для проверки наличия данных
            const startTimestamp = dayBoundsUnix(start.value).start;
            const endTimestamp = dayBoundsUnix(start.value).end;
            await messagesUI.loadMessages(startTimestamp, endTimestamp);

            // Показываем слой на карте только если тогл включен
            if (messages.value) {
              messagesUI.toggleMessagesLayer(true);
            }
          } catch (error) {
            console.error("Failed to initialize messages layer on mount:", error);
            messages.value = false;
          }
        }
      }, 500);
    }
  } catch (e) {
    console.error(e);
  }
});

// Toggle ветра: сохраняем в localStorage только факт "отключения" по действию пользователя.
const onWindToggle = (enabled) => {
  wind.value = enabled;
  try {
    localStorage.setItem("wind", String(enabled));
  } catch (e) {
    // Если localStorage недоступен — работаем без сохранения
  }
};

// type теперь computed, поэтому синхронизация не нужна

// Watcher для переключения слоя сообщений
watch(messages, async (enabled) => {
  if (enabled) {
    try {
      // Сначала инициализируем слой сообщений
      messagesUI.initMessagesLayer((messageData) => {
        // Обработчик клика по маркеру сообщения
        handleMessageClick(messageData);
      });

      // Показываем слой на карте
      messagesUI.toggleMessagesLayer(true);

      // Затем загружаем сообщения
      const startTimestamp = dayBoundsUnix(start.value).start;
      const endTimestamp = dayBoundsUnix(start.value).end;
      const result = await messagesUI.loadMessages(startTimestamp, endTimestamp);
    } catch (error) {
      console.error("Failed to initialize messages layer:", error);
      messages.value = false;
    }
  } else {
    // Скрываем слой сообщений
    messagesUI.toggleMessagesLayer(false);
    messagesUI.clearMessagesMarkers();
  }
});

// Функции для расширенной панели
const zoomIn = () => {
  const map = instanceMap();
  if (map) {
    map.zoomIn();
  }
};

const zoomOut = () => {
  const map = instanceMap();
  if (map) {
    map.zoomOut();
  }
};

// Проверяем граничные значения зума
const isMaxZoom = computed(() => {
  const currentZoom = Number(mapState.mapposition.value.zoom);
  return currentZoom >= 18;
});

const isMinZoom = computed(() => {
  const currentZoom = Number(mapState.mapposition.value.zoom);
  return currentZoom <= 3;
});

// Состояние темы карты
const mapTheme = ref(localStorage.getItem("mapTheme") || "default"); // 'default' или 'satellite'

// Функция переключения темы карты
const toggleMapTheme = () => {
  if (mapTheme.value === "default") {
    // Переключаемся на спутниковую карту из конфига
    mapTheme.value = "satellite";
    localStorage.setItem("mapTheme", "satellite");
    // Обновляем тему через глобальную функцию
    if (window.mapUpdateTheme) {
      window.mapUpdateTheme(settings.MAP.theme.satellite);
    }
  } else {
    // Возвращаемся к дефолтной теме (светлой/темной)
    mapTheme.value = "default";
    localStorage.setItem("mapTheme", "default");
    if (window.mapUpdateTheme) {
      window.mapUpdateTheme(resolveMapColorScheme());
    }
  }
};

// Переменные для геолокации (перемещены в начало файла)

// Закрывает tooltip с сообщением о геолокации
const closegeotip = () => {
  geomsg.value = "";
  geomsgopened.value = false;
  geomsgopenedtimer.value && clearTimeout(geomsgopenedtimer.value);
};

// Показывает tooltip с сообщением о геолокации на 5 секунд
const opengeotip = (msg) => {
  closegeotip();
  geomsg.value = msg;
  geomsgopened.value = true;
  geomsgopenedtimer.value = setTimeout(closegeotip, geomsgopenedtime.value);
};

// Функция позиционирования
const centerOnUser = () => {
  emit("center-on-user");
  opengeotip(t("locationloading"));
};

// Обработчик клика на маркер сообщения
const handleMessageClick = (messageData) => {
  // Эмитим событие для Main.vue
  emit("clickMessage", messageData);
};

// Делаем функции доступными для родительского компонента
defineExpose({
  opengeotip,
  closegeotip,
});
</script>

<style>
.popovercontrol.active {
  border-color: var(--color-blue);
}

.popovercontrol.active path {
  fill: var(--color-blue) !important;
}

/* AOD legend: Leaflet control, lifted above the footer controls */
.leaflet-bottom.leaflet-right .aod-legend {
  margin-bottom: calc(var(--app-inputheight) + var(--app-controlsgap) * 2);
  margin-right: var(--app-controlsgap);
  padding: 6px 8px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-light) 85%, transparent);
  color: var(--color-dark);
  font-size: 11px;
  line-height: 1.3;
  width: 170px;
}

.aod-legend-title {
  font-weight: 600;
}

.aod-legend-time {
  font-weight: 400;
  opacity: 0.7;
}

.aod-legend-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.aod-legend-name {
  width: 38px;
}

.aod-legend-scale {
  flex: 1;
  height: 8px;
  border-radius: 2px;
  background: linear-gradient(to right, #fff5eb, #fdd0a2, #fd8d3c, #d94801, #7f2704);
}

.aod-legend-labels {
  display: flex;
  justify-content: space-between;
  margin: 2px 0 0 44px;
}

.aod-legend-attr {
  margin-top: 3px;
  font-size: 9px;
  opacity: 0.7;
}

/* Fires legend; with both legends on, Leaflet puts the newer one on top */
.leaflet-bottom.leaflet-right .fires-legend {
  margin-bottom: calc(var(--app-inputheight) + var(--app-controlsgap) * 2);
  margin-right: var(--app-controlsgap);
  padding: 6px 8px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-light) 85%, transparent);
  color: var(--color-dark);
  font-size: 11px;
  line-height: 1.3;
  width: 170px;
}

.leaflet-bottom.leaflet-right .aod-legend:has(+ .fires-legend),
.leaflet-bottom.leaflet-right .fires-legend:has(+ .aod-legend) {
  margin-bottom: 4px;
}

.fires-legend-title {
  font-weight: 600;
}

.fires-legend-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(circle, #ffd666 0, #ff8000 45%, rgba(230, 60, 0, 0) 100%);
  vertical-align: middle;
}

.fires-legend-time {
  font-weight: 400;
  opacity: 0.7;
}

.fires-legend-attr {
  margin-top: 3px;
  font-size: 9px;
  opacity: 0.7;
}
</style>

<style scoped>
.mapcontrols {
  bottom: 0;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  left: 0;
  padding: 0 var(--app-controlsgap) var(--app-controlsgap);
  position: absolute;
  right: 0;
  z-index: 12;
  pointer-events: none;
}

.mapcontrols > * {
  pointer-events: all;
}

.mapcontrols-primary {
  flex-shrink: 0;
}

.popover-bottom-right,
.popover-bottom-left {
  bottom: calc(var(--app-inputheight) + var(--app-controlsgap) * 2);
  max-width: calc(100vw - var(--app-controlsgap) * 2);
}

.popover-bottom-right {
  right: var(--app-controlsgap);
}

.popover-bottom-left {
  left: var(--app-controlsgap);
}

.geolocation {
  position: relative;
}

.geolocation-tip {
  --gettime: v-bind("geomsgopenedtime");
  --openedtime: calc(var(--gettime) / 1000 * 1s);
  position: absolute;
  padding: 5px 25px 5px 10px;
  background-color: color-mix(in srgb, var(--color-dark) 70%, transparent);
  color: var(--color-light);
  backdrop-filter: blur(5px);
  font-weight: bold;
  border-radius: 2px;
  bottom: calc(var(--app-inputheight) + 10px);
  width: 220px;
  right: -10px;
  font-size: 0.9em;
}

.geolocation-tip:before {
  content: "";
  height: 2px;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background-color: var(--color-light);
  animation: rolldownLeft var(--openedtime) linear 0s forwards;
  transform-origin: 0 50%;
}

.geolocation-tip:after {
  content: "";
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid color-mix(in srgb, var(--color-dark) 70%, transparent);
  position: absolute;
  bottom: -10px;
  right: 15px;
}

.geolocation-tipclose {
  position: absolute;
  top: 5px;
  right: 5px;
}

.mapcontrols-geo {
  display: flex;
  gap: var(--gap);
  background-color: var(--color-light);
  color: var(--color-dark);
  border-radius: 40px;
  font-weight: bold;
  border: 2px solid var(--color-dark);
  padding: calc(var(--gap) * 0.5) var(--gap);
}

.mapcontrols-geo button {
  background-color: transparent;
  color: var(--color-dark);
  border: 0;
  cursor: pointer;
  font-size: 1.2em;
}

.mapcontrols-geo button[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

input[type="date"][disabled] {
  opacity: 0.7;
  cursor: not-allowed;
}

.footercontrol-narrow {
  display: none;
}


#mapsettings {
  min-width: 20vw;
}

.mapsettings-content {
  display: flex;
  flex-direction: column;
  gap: calc(var(--gap) * 3);
  max-height: 80svh;
  overflow-y: auto;
}

@media screen and (width < 820px) {
  .footercontrol-narrow {
    display: block;
  }

  .footercontrol-wide {
    display: none;
  }

  .mapcontrols-geo {
    padding: calc(var(--gap) * 1) calc(var(--gap) * 3);
    gap: calc(var(--gap) * 3);
  }

  .mapcontrols-geo button {
    font-size: 1.4em;
  }

  .button-round-outline {
    padding: calc(var(--gap) * 2.5);
  }
}
</style>
