<template>
  <!-- <div class="maintenance-banner">
    <a
      href="https://cyberpunks.shop/"
      target="_blank"
      rel="noopener noreferrer"
      class="maintenance-banner-link"
    >
      <span>Buy a map-ready air quality sensor <i>[Track your local environment]</i></span>
      <font-awesome-icon icon="fa-solid fa-arrow-right" class="maintenance-banner-arrow" aria-hidden="true" />
    </a>
  </div> -->
  <RouterView />
  <notifications :classes="['notify', 'vue-notification']" />
</template>

<script setup>
import { RouterView } from "vue-router";
import { onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useAccounts } from "@/composables/useAccounts";

import config from "@/config/default/config.json";
// import { getSensorsMapList } from "./utils/map/markers/requests"; // Убран - теперь используется только в Main.vue

const route = useRoute();
const router = useRouter();

/*
  Класс для /main
*/
function updateAppClass() {
  const app = document.getElementById("app");
  if (!app) return;
  if (route.name === "main") app.classList.add("map");
  else app.classList.remove("map");
}
watch(() => route.name, updateAppClass, { immediate: true });

/**
 * Очищает устаревшие данные из localStorage
 * Удаляет ключи, начинающиеся с 'aqi_cache_' и 'revgeo_addr_'
 */
function cleanupOldLocalStorage() {
  try {
    const keysToRemove = [];

    // Проходим по всем ключам в localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("aqi_cache") || key.startsWith("revgeo_addr_"))) {
        keysToRemove.push(key);
      }
    }

    // Удаляем найденные ключи
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });

    if (keysToRemove.length > 0) {
      console.log(`Cleaned up ${keysToRemove.length} old localStorage entries:`, keysToRemove);
    }
  } catch (error) {
    console.warn("Failed to cleanup localStorage:", error);
  }
}

onMounted(async () => {
  // Очищаем устаревшие данные из localStorage
  cleanupOldLocalStorage();

  // Инициализация Matomo
  const waitForMatomo = setInterval(() => {
    if (typeof window.Matomo !== "undefined" && typeof window.Matomo.getTracker === "function") {
      clearInterval(waitForMatomo);

      const trackPage = () => {
        const tracker = window.Matomo.getTracker();
        if (tracker && !tracker.isUserOptedOut()) {
          window._paq.push(["setCustomUrl", router.currentRoute.value.fullPath]);
          window._paq.push(["setDocumentTitle", document.title]);
          window._paq.push(["trackPageView"]);
        }
      };

      // Track the initial page load
      trackPage();
    }
  }, 100);

  /* + INIT ACCOUNT */
  /*
  При маунте: загружаем аккаунты из IndexedDB через стор,
  затем для каждого обновляем devices из сети (getUserSensors) и
  сохраняем обратно через addAccount.
*/
  if (config.SERVICES.accounts) {
    const accountStore = useAccounts();
    const accounts = await accountStore.getAccounts();

    if (accounts && accounts.length > 0) {
      for (const acc of accounts) {
        const sensors = await accountStore.getUserSensors(acc.address);
        await accountStore.addAccount(
          {
            phrase: acc.phrase || "",
            seedHex: acc.seedHex || "",
            address: acc.address,
            type: acc.type,
            devices: sensors,
            ts: acc.ts,
          },
          { persist: acc?.persist !== false }
        );
      }
    }
  }
  /* - INIT ACCOUNT */
});

// Watcher для изменения даты убран - теперь данные загружаются только через Main.vue handlerHistory
// Это предотвращает дублирующиеся запросы к API
</script>

<style>
.notify {
  font-size: 20px !important;
  font-weight: bold;
}

/* .maintenance-banner {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: var(--color-red);
  color: var(--color-light);
  text-align: center;
  padding: 0.5rem var(--gap);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.maintenance-banner-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35em;
  width: 100%;
  color: var(--color-light);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 700;
  transition: opacity 0.2s ease;
  font-weight: 900;
}

.maintenance-banner-link:hover {
  color: var(--color-light);
}

.maintenance-banner i {
  font-weight: 400;
}

@media screen and (max-width: 600px) {
  .maintenance-banner {
    padding: 0.4rem calc(var(--gap) / 2);
  }

  .maintenance-banner-link {
    font-size: 0.85rem;
  }

  .maintenance-banner i {
    display: block;
  }
} */
</style>
