<template>
  <section class="app-promo" :aria-label="t('app.title')">
    <QrCode
      class="app-promo__qr"
      :value="sensorLink"
      :size="200"
      :filename="`sensor-${sensorId}.png`"
    />

    <div class="app-promo__text">
      <p class="app-promo__eyebrow">
        <font-awesome-icon icon="fa-brands fa-android" aria-hidden="true" />
        {{ t("app.eyebrow") }}
      </p>
      <h3 class="app-promo__title">{{ t("app.title") }}</h3>
      <p class="app-promo__lead">{{ t("app.lead") }}</p>

      <ol class="app-promo__steps">
        <li>
          <i18n-t keypath="app.step1" tag="span">
            <template #github>
              <a :href="APP_RELEASES_URL" target="_blank" rel="noopener">GitHub</a>
            </template>
          </i18n-t>
        </li>
        <li>
          <i18n-t keypath="app.step2" tag="span">
            <template #add>
              <b>Add a sensor</b>
            </template>
            <template #scan>
              <b>Scan a QR code</b>
            </template>
          </i18n-t>
        </li>
        <li>{{ t("app.step3") }}</li>
      </ol>

      <a class="button app-promo__download" :href="APP_RELEASES_URL" target="_blank" rel="noopener">
        <font-awesome-icon icon="fa-brands fa-android" aria-hidden="true" />
        <span>{{ t("app.download") }}</span>
      </a>

      <p class="app-promo__note">
        <i18n-t keypath="app.onPhone" tag="span">
          <template #paste>
            <b>Paste an address</b>
          </template>
        </i18n-t>
      </p>
      <Copy
        v-if="sensorId"
        class="app-promo__copy"
        :msg="sensorId"
        :title="t('app.copyAddress')"
        :notify="t('details.copied')"
        >{{ t("app.copyAddress") }}</Copy
      >
      <p class="app-promo__note">{{ t("app.noAndroid") }}</p>
    </div>
  </section>
</template>

<script setup>
/**
 * The first step of the sensors.social Android app is scanning a sensor's QR code here, so the
 * sensor panel says what the code is for and where to get the app. The APK is distributed only
 * through GitHub releases (never as a file), hence the link to the releases page.
 */
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { settings } from "@config";
import Copy from "../../controls/Copy.vue";
import QrCode from "../../controls/QrCode.vue";

const APP_RELEASES_URL = "https://github.com/PinoutLimited/sensors-social-android/releases/latest";

const props = defineProps({
  sensorId: { type: String, default: "" },
  owner: { type: String, default: "" },
});

const { t } = useI18n();

// The plain sensor link: the app reads `sensor=` from it, a phone camera opens it on the map.
const sensorLink = computed(() => {
  if (!props.sensorId) return "";
  const params = new URLSearchParams();
  if (props.owner) params.set("owner", props.owner);
  params.set("sensor", props.sensorId);
  const base = String(settings?.SHARE_URL || "").replace(/\/$/, "") || `${window.location.origin}/`;
  return `${base}?${params.toString()}`;
});
</script>

<style scoped>
.app-promo {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: calc(var(--gap) * 1.5);
  align-items: start;
  padding: calc(var(--gap) * 1.25);
  border: 1px solid color-mix(in srgb, var(--color-blue), transparent 60%);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--color-blue), transparent 94%);
}

.app-promo__qr {
  margin: 0;
}

.app-promo__text {
  display: flex;
  flex-direction: column;
  gap: calc(var(--gap) * 0.6);
  min-width: 0;
}

.app-promo__text > * {
  margin: 0;
}

.app-promo__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  font-size: 0.85em;
  font-weight: 700;
  color: var(--color-blue);
}

.app-promo__title {
  font-size: calc(var(--font-size) * 1.5);
  line-height: 1.2;
}

.app-promo__lead {
  color: color-mix(in srgb, var(--app-textcolor), transparent 20%);
}

.app-promo__steps {
  padding-left: 1.3em;
  display: flex;
  flex-direction: column;
  gap: 0.35em;
}

.app-promo__download {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  background: var(--color-blue);
  border-color: var(--color-blue);
  color: #fff;
}

.app-promo__download:hover {
  background: color-mix(in srgb, var(--color-blue), #000 15%);
}

.app-promo__copy {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  font-size: 0.85em;
  font-weight: 700;
  cursor: pointer;
}

.app-promo__note {
  font-size: 0.85em;
  color: color-mix(in srgb, var(--app-textcolor), transparent 35%);
}

/* On a phone the reader is already holding the phone: the download and the address come
   first, the code to scan from another screen goes last. */
@media (width < 700px) {
  .app-promo {
    grid-template-columns: 1fr;
  }

  .app-promo__qr {
    order: 2;
    justify-self: center;
  }
}
</style>
