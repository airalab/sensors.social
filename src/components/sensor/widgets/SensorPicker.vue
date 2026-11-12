<template>
  <div class="sensor-picker">
    <button
      type="button"
      class="panel-trigger panel-trigger--sensor"
      popovertarget="sensor-picker-popover"
    >
      <div class="panel-list__media" aria-hidden="true">
        <img :src="sensorTypeIcon(activeRow.type)" alt="" />
      </div>

      <div class="panel-list__text">
        <b class="panel-list__title">
          <template v-if="isDemo">{{ sensorTypeTitle(activeRow.type) }}</template>
          <template v-else>Sensor ({{ sensorTypeTitle(activeRow.type) }})</template>
        </b>
        <span class="panel-list__meta">
          <template v-if="isDemo">{{ t("sensorpopup.demo_live") }}</template>
          <template v-else>{{ sensorName(activeRow.sensorId) }}</template>
        </span>
      </div>

      <font-awesome-icon icon="fa-solid fa-caret-down" class="panel-trigger__caret" aria-hidden="true" />
    </button>

    <div ref="popoverRef" id="sensor-picker-popover" class="popover panel-popover" popover>
      <ul class="panel-list" role="listbox">
        <li v-for="row in rows" :key="row.sensorId || row.type">
          <button
            type="button"
            class="panel-list__item"
            role="option"
            :class="{
              'is-active': row.state === 'active',
              'is-available': row.state === 'available',
              'is-missing': row.state === 'missing',
            }"
            :aria-selected="row.state === 'active' ? 'true' : 'false'"
            :disabled="row.state !== 'available'"
            @click="onSelect(row)"
          >
            <div class="panel-list__media" aria-hidden="true">
              <img :src="sensorTypeIcon(row.type)" alt="" />
            </div>

            <div class="panel-list__text">
              <span class="panel-list__title">Sensor ({{ sensorTypeTitle(row.type) }})</span>
              <span class="panel-list__meta">
                <template v-if="row.sensorId">{{ sensorName(row.sensorId) }}</template>
                <template v-else>{{ t("sensor_picker_not_found") }}</template>
              </span>
            </div>
          </button>
        </li>
      </ul>

      <p class="panel-popover__footer">
        {{ t("sensor_picker_shop_prefix") }}
        <a href="https://cyberpunks.shop/" target="_blank" rel="noopener noreferrer">
          Cyberpunks.shop
        </a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { sensorName } from "@/utils/addressNames";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  buildSensorPickerRows,
  resolveSensorType,
  sensorTypeIcon,
  sensorTypeTitle,
  useSensors,
} from "@/composables/useSensors";

const props = defineProps({
  point: Object,
  log: Array,
  variant: {
    type: String,
    default: "data",
  },
});

const { t } = useI18n();
const { switchOpenSensor } = useSensors();
const popoverRef = ref(null);
const isDemo = computed(() => props.variant === "demo");

const rows = computed(() => buildSensorPickerRows(props.point, props.log));

const activeRow = computed(() => {
  const found = rows.value.find((row) => row.state === "active");
  if (found) return found;

  const sensorId = String(props.point?.sensor_id || "");
  return {
    type: resolveSensorType(props.point, props.log),
    sensorId: sensorId || null,
    state: sensorId ? "active" : "missing",
  };
});

const onSelect = (row) => {
  if (row.state !== "available" || !row.sensorId) return;
  popoverRef.value?.hidePopover?.();
  switchOpenSensor(row.sensorId, props.point);
};
</script>

<style scoped>
.panel-trigger--sensor {
  anchor-name: --sensor-picker-trigger;
}

@supports (position-anchor: --sensor-picker-trigger) {
  .panel-popover {
    position-anchor: --sensor-picker-trigger;
    top: anchor(bottom);
    left: anchor(left);
    margin-top: 10px;
  }
}
</style>
