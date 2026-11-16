/**
 * Color calculation utilities for markers and clusters
 * Centralized color logic for consistent coloring across the application
 */

import { getMeasurementByName } from "../../../measurements/tools";

// Default colors configuration
export const DEFAULT_COLORS = {
  cluster: {
    initColor: "#a1a1a1", // default gray color
    initBorderColor: "#999",
  },
  point: {
    initColor: "#a1a1a1", // default gray color
    initBorderColor: "#999",
    initRgb: [161, 161, 161], // RGB equivalent of initColor
    userMessageColor: "#f99981", // User message color
  },
};

/**
 * Universal color calculation method for both individual markers and clusters
 * @param {number|null} value - The value to get color for
 * @param {string} unit - The measurement unit (pm10, pm25, temperature, etc.)
 * @param {Object} point - The point data
 * @returns {string} - The color for the value
 */
export function getColorForValue(value, unit, point = null) {
  // Regular measurement handling
  if (value === null || value === undefined || isNaN(value)) {
    return DEFAULT_COLORS.point.initColor; // Default color for no data
  }

  const scaleParams = getMeasurementByName(unit);
  const zones = scaleParams?.zones || [];
  if (unit && zones.length > 0) {
    const match = zones.find((i) => value <= i?.valueMax);
    if (match) {
      return match.color;
    } else if (!zones[zones.length - 1]?.valueMax) {
      return zones[zones.length - 1].color;
    }
  }

  return DEFAULT_COLORS.point.initColor; // Default color
}

/**
 * Calculate border color by darkening the base color
 * @param {string} color - Base color (CSS color string)
 * @returns {string} - Darkened border color
 */
export function getBorderColor(color) {
  // Convert color to RGB for border calculation
  const tempEl = document.createElement("div");
  tempEl.style.color = color;
  document.body.appendChild(tempEl);
  const computedColor = getComputedStyle(tempEl).color;
  document.body.removeChild(tempEl);

  if (computedColor.startsWith("rgb")) {
    const rgb = computedColor.match(/\d+/g);
    if (rgb && rgb.length >= 3) {
      const r = parseInt(rgb[0]);
      const g = parseInt(rgb[1]);
      const b = parseInt(rgb[2]);
      return `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`;
    }
  }

  return DEFAULT_COLORS.point.initBorderColor; // Fallback
}

/**
 * Check if a color is dark (for text contrast)
 * @param {string} color - CSS color string
 * @returns {boolean} - True if color is dark
 */
export function isDarkColor(color) {
  const tempEl = document.createElement("div");
  tempEl.style.color = color;
  document.body.appendChild(tempEl);
  const computedColor = getComputedStyle(tempEl).color;
  document.body.removeChild(tempEl);

  if (computedColor.startsWith("rgb")) {
    const rgb = computedColor.match(/\d+/g);
    if (rgb && rgb.length >= 3) {
      const r = parseInt(rgb[0]);
      const g = parseInt(rgb[1]);
      const b = parseInt(rgb[2]);
      // Use luminance formula: 0.299*R + 0.587*G + 0.114*B
      return r * 0.299 + g * 0.587 + b * 0.114 < 128;
    }
  }

  return false; // Fallback
}

/**
 * Get colors object for a marker based on its type and value
 * @param {Object} point - Point data
 * @param {string} unit - Measurement unit
 * @param {boolean} isUserMessage - Whether this is a user message
 * @returns {Object} - Colors object with basic, border, rgb properties
 */
export function getMarkerColors(point, unit, isUserMessage = false) {
  const colors = {
    basic: isUserMessage ? DEFAULT_COLORS.point.userMessageColor : DEFAULT_COLORS.point.initColor,
    border: DEFAULT_COLORS.point.initBorderColor,
    rgb: DEFAULT_COLORS.point.initRgb,
  };

  // For regular markers, apply color based on value
  if (!isUserMessage && !point.isEmpty) {
    const color = getColorForValue(point.value, unit, point);
    colors.basic = color;
    colors.border = getBorderColor(color);
  }

  return colors;
}

/**
 * Find the winning color for a cluster based on zone counting.
 * The most common zone wins; on a tie the higher zone of the scale wins, so a cluster
 * with as many red sensors as green ones shows red (for pollutants, the worse level).
 * @param {Array} markers - Array of marker objects
 * @param {string} unit - Measurement unit
 * @returns {string} - The winning color
 */
export function getClusterWinningColor(markers, unit) {
  const zones = getMeasurementByName(unit)?.zones || [];
  const zoneRank = (color) => zones.findIndex((zone) => zone?.color === color);
  const zoneCounts = new Map(); // zone color -> count

  for (const marker of markers) {
    const data = marker.options.data;
    if (!data) continue;

    const value = data.value;
    if (value === null || value === undefined || isNaN(value)) continue;

    const markerColor = getColorForValue(value, unit, data);
    zoneCounts.set(markerColor, (zoneCounts.get(markerColor) || 0) + 1);
  }

  let maxCount = 0;
  let winningColor = DEFAULT_COLORS.cluster.initColor;

  for (const [color, count] of zoneCounts) {
    if (count > maxCount || (count === maxCount && zoneRank(color) > zoneRank(winningColor))) {
      maxCount = count;
      winningColor = color;
    }
  }

  return winningColor;
}
