<template>
  <MetaInfo pageTitle="Login" pageImage="/og-login.webp" noindex />

  <PageTextLayout>
    <section class="login-page">
      <header class="hero">
        <h3>{{ $t("Accounts") }}</h3>
        <p class="subtitle">
          {{
            $t(
              "Add an account using your 12-word seed phrase, or import a self-owner JSON from the device. “Keep me signed” stores it on this device."
            )
          }}
        </p>
      </header>

      <section v-if="isLoggedIn && !showAddAnother" class="card">
        <div class="card-header">
          <div>
            <div class="card-title">{{ $t("Signed in") }}</div>
            <div class="muted">
              {{ accountsCount }} {{ $t("account") }}<span v-if="accountsCount !== 1">s</span>
              {{ $t("on this device") }}
            </div>
          </div>
          <div class="card-actions">
            <button class="button" type="button" @click.prevent="showAddAnother = true">
              {{ $t("Add account") }}
            </button>
            <button class="button button-red" type="button" @click.prevent="handleLogoutAll">
              {{ $t("Log out all") }}
            </button>
          </div>
        </div>

        <div class="accounts-grid">
          <div v-for="acc in accounts" :key="acc.address" class="account-pill">
            <div class="account-pill-top">
              <div class="account-pill-left">
                <img
                  v-if="avatarsByAddr[acc.address]"
                  class="account-avatar"
                  :src="avatarsByAddr[acc.address]"
                  alt=""
                  aria-hidden="true"
                />
                <span class="account-pill-text" :title="acc.address">{{ ownerName(acc.address) }}</span>
              </div>
              <div class="pill-actions">
                <Copy :msg="acc.address" :title="'Copy address'" :notify="'Copied'" />
                <button
                  class="pill-delete"
                  type="button"
                  aria-label="Remove account"
                  @click="removeOne(acc)"
                >
                  <font-awesome-icon icon="fa-solid fa-trash" />
                </button>
              </div>
            </div>

            <details class="pill-sensors" @toggle="onSensorsToggle(acc, $event)">
              <summary class="pill-sensors-summary">
                <span>Sensors</span>
                <span class="muted" v-if="sensorsLoadingByAddr[acc.address]">{{
                  $t("Loading…")
                }}</span>
                <span class="muted" v-else-if="accountSensors(acc).length">
                  {{ accountSensors(acc).length }}
                </span>
              </summary>
              <div class="pill-sensors-body">
                <div v-if="sensorsLoadingByAddr[acc.address]" class="muted">
                  {{ $t("Loading sensors…") }}
                </div>
                <div v-else-if="accountSensors(acc).length === 0" class="muted">
                  {{ $t("No sensors found for this account yet.") }}
                </div>
                <div v-else class="sensor-chips">
                  <router-link
                    v-for="sensor in accountSensors(acc)"
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
        </div>
      </section>

      <section v-else class="card">
        <div class="card-header">
          <div>
            <div class="card-title">{{ $t("Add account") }}</div>
            <div class="muted">{{ $t("Seed phrase never leaves your browser") }}</div>
          </div>
          <button
            v-if="isLoggedIn"
            class="button button-round-outline"
            type="button"
            @click.prevent="showAddAnother = false"
            title="Back"
            aria-label="Back"
          >
            <font-awesome-icon icon="fa-solid fa-caret-left" />
          </button>
        </div>

        <form class="form" @submit="handleLogin">
          <label class="field">
            <span class="field-label">{{ $t("Seed phrase") }}</span>
            <input
              type="password"
              placeholder="Pass phrase (12 words)"
              v-model="passPhrase"
              autocomplete="off"
              @input="resetStatus"
            />
          </label>

          <div v-if="account" class="preview">
            <div class="muted">{{ $t("You are signing in as") }}</div>
            <div class="addr"><b>{{ ownerName(account) }}</b> · {{ formatAddress(account) }}</div>
            <label class="label-line">
              <span>{{ $t("Type (advanced):") }}</span>
              <select v-model="keyType" class="select-link">
                <option value="sr25519">sr25519</option>
                <option value="ed25519">ed25519</option>
              </select>
            </label>
          </div>

          <label v-if="account && canKeepSigned" class="keep">
            <input type="checkbox" v-model="keepSigned" />
            <span>
              {{ $t("Keep me signed in (I trust this device)") }}
            </span>
          </label>

          <div class="import-owner">
            <div class="muted">{{ $t("Or import self-owner JSON from the device") }}</div>
            <p class="import-owner-notice" role="note">
              <font-awesome-icon
                icon="fa-solid fa-circle-info"
                class="import-owner-notice__icon"
                aria-hidden="true"
              />
              <span>{{ $t("login.owner_json_warning") }}</span>
            </p>
            <input
              ref="ownerJsonInput"
              type="file"
              accept="application/json,.json"
              class="file-input"
              @change="handleOwnerJsonImport"
            />
            <button class="button" type="button" @click.prevent="pickOwnerJson">
              {{ $t("Import owner access JSON") }}
            </button>
          </div>

          <button
            class="button"
            :class="loginStatus === 'success' ? 'button-green' : null"
            :disabled="loginStatus === 'success'"
          >
            {{ loginStatus === "success" ? $t("Signed in") : $t("Sign in") }}
          </button>

          <div v-if="loginStatus === 'success' && lastAddress" class="success">
            {{ $t("Signed in as") }} <b>{{ ownerName(lastAddress) }}</b>
          </div>

          <div v-if="loginStatus === 'error'" class="error">
            <font-awesome-icon icon="fa-solid fa-circle-exclamation" />
            <span>{{ error }}</span>
          </div>
        </form>
      </section>
    </section>
  </PageTextLayout>
</template>

<script setup>
import { ownerName } from "@/utils/addressNames";
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAccounts, accountFromOwnerAccessJson } from "@/composables/useAccounts";
import { mnemonicValidate, encodeAddress } from "@polkadot/util-crypto";
import { Keyring } from "@polkadot/keyring";
import config from "@/config/default/config.json";
import { generateAvatar } from "@/utils/avatarGenerator";

import MetaInfo from "../components/MetaInfo.vue";
import PageTextLayout from "../components/layouts/PageText.vue";
import Copy from "@/components/controls/Copy.vue";

const accountStore = useAccounts();
const router = useRouter();
const { t } = useI18n();

const passPhrase = ref("");
const keepSigned = ref(false);
const error = ref("");
const keyType = ref("ed25519");
const loginStatus = ref("idle");
const lastAddress = ref("");

const isLoggedIn = computed(() => (accountStore.accounts?.value?.length || 0) > 0);
const accounts = computed(() => accountStore.accounts?.value || []);
const accountsCount = computed(() => accounts.value.length);
const showAddAnother = ref(false);

const sensorsByAddr = ref({});
const sensorsLoadingByAddr = ref({});
const avatarsByAddr = ref({});

function accountSensors(acc) {
  const addr = acc?.address;
  if (!addr) return [];
  const loaded = sensorsByAddr.value[addr];
  if (Array.isArray(loaded) && loaded.length > 0) return loaded;
  if (Array.isArray(acc?.devices) && acc.devices.length > 0) return acc.devices;
  return [];
}

onMounted(() => {
  accountStore.getAccounts();
});

watch(
  () =>
    accounts.value
      .map((a) => `${a.address}:${(a.devices || []).join(",")}`)
      .join("|"),
  async () => {
    const nextSensors = { ...sensorsByAddr.value };
    for (const acc of accounts.value) {
      const addr = acc?.address;
      if (!addr) continue;
      if (!nextSensors[addr]?.length) {
        const sensors = await accountStore.getUserSensors(addr);
        if (sensors.length > 0) nextSensors[addr] = sensors;
        else if (Array.isArray(acc.devices) && acc.devices.length > 0) {
          nextSensors[addr] = [...acc.devices];
        }
      }
    }
    sensorsByAddr.value = nextSensors;

    try {
      const entries = await Promise.all(
        accounts.value
          .map((a) => a?.address)
          .filter(Boolean)
          .map(async (addr) => [addr, await generateAvatar(addr, 34)])
      );
      avatarsByAddr.value = Object.fromEntries(entries.filter(([, v]) => !!v));
    } catch {
      // ignore
    }
  },
  { immediate: true }
);

const canKeepSigned = computed(
  () => !!(window.crypto?.subtle || window.crypto?.webkitSubtle) && !!window.indexedDB
);

const account = computed(() => {
  const phrase = passPhrase.value.trim();
  if (phrase.split(/\s+/).length !== 12) return "";
  if (!mnemonicValidate(phrase)) return "";
  try {
    const keyring = new Keyring({ type: keyType.value });
    const pair = keyring.addFromMnemonic(phrase);
    return encodeAddress(pair.publicKey, 32);
  } catch {
    return "";
  }
});

function formatAddress(addr) {
  if (!addr) return "";
  if (addr.length <= 16) return addr;
  return addr.slice(0, 6) + "..." + addr.slice(-6);
}

function getRobonomicsAddressByType(phrase, type) {
  const keyring = new Keyring({ type });
  const pair = keyring.addFromMnemonic(phrase);
  const address = encodeAddress(pair.publicKey, 32);
  return { address, type, publicKey: pair.publicKey };
}

function resetStatus() {
  loginStatus.value = "idle";
  error.value = "";
}

const ownerJsonInput = ref(null);

function pickOwnerJson() {
  ownerJsonInput.value?.click?.();
}

async function handleOwnerJsonImport(ev) {
  error.value = "";
  loginStatus.value = "idle";
  const file = ev?.target?.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const accountData = await accountFromOwnerAccessJson(text);
    if (keepSigned.value) {
      await accountStore.addAccount(accountData, { persist: true });
    } else {
      await accountStore.removeAccounts(accountData.address);
      await accountStore.addAccount(accountData, { persist: false });
    }
    lastAddress.value = accountData.address;
    passPhrase.value = "";
    loginStatus.value = "success";
    showAddAnother.value = false;
    await router.push({ name: "main" });
  } catch (e) {
    error.value = e?.message ? t(e.message) : t("Cannot import owner access JSON");
    loginStatus.value = "error";
  } finally {
    if (ev?.target) ev.target.value = "";
  }
}

async function handleLogin(e) {
  e.preventDefault();
  error.value = "";
  loginStatus.value = "idle";

  const phrase = passPhrase.value.trim();

  if (phrase.split(/\s+/).length !== 12) {
    error.value = "Passphrase must be 12 words";
    loginStatus.value = "error";
    return;
  }
  if (!mnemonicValidate(phrase)) {
    error.value = "Invalid mnemonic";
    loginStatus.value = "error";
    return;
  }

  let accountData;
  try {
    accountData = getRobonomicsAddressByType(phrase, keyType.value);
  } catch (e) {
    error.value = e.message || "Cannot create Robonomics account";
    loginStatus.value = "error";
    return;
  }

  const { address, type } = accountData;

  try {
    if (keepSigned.value) {
      await accountStore.addAccount(
        { phrase, address, type, devices: [], ts: Date.now() },
        { persist: true }
      );
    } else {
      await accountStore.removeAccounts(address);
      await accountStore.addAccount(
        { phrase, address, type, devices: [], ts: Date.now() },
        { persist: false }
      );
    }
  } catch (e) {
    error.value = e?.message || "Cannot save account";
    loginStatus.value = "error";
    return;
  }

  lastAddress.value = address;
  passPhrase.value = "";
  loginStatus.value = "success";
  showAddAnother.value = false;
  await router.push({ name: "main" });
}

async function handleLogoutAll() {
  const list = accounts.value || [];
  const addresses = list.map((a) => a.address).filter(Boolean);
  await accountStore.removeAccounts(addresses);
  resetStatus();
  showAddAnother.value = false;
}

async function removeOne(acc) {
  const addr = acc?.address;
  if (!addr) return;
  await accountStore.removeAccounts(addr);
}

function getSensorLink(sensor) {
  return {
    name: "main",
    query: {
      provider: "remote",
      type: config.MAP.measure,
      sensor: sensor,
    },
  };
}

async function onSensorsToggle(acc, event) {
  const open = event?.target?.open === true;
  if (!open) return;
  const addr = acc?.address;
  if (!addr) return;
  if (acc.sensorsLoading) return;
  if (accountSensors(acc).length > 0) return;

  try {
    sensorsLoadingByAddr.value = { ...sensorsLoadingByAddr.value, [addr]: true };
    const sensors = await accountStore.getUserSensors(addr);
    sensorsByAddr.value = { ...sensorsByAddr.value, [addr]: sensors };
  } finally {
    sensorsLoadingByAddr.value = { ...sensorsLoadingByAddr.value, [addr]: false };
  }
}
</script>

<style>
.pill-actions .copy .fa-copy {
  font-size: calc(var(--font-size) * 1.2);
}
</style>

<style scoped>
.login-page {
  display: grid;
  gap: calc(var(--gap) * 0.8);
  width: min(720px, 100%);
  margin: 0 auto;
}

.hero {
  text-align: center;
  display: grid;
  gap: 0.2rem;
}

.subtitle {
  margin: 0 auto;
  max-width: 60ch;
  opacity: 0.8;
  font-size: calc(var(--font-size) * 0.9);
}

.card {
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg);
  background: var(--color-light);
  padding: calc(var(--gap) * 0.9);
  display: grid;
  gap: calc(var(--gap) * 0.75);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: calc(var(--gap) * 0.75);
}

.card-title {
  font-weight: 900;
  font-size: calc(var(--font-size) * 1.18);
}

.card-actions {
  display: flex;
  gap: calc(var(--gap) * 0.6);
  flex-wrap: wrap;
  justify-content: flex-end;
}

.card-actions :deep(.button) {
  --app-inputpadding: 0.9rem;
  font-size: calc(var(--font-size) * 0.8);
}

.muted {
  opacity: 0.7;
}

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: calc(var(--gap) * 0.7);
}

.account-pill {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: calc(var(--gap) * 0.3);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: var(--pad-sm) var(--pad-md);
  background: var(--surface-bg-soft);
}

.account-pill-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--gap) * 0.8);
  min-width: 0;
}

.account-pill-left {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--gap) * 0.6);
  min-width: 0;
}

.account-avatar {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  flex: 0 0 auto;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: rgba(0, 0, 0, 0.03);
}

.account-pill-text {
  font-weight: 800;
  font-size: calc(var(--font-size) * 1.1);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pill-actions {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--gap) * 0.2);
  flex: 0 0 auto;
}

.pill-delete {
  border: 0;
  cursor: pointer;
  opacity: 0.75;
  font-size: calc(var(--font-size) * 1);
}

.pill-delete:hover {
  opacity: 1;
  color: var(--color-red);
}

.pill-sensors {
  border-top: 1px solid var(--surface-border-soft);
  padding-top: calc(var(--gap) * 0.3);
}

.pill-sensors summary::-webkit-details-marker,
.pill-sensors summary::marker {
  content: "";
  display: none;
}

.pill-sensors-summary {
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--gap) * 0.3);
  font-weight: 900;
  font-size: calc(var(--font-size) * 0.8);
}

.pill-sensors-body {
  margin-top: calc(var(--gap) * 0.3);
}

.sensor-chips {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--gap) * 0.3);
}

.sensor-chip {
  display: inline-flex;
  align-items: center;
  padding: calc(var(--gap) * 0.3) calc(var(--gap) * 0.5);
  text-decoration: none;
  color: var(--color-blue);
  font-weight: 700;
  font-size: calc(var(--font-size) * 0.9);
  hyphens: auto;
  transition: color 0.33s ease-in-out;
}

.sensor-chip:hover {
  color: var(--color-navy);
}

.form {
  display: grid;
  gap: var(--gap);
  --app-inputpadding: 1.2rem;
}

.field {
  display: grid;
  gap: calc(var(--gap) * 0.7);
}

.field-label {
  font-weight: 800;
}

input,
button,
select {
  width: 100%;
  height: auto;
}

.preview {
  --font-size: calc(var(--font-size) * 1.12);
  border: 1px dashed rgba(0, 0, 0, 0.18);
  border-radius: var(--radius-md);
  padding: var(--pad-sm) var(--pad-md);
  background: rgba(0, 0, 0, 0.015);
  display: grid;
  gap: calc(var(--gap) * 0.7);
}

.addr {
  font-weight: 900;
  letter-spacing: 0.2px;
}

.label-line {
  display: flex;
  align-items: center;
  gap: 0.5em;
  flex-wrap: wrap;
}

.keep {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.success {
  text-align: center;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(40, 170, 85, 0.12);
  color: var(--color-green);
}

.error {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(220, 70, 70, 0.1);
  color: var(--color-red);
}

.import-owner {
  margin: 0.75rem 0 0;
  padding-top: 0.85rem;
  border-top: 1px solid var(--surface-border-soft, rgba(0, 0, 0, 0.08));
  display: grid;
  gap: 0.55rem;
  width: 100%;
}

.import-owner-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  margin: 0;
  padding: 0.45rem 0.6rem;
  border-radius: 8px;
  border: 1px solid rgba(200, 140, 0, 0.22);
  border-left: 3px solid rgba(200, 140, 0, 0.72);
  background: rgba(255, 193, 7, 0.07);
  font-size: calc(var(--font-size) * 0.8);
  line-height: 1.35;
  color: color-mix(in srgb, var(--app-textcolor, #222) 76%, #8a6200);
}

.import-owner-notice__icon {
  margin-top: 0.08em;
  flex: 0 0 auto;
  font-size: calc(var(--font-size) * 0.95);
  color: rgba(180, 120, 0, 0.9);
}

.import-owner .button {
  width: auto;
  margin-top: 0.2rem;
}

.file-input {
  display: none;
}
</style>
