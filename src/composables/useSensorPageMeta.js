import { computed, toValue } from "vue";
import { settings } from "@config";
import { useLogGeoAddresses } from "@/composables/useLogGeoAddresses";
import { resolveSensorType, sensorTypeTitle } from "@/composables/useSensors";
import { sensorName } from "@/utils/addressNames";
import measurements from "../measurements";
import { MEASUREMENT_GROUPS, MEASUREMENT_GROUP_LOOKUP } from "../measurements/groups";
import en from "../translate/en.js";
import ru from "../translate/ru.js";

export const SENSOR_PAGE_META_KEY = Symbol("sensorPageMeta");

const UI_MESSAGES = { en, ru };

/** Title lead-in for sensor share / OG previews (English; "at" fits street, city, and country). */
export function sensorShareTitleLead(placeLabel) {
  const place = String(placeLabel || "").trim();
  if (!place) return "Air quality";
  return `Air quality at ${place}`;
}

/** @param {{ address?: string|null, sensorId: string, suffix: string }} opts */
export function buildSensorShareTitle({ address, sensorId, suffix }) {
  const place = address || sensorName(sensorId);
  return `${sensorShareTitleLead(place)} — ${suffix}`;
}

function measurementTypeLabel(unitKey, locale) {
  const key = String(unitKey || "").toLowerCase();
  const groupKey = MEASUREMENT_GROUP_LOOKUP[key];
  if (groupKey) {
    const labelKey = MEASUREMENT_GROUPS[groupKey].labelKey;
    const dict = UI_MESSAGES[locale] || UI_MESSAGES.en;
    return dict[labelKey] || labelKey;
  }

  const unitInfo = measurements[key];
  return (
    unitInfo?.nameshort?.[locale] ||
    unitInfo?.name?.[locale] ||
    unitInfo?.label ||
    key.toUpperCase()
  );
}

const siteBrandName = () => settings?.SITE_NAME || "sensors.social";

function sensorMetaTitleSuffix(point, log) {
  const siteName = siteBrandName();
  const type = resolveSensorType(point, log);
  if (type === "insight" || type === "urban" || type === "altruist") {
    return `${sensorTypeTitle(type)} on ${siteName}`;
  }
  return siteName;
}

/**
 * Page title / description for MetaInfo when a sensor popup is open.
 * @param {import('vue').MaybeRefOrGetter<string>} sensorIdSource
 * @param {import('vue').MaybeRefOrGetter<Array|null>} sensorLogSource
 * @param {import('vue').MaybeRefOrGetter<object|null>} sensorPointSource
 * @param {import('vue').MaybeRefOrGetter<object>} routeQuerySource
 * @param {ReturnType<import('@/composables/useMap').useMap>} mapState
 * @param {import('vue').MaybeRefOrGetter<string>} localeSource
 */
export function useSensorPageMeta(
  sensorIdSource,
  sensorLogSource,
  sensorPointSource,
  routeQuerySource,
  mapState,
  localeSource
) {
  const sensorGeo = computed(() => toValue(sensorPointSource)?.geo ?? null);

  const logGeoAddresses = useLogGeoAddresses(sensorLogSource, localeSource, sensorGeo);

  const pageTitle = computed(() => {
    const sensorId = String(toValue(sensorIdSource) || "").trim();
    if (!sensorId) {
      return settings?.TITLE || settings?.SITE_NAME || "Sensors map";
    }

    const address = logGeoAddresses.headerAddress.value;
    const suffix = sensorMetaTitleSuffix(toValue(sensorPointSource), toValue(sensorLogSource));
    return buildSensorShareTitle({ address, sensorId, suffix });
  });

  const pageDescription = computed(() => {
    const sensorId = String(toValue(sensorIdSource) || "").trim();
    if (!sensorId) {
      return settings?.DESC || null;
    }

    const sid = sensorName(sensorId);
    const address = logGeoAddresses.headerAddress.value;
    if (!address) return null;

    const query = toValue(routeQuerySource) || {};
    const locale = toValue(localeSource) || "en";
    const hasType = Boolean(query.type);

    const provider = query.provider || mapState.currentProvider.value || "remote";

    if (!hasType) {
      if (provider === "realtime") {
        return `Air quality measurements from sensor ${sid} at ${address}.`;
      }
      const date = query.date || mapState.currentDate.value || null;
      return `Air quality measurements from sensor ${sid} at ${address}${
        date ? ` on ${date}` : ""
      }.`;
    }

    const unitKey = String(query.type || mapState.currentUnit.value || "pm25").toLowerCase();
    const typeName = measurementTypeLabel(unitKey, locale);
    if (provider === "realtime") {
      return `Real-time ${typeName} measurements from sensor ${sid} at ${address}.`;
    }

    const date = query.date || mapState.currentDate.value || null;
    return `${typeName} measurements from sensor ${sid} at ${address}${
      date ? ` on ${date}` : ""
    }.`;
  });

  return {
    logGeoAddresses,
    pageTitle,
    pageDescription,
  };
}
