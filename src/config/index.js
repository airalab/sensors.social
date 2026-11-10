import { mergeDeep } from "../utils/utils";

// Take user config name from .env (VITE_CONFIG_ENV), fallback to "default"
const USER_CONFIG = (import.meta.env.VITE_CONFIG_ENV || "default").trim();

// Eagerly load all JSON/JS files from subfolders of /config
const jsonGlobs = import.meta.glob("./*/**/*.json", { eager: true });
const jsGlobs = import.meta.glob("./*/**/*.js", { eager: true });

// Normalize imported module (JSON has .default, JS may or may not)
const get = (m) => m?.default ?? m ?? null;

// Pick a file from a specific folder (USER_CONFIG or default)
const pickFrom = (dir, file) =>
  get(jsGlobs[`./${dir}/${file}`]) ?? get(jsonGlobs[`./${dir}/${file}`]);

// Try to load from USER_CONFIG folder, fallback to default
function resolve(file) {
  return pickFrom(USER_CONFIG, file) ?? pickFrom("default", file);
}

// For JSON configs that should be merged: default + USER_CONFIG override
function resolveJsonMerged(file) {
  const base = pickFrom("default", file) ?? {};
  const custom = pickFrom(USER_CONFIG, file) ?? {};
  return mergeDeep(base, custom);
}

// Named exports
export const idbschemas = resolve("idb-schemas.json");
export const agents = resolve("agents.json");
export const pinned_sensors = resolve("pinned_sensors.js");
export const excluded_sensors = resolve("excluded_sensors.js");
export const themes = resolve("themes.js");
export const banner = resolve("banner.js");

// Final merged settings
export const settings = resolveJsonMerged("config.json");

// Default export
export default settings;

// Utility: merge given config with settings
export function mergeDefault(config) {
  return mergeDeep(settings, config);
}
