/**
 * Wind-related marker functionality
 * Handles wind arrows, wind layer, and wind data visualization
 */

import L from "leaflet";
import "./leaflet-velocity";
import "leaflet-velocity/dist/leaflet-velocity.css";
import { settings } from "@config";

export const immediate = false;

let windLayer;

/**
 * Initializes wind layer with data from wind provider
 *
 * Скорость анимации зависит от реальных данных:
 * - Направление: точно отражает реальное направление ветра
 * - Интенсивность цвета: зависит от реальной силы ветра (0-15 м/с)
 * - Скорость анимации: масштабируется через velocityScale для видимости
 *
 * Данные приходят с сервера в формате GRIB и содержат:
 * - U-компонента ветра (восток-запад)
 * - V-компонента ветра (север-юг)
 * - Временные метки для прогнозирования
 */
export async function initWindLayer() {
  if (windLayer) {
    return; // Уже инициализирован
  }

  try {
    const response = await fetch(settings.WIND_PROVIDER);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    windLayer = L.velocityLayer({
      displayValues: false,
      data,
      maxVelocity: 15, // Максимальная скорость ветра для нормализации (м/с)
      velocityScale: 0.01, // Уменьшаем скорость анимации для спокойной визуализации
      // Тёмно-синие частицы: светло-голубые терялись на слое пыли (AOD)
      colorScale: ["rgb(78, 132, 248)", "rgb(37, 99, 235)", "rgb(29, 78, 216)", "rgb(30, 58, 138)"],
      particleAge: 20, // Короткое время жизни частиц
      particleMultiplier: 0.001, // Мало частиц
      frameRate: 10, // Малый FPS
      opacity: 0.2, // Почти прозрачный для видимости карты
      displayValues: false, // Отключаем отображение значений
    });
  } catch (error) {
    console.error("Failed to fetch wind data:", error);
    throw error;
  }
}

/**
 * Switches wind layer visibility on the map
 * @param {L.Map} map - Leaflet map instance
 * @param {boolean} enabled - Whether to show or hide wind layer
 */
export function switchWindLayer(map, enabled = false) {
  if (windLayer) {
    if (enabled) {
      map.addLayer(windLayer);
    } else {
      map.removeLayer(windLayer);
    }
  }
}

/**
 * Creates a wind arrow icon for a sensor
 * @param {number} dir - Wind direction in degrees
 * @param {number} speed - Wind speed in m/s
 * @param {string} color - Arrow color
 * @returns {L.DivIcon} Wind arrow icon
 */
export function createWindArrowIcon(dir, speed, color) {
  return L.divIcon({
    html: `
      <div class="icon-arrow-container" style="transform: rotate(${dir + 90}deg);">
        <div class="icon-arrow" style="border-color: ${color} ${color} transparent transparent;"></div>
      </div>
      <div class="label-arrow">${speed} m/s</div>
    `,
    iconSize: [30, 30],
    className: "marker-point marker-wind",
  });
}

/**
 * Creates a wind arrow marker
 * @param {Array} coord - [lat, lng] coordinates
 * @param {Object} data - Sensor data with wind information
 * @param {Object} colors - Color configuration
 * @returns {L.Marker} Wind arrow marker
 */
export function createWindArrowMarker(coord, data, colors) {
  const marker = L.marker(coord, {
    icon: createWindArrowIcon(data.data.windang, data.data.windspeed, colors.basic),
    typeMarker: "arrow",
  });

  return marker;
}

/**
 * Checks if a sensor has wind data
 * @param {Object} point - Sensor point data
 * @returns {boolean} True if sensor has wind data
 */
export function hasWindData(point) {
  return point.data && Object.prototype.hasOwnProperty.call(point.data, "windang");
}

/**
 * Determines if a sensor should be displayed as a wind arrow
 * @param {Object} point - Sensor point data
 * @returns {boolean} True if sensor should be wind arrow
 */
export function shouldShowAsWindArrow(point) {
  return hasWindData(point);
}

/**
 * Updates an existing marker with wind data
 * @param {L.Marker} existingMarker - Existing marker to update
 * @param {Object} point - Updated sensor point data
 * @param {Object} colors - Color configuration
 * @returns {L.Marker} Updated marker
 */
export function updateMarkerWithWindData(existingMarker, point, colors) {
  if (hasWindData(point)) {
    existingMarker.setIcon(
      createWindArrowIcon(point.data.windang, point.data.windspeed, colors.basic)
    );
  }
  return existingMarker;
}

/**
 * Destroys wind layer and cleans up resources
 */
export function destroyWindLayer() {
  if (windLayer) {
    console.log("Destroying wind layer and cleaning up resources");

    // Удаляем слой с карты если он добавлен
    if (window.mapContext && window.mapContext.map && window.mapContext.map.hasLayer(windLayer)) {
      window.mapContext.map.removeLayer(windLayer);
    }

    // Останавливаем анимацию если есть
    if (windLayer._stopAnimation) {
      windLayer._stopAnimation();
    }

    // Очищаем canvas если есть
    if (windLayer._canvas) {
      windLayer._canvas.remove();
      windLayer._canvas = null;
    }

    // Очищаем данные
    if (windLayer._data) {
      windLayer._data = null;
    }

    // Удаляем обработчики событий
    if (windLayer.off) {
      windLayer.off();
    }

    windLayer = null;
    console.log("Wind layer destroyed and resources cleaned up");
  }
}
