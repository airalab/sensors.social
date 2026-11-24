// import { settings } from "@config";
import { dayISO } from "@/utils/date";

/**
 * Universal fetch method for JSON data
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options (optional)
 * @returns {Promise<object>} Parsed JSON data
 */
/**
 * fetchJson that waits out a short outage of the API: a network error or a 5xx answer is retried
 * with growing pauses (1, 2, 4, 8, 16 s — about half a minute in all, then the error stands).
 * RoSeMAN is down for 10–40 s while it restarts after a deploy; a map opened in that window used
 * to stay empty until reloaded. 4xx answers are final and not retried.
 */
export async function fetchJsonRetrying(url, options = {}, attempts = 6) {
  for (let i = 0; ; i++) {
    try {
      const res = await fetch(url, { credentials: "omit", cache: "no-cache", ...options });
      if (res.ok) return res.json();
      if (res.status < 500 || i >= attempts - 1) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      if (i >= attempts - 1 || /^HTTP 4/.test(e.message)) throw e;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** i));
  }
}

export async function fetchJson(url, options = {}) {
  const defaultOptions = {
    credentials: "omit",
    cache: "no-cache",
  };
  const res = await fetch(url, { ...defaultOptions, ...options });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function mergeDeep(target, source) {
  const isObject = (obj) => obj && typeof obj === "object";

  if (!isObject(target) || !isObject(source)) {
    return source;
  }

  Object.keys(source).forEach((key) => {
    const targetValue = target[key];
    const sourceValue = source[key];

    if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      // target[key] = targetValue.concat(sourceValue);
      target[key] = sourceValue;
    } else if (isObject(targetValue) && isObject(sourceValue)) {
      target[key] = mergeDeep(Object.assign({}, targetValue), sourceValue);
    } else {
      target[key] = sourceValue;
    }
  });

  return target;
}

/**
 * Проверяет, являются ли координаты валидными (не нулевыми)
 * @param {Object} geo - Объект с координатами {lat, lng}
 * @returns {boolean} true если координаты валидны, false если нулевые или отсутствуют
 */
export function hasValidCoordinates(geo) {
  if (!geo || !geo.lat || !geo.lng) {
    return false;
  }

  const lat = Number(geo.lat);
  const lng = Number(geo.lng);

  return Math.abs(lat) > 0.001 && Math.abs(lng) > 0.001;
}

/**
 * Получает адрес по координатам через Nominatim API
 * @param {number} lat - широта
 * @param {number} lng - долгота
 * @param {string} language - язык для адреса
 * @returns {string} строка адреса или координаты через запятую
 */
export async function getAddress(lat, lng, language = "en") {
  const zoomAddr = Number(window?.appSettings?.GEOCODER?.zoom?.address) || 18;
  const tpl =
    window?.appSettings?.GEOCODER?.urlTemplate ||
    "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={lat}&lon={lon}&zoom={zoom}&addressdetails={addressdetails}&accept-language={lang}";
  const url = tpl
    .replace("{lat}", encodeURIComponent(lat))
    .replace("{lon}", encodeURIComponent(lng))
    .replace("{zoom}", encodeURIComponent(zoomAddr))
    .replace("{addressdetails}", "1")
    .replace("{lang}", encodeURIComponent(language));

  try {
    const response = await fetch(url);
    const data = await response.json();
    const addr = buildAddressFromAny(data);

    // Если получили адрес, объединяем его в строку
    if (addr && Array.isArray(addr.address) && addr.address.length > 0) {
      const parts = [];
      if (addr.country) parts.push(addr.country);
      parts.push(...addr.address);
      return parts.join(", ");
    }
  } catch {}

  // Если не удалось получить адрес, возвращаем координаты
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
    return `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`;
  }
  return `${String(lat)}, ${String(lng)}`;
}

/**
 * Выбирает наиболее подходящее название города из объекта адреса
 * @param {Object} addr - объект адреса
 * @returns {string} название города
 */
function pickCity(addr) {
  return (
    addr?.city ||
    addr?.town ||
    addr?.village ||
    addr?.municipality ||
    addr?.locality ||
    addr?.suburb ||
    addr?.hamlet ||
    addr?.county ||
    addr?.state ||
    ""
  );
}

/**
 * Строит структуру адреса из данных Nominatim
 * @param {Object} j - JSON ответ от Nominatim
 * @returns {Object} объект с полями country, address, postcode
 */
function buildFromNominatim(j) {
  const a = j?.address || {};
  const country = a.country || "";
  const city = pickCity(a);
  const hood = a.neighbourhood || a.suburb || a.city_district || a.village || "";
  const road = a.road || a.pedestrian || a.footway || a.path || a.cycleway || "";
  const house = a.house_number || "";
  const postcode = a.postcode || "";
  const address = [];
  if (city) address.push(city);
  if (hood && hood !== city) address.push(hood);
  if (road) address.push(road);
  if (house) address.push(house);
  return { country, address, postcode };
}

/**
 * Строит адрес из любого JSON ответа геокодера
 * @param {Object} json - JSON ответ от геокодера
 * @returns {Object} объект с полями country, address, postcode
 */
function buildAddressFromAny(json) {
  if (json && json.address) return buildFromNominatim(json);
  return { country: "", address: [], postcode: "" };
}

/**
 * Calculates distance between two geographic points using the Haversine formula.
 * Returns distance in kilometers.
 *
 * @param {Object} a - First geographic point
 * @param {number} a.lat - Latitude of first point
 * @param {number} a.lng - Longitude of first point
 *
 * @param {Object} b - Second geographic point
 * @param {number} b.lat - Latitude of second point
 * @param {number} b.lng - Longitude of second point
 *
 * @returns {number} Distance between points in kilometers
 */
function distanceKm(a, b) {
  const R = 6371; // Earth radius in km

  const toRad = (deg) => deg * Math.PI / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Checks whether two geographic points are within a given distance.
 *
 * @param {Object} a - First geographic point
 * @param {number} a.lat - Latitude of first point
 * @param {number} a.lng - Longitude of first point
 *
 * @param {Object} b - Second geographic point
 * @param {number} b.lat - Latitude of second point
 * @param {number} b.lng - Longitude of second point
 *
 * @param {number} [maxDistanceKm=10] - Maximum allowed distance in kilometers
 *
 * @returns {boolean} True if points are within specified distance
 */
export function isPointNearby(a, b, maxDistanceKm = 10) {
  return distanceKm(a, b) <= maxDistanceKm;
}
