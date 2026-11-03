<template>
  <header :class="`route-${route.name || route.path.replaceAll('/', '-')}`">
    <div class="header-content flexline space-between">
      <div class="flexline align-start">
        <router-link to="/" class="appicon">
          <img :alt="settings.TITLE" src="../../../public/app-icon-512.png" />
        </router-link>
        <!-- Если есть sensorsNoLocation - показываем details с полным содержимым -->
        <details
          v-if="mapSensorsCountDisplay > 0 && mapNoLocationCount > 0"
          tabindex="0"
          class="sensors details-popup"
        >
          <summary class="sensors-counter">
            <IconSensor class="sensors-mainicon" />
            {{ mapSensorsCountDisplay }}
          </summary>
          <div class="details-content nogeo">
            <section>
              <h4>{{ sensorsNoLocation?.length }} sensors without geolocation</h4>
              <ul class="sensors-list">
                <li v-for="sensor in sensorsNoLocation" :key="sensor.sensor_id">
                  <a :href="getSensorLink(sensor)">
                    <b>{{ formatSensorId(sensor.sensor_id) }}</b>
                  </a>
                </li>
              </ul>
            </section>
          </div>
        </details>

        <!-- Если sensorsNoLocation пуст - показываем только div.sensors-counter -->
        <div v-else-if="mapSensorsCountDisplay > 0" class="sensors-counter">
          <IconSensor class="sensors-mainicon" />
          {{ mapSensorsCountDisplay }}
        </div>
      </div>

      <div class="flexline header-actions">
        <a
          href="/where-to-buy/"
          class="button button-outlined narrow-hide button-round-outline-brightgreen"
        >
          <font-awesome-icon icon="fa-solid fa-bag-shopping" aria-hidden="true" />
          <span>{{ $t("Shop sensors") }}</span>
        </a>

        <button class="popovercontrol button-round-outline" popovertarget="about">
          <font-awesome-icon icon="fa-solid fa-bars" />
        </button>

        <button
          class="popovercontrol button-round-outline bookmarksbutton"
          :class="{ active: bookmarksCount > 0 }"
          popovertarget="bookmarks"
        >
          <font-awesome-icon icon="fa-solid fa-bookmark" />
          <span class="button-round-outline__badge" v-if="bookmarksCount > 0">{{
            bookmarksCount
          }}</span>
        </button>

        <Login v-if="settings.SERVICES.accounts" />
      </div>
    </div>

    <div id="about" class="popover popover-top-right" popover>
        <h3>{{ $t("header.title") }}</h3>
        <p>
          {{ $t("header.text1") }}
          <a
            href="https://www.fsf.org/campaigns/priority-projects/decentralization-federation"
            target="_blank"
            rel="noopener"
            >{{ $t("header.link1") }}</a
          >
          {{ $t("header.text2") }}
          <a
            href="https://robonomics.academy/en/learn/sensors-connectivity-course/sensors-connectivity-module/"
            target="_blank"
            rel="noopener"
            >{{ $t("header.link2") }}</a
          >
          {{ $t("header.text3") }}
        </p>
        <p>
          {{ $t("Map data") }} ©
          <a href="https://www.openstreetmap.org/copyright" target="_blank">{{
            $t("OpenStreetMap contributors")
          }}</a>
        </p>
        <p>
          {{ $t("Sensor data") }} ©
          {{ $t("sensors.social contributors") }},
          <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener">ODbL 1.0</a>.
          {{ $t("Code") }}:
          <a href="https://github.com/airalab/sensors.social/blob/master/NOTICE" target="_blank" rel="noopener">AGPL-3.0</a>
        </p>

        <section class="navlinks">
          <router-link class="navtile" to="/altruist-device-info/">
            <font-awesome-icon class="navfa" icon="fa-solid fa-circle-info" />
            <span>{{ $t("Altruist device info") }}</span>
          </router-link>
          <router-link class="navtile" to="/where-to-buy/">
            <font-awesome-icon class="navfa" icon="fa-regular fa-credit-card" />
            <span>{{ $t("Where to buy") }}</span>
          </router-link>
          <router-link class="navtile" to="/altruist-use-cases/">
            <img class="navimg" :src="urbanIcon" alt="" aria-hidden="true" />
            <span>{{ $t("Altruist use cases") }}</span>
          </router-link>
          <router-link class="navtile" to="/altruist-timeline/">
            <font-awesome-icon class="navfa" icon="fa-solid fa-infinity" />
            <span>{{ $t("Altruist timeline") }}</span>
          </router-link>
          <router-link class="navtile" to="/altruist-compare/">
            <img class="navimg" :src="altruistIcon" alt="" aria-hidden="true" />
            <span>{{ $t("Altruist comparison table") }}</span>
          </router-link>
          <router-link class="navtile" to="/altruist-setup/">
            <img class="navimg" :src="diyIcon" alt="" aria-hidden="true" />
            <span>{{ $t("Altruist setup") }}</span>
          </router-link>
          <router-link class="navtile" to="/air-measurements/">
            <font-awesome-icon class="navfa" icon="fa-solid fa-chart-simple" />
            <span>{{ $t("links.measurement") }}</span>
          </router-link>
          <router-link class="navtile" to="/construction-monitoring/">
            <font-awesome-icon class="navfa" icon="fa-solid fa-helmet-safety" />
            <span>{{ $t("Construction monitoring") }}</span>
          </router-link>
          <router-link class="navtile" to="/blog/">
            <font-awesome-icon class="navfa" icon="fa-regular fa-newspaper" />
            <span>{{ $t("Blog") }}</span>
          </router-link>
          <router-link class="navtile" to="/noise-data-real-estate/">
            <font-awesome-icon class="navfa" icon="fa-solid fa-volume-high" />
            <span>{{ $t("Noise data for real estate") }}</span>
          </router-link>
          <router-link class="navtile" to="/privacy-policy/">
            <font-awesome-icon class="navfa" icon="fa-regular fa-file-lines" />
            <span>{{ $t("links.privacy") }}</span>
          </router-link>
          <router-link class="navtile" to="/support/">
            <font-awesome-icon class="navfa" icon="fa-regular fa-comment" />
            <span>{{ $t("Support") }}</span>
          </router-link>
        </section>

        <ReleaseInfo />

        <div class="locale-select-container">
          <select v-model="locale">
            <option v-for="lang in locales" :key="lang.code" :value="lang.code">
              {{ lang.title }}
            </option>
          </select>
        </div>
      </div>

    <div id="bookmarks" class="popover-top-right popover" popover>
      <h3>{{ $t("bookmarks.listtitle") }}</h3>
      <div class="bookmarks-content">
        <Bookmarks />
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, watch, onMounted, reactive } from "vue";
import { languages } from "@/translate";
import { settings, excluded_sensors } from "@config";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import { useMap } from "@/composables/useMap";
import { useBookmarks } from "@/composables/useBookmarks";
import { useSensors } from "@/composables/useSensors";

import IconSensor from "../icons/Sensor.vue";
import ReleaseInfo from "../ReleaseInfo.vue";
import Login from "./Login.vue";
import Bookmarks from "@/components/Bookmarks.vue";

import diyIcon from "@/assets/images/sensorTypes/DIY.svg";
import urbanIcon from "@/assets/images/sensorTypes/Urban.svg";
import altruistIcon from "@/assets/images/sensorTypes/Altruist.svg";

const { locale: i18nLocale } = useI18n();
const router = useRouter();
const route = useRoute();

const locale = ref(localStorage.getItem("locale") || i18nLocale.value || "en");
const locales = languages || ["en"];
const mapState = useMap();
const { idbBookmarks } = useBookmarks();
const localeComputed = computed(() => locale.value || "en");
const sensorsData = reactive(useSensors());

/**
 * Фильтрует сенсоры согласно конфигурации excluded_sensors
 * @param {Array} sensors - массив сенсоров для фильтрации
 * @returns {Array} отфильтрованный массив сенсоров
 */
const filterSensors = (sensors) => {
  if (!excluded_sensors || !excluded_sensors.sensors || excluded_sensors.sensors.length === 0) {
    return sensors || [];
  }

  const { mode, sensors: configSensors } = excluded_sensors;
  const sensorIdsSet = new Set(configSensors);

  if (!Array.isArray(sensors)) return [];

  if (mode === "include-only") {
    // Whitelist: показываем только сенсоры из списка
    return sensors.filter((sensor) => sensorIdsSet.has(sensor.sensor_id));
  } else {
    // Blacklist (exclude): скрываем сенсоры из списка
    return sensors.filter((sensor) => !sensorIdsSet.has(sensor.sensor_id));
  }
};

const sensorsNoLocation = computed(() => filterSensors(sensorsData.sensorsNoLocation));

/** No-geo sensors in the counter total (each device row). */
const mapNoLocationCount = computed(() => (sensorsNoLocation.value || []).length);

/** Total sensors with geo from the loaded list (single source: useSensors). */
const mapSensorsCountDisplay = computed(() => sensorsData.mapSensorsCount ?? 0);

// Количество закладок
const bookmarksCount = computed(() => idbBookmarks.value?.length || 0);

// Make a link for sensor. E.g. origin/#/provider/pm10/20/lat/lng/sensor_id
const getSensorLink = (sensor) => {
  return router.resolve({
    name: "main",
    query: {
      provider: mapState.currentProvider.value,
      type: mapState.currentUnit.value,
      zoom: settings.MAP.zoom,
      lat: sensor.geo.lat,
      lng: sensor.geo.lng,
      sensor: sensor.sensor_id,
    },
  }).href;
};

// Функция форматирования sensor_id: первые 6 символов, троеточие, последние 6
const formatSensorId = (id) => {
  id = String(id);
  if (id.length > 12) {
    return id.substring(0, 6) + "..." + id.substring(id.length - 6);
  }
  return id;
};

watch(
  locale,
  (newValue) => {
    i18nLocale.value = newValue;
    localStorage.setItem("locale", newValue);
  },
  { immediate: true }
);

onMounted(() => {
  // Close all opened details on body click if this is Tooltip

  document.body.onclick = (e) => {
    const current = e.target.closest('details[tabindex="0"]'); //save clicked element to detect if it is our current detail
    document.body.querySelectorAll('details[tabindex="0"]').forEach((e) => {
      if (e !== current) {
        //we need this condition not to break details behavior
        e.open = false;
      }
    });
  };

  // Update for Indiegogo timer hourly
  // timer = setInterval(() => { now.value = new Date() }, 1000 * 60 * 60);
});
</script>

<style scoped>
header {
  left: 0;
  position: sticky;
  top: 0;
  width: 100%;
  z-index: 99;
  pointer-events: none;
  box-shadow: 0 6px 12px -4px rgba(0, 0, 0, 0.12);
}

header.route-altruist-compare {
  position: static;
}

header > * {
  pointer-events: all;
}

/* Popovers live outside the flex row; closed state must not affect header layout */
header > .popover {
  position: fixed;
  margin: 0;
}

.header-content {
  padding: calc(var(--gap) / 2) var(--gap);
  background-color: var(--app-bodybg);
}

@media screen and (max-width: 460px) {
  .latest-updates span {
    display: none;
  }

  .latest-updates {
    padding-left: calc(var(--gap) * 0.75);
    padding-right: calc(var(--gap) * 0.75);
    min-width: 2.6rem;
    justify-content: center;
  }
}

.appicon {
  border-radius: 0.5rem;
  display: block;
  overflow: hidden;
  user-select: none;
  width: 2.5rem;
}

.appicon img {
  display: block;
  max-width: 100%;
}

#about p {
  font-size: 1em;
  line-height: 1.55;
}

#about h3 {
  font-size: 1.4em;
  letter-spacing: 0.2px;
  margin-bottom: calc(var(--gap) * 0.75);
}

.locale-select-container select {
  --app-inputpadding: 1rem;
  height: auto;
  line-height: 1.2;
  padding-top: 0.9rem;
  padding-bottom: 0.9rem;
}

.navlinks {
  font-weight: 900;
  margin-bottom: calc(var(--gap) * 1.5);
  display: grid;
  gap: calc(var(--gap) * 0.55);
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
}

.navlinks a.navtile {
  margin-bottom: 0;
  display: flex;
  align-items: center;
  gap: calc(var(--gap) * 0.8);
  padding: calc(var(--gap) * 0.7) calc(var(--gap) * 0.5);
  text-decoration: none;
  color: var(--color-blue);
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.025), rgba(0, 0, 0, 0.01));
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  font-size: calc(var(--font-size) * 1.1);
  min-height: 3.1rem;
  height: 100%;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease,
    box-shadow 0.15s ease;
}

.navlinks a.navtile:hover {
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.045), rgba(0, 0, 0, 0.02));
  border-color: rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}

.navlinks a.navtile span {
  line-height: 1.15;
  flex: 1 1 auto;
}

.navlinks a.navtile .navfa {
  color: var(--color-dark);
}

.navimg {
  width: 1.35em;
  height: 1.35em;
  flex: 0 0 auto;
  display: block;
}

/* + sensors list */

.sensors-counter {
  display: flex;
  align-items: center;
  gap: 3px;
  color: var(--color-dark);
  background-color: var(--color-light);
  border-radius: 5px;
  padding: 4px 5px;
  font-weight: bold;
  border: var(--app-borderwidth) solid var(--app-bordercolor);
}

.sensors-mainicon {
  width: 19px;
}

.sensors-list a {
  display: block;
  padding: 5px;
}

.sensors-list li {
  display: block;
  border-top: 1px dotted var(--app-bordercolor);
  margin: 0;
}
/* - sensors list */

/* - bookmarks button */
.bookmarksbutton.active {
  color: var(--color-orange);
}

.bookmarksbutton.active:hover {
  color: var(--color-orange-dark, #e67e22);
}

/* - bookmarks popup */
#bookmarks {
  padding: 0;
  min-width: 320px;
  max-width: 400px;
  max-height: 500px;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

#bookmarks h3 {
  margin: 0 0 16px 0;
  padding: 16px 16px 0 16px;
  font-size: 1.2em;
  font-weight: 600;
  color: var(--color-text);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding-bottom: 12px;
}

#bookmarks .bookmarks-content {
  padding: 0 16px 16px 16px;
}

/* Стили для элементов внутри закладок */
#bookmarks .bookmarks-content > * {
  margin-bottom: 8px;
}

#bookmarks .bookmarks-content > *:last-child {
  margin-bottom: 0;
}

/* Анимация для счетчика */
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

/* Адаптивность для мобильных */
@media screen and (max-width: 600px) {
  #bookmarks {
    min-width: 280px;
    max-width: calc(100vw - 32px);
    margin: 0 16px;
  }

  .navlinks {
    grid-template-columns: 1fr;
    gap: calc(var(--gap) * 1.4);
  }

  .navlinks a.navtile {
    font-size: calc(var(--font-size) * 1.2);
    padding: calc(var(--gap) * 1.5) calc(var(--gap) * 0.8);
    min-height: 3.8rem;
  }
}
/* - bookmarks button */

@media screen and (width < 600px) {
  .header-actions {
    gap: var(--gap);
  }

  .hidemobiles {
    display: none;
  }
}

@media screen and (width > 900px) {
  .nogeo {
    display: grid;
    grid-template-columns: 350px 1fr;
    max-width: calc(100vw - var(--gap) * 2) !important;
    /* min-width: min(800px, calc(100vw - (var(--gap) * 2))) !important; */
    gap: calc(var(--gap) * 2);
  }
}

.locale-select-container {
  text-align: center;
  margin-top: var(--gap);
}
</style>

<style>
/* По умолчанию popover backdrop не ч/б (см. base.css).
   Для header popover оставляем grayscale, как было раньше. */
#about:popover-open::backdrop,
#bookmarks:popover-open::backdrop,
#accounts:popover-open::backdrop {
  backdrop-filter: grayscale(1);
}

/* Polyfill fallback: в CSS используется класс `.\:popover-open`. */
#about.\:popover-open::backdrop,
#bookmarks.\:popover-open::backdrop,
#accounts.\:popover-open::backdrop {
  backdrop-filter: grayscale(1);
}
</style>
