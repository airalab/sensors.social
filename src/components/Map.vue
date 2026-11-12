<template>
  <div :class="{ inactive: mapState.mapinactive.value }" class="mapcontainer" id="map"></div>
  <Footer
    :geoavailable="geoavailable"
    :geoisloading="geoisloading"
    :mapRef="mapRef"
    @center-on-user="resetgeo"
    @clickMessage="handleMessageClick"
    ref="footerRef"
  />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { settings } from "@config";
import { toRaw } from "vue";
import Footer from "../components/footer/Footer.vue";
import { drawuser, init, removeMap, setTheme, moveMap, initMapContext } from "../utils/map/map";
import {
  getMapThemeConfig,
  resolveInitialMapTheme,
  resolveMapColorScheme,
} from "../utils/map/themeScheme";
import { init as initSensors } from "../utils/map/sensors";
import { init as initMessages } from "../utils/map/messages";
import { destroyWindLayer } from "../utils/map/wind";
import { useMap } from "@/composables/useMap";
import { useBookmarks } from "@/composables/useBookmarks";
import { getDefaultMapView } from "@/utils/map/defaultView";

// Props and emits
const props = defineProps({
  mapRef: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["clickMarker", "clickMessage"]);

// Ref для Footer компонента
const footerRef = ref(null);
const mapRef = ref(null);

// Функция для показа тултипа в Footer
const showGeoTip = (message) => {
  if (footerRef.value && footerRef.value.opengeotip) {
    footerRef.value.opengeotip(message);
  }
};

// Обработчик клика на маркер сообщения из Footer
const handleMessageClick = (messageData) => {
  emit("clickMessage", messageData);
};

// Composables
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const mapState = useMap();
const { idbBookmarkGet } = useBookmarks();

// Reactive state
const userposition = ref(null);
const geoavailable = ref(false);
const geoisloading = ref(false);
const geomsg = ref("");
const geomsgopened = ref(false);
const geomsgopenedtime = ref(5000); // 5 seconds
const geomsgopenedtimer = ref(null);
const map = ref(null);

const currentTheme = ref(resolveInitialMapTheme());

// Computed properties
const theme = computed(() => currentTheme.value);

// Functions
const themelistener = ({ matches }) => {
  if (!matches) return;

  const savedMapTheme = localStorage.getItem("mapTheme");
  const themeCfg = getMapThemeConfig();
  if (savedMapTheme === "satellite" && themeCfg.satellite) {
    return;
  }

  currentTheme.value = resolveMapColorScheme(themeCfg);
  setTheme(theme.value);
};

// Функция для обновления темы из внешних компонентов
const updateTheme = (newTheme) => {
  currentTheme.value = newTheme;
  setTheme(newTheme);
};

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

// Загружает позицию карты из localStorage или использует настройки по умолчанию
const getlocalmappos = () => {
  const stored = localStorage.getItem("map-position");
  const lastsettings = stored || JSON.stringify(getDefaultMapView());

  const { lat, lng, zoom } = JSON.parse(lastsettings);
  mapState.setMapSettings(route, router, { lat, lng, zoom });
};

// Проверяет, есть ли координаты в URL
const checkPosFromURI = () => {
  return !!(route.query.lat && route.query.lng && route.query.zoom);
};

// Загружает позицию карты из URL параметров
const setPosFromURI = () => {
  const lat = route.query.lat;
  const lng = route.query.lng;
  const zoom = route.query.zoom || settings.MAP.zoom;

  // Guard against corrupted URL params (e.g. sensor_id accidentally written into lat)
  const nLat = Number(lat);
  const nLng = Number(lng);
  const nZoom = Number(zoom);
  if (!Number.isFinite(nLat) || !Number.isFinite(nLng) || !Number.isFinite(nZoom)) {
    setPosDefault();
    return;
  }

  mapState.setMapSettings(route, router, { lat: nLat, lng: nLng, zoom: nZoom });
};

// Устанавливает позицию карты по умолчанию (глобальный обзор, без регионального центра)
const setPosDefault = () => {
  const { lat, lng, zoom } = getDefaultMapView();
  mapState.setMapSettings(route, router, { lat, lng, zoom });
};

// Инициализирует позицию карты: URL → localStorage → настройки по умолчанию
const initializeMapPosition = () => {
  if (checkPosFromURI()) {
    setPosFromURI();
    return t("geolocationfromparams");
  } else if (localStorage.getItem("map-position")) {
    getlocalmappos();
    return t("geolocationlocal");
  } else {
    setPosDefault();
    return t("geolocationdefault");
  }
};

// Получает текущую геолокацию пользователя через браузер
const getUserGeolocation = () => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userposition.value = [position.coords.latitude, position.coords.longitude];
        mapState.setMapSettings(route, router, {
          lat: userposition.value[0],
          lng: userposition.value[1],
          zoom: 20,
        });

        if (userposition.value && map.value) {
          drawuser(userposition.value, mapState.mapposition.value.zoom);
        }

        resolve(t("geolocationisdetermined"));
      },
      (e) => reject(`${t("geolocationerror")} ${e.code}]`),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 5 * 60 * 1000,
      }
    );
  });
};

// Устанавливает позицию карты: инициализация или принудительная геолокация
const setgeo = (force = false) => {
  return new Promise((resolve, reject) => {
    geoisloading.value = true;

    if (!("geolocation" in navigator)) {
      geoavailable.value = false;
      reject(t("geolocationnotavailable"));
      return;
    }

    geoavailable.value = true;

    if (force) {
      getUserGeolocation().then(resolve).catch(reject);
    } else {
      const message = initializeMapPosition();
      resolve(message);
    }
  });
};

// Принудительно определяет геолокацию пользователя и обновляет карту
const resetgeo = async () => {
  closegeotip();

  try {
    const message = await setgeo(true);
    mapState.setMapSettings(route, router, {
      lat: mapState.mapposition.value.lat,
      lng: mapState.mapposition.value.lng,
      zoom: mapState.mapposition.value.zoom,
    });
    moveMap(
      [mapState.mapposition.value.lat, mapState.mapposition.value.lng],
      mapState.mapposition.value.zoom
    );
    showGeoTip(message);
  } catch (error) {
    showGeoTip(error);
  } finally {
    geoisloading.value = false;
  }
};

// Обновляет позицию карты при изменении зума или перемещении
const onMapMove = (e) => {
  const newLat = e.target.getCenter().lat.toFixed(4);
  const newLng = e.target.getCenter().lng.toFixed(4);
  const newZoom = e.target.getZoom();

  const settings = {
    lat: parseFloat(newLat),
    lng: parseFloat(newLng),
    zoom: parseInt(newZoom),
  };

  mapState.setMapSettings(route, router, settings);
};

// Настраивает обработчики событий карты (зум, перемещение)
const setupMapEventHandlers = () => {
  map.value.on("zoomend", onMapMove);
  map.value.on("moveend", (e) => {
    setTimeout(() => onMapMove(e), 50);
  });
};

// Инициализирует компоненты карты: маркеры, ветер, закладки
const initializeMapComponents = async () => {
  // Инициализируем контекст карты перед инициализацией сенсоров
  initMapContext(
    toRaw(map.value),
    (data) => {
      emit("clickMarker", data);
    },
    mapState.currentUnit.value
  );

  initSensors((data) => {
    emit("clickMarker", data);
  }, mapState.currentUnit.value);

  // Инициализируем слой сообщений
  initMessages((data) => {
    emit("clickMessage", data);
  });

  if (mapState.currentProvider.value === "realtime") {
    // await initWindLayer();
  }

  await idbBookmarkGet();
};

// Загружает и инициализирует карту со всеми компонентами
const loadMap = async () => {
  geoisloading.value = false;

  map.value = init(
    [mapState.mapposition.value.lat, mapState.mapposition.value.lng],
    mapState.mapposition.value.zoom,
    theme.value
  );
  mapState.setMapSettings(route, router, {
    lat: mapState.mapposition.value.lat,
    lng: mapState.mapposition.value.lng,
    zoom: mapState.mapposition.value.zoom,
  });
  moveMap(
    [mapState.mapposition.value.lat, mapState.mapposition.value.lng],
    mapState.mapposition.value.zoom
  );

  setupMapEventHandlers();
  await initializeMapComponents();
};

// Watchers
watch(geoisloading, (v) => {
  console.debug("geoisloading changed", v);
});

watch(geomsg, (v) => {
  console.debug("geomsg changed", v);
});

// Настраивает слушатели изменения темы системы
const setupThemeListeners = () => {
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", themelistener);
    window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", themelistener);
  }
};

// Инициализирует карту с определением геолокации
const initializeMapWithGeolocation = async () => {
  try {
    const message = await setgeo();
    showGeoTip(message);
  } catch (error) {
    showGeoTip(error + `, ${t("geolocationdefaultsetup")}`);
  }

  await loadMap();
};

onMounted(async () => {
  setupThemeListeners();
  await initializeMapWithGeolocation();

  // Устанавливаем глобальную ссылку на функцию updateTheme
  window.mapUpdateTheme = updateTheme;
});

onUnmounted(() => {
  // Очищаем ресурсы ветра перед удалением карты
  destroyWindLayer();
  removeMap();
  // Очищаем глобальную ссылку
  window.mapUpdateTheme = null;
});

// Экспортируем функцию для обновления темы
defineExpose({
  updateTheme,
});
</script>

<style scoped>
.mapcontainer {
  background-color: var(--color-light-gray);
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  width: 100%;
  height: 100svh;
  overflow: hidden;
}
</style>
