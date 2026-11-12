<template>
  <div v-if="aqiValue !== null" class="aqi-container" :style="aqiStyle">
    <div class="aqi">
      <div class="aqi-badge">
        <!-- EEA has six named levels and no number: the level name is the value -->
        <div class="aqi-box">
          <span class="aqi-value">{{ isEEA ? zoneLabel : aqiValue }}</span>
        </div>
        <div class="aqi-text">
          <div class="aqi-subtext">{{ aqiTitle }}</div>
          <div v-if="zoneLabel && !isEEA" class="aqi-label">{{ zoneLabel }}</div>
        </div>
      </div>
    </div>

    <select v-model="selectedVersion" @change="handleVersionChange" class="aqi-version-select">
      <option value="us">US EPA</option>
      <option value="eu">EU (EEA)</option>
    </select>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useMap } from "@/composables/useMap";
import { calculateAQIIndex as calculateAQIIndexUS } from "../../../utils/calculations/aqi/us";
import { calculateAQIIndex as calculateAQIIndexEU } from "../../../utils/calculations/aqi/eu";
import aqiUSZones from "../../../measurements/aqi_us";
import aqiEUZones from "../../../measurements/aqi_eu";

const props = defineProps({
  logs: { type: Array, default: () => [] },
});

const { locale, t } = useI18n();
const isEEA = computed(() => mapState.aqiVersion.value === "eu");
const mapState = useMap();
const localeComputed = computed(() => localStorage.getItem("locale") || locale.value || "en");
const selectedVersion = ref(mapState.aqiVersion.value);

// AQI version selector function
const getAQICalculator = (version = "us") => {
  switch (version) {
    case "us":
      return calculateAQIIndexUS;
    case "eu":
      return calculateAQIIndexEU;
    default:
      return calculateAQIIndexUS;
  }
};

// Get appropriate zones based on AQI version
const getAQIZones = (version = "us") => {
  if (version === "eu") {
    return aqiEUZones;
  }
  return aqiUSZones;
};

const aqiValue = computed(() => {
  const calculateAQIIndex = getAQICalculator(mapState.aqiVersion.value);
  const v = calculateAQIIndex(props.logs);

  return typeof v === "number" ? v : null;
});

const aqiTitle = computed(() => {
  // Показываем разные названия в зависимости от выбранной версии AQI
  if (mapState.aqiVersion.value === "eu") {
    return t("aqi.eeaLastHour");
  } else {
    return "AQI (US EPA)";
  }
});

const matchedZone = computed(() => {
  if (aqiValue.value === null) return null;
  const zones = getAQIZones(mapState.aqiVersion.value);
  return zones.find((z) => typeof z.valueMax === "number" && aqiValue.value <= z.valueMax) || null;
});

const zoneLabel = computed(() => {
  const z = matchedZone.value;
  if (!z?.label) return "";
  const l = localeComputed.value;
  return z.label[l] || z.label.en || "";
});

const aqiStyle = computed(() => {
  const z = matchedZone.value;
  return z?.color ? { backgroundColor: z.color } : {};
});

const handleVersionChange = () => {
  mapState.setAQIVersion(selectedVersion.value);
  // Watcher will handle cache clearing and marker refresh
};

onMounted(() => {
  // Watch for external changes to aqiVersion
  selectedVersion.value = mapState.aqiVersion.value;
});

// Watch for changes in aqiVersion from composable and update markers
watch(
  () => mapState.aqiVersion.value,
  (newVersion) => {
    // Update local selected version
    selectedVersion.value = newVersion;

    // Clear AQI cache and refresh markers
    import("@/utils/map/markers").then((module) => {
      if (module.clearAQICache) {
        module.clearAQICache(mapState.currentDate.value);
      }

      if (module.refreshClusters) {
        module.refreshClusters();
      }
    });
  }
);
</script>

<style scoped>
.aqi-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap);
  padding: var(--gap);
  border-radius: 0.2rem;
}

.aqi-container select {
  --app-inputpadding: 0.6rem;
  padding-top: 0;
  padding-bottom: 0;
  background-color: rgba(255, 255, 255, 0.4);
}

.aqi-badge {
  display: flex;
  align-items: center;
  gap: 10px;
}
.aqi-box {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 20px;
}
.aqi-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.aqi-value {
  font-size: 18px;
}
.aqi-label {
  font-size: 7px;
  font-weight: bold;
}
.aqi-subtext {
  font-size: 10px;
  font-weight: bold;
}
</style>
