<template>
  <details tabindex="0" class="service-status details-popup">
    <summary
      class="service-status__summary button-round-outline button-round-outline-labeled"
      :aria-label="summaryLabel"
    >
      <span v-for="service in services" :key="service.name" class="service-status__item">
        <span class="service-status__dot" :class="`is-${service.state}`" aria-hidden="true"></span>
        <span class="service-status__name">{{ service.name }}</span>
      </span>
    </summary>
    <div class="details-content">
      <h4 class="service-status__title">{{ $t("Service status") }}</h4>
      <ul class="service-status__list">
        <li v-for="service in services" :key="service.name">
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
            <div v-if="service.detail" class="service-status__detail">{{ service.detail }}</div>
          </div>
        </li>
      </ul>
    </div>
  </details>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useServiceStatus } from "@/composables/useServiceStatus";

const { t } = useI18n();
const status = useServiceStatus();

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

const services = computed(() => {
  const { connectivity, roseman, robonomics } = status;
  return [
    {
      name: "Connectivity",
      state: connectivity.state,
      detail: connectivity.total
        ? `${t("service.agentsWriting", {
            active: connectivity.active,
            total: connectivity.total,
          })}` +
          (connectivity.lastRecordAt
            ? `, ${t("service.lastRecord")} ${timeAgo(connectivity.lastRecordAt)}`
            : "")
        : "",
    },
    {
      name: "RoSeMAN",
      state: roseman.state,
      detail: roseman.lag === null ? "" : t("service.blocksBehind", { n: roseman.lag }),
    },
    {
      name: "Robonomics",
      state: robonomics.state,
      detail: robonomics.blockAt ? `${t("service.lastBlock")} ${timeAgo(robonomics.blockAt)}` : "",
    },
  ];
});

const summaryLabel = computed(
  () =>
    `${t("Service status")}: ` +
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
