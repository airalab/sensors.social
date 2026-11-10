<template>
  <figure class="qrcode" v-if="value">
    <!-- eslint-disable-next-line vue/no-v-html -- SVG is generated locally by `qrcode` from a URL we build -->
    <div
      class="qrcode-image"
      :style="{ width: `${size}px` }"
      v-html="svg"
      role="img"
      :aria-label="label || value"
    ></div>
    <figcaption v-if="label" class="qrcode-caption">{{ label }}</figcaption>
    <button type="button" class="qrcode-download" @click="download">
      <font-awesome-icon icon="fa-solid fa-download" />
      <span>{{ t("qr.download") }}</span>
    </button>
  </figure>
</template>

<script setup>
/**
 * QR for a sensor link. Encodes the same share URL people copy, so a phone camera opens
 * the sensor on sensors.social (the sensors.social Android app reads the same link).
 * Rendered locally by `qrcode`; dark modules on white regardless of site theme —
 * scanners need the contrast.
 */
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import QRCode from "qrcode";

const props = defineProps({
  value: { type: String, default: "" },
  size: { type: Number, default: 180 },
  label: { type: String, default: "" },
  filename: { type: String, default: "sensor-qr.png" },
});

const { t } = useI18n();
const svg = ref("");
const QR_OPTIONS = {
  errorCorrectionLevel: "M",
  margin: 2,
  color: { dark: "#000000", light: "#ffffff" },
};

watch(
  () => props.value,
  async (value) => {
    if (!value) {
      svg.value = "";
      return;
    }
    try {
      svg.value = await QRCode.toString(value, { ...QR_OPTIONS, type: "svg" });
    } catch (error) {
      console.warn("QR render failed:", error);
      svg.value = "";
    }
  },
  { immediate: true }
);

async function download() {
  try {
    const url = await QRCode.toDataURL(props.value, { ...QR_OPTIONS, width: 1024 });
    const a = document.createElement("a");
    a.href = url;
    a.download = props.filename;
    a.click();
  } catch (error) {
    console.warn("QR download failed:", error);
  }
}
</script>

<style scoped>
.qrcode {
  margin: 0;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: calc(var(--gap) * 0.5);
}

.qrcode-image {
  max-width: 100%;
  background: #fff;
  border-radius: 8px;
  line-height: 0;
}

.qrcode-image :deep(svg) {
  width: 100%;
  height: auto;
  display: block;
}

.qrcode-caption {
  font-size: 0.8em;
  color: var(--color-gray, #666);
  max-width: 260px;
  line-height: 1.3;
}

.qrcode-download {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--gap) * 0.4);
  background: none;
  border: 0;
  padding: 0;
  color: var(--color-link, #0066cc);
  font: inherit;
  font-size: 0.85em;
  cursor: pointer;
}
</style>
