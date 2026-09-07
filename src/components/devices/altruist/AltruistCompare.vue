<template>
  <section>
    <h2>{{ $t("Air Sensor Comparison Table") }}</h2>

    <img
      alt=""
      src="@/assets/images/pages/altruist-compare/compare-stand.gif"
      v-if="gif"
      class="gif"
    />

    <div class="compare-promo" v-if="promo">
      <p>
        {{
          $t(
            "Altruist is two devices working as one. Urban goes outside and measures what the street does to your air: PM2.5 and PM10, temperature, humidity, pressure and noise in decibels. Insight stays in the room and measures what you actually breathe: CO2 through an NDIR sensor, shown on an e-ink screen you can read from across the table."
          )
        }}
      </p>
      <ul>
        <li>
          <b>{{ $t("Open from the firmware up.") }}</b>
          {{
            $t(
              "The firmware, the schematics and the open source cloud it talks to are all public. You can read the code, change it, and build on it."
            )
          }}
        </li>
        <li>
          <b>{{ $t("Works on its own.") }}</b>
          {{
            $t(
              "Local control over your own network, a native Home Assistant integration and a microSD card for history. The device keeps measuring and showing data with no internet connection at all."
            )
          }}
        </li>
        <li>
          <b>{{ $t("Your data, your call.") }}</b>
          {{
            $t(
              "Publish your measurements to the open source cloud and they join a public map, or keep everything inside your own network."
            )
          }}
        </li>
      </ul>
      <p>{{ $t("Here is how Altruist measures up, feature by feature.") }}</p>
    </div>

    <div class="compare-table">
      <table>
        <thead>
          <tr>
            <th>{{ $t("Model") }}</th>
            <th v-for="(device, i) in deviceHeaders" :key="'name-' + i">
              {{ device.name }}
            </th>
          </tr>
          <tr>
            <th>{{ $t("Photo") }}</th>
            <th v-for="(device, i) in deviceHeaders" :key="'img-' + i">
              <img :src="device.img" :alt="device.name + ' device'" class="device-photo" />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in tableData" :key="rowIndex">
            <td>{{ row.feature }}</td>
            <td
              v-for="(value, i) in [
                row.urban,
                row.altruist,
                row.airvisual,
                row.airgradient,
                row.purpleair,
                row.netatmo,
              ]"
              :key="i"
              :class="getMarkClass(value.mark)"
            >
              <template v-if="isMobile">
                <div class="device-mobile-label">
                  <img
                    :src="deviceHeaders[i].img"
                    :alt="deviceHeaders[i].name"
                    class="device-label-img"
                  />
                  <span class="device-label-title">{{ deviceHeaders[i].name }}</span>
                </div>
              </template>

              <template v-if="row.feature === 'Price' && i < 2">
                <a :href="i === 0 ? urbanLink : storeLink"
                  ><b>{{ formatValue(value) }}</b></a
                >
              </template>
              <template v-else-if="row.feature === 'Price'">
                <b>{{ formatValue(value) }}</b>
              </template>
              <template v-else>
                {{ formatValue(value) }}
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="compare-cta">
      <a :href="storeLink" class="button">{{ $t("Buy on Cyberpunks.shop") }}</a>
    </p>
  </section>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";

import altruistImg from "@/assets/images/altruist-device/Altruist-bundle.webp";
import purpleAirImg from "@/assets/images/compare-table/purpleAir-device.webp";
import airGradientImg from "@/assets/images/compare-table/airGradient-device.webp";
import netatmoImg from "@/assets/images/compare-table/netatmo-device.webp";
import airVisualImg from "@/assets/images/compare-table/airvisual-device.webp";

import { useI18n } from "vue-i18n";
const { t: $t } = useI18n();

const props = defineProps({
  gif: { type: Boolean, default: false },
  promo: { type: Boolean, default: false },
});

const deviceHeaders = [
  // TODO: заменить на фото самого Urban, сейчас стоит снимок комплекта.
  { name: $t("Altruist Urban"), img: altruistImg },
  { name: $t("Altruist Dual"), img: altruistImg },
  { name: $t("AirVisual Pro & Outdoor"), img: airVisualImg },
  { name: $t("AirGradient Indoor & Outdoor"), img: airGradientImg },
  { name: $t("PurpleAir Zen"), img: purpleAirImg },
  { name: $t("Netatmo Weather Station"), img: netatmoImg },
];

const STORE_URLS = {
  urban: "https://cyberpunks.shop/en/altruist-urban",
  dual: "https://cyberpunks.shop/en/altruist-dual",
};

// Метки клика переносим из адреса страницы в ссылку на магазин: замер стоит
// там, а не здесь, и без gclid платный клик не свяжется с заказом.
const PASS_THROUGH = ["gclid", "gbraid", "wbraid", "msclkid", "fbclid"];

const buildStoreLink = (target) => {
  const incoming = new URLSearchParams(window.location.search);
  const url = new URL(target);
  for (const key of PASS_THROUGH) {
    const value = incoming.get(key);
    if (value) url.searchParams.set(key, value);
  }
  for (const [key, value] of incoming.entries()) {
    if (key.startsWith("utm_")) url.searchParams.set(key, value);
  }
  if (!url.searchParams.has("utm_source")) {
    url.searchParams.set("utm_source", "sensors.social");
    url.searchParams.set("utm_medium", "compare");
  }
  return url.toString();
};

const urbanLink = computed(() => buildStoreLink(STORE_URLS.urban));
const storeLink = computed(() => buildStoreLink(STORE_URLS.dual));

const tableData = [
  {
    feature: $t("Price"),
    urban: { value: "€210 ($244)", mark: " " },
    altruist: { value: "€360 ($418)", mark: " " },
    purpleair: { value: "€257 ($299)", mark: " " },
    airgradient: { value: "€392 ($455)", mark: " " },
    netatmo: { value: "€150 ($174)", mark: " " },
    airvisual: { value: "€542 ($630)", mark: " " },
  },
  {
    feature: $t("Type"),
    urban: { value: $t("Single outdoor module"), mark: " " },
    altruist: { value: $t("Dual-module, outdoor and indoor"), mark: " " },
    purpleair: { value: $t("Can be outdoor or indoor"), mark: " " },
    airgradient: { value: $t("Two separate modules"), mark: " " },
    netatmo: { value: $t("Dual-module, outdoor and indoor"), mark: " " },
    airvisual: { value: $t("Two separate modules"), mark: " " },
  },
  {
    feature: $t("Particle Sensor"),
    urban: { value: $t("Yes"), mark: "good" },
    altruist: { value: $t("Yes"), mark: "good" },
    purpleair: { value: $t("Yes"), mark: "good" },
    airgradient: { value: $t("Yes"), mark: "good" },
    netatmo: { value: $t("No"), mark: "bad" },
    airvisual: { value: $t("Yes"), mark: "good" },
  },
  {
    feature: $t("Urban Noise Sensor"),
    urban: { value: $t("Yes"), mark: "good" },
    altruist: { value: $t("Yes"), mark: "good" },
    purpleair: { value: $t("No"), mark: "bad" },
    airgradient: { value: $t("No"), mark: "bad" },
    netatmo: { value: $t("Only indoor"), mark: "neutral" },
    airvisual: { value: $t("No"), mark: "bad" },
  },
  {
    feature: $t("Indoor CO2"),
    urban: { value: $t("No"), mark: "bad" },
    altruist: { value: $t("Yes"), mark: "good" },
    purpleair: { value: $t("No"), mark: "bad" },
    airgradient: { value: $t("Yes"), mark: "good" },
    netatmo: { value: $t("Yes"), mark: "good" },
    airvisual: { value: $t("Yes"), mark: "good" },
  },
  {
    feature: $t("User Interface on Device"),
    urban: { value: $t("LED indication"), mark: "neutral" },
    altruist: { value: $t("LED indication on Urban + E-ink screen on Insight"), mark: "neutral" },
    purpleair: { value: $t("Only LED strip"), mark: "neutral" },
    airgradient: { value: $t("LED indication and small screen on Indoor"), mark: "neutral" },
    netatmo: { value: $t("Only LED strip"), mark: "neutral" },
    airvisual: { value: $t("LED indication on Outdoor and LCD screen on Pro"), mark: "neutral" },
  },
  {
    feature: $t("microSD Support"),
    urban: { value: $t("Yes"), mark: "good" },
    altruist: { value: $t("Yes"), mark: "good" },
    purpleair: { value: $t("Yes"), mark: "good" },
    airgradient: { value: $t("No"), mark: "bad" },
    netatmo: { value: $t("No"), mark: "bad" },
    airvisual: { value: $t("No"), mark: "bad" },
  },
  {
    feature: $t("Power Connector"),
    urban: { value: $t("USB Type-C"), mark: "good" },
    altruist: { value: $t("USB Type-C"), mark: "good" },
    purpleair: { value: $t("Micro USB"), mark: "bad" },
    airgradient: { value: $t("USB Type-C"), mark: "good" },
    netatmo: { value: $t("Micro USB"), mark: "bad" },
    airvisual: { value: $t("Micro USB on Pro & Ethernet PoE on Outdoor"), mark: "neutral" },
  },
  {
    feature: $t("Housing"),
    urban: { value: $t("3D printed, different colors and icons"), mark: "good" },
    altruist: { value: $t("3D printed, different colors and icons"), mark: "good" },
    purpleair: { value: $t("Only one color available"), mark: "bad" },
    airgradient: { value: $t("Only one color available"), mark: "bad" },
    netatmo: { value: $t("Only one color available"), mark: "bad" },
    airvisual: { value: $t("Only one color available"), mark: "bad" },
  },
  {
    feature: $t("Water Protection"),
    urban: { value: $t("Fully sealed housing, air supply tube"), mark: "good" },
    altruist: { value: $t("Fully sealed housing, air supply tube"), mark: "good" },
    purpleair: { value: $t("Unprotected open bottom of the sensor"), mark: "bad" },
    airgradient: { value: $t("Fully sealed housing"), mark: "good" },
    netatmo: { value: $t("Fully sealed housing"), mark: "good" },
    airvisual: { value: $t("Fully sealed housing"), mark: "good" },
  },
  {
    feature: $t("UV Protection"),
    urban: { value: $t("Protective shield made of ASA plastic"), mark: "good" },
    altruist: { value: $t("Protective shield made of ASA plastic"), mark: "good" },
    purpleair: { value: $t("Not specified"), mark: "bad" },
    airgradient: { value: $t("Housing is made of ASA plastic"), mark: "good" },
    netatmo: { value: $t("Not specified"), mark: "bad" },
    airvisual: { value: $t("Yes"), mark: "good" },
  },
  {
    feature: $t("Mandatory Cloud Connection"),
    urban: { value: $t("No"), mark: "good" },
    altruist: { value: $t("No"), mark: "good" },
    purpleair: { value: $t("Yes"), mark: "bad" },
    airgradient: { value: $t("No"), mark: "good" },
    netatmo: { value: $t("Yes"), mark: "bad" },
    airvisual: { value: $t("Yes"), mark: "bad" },
  },
  {
    feature: $t("Local Device Management via IP"),
    urban: { value: $t("Full control over settings"), mark: "good" },
    altruist: { value: $t("Full control over settings"), mark: "good" },
    purpleair: {
      value: $t("Most functions are not available, settings only via corporate cloud"),
      mark: "bad",
    },
    airgradient: { value: $t("No, but available via Home Assistant"), mark: "neutral" },
    netatmo: { value: $t("No, only in the app"), mark: "bad" },
    airvisual: { value: $t("No, only in the app"), mark: "bad" },
  },
  {
    feature: $t("Online Air Quality Map by Community"),
    urban: { value: $t("Yes, optional"), mark: "good" },
    altruist: { value: $t("Yes, optional"), mark: "good" },
    purpleair: { value: $t("Yes, main entry point to view data"), mark: "good" },
    airgradient: { value: $t("Yes, optional"), mark: "good" },
    netatmo: { value: $t("Yes, optional"), mark: "good" },
    airvisual: { value: $t("Yes, optional"), mark: "good" },
  },
  {
    feature: $t("Home Assistant Integration"),
    urban: { value: $t("Yes, only the HA addon is needed"), mark: "good" },
    altruist: { value: $t("Yes, only the HA addon is needed"), mark: "good" },
    purpleair: { value: $t("Yes, but limited API and cloud connection are required"), mark: "bad" },
    airgradient: { value: $t("Yes, only the HA addon is needed"), mark: "good" },
    netatmo: { value: $t("Yes, only the HA addon is needed"), mark: "good" },
    airvisual: { value: $t("Yes, but only for Pro"), mark: "bad" },
  },
  {
    feature: $t("Data Control and Ownership"),
    urban: { value: $t("The user owns the data and controls its distribution"), mark: "good" },
    altruist: { value: $t("The user owns the data and controls its distribution"), mark: "good" },
    purpleair: {
      value: $t(
        "The company owns the data, but users can view and export it with some limitations"
      ),
      mark: "bad",
    },
    airgradient: {
      value: $t("The user owns the data and controls its distribution"),
      mark: "good",
    },
    netatmo: {
      value: $t(
        "Officially owned by users, but they must consent to the company's use of their data"
      ),
      mark: "bad",
    },
    airvisual: {
      value: $t(
        "Officially owned by users, but they must consent to the company's use of their data"
      ),
      mark: "bad",
    },
  },
  {
    feature: $t("Open Source and Hardware"),
    urban: { value: $t("Yes"), mark: "good" },
    altruist: { value: $t("Yes"), mark: "good" },
    purpleair: { value: $t("No"), mark: "bad" },
    airgradient: { value: $t("Yes"), mark: "good" },
    netatmo: { value: $t("No"), mark: "bad" },
    airvisual: { value: $t("No"), mark: "bad" },
  },
  {
    feature: $t("Custom Firmware and DIY-mods"),
    urban: { value: $t("Yes"), mark: "good" },
    altruist: { value: $t("Yes"), mark: "good" },
    purpleair: { value: $t("No"), mark: "bad" },
    airgradient: { value: $t("Yes"), mark: "good" },
    netatmo: { value: $t("No"), mark: "bad" },
    airvisual: { value: $t("No"), mark: "bad" },
  },
];

const formatValue = (valObj) => valObj?.value || "";
const getMarkClass = (mark) => (mark?.trim() ? `mark-${mark}` : "");

const isMobile = ref(window.innerWidth < 1000);

const updateMobile = () => {
  isMobile.value = window.innerWidth < 1000;
};

onMounted(() => window.addEventListener("resize", updateMobile));
onUnmounted(() => window.removeEventListener("resize", updateMobile));
</script>

<style scoped>
.compare-table {
  width: 100%;
  max-width: 100%;
  margin: calc(var(--gap) * 1.25) 0;
}

@media (width >= 1000px) {
  .compare-table {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
  margin: 0;
}

@media (width >= 1000px) {
  table {
    min-width: 1320px;
  }
}

.device-photo,
.device-label-img {
  display: inline-block;
  object-fit: contain;
}

.device-photo {
  max-width: 150px;
}

.device-label-img {
  max-width: 40px;
}

td:first-child {
  font-weight: bold;
}

th:first-child {
  min-width: 160px;
}

th:not(:first-child) {
  text-align: center;
}

h2 {
  position: sticky;
  top: 0;
  background-color: var(--app-bodybg);
  z-index: 1000;
}

.mark-good {
  background-color: var(--color-green-bright);
}

.mark-bad {
  background-color: var(--color-light-gray);
}

.mark-neutral {
  background-color: var(--color-bright-green-dim);
}

@media (width > 1000px) {
  thead tr:first-child th {
    position: sticky;
    top: 3.5rem; /* чтобы не перекрывало h2 */
    background: var(--app-bodybg);
    z-index: 999;
  }
}

/* When table is horizontally scrollable, avoid sticky interactions */
@media (width >= 1000px) {
  h2 {
    position: static;
  }

  thead tr:first-child th {
    position: static;
  }
}

@media (width < 1000px) {
  .compare-table {
    max-width: 760px;
    margin-left: auto;
    margin-right: auto;
  }

  table,
  thead,
  tbody,
  th,
  td,
  tr {
    display: block;
  }

  thead tr {
    display: none;
  }

  tr {
    margin-bottom: calc(var(--gap) * 2);
    /* border-bottom: 2px solid var(--app-bordercolor); */
    max-width: 760px;
    margin-left: auto;
    margin-right: auto;
  }

  td {
    position: relative;
    min-height: 40px;
    border: none;
    border-bottom: 1px solid var(--app-bordercolor);
    text-align: center !important;
  }

  td:first-child {
    font-weight: 900;
    text-transform: uppercase;
    border-bottom: 0;
  }

  td:last-child {
    border-bottom: 0;
  }

  .device-photo {
    display: none;
  }

  .device-mobile-label {
    display: flex;
    gap: calc(var(--gap) / 2);
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin-bottom: calc(var(--gap) / 2);
  }

  tbody tr:last-child td,
  tfoot tr:last-child td {
    border-bottom-width: 1px;
  }
}
.gif {
  display: block;
  width: 100%;
  margin-bottom: calc(var(--gap) * 2);
}

.compare-promo {
  max-width: 800px;
  margin: calc(var(--gap) * 1.5) auto calc(var(--gap) * 2);
}

.compare-promo ul {
  padding-left: 1.2rem;
}

.compare-promo li {
  margin-bottom: 0.6rem;
}

.compare-cta {
  margin-top: 2rem;
  text-align: center;
}
</style>
