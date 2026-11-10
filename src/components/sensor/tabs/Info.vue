<template>
  <!-- TODO: sensor avatar via getAvatar(sensorId) from @/utils/avatarGenerator -->
  <section class="sensor-info-tab">
    <div class="infoline flexline" v-if="sensorId">
      <div class="infoline-title">{{ t("sensorpopup.infosensorid") }}:</div>
      <div class="infoline-info">
        <span>{{ collapsedSensorId }}</span>
        <Copy :msg="sensorId" :title="`Copy ${sensorId}`" :notify="t('details.copied')" />
      </div>
    </div>

    <div class="infoline flexline" v-if="owner">
      <div class="infoline-title">{{ t("sensorpopup.infosensorowner") }}:</div>
      <div class="infoline-info">
        <span>{{ collapsedOwner }}</span>
        <Copy :msg="owner" :title="`Copy ${owner}`" :notify="t('details.copied')" />
      </div>
    </div>

    <div class="infoline flexline" v-if="geo && geo.lat && geo.lng">
      <div class="infoline-title">{{ t("sensorpopup.infosensorgeo") }}:</div>
      <div class="infoline-info">
        <template v-if="mapInfo.href">
          <a :href="mapInfo.href" target="_blank">
            {{ geo.lat }}, {{ geo.lng }}
            <img
              v-if="mapInfo.icon"
              :src="mapInfo.icon"
              :alt="mapInfo.provider"
              class="map-provider-icon"
            />
          </a>
        </template>
        <span v-else>{{ geo.lat }}, {{ geo.lng }}</span>
      </div>
    </div>

    <div class="infoline flexline" v-if="metaUserLink">
      <div class="infoline-title">{{ t("sensorpopup.infosensorowner") }}:</div>
      <div class="infoline-info">
        <a :href="metaUserLink" rel="noopener" target="_blank">{{ metaUserLink }}</a>
      </div>
    </div>

    <QrCode
      v-if="sensorLink"
      :value="sensorLink"
      :label="t('qr.caption')"
      :filename="`sensor-${sensorId}.png`"
    />
  </section>
</template>

<script setup>
import { computed, getCurrentInstance } from "vue";
import { useI18n } from "vue-i18n";
import Copy from "../../controls/Copy.vue";
import QrCode from "../../controls/QrCode.vue";
import { pinned_sensors, settings } from "@config";
import appleMapIcon from "@/assets/images/map-apps-icons/Apple-map-icon.svg";
import googleMapIcon from "@/assets/images/map-apps-icons/Google-map-icon.svg";

const props = defineProps({
  sensorId: String,
  owner: String,
  geo: Object,
});

const { t } = useI18n();
const { proxy } = getCurrentInstance();
const filters = proxy?.$filters || null;

const collapsedSensorId = computed(() => {
  if (!props.sensorId) return "";
  return filters?.collapse ? filters.collapse(props.sensorId) : props.sensorId;
});

const collapsedOwner = computed(() => {
  if (!props.owner) return "";
  return filters?.collapse ? filters.collapse(props.owner) : props.owner;
});

/** Same shape as the default Share link: owner + sensor on the share host. */
const sensorLink = computed(() => {
  if (!props.sensorId) return "";
  const params = new URLSearchParams();
  if (props.owner) params.set("owner", props.owner);
  params.set("sensor", props.sensorId);
  const base = String(settings?.SHARE_URL || "").replace(/\/$/, "") || `${window.location.origin}/`;
  return `${base}?${params.toString()}`;
});

const MAP_ICONS = {
  apple: appleMapIcon,
  google: googleMapIcon,
};

const mapInfo = computed(() => {
  if (!props.sensorId || !props.geo?.lat || !props.geo?.lng) {
    return { href: null, provider: null, icon: null };
  }
  const info = getMapLink(props.geo.lat, props.geo.lng, `Air Sensor: ${props.sensorId}`);
  return {
    ...info,
    icon: MAP_ICONS[info.provider] || null,
  };
});

const metaUserLink = computed(() => {
  if (!props.sensorId) return "";
  return pinned_sensors[props.sensorId]?.link || "";
});

function getMapLink(lat, lon, label = "Sensor") {
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);

  if (isIOS) {
    return {
      href: `https://maps.apple.com/?ll=${lat},${lon}&q=${encodeURIComponent(label)}`,
      provider: "apple",
    };
  }
  if (isAndroid) {
    return {
      href: `geo:${lat},${lon}?q=${lat},${lon}(${encodeURIComponent(label)})`,
      provider: "google",
    };
  }
  return {
    href: `https://www.google.com/maps?q=${lat},${lon}`,
    provider: "google",
  };
}
</script>

<style scoped>
.sensor-info-tab {
  display: flex;
  flex-direction: column;
  gap: var(--gap);
}

.infoline.flexline {
  display: flex;
  gap: calc(var(--gap) * 0.5);
  align-items: center;
  flex-wrap: wrap;
}

.infoline-title {
  font-weight: bold;
  min-width: 120px;
}

.infoline-info {
  display: flex;
  align-items: center;
  gap: calc(var(--gap) * 0.5);
  flex-wrap: wrap;
}

.map-provider-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  margin-left: calc(var(--gap) * 0.25);
  vertical-align: middle;
}
</style>
