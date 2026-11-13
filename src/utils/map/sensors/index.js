import { MARKER_CLASSES } from "../markers";
import { getMapContext } from "../map";
import * as utils from "../markers";
import { findMarker as findMarkerGeneral } from "../markers";
import * as icons from "./icons";
import * as colors from "./colors";
import { hasValidCoordinates } from "../../utils";

// Функция для получения контекста (вызывается внутри функций)

/**
 * Проверяет, готов ли слой маркеров для работы
 * @returns {boolean} true если слой инициализирован
 */
export function isReadyLayer() {
  try {
    const ctx = getMapContext();
    return !!ctx.markersLayer;
  } catch (error) {
    return false;
  }
}

/**
 * Redraws a marker's icon and remembers what it now shows: the comparison in upsertMarker()
 * must be against the drawn icon, not against the latest data.
 */
function redrawIcon(marker, point, colors) {
  marker.options.colorKey = `${colors?.basic || ""}|${colors?.border || ""}`;
  marker.options.drawn = point;
  delete marker.options.pendingColors;
  marker.setIcon(
    icons.createIconPoint({
      image: point.iconLocal,
      colors: point.markerIconFullBleed ? null : colors,
      isBookmarked: point.isBookmarked,
      id: point.sensor_id,
    })
  );
}

/** Icons whose redraw was held back while a cluster was spiderfied. */
function redrawPendingIcons(layer) {
  let redrawn = 0;
  layer.eachLayer((marker) => {
    if (marker.options?.pendingColors === undefined) return;
    redrawIcon(marker, marker.options.data, marker.options.pendingColors);
    redrawn++;
  });
  // The cluster refresh after a data batch was skipped while the web was open; do it now,
  // so the cluster takes the colour its markers have.
  if (redrawn) layer.refreshClusters();
}

/**
 * Upsert маркер: создает новый или обновляет существующий
 * @param {Object} point - Данные точки
 * @param {Object} colors - Цвета для маркера
 * @param {string} [sensor_id] - ID сенсора для поиска существующего маркера (опционально)
 * @returns {Object} - { marker: Object, isNew: boolean } - Обработанный маркер и флаг новизны
 */
function upsertMarker(point, colors, sensor_id = null) {
  // Вычисляем координаты (сенсоры всегда используют scatter)
  const coord = utils.scatterCoords([point.geo.lat, point.geo.lng], point.sensor_id);

  // Определяем тип маркера (только для сенсоров: image или circle)
  const markerType = point.iconLocal ? "image" : "circle";

  // Ищем существующий маркер
  const existingMarker = sensor_id ? findMarker(sensor_id) : null;

  // Если маркер существует, обновляем его
  if (existingMarker) {
    const ctx = getMapContext();
    const spiderfyOpen = Boolean(ctx?.markersLayer?.__spiderfyOpen);

    const markerId = String(point.sensor_id || "");
    const shouldStayActive =
      ctx.activeSensorMarkerId === markerId ||
      existingMarker.getElement()?.classList.contains(MARKER_CLASSES.active);

    // Обновляем иконку только когда она реально изменилась.
    // Important: while a cluster is spiderfied, avoid calling `setIcon()` on child markers.
    // Markercluster treats icon changes as a reason to recalculate clusters, which can
    // collapse the spiderfy "web" after a short delay.
    // Compare with the data the icon was drawn from, read BEFORE it is replaced: comparing
    // the new point with itself froze every marker's colour at its first render, while the
    // cluster around it was recoloured from fresh values (red cluster over green markers).
    const prevData = existingMarker.options.drawn || existingMarker.options.data;
    const colorKey = `${colors?.basic || ""}|${colors?.border || ""}`;
    const iconUnchanged =
      prevData?.iconLocal === point.iconLocal &&
      Boolean(prevData?.markerIconFullBleed) === Boolean(point.markerIconFullBleed) &&
      Boolean(prevData?.isBookmarked) === Boolean(point.isBookmarked) &&
      existingMarker.options.colorKey === colorKey;

    existingMarker.options.data = point;
    if (!iconUnchanged) {
      if (spiderfyOpen) {
        // Redrawn when the web closes (see redrawPendingIcons), not on the next data tick,
        // which in the remote mode may never come.
        existingMarker.options.pendingColors = colors;
      } else {
        redrawIcon(existingMarker, point, colors);
      }
    }

    // Применяем вычисленные координаты
    // Important: avoid forcing recluster/unspiderfy on every data tick.
    try {
      // A spiderfied marker sits on its leg, not on its point: compare with the point it came
      // from, or every data tick moves it back and markercluster collapses the open web.
      const prev = existingMarker._preSpiderfyLatlng || existingMarker.getLatLng?.();
      const nextLat = Number(coord[0]);
      const nextLng = Number(coord[1]);
      const same =
        prev &&
        Number.isFinite(nextLat) &&
        Number.isFinite(nextLng) &&
        Math.abs(prev.lat - nextLat) < 1e-10 &&
        Math.abs(prev.lng - nextLng) < 1e-10;
      if (!same) {
        existingMarker.setLatLng(new L.LatLng(nextLat, nextLng));
      }
    } catch {
      existingMarker.setLatLng(new L.LatLng(coord[0], coord[1]));
    }

    if (shouldStayActive) {
      const element = existingMarker.getElement();
      if (element) {
        element.classList.add(MARKER_CLASSES.active);
        ctx.activeMarker = existingMarker;
        ctx.activeSensorMarkerId = markerId;
      }
    }

    return { marker: existingMarker, isNew: false };
  }

  // Создаем новый маркер
  const marker = icons.createMarker(
    coord,
    point,
    point.markerIconFullBleed ? null : colors,
    point.iconLocal,
    markerType
  );
  marker.options.colorKey = `${colors?.basic || ""}|${colors?.border || ""}`;
  marker.options.drawn = point;

  return { marker, isNew: true };
}

/**
 * Добавляет маркер сенсора на карту
 * @param {Object} point - Данные точки
 * @param {string} [unit] - Единица измерения
 */
async function addMarker(point, unit = null) {
  if (!point?.geo || !hasValidCoordinates(point.geo)) return;

  // пропускаем датчики с «нулевой» геопозицией
  const tolerance = 0.001;
  const lat = Number(point.geo.lat);
  const lng = Number(point.geo.lng);

  if (Math.abs(lat) < tolerance && Math.abs(lng) < tolerance) {
    return;
  }

  // Определяем цвета для сенсора
  const markerColors = colors.getMarkerColors(point, unit, false);

  const { marker, isNew } = upsertMarker(point, markerColors, point.sensor_id);

  if (isNew) {
    // Добавляем класс обновления для визуальной обратной связи
    const iconElement = marker.getElement();
    if (iconElement) {
      iconElement.classList.add(MARKER_CLASSES.updating);
    }

    // Прикрепляем все события включая клик для нового маркера
    const ctx = getMapContext();
    utils.attachMarkerEvents(marker, ctx.markerClickHandler);

    // Добавляем маркер в основной слой сенсоров
    if (ctx.markersLayer) {
      ctx.markersLayer.addLayer(marker);
    }

    // Убираем класс обновления после добавления на карту
    setTimeout(() => {
      if (iconElement) {
        iconElement.classList.remove(MARKER_CLASSES.updating);
      }
    }, 800);
  }
  // Для существующего маркера ничего дополнительного не нужно - он уже обновлен
}

// Функция findMarker теперь экспортируется из markers.js
// Оставляем только для обратной совместимости
export function findMarker(sensor_id) {
  // Используем общую функцию из markers.js
  return findMarkerGeneral(sensor_id, "sensor");
}

/**
 * Очищает все маркеры сенсоров с карты
 */
export function clearAllMarkers() {
  const ctx = getMapContext();
  if (ctx.markersLayer) {
    ctx.markersLayer.clearLayers();
  }
}

/**
 * Удаляет конкретный маркер сенсора с карты
 * @param {string} sensorId - ID сенсора
 */
export function removeMarker(sensorId) {
  if (!sensorId) return;
  
  const marker = findMarker(sensorId);
  if (marker) {
    const ctx = getMapContext();
    if (ctx.markersLayer) {
      ctx.markersLayer.removeLayer(marker);
    }
  }
}

export function upsertPoint(point, unit = null) {
  try {
    if (unit) {
      try {
        getMapContext().sensorUnit = unit;
      } catch {
        /* map not ready */
      }
    }
    // Сенсоры всегда используют addMarker
    addMarker(point, unit);
  } catch (error) {
    console.error(`Error processing point for sensor ${point.sensor_id}:`, error);
  }
}

export function switchMessagesLayer(map, enabled = false) {
  for (const messagesLayer of Object.values(messagesLayers)) {
    if (messagesLayer) {
      if (enabled) {
        map.addLayer(messagesLayer);
      } else {
        map.removeLayer(messagesLayer);
      }
    }
  }
}

export function refreshClusters() {
  let ctx;
  try {
    ctx = getMapContext();
  } catch {
    return;
  }
  if (ctx.markersLayer) {
    // If a cluster is currently spiderfied, refreshing clusters collapses the web.
    if (ctx.markersLayer.__spiderfyOpen) return;
    ctx.markersLayer.refreshClusters();
  }
}

// Функция для применения активного класса к маркеру

/**
 * Инициализирует систему маркеров на карте
 * @param {Function} cb - Callback функция для обработки кликов по маркерам
 * @param {string} unit - Единица измерения (pm10, pm25, temperature, etc.)
 */
export async function init(cb, unit = null) {
  const ctx = getMapContext();

  // Создаем основной слой маркеров
  // The cluster colour must use the measurement the markers are drawn with now, not the one
  // the map was opened with: upsertPoint() keeps ctx.sensorUnit current.
  ctx.sensorUnit = unit;
  ctx.markersLayer = utils.createClusterGroup(
    (cluster) =>
      icons.createIconCluster(
        cluster,
        ctx.sensorUnit || unit,
        colors.getClusterWinningColor,
        colors.getBorderColor,
        colors.isDarkColor
      ),
    unit
  );
  ctx.map.addLayer(ctx.markersLayer);
  ctx.markersLayer.on("unspiderfied", () => redrawPendingIcons(ctx.markersLayer));

  // Создаем обработчик клика для маркеров
  ctx.markerClickHandler = (data) => cb(data);

  // Устанавливаем защиту от рекурсии
  utils.setupRecursionProtection(ctx.map);

  // Прикрепляем события к основному слою маркеров
  utils.attachClusterEvents(ctx.markersLayer, ctx.markerClickHandler);
}
