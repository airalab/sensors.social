import { ref } from "vue";
import { settings } from "@config";
import { dayISO } from "@/utils/date";
import { getDefaultMapView } from "@/utils/map/defaultView";
import { canonicalMeasurementId } from "@/measurements/aliases";

const initialMapView = getDefaultMapView();

// Глобальное состояние карты (разделяется между всеми экземплярами composable)
const mapposition = ref({
  zoom: initialMapView.zoom,
  lat: initialMapView.lat,
  lng: initialMapView.lng,
});

const mapinactive = ref(false);

// Инициализация currentUnit
const getCurrentUnitValue = () => {
  const stored = localStorage.getItem("currentUnit");
  const config = settings?.MAP?.measure;
  const fallback = "pm10";

  // Если в localStorage есть строка - используем её
  if (stored && typeof stored === "string") {
    return stored.toLowerCase();
  }

  // Если в конфиге есть строка - используем её
  if (config && typeof config === "string") {
    return config.toLowerCase();
  }

  // Иначе fallback
  return fallback;
};

const currentUnit = ref(getCurrentUnitValue());
const currentDate = ref(dayISO());
const aqiVersion = ref(localStorage.getItem("aqiVersion") || "us");
const currentProvider = ref(
  localStorage.getItem("provider_type") || settings?.DEFAULT_TYPE_PROVIDER || "remote"
);
const timelineMode = ref("day");
const currentSensorId = ref(null);

export function useMap() {
  const toFinite = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const setmapposition = (lat, lng, zoom, save = true) => {
    const nextLat = toFinite(lat);
    const nextLng = toFinite(lng);
    const nextZoom = toFinite(zoom);
    if (nextLat === null || nextLng === null || nextZoom === null) {
      // Ignore invalid coordinates (e.g. sensor_id accidentally written into lat)
      return;
    }

    mapposition.value.lat = nextLat;
    mapposition.value.lng = nextLng;
    mapposition.value.zoom = nextZoom;

    if (save) {
      localStorage.setItem(
        "map-position",
        JSON.stringify({ lat: nextLat, lng: nextLng, zoom: nextZoom })
      );
    }
  };

  const setCurrentUnit = (unit) => {
    const u = canonicalMeasurementId(unit);
    currentUnit.value = u;
    try {
      localStorage.setItem("currentUnit", u);
    } catch {}
  };

  const setCurrentDate = (date) => {
    const d = String(date || dayISO());
    currentDate.value = d;
  };

  const setAQIVersion = (version) => {
    const v = String(version || "us");
    if (["us", "eu"].includes(v)) {
      aqiVersion.value = v;
      try {
        localStorage.setItem("aqiVersion", v);
      } catch {}
    }
  };

  const setCurrentProvider = (provider) => {
    const p = String(provider || "remote");
    if (["realtime", "remote"].includes(p)) {
      currentProvider.value = p;
      try {
        localStorage.setItem("provider_type", p);
      } catch {}
    }
  };

  const setTimelineMode = (mode, id) => {
    const m = String(mode || "day");
    if (["day", "week", "month", "realtime"].includes(m)) {
      timelineMode.value = m;
      currentSensorId.value = id;
    }
  };

  /**
   * Получает приоритетное значение по схеме: URL > store > localStorage > default
   */
  const getPriorityValue = (urlValue, storeValue, localStorageKey, defaultValue) => {
    if (urlValue !== undefined && urlValue !== null && urlValue !== "") {
      return urlValue;
    }
    if (storeValue !== undefined && storeValue !== null && storeValue !== "") {
      return storeValue;
    }
    if (localStorageKey) {
      try {
        const stored = localStorage.getItem(localStorageKey);
        if (stored) return stored;
      } catch (e) {
        console.warn(`Failed to get ${localStorageKey} from localStorage:`, e);
      }
    }
    return defaultValue;
  };

  /**
   * Устанавливает конкретные настройки карты и синхронизирует их
   */
  const setMapSettings = (route, router, settings = {}) => {
    const { type, date, provider, lat, lng, zoom, sensor, owner } = settings;

    // Обновляем composable с новыми значениями
    if (type !== undefined) {
      setCurrentUnit(type);
    }
    if (date !== undefined) {
      setCurrentDate(date);
    }
    if (provider !== undefined) {
      setCurrentProvider(provider);
    }
    if (lat !== undefined && lng !== undefined && zoom !== undefined) {
      setmapposition(lat, lng, zoom, false);
    }

    // Синхронизируем URL
    const currentUnitValue = type || currentUnit.value;
    const currentDateValue = date || currentDate.value;
    const currentProviderValue = provider || currentProvider.value;
    const mapPosition = mapposition.value;

    const newQuery = {
      ...route.query,
      type: currentUnitValue,
      date: currentDateValue,
      provider: currentProviderValue,
      lat: mapPosition.lat,
      lng: mapPosition.lng,
      zoom: mapPosition.zoom,
    };

    // Add/remove owner only when explicitly provided:
    // - owner: string -> set `owner=...`
    // - owner: null -> delete `owner`
    // - owner: undefined -> keep as-is
    if (owner !== undefined) {
      const o = owner === null ? "" : String(owner || "").trim();
      if (!o) {
        delete newQuery.owner;
      } else {
        newQuery.owner = o;
      }

      // Ensure stable ordering: owner should appear before sensor in querystring.
      if (newQuery.sensor !== undefined) {
        const s = newQuery.sensor;
        delete newQuery.sensor;
        newQuery.sensor = s;
      }
    }

    // sensor: string -> set; sensor: null | "" -> remove from URL; undefined -> leave as-is
    if (sensor !== undefined) {
      const sid = sensor === null ? "" : String(sensor || "").trim();
      if (!sid) {
        delete newQuery.sensor;
      } else {
        newQuery.sensor = sid;
      }
    }

    router.replace({ query: newQuery }).catch(() => {});
  };

  /**
   * Синхронизирует настройки карты между URL, composable и localStorage
   */
  const syncMapSettings = (route, router) => {
    const currentUnitValue = canonicalMeasurementId(
      getPriorityValue(route.query.type, currentUnit.value, "currentUnit", "pm10")
    );

    const currentDateValue = getPriorityValue(route.query.date, currentDate.value, null, dayISO());

    const urlPos =
      route.query.lat != null && route.query.lng != null && route.query.zoom != null
        ? {
            lat: route.query.lat,
            lng: route.query.lng,
            zoom: route.query.zoom,
          }
        : null;

    const mapPositionValue = getPriorityValue(urlPos, mapposition.value, "map-position", mapposition.value);

    // Normalize/validate lat/lng/zoom (URL and localStorage are strings)
    const parsedLat = toFinite(mapPositionValue?.lat);
    const parsedLng = toFinite(mapPositionValue?.lng);
    const parsedZoom = toFinite(mapPositionValue?.zoom);
    const safeMapPositionValue =
      parsedLat === null || parsedLng === null || parsedZoom === null
        ? mapposition.value
        : { lat: parsedLat, lng: parsedLng, zoom: parsedZoom };

    const currentProviderValue = getPriorityValue(
      route.query.provider,
      currentProvider.value,
      "provider_type",
      "remote"
    );

    // Обновляем composable
    setCurrentUnit(currentUnitValue);
    setCurrentDate(currentDateValue);
    setCurrentProvider(currentProviderValue);

    if (safeMapPositionValue && safeMapPositionValue !== mapposition.value) {
      setmapposition(
        safeMapPositionValue.lat,
        safeMapPositionValue.lng,
        safeMapPositionValue.zoom,
        false
      );
    }

    // Синхронизируем URL если нужно
    const urlNeedsUpdate =
      route.query.type !== currentUnitValue ||
      route.query.date !== currentDateValue ||
      route.query.provider !== currentProviderValue ||
      route.query.lat !== String(safeMapPositionValue.lat) ||
      route.query.lng !== String(safeMapPositionValue.lng) ||
      route.query.zoom !== String(safeMapPositionValue.zoom);

    if (urlNeedsUpdate) {
      const newQuery = {
        ...route.query,
        type: currentUnitValue,
        date: currentDateValue,
        provider: currentProviderValue,
        lat: safeMapPositionValue.lat,
        lng: safeMapPositionValue.lng,
        zoom: safeMapPositionValue.zoom,
      };

      // Сохраняем sensor если он есть в route.query
      if (route.query.sensor) {
        newQuery.sensor = route.query.sensor;
      }

      router.replace({ query: newQuery }).catch(() => {});
    }
  };

  return {
    // State
    mapposition,
    mapinactive,
    currentUnit,
    currentDate,
    aqiVersion,
    currentProvider,
    timelineMode,
    currentSensorId,

    // Actions
    setmapposition,
    setCurrentUnit,
    setCurrentDate,
    setAQIVersion,
    setCurrentProvider,
    setTimelineMode,
    setMapSettings,
    syncMapSettings,
  };
}
