<template>
  <div v-if="!isReady" class="button button-round-outline disabled">
    <font-awesome-icon icon="fa-solid fa-user" />
  </div>
  <router-link v-else-if="accounts.length === 0" to="/login/" class="button button-round-outline" :title="$t('Login')">
    <font-awesome-icon icon="fa-solid fa-user" />
  </router-link>
  <template v-else>
    <div class="login-popover-slot">
      <div id="accounts" class="popover popover-top-right accounts-popover" popover>
      <div class="accounts-title">{{ $t("Accounts") }}</div>

      <div v-for="acc in accounts" :key="acc.address" class="account-card">
        <div class="account-header">
          <div class="account-address" :title="acc.address">
            <img
              v-if="avatarsByAddr[acc.address]"
              class="account-avatar"
              :src="avatarsByAddr[acc.address]"
              alt=""
              aria-hidden="true"
            />
            <font-awesome-icon v-else icon="fa-solid fa-user" class="account-icon" />
            <b class="account-address-text" :title="acc.address">{{ ownerName(acc.address) }}</b>
          </div>
          <div class="account-actions">
            <Copy
              class="account-copy"
              :msg="acc.address"
              :title="'Copy address'"
              :notify="'Copied'"
            >
              <span class="sr-only">Copy</span>
            </Copy>
            <button
              class="account-delete"
              type="button"
              aria-label="Remove account"
              @click="deleteAccount(acc)"
            >
              <font-awesome-icon icon="fa-solid fa-trash" />
            </button>
          </div>
        </div>

        <details class="account-sensors" @toggle="onSensorsToggle(acc, $event)">
          <summary class="account-sensors-summary">
            <span>{{ $t("Sensors") }}</span>
            <span class="muted" v-if="acc.sensorsLoading">Loading…</span>
            <span class="muted" v-else-if="acc.sensors && acc.sensors.length">{{
              acc.sensors.length
            }}</span>
          </summary>

          <div class="account-sensors-body">
            <div v-if="acc.sensorsLoading" class="muted">Loading sensors…</div>
            <div v-else-if="!acc.sensors || acc.sensors.length === 0" class="muted">
              {{ $t("No sensors found for this account yet.") }}
            </div>
            <div v-else class="sensor-chips">
              <router-link
                v-for="sensor in acc.sensors"
                :key="sensor"
                class="sensor-chip"
                :to="getSensorLink(sensor)"
              >
                {{ sensor }}
              </router-link>
            </div>
          </div>
        </details>
      </div>

      <div class="accounts-actions">
        <router-link class="button" to="/login/">{{ $t("Manage accounts") }}</router-link>
        <button class="button button-red" type="button" @click="logoutAll">
          {{ $t("Log out all") }}
        </button>
      </div>
      </div>
      <button class="popovercontrol button-round-outline" popovertarget="accounts">
        <font-awesome-icon icon="fa-solid fa-user" />
      </button>
    </div>
  </template>
</template>

<script setup>
import { ownerName } from "@/utils/addressNames";
import { ref, onMounted, watch } from "vue";
import { useAccounts } from "@/composables/useAccounts";
import config from "@/config/default/config.json";
import Copy from "@/components/controls/Copy.vue";
import { generateAvatar } from "@/utils/avatarGenerator";

const accountStore = useAccounts();
const accounts = ref([]);
const isReady = ref(false);
const avatarsByAddr = ref({});

// Загружаем все аккаунты из БД/стора и подгружаем сенсоры
async function loadAccounts() {
  isReady.value = false;
  const stored = await accountStore.getAccounts();

  accounts.value = await Promise.all(
    stored.map(async (acc) => {
      const sensors = await accountStore.getUserSensors(acc.address);
      return {
        ...acc,
        sensors,
        sensorsLoading: false,
      };
    })
  );

  // Prefetch identicons for nicer UI
  try {
    const entries = await Promise.all(
      accounts.value
        .map((a) => a?.address)
        .filter(Boolean)
        .map(async (addr) => [addr, await generateAvatar(addr, 28)])
    );
    avatarsByAddr.value = Object.fromEntries(entries.filter(([, v]) => !!v));
  } catch {
    // ignore
  }

  isReady.value = true;
}

// Удалить аккаунт по ключу, перезагрузить список
async function deleteAccount(acc) {
  await accountStore.removeAccounts(acc.address);
  await loadAccounts();
}

async function logoutAll() {
  const stored = await accountStore.getAccounts();
  const addresses = (stored || []).map((a) => a.address).filter(Boolean);
  await accountStore.removeAccounts(addresses);
  await loadAccounts();
}


// Сформировать ссылку на сенсор
function getSensorLink(sensor) {
  return {
    name: "main",
    query: {
      provider: "remote", // Default provider for login redirect
      type: config.MAP.measure,
      sensor: sensor,
    },
  };
}

// function reloadOnClick() {
//   setTimeout(() => {
//     window.location.reload();
//   }, 50);
// }

async function onSensorsToggle(acc, event) {
  const open = event?.target?.open === true;
  if (!open) return;
  if (!acc?.address) return;
  if (acc.sensorsLoading) return;
  if (Array.isArray(acc.sensors) && acc.sensors.length > 0) return;

  try {
    acc.sensorsLoading = true;
    acc.sensors = await accountStore.getUserSensors(acc.address);
  } finally {
    acc.sensorsLoading = false;
  }
}

onMounted(loadAccounts);

// Keep header state in sync with log in/out happening elsewhere (e.g. Login page)
watch(
  () => accountStore.accounts?.value?.map((a) => a.address).join(",") || "",
  () => {
    loadAccounts();
  }
);
</script>

<style scoped>
.login-popover-slot {
  position: relative;
  flex: 0 0 auto;
}

.login-popover-slot > .popover {
  position: fixed;
  margin: 0;
}

.accounts-popover {
  min-width: 320px;
  max-width: min(420px, 95vw);
}

.accounts-title {
  font-weight: 900;
  margin-bottom: calc(var(--gap) * 0.75);
}

.account-card {
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: var(--pad-sm);
  background: var(--color-light);
  display: grid;
  gap: calc(var(--gap) * 0.8);
}

.account-card:not(:last-child) {
  margin-bottom: calc(var(--gap) * 1.1);
}

.account-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--gap) * 1.1);
}

.account-actions {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--gap) * 0.15);
  flex: 0 0 auto;
}

.account-address {
  font-size: calc(var(--font-size) * 1.05);
  display: flex;
  align-items: center;
  gap: calc(var(--gap) * 0.5);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-copy {
  margin: 0;
  opacity: 0.8;
}

.account-copy:hover {
  opacity: 1;
}

.account-icon {
  width: 16px;
  height: 16px;
  opacity: 0.75;
  flex: 0 0 auto;
}

.account-avatar {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  flex: 0 0 auto;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: rgba(0, 0, 0, 0.03);
}

.account-address-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-delete {
  border: 0;
  background: transparent;
  cursor: pointer;
  padding: calc(var(--gap) * 0.5) calc(var(--gap) * 0.3);
  line-height: 1;
  opacity: 0.75;
}

.account-delete:hover {
  opacity: 1;
  color: var(--color-red);
}

.muted {
  opacity: 0.7;
}

.account-sensors {
  border-top: 1px solid var(--surface-border-soft);
  padding-top: calc(var(--gap) * 0.7);
}

.account-sensors summary::-webkit-details-marker,
.account-sensors summary::marker {
  content: "";
  display: none;
}

.account-sensors-summary {
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--gap) * 0.6);
  font-weight: 700;
}

.account-sensors-body {
  margin-top: calc(var(--gap) * 0.3);
}

.sensor-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.sensor-chip {
  display: inline-flex;
  align-items: center;
  padding: calc(var(--gap) * 0.5) calc(var(--gap) * 0.3);
  text-decoration: none;
  color: var(--color-blue);
  font-weight: 700;
  font-size: var(--font-size);
  hyphens: auto;
  transition: color 0.33s ease-in-out;
}

.sensor-chip:hover {
  color: var(--color-navy);
}

.accounts-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: calc(var(--gap) * 0.6);
  margin-top: calc(var(--gap) * 0.8);
}

.accounts-actions .button {
  width: 100%;
  text-align: center;
}
</style>
