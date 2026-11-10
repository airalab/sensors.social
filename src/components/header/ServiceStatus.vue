<template>
  <details tabindex="0" class="service-status details-popup">
    <summary
      class="service-status__summary button-round-outline button-round-outline-labeled"
      :aria-label="summaryLabel"
    >
      <span v-for="service in services" :key="service.tech" class="service-status__item">
        <span class="service-status__dot" :class="`is-${service.state}`" aria-hidden="true"></span>
        <span class="service-status__name">{{ service.short }}</span>
      </span>
    </summary>
    <div class="details-content">
      <h4 class="service-status__title">{{ $t("service.title") }}</h4>
      <p v-if="status.sensors24h !== null" class="service-status__sensors">
        {{ $t("service.sensors24h", { n: status.sensors24h }) }}
      </p>
      <details v-if="sensorsNoLocation.length > 0" class="service-status__nogeo">
        <summary>{{ $t("service.noGeo", { n: sensorsNoLocation.length }) }}</summary>
        <ul class="service-status__nogeo-list">
          <li v-for="sensor in sensorsNoLocation" :key="sensor.sensor_id">
            <a :href="sensorLink(sensor)" :title="sensor.sensor_id">
              <b>{{ shortId(sensor.sensor_id) }}</b>
              <span v-if="sensor.device_model"> · {{ sensor.device_model }}</span>
            </a>
          </li>
        </ul>
      </details>
      <ul class="service-status__list">
        <li v-for="service in services" :key="service.tech" :title="service.tech">
          <span
            class="service-status__dot"
            :class="`is-${service.state}`"
            aria-hidden="true"
          ></span>
          <div class="service-status__body">
            <div class="service-status__row">
              <b>{{ service.name }}</b>
              <span>{{ stateLabel(service.state) }}</span>
            </div>
            <div class="service-status__detail">{{ service.about }}</div>
            <div v-if="service.detail">{{ service.detail }}</div>
          </div>
        </li>
      </ul>
    </div>
  </details>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useServiceStatus } from "@/composables/useServiceStatus";
import { useSensors } from "@/composables/useSensors";
import { useMap } from "@/composables/useMap";

const { t } = useI18n();
const status = useServiceStatus();
const router = useRouter();
const mapState = useMap();

// Sensors reporting lat/lng 0,0 never get a marker; this list is the only way to reach them.
// Already filtered by excluded_sensors and bounds in the loader (markerRowsFromSensorData).
const { sensorsNoLocation: noLocationRef } = useSensors();
const sensorsNoLocation = computed(() => noLocationRef.value || []);

const sensorLink = (sensor) =>
  router.resolve({
    name: "main",
    query: {
      provider: mapState.currentProvider.value,
      type: mapState.currentUnit.value,
      sensor: sensor.sensor_id,
    },
  }).href;

const shortId = (id) => {
  const s = String(id);
  return s.length > 12 ? `${s.slice(0, 6)}…${s.slice(-6)}` : s;
};

const stateLabel = (state) =>
  ({
    ok: t("service.ok"),
    degraded: t("service.degraded"),
    down: t("service.down"),
    unknown: t("service.unknown"),
  }[state]);

const timeAgo = (time) => {
  const minutes = Math.floor((Date.now() - time) / 60000);
  if (minutes < 1) return t("service.justNow");
  if (minutes < 120) return t("service.minutesAgo", { n: minutes });
  return t("service.hoursAgo", { n: Math.floor(minutes / 60) });
};

// Robonomics makes a block about every 6 seconds.
const lagLabel = (blocks) => {
  const minutes = Math.floor((blocks * 6) / 60);
  if (minutes < 1) return t("service.upToDate");
  if (minutes < 120) return t("service.behindMinutes", { n: minutes });
  return t("service.behindHours", { n: Math.floor(minutes / 60) });
};

const services = computed(() => {
  const { connectivity, roseman, robonomics } = status;
  return [
    {
      tech: "Connectivity",
      name: t("service.data"),
      short: t("service.dataShort"),
      about: t("service.dataAbout"),
      state: connectivity.state,
      detail: connectivity.total
        ? t("service.dataNow", { active: connectivity.active, total: connectivity.total }) +
          (connectivity.lastRecordAt
            ? `, ${t("service.latestEntry", { ago: timeAgo(connectivity.lastRecordAt) })}`
            : "")
        : "",
    },
    {
      tech: "RoSeMAN",
      name: t("service.database"),
      short: t("service.databaseShort"),
      about: t("service.databaseAbout"),
      state: roseman.state,
      detail: roseman.lag === null ? "" : lagLabel(roseman.lag),
    },
    {
      tech: "Robonomics",
      name: t("service.chain"),
      short: t("service.chainShort"),
      about: t("service.chainAbout"),
      state: robonomics.state,
      detail: robonomics.blockAt ? t("service.newBlock", { ago: timeAgo(robonomics.blockAt) }) : "",
    },
  ];
});

const summaryLabel = computed(
  () =>
    `${t("service.title")}: ` +
    services.value.map((s) => `${s.name} ${stateLabel(s.state)}`).join(", ")
);
</script>

<style scoped>
.service-status {
  align-self: center;
}

.service-status .service-status__summary {
  gap: 16px;
  padding: 0 14px;
}

.service-status__summary:focus-visible {
  outline: 2px solid var(--app-buttoncolor);
  outline-offset: 2px;
}

.service-status__item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.service-status__dot {
  flex: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: transparent;
  box-shadow: inset 0 0 0 2px #7d848b;
}

.service-status__dot.is-ok {
  background: #2ea44f;
  box-shadow: none;
}

.service-status__dot.is-degraded {
  background: linear-gradient(90deg, #c97a00 50%, transparent 50%);
  box-shadow: inset 0 0 0 2px #c97a00;
}

.service-status__dot.is-down {
  background: linear-gradient(#fff 0 0) center / 8px 2px no-repeat, #d73a49;
  box-shadow: none;
}

.service-status .details-content {
  top: calc(100% + var(--gap));
  width: max-content;
  min-width: 300px;
  max-width: min(420px, calc(100vw - var(--gap) * 2));
  padding: 12px 16px;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
}

.service-status__title {
  font-size: 1rem;
  margin-bottom: 4px;
}

.service-status__sensors {
  margin: 0 0 4px;
  font-size: max(var(--font-size), 0.875rem);
}

.service-status__nogeo {
  margin: 0 0 8px;
  font-size: max(var(--font-size), 0.875rem);
}

.service-status__nogeo summary {
  cursor: pointer;
  color: var(--color-link, #0066cc);
}

.service-status__nogeo-list {
  margin: 4px 0 0;
  padding: 0;
  max-height: 40vh;
  overflow-y: auto;
}

.service-status__nogeo-list li {
  display: block;
  margin: 0;
  border-top: 1px dotted var(--app-bordercolor);
}

.service-status__nogeo-list a {
  display: block;
  padding: 5px 0;
}

.service-status__list {
  margin: 0;
  padding: 0;
}

.service-status__list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 0;
  padding: 10px 0;
  font-size: max(var(--font-size), 0.875rem);
}

.service-status__list li + li {
  border-top: 1px solid var(--surface-border);
}

.service-status__list li:last-child {
  padding-bottom: 0;
}

.service-status__list .service-status__dot {
  margin-top: calc((1lh - 12px) / 2);
}

.service-status__body {
  flex: 1;
  min-width: 0;
}

.service-status__row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
}

.service-status__detail {
  opacity: 0.75;
}

@media (width < 700px) {
  .service-status__name {
    display: none;
  }

  .service-status .service-status__summary {
    gap: 10px;
    padding: 0 12px;
  }

  .service-status__summary::after {
    content: "";
    position: absolute;
    inset: -3px 0;
  }
}

@media (width < 550px) {
  .service-status .details-content {
    top: calc(var(--gap) * 3 + var(--app-inputheight));
    right: var(--gap);
    bottom: auto;
    left: var(--gap);
    width: auto !important;
    min-width: 0;
    max-width: none !important;
  }
}
</style>
