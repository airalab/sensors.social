<template>
  <MetaInfo pageTitle="Support — sensors.social" pageImage="/og-default.webp" />
  <PageTextLayout>
    <div class="pagetext-prose">
      <section class="pagetext-header">
        <div class="pagetext-eyebrow">sensors.social</div>
        <h1 class="pagetext-title">{{ $t("Support") }}</h1>
        <p class="pagetext-subtitle">
          {{
            $t(
              "Tell us what happened — we’ll reply to your email. The more details you share, the faster we can help."
            )
          }}
        </p>
      </section>

      <section class="support-grid">
        <form ref="form" class="ui-surface support-card" @submit.prevent="onSubmit">
          <vue-hcaptcha
            ref="invisibleHcaptcha"
            :sitekey="siteKey"
            size="invisible"
            @verify="onVerify"
            @error="onCaptchaError"
          />

          <label class="field">
            <span class="field-label">Email</span>
            <input
              v-model.trim="email"
              class="block"
              type="email"
              autocomplete="email"
              inputmode="email"
              placeholder="you@example.com"
              :disabled="isSubmitting"
              required
              data-gsp-name="Email"
              :data-gsp-data="email"
            />
          </label>

          <label class="field">
            <span class="field-label">{{ $t("Topic") }}</span>
            <select
              v-model="topic"
              class="block"
              :disabled="isSubmitting"
              required
              data-gsp-name="Topic"
              :data-gsp-data="topic"
            >
              <option value="Altruist Sensor Support">
                {{ $t("Altruist Sensor Support") }}
              </option>
              <option value="Map Questions & Feedback">
                {{ $t("Map Questions & Feedback") }}
              </option>
              <option value="Other">{{ $t("Other") }}</option>
            </select>
          </label>

          <label class="field">
            <div class="field-head">
              <span class="field-label">{{ $t("Comment") }}</span>
            </div>
            <textarea
              v-model.trim="comment"
              class="block"
              rows="6"
              :placeholder="
                topic === 'Altruist Sensor Support'
                  ? $t('support.placeholder.altruist')
                  : topic === 'Map Questions & Feedback'
                  ? $t('support.placeholder.map')
                  : $t('support.placeholder.other')
              "
              :disabled="isSubmitting"
              required
              data-gsp-name="Comment"
              :data-gsp-data="comment"
            ></textarea>
          </label>

          <input type="hidden" data-gsp-name="Location" :data-gsp-data="location" />

          <div class="support-actions">
            <button class="button block" type="submit" :disabled="isSubmitting">
              <span v-if="isSubmitting">{{ $t("Sending…") }}</span>
              <span v-else>Send</span>
            </button>

            <div v-if="status === 'error'" class="support-status support-status--error">
              {{ errorMessage || "Not submitted" }}
            </div>
            <div v-else-if="status === 'ok'" class="support-status support-status--ok">
              {{ $t("Thanks! Your message was sent.") }}
            </div>
            <div v-else-if="status === 'na'" class="support-status support-status--error">
              {{ errorMessage }}
            </div>
          </div>
        </form>
      </section>
    </div>
  </PageTextLayout>
</template>

<script setup>
import { computed, getCurrentInstance, ref } from "vue";
import VueHcaptcha from "@hcaptcha/vue3-hcaptcha";
import MetaInfo from "../components/MetaInfo.vue";
import PageTextLayout from "../components/layouts/PageText.vue";

const email = ref("");
const topic = ref("Altruist Sensor Support");
const comment = ref("");
const isSubmitting = ref(false);
const status = ref("init"); // init | process | ok | error | na
const errorMessage = ref("");
const form = ref(null);

const { proxy } = getCurrentInstance();

const gscriptID = ref(import.meta.env.VITE_CONTACTS_FORM_SCRIPT_ID || "");
const siteKey = ref(import.meta.env.VITE_HCAPTCHA_SITE_KEY || "");
const invisibleHcaptcha = ref(null);
const location = ref(typeof window !== "undefined" ? window.location.href : "");

const isEmailValid = computed(() => {
  const value = String(email.value || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
});

function notify(text) {
  try {
    proxy?.$notify?.({
      position: "top right",
      text: String(text ?? ""),
    });
  } catch (e) {
    console.warn("Notification failed:", e);
  }
}

function setStatus(next, message = "") {
  status.value = next;
  errorMessage.value = message || "";
}

function onCaptchaError() {
  setStatus("na", "Captcha is not verified. Please, check your internet connection");
  notify(errorMessage.value);
  isSubmitting.value = false;
}

function onSubmit() {
  if (isSubmitting.value) return;

  const from = String(email.value || "").trim();
  const msg = String(comment.value || "").trim();

  if (!from || !msg) {
    notify("Please fill in both fields.");
    return;
  }
  if (!isEmailValid.value) {
    notify("Please enter a valid email address.");
    return;
  }

  if (!String(siteKey.value || "").trim()) {
    notify("Captcha site key is missing.");
    return;
  }

  const id = String(gscriptID.value || "").trim();
  if (!id) {
    notify("Support form is not configured yet.");
    return;
  }

  isSubmitting.value = true;
  setStatus("process");
  invisibleHcaptcha.value?.execute();
}

async function onVerify(token) {
  try {
    const id = String(gscriptID.value || "").trim();
    const endpoint = `https://script.google.com/macros/s/${encodeURIComponent(id)}/exec`;

    const dataElements = form.value?.querySelectorAll?.("[data-gsp-data]") || [];
    const formData = new URLSearchParams();
    dataElements.forEach((item) => {
      const name = item?.dataset?.gspName;
      const value = item?.dataset?.gspData;
      if (!name) return;
      formData.append(name, value ?? "");
    });
    // Always include captcha token
    formData.append("hcaptchaToken", String(token || ""));

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: formData.toString(),
    });

    const raw = await res.text();
    const responseData = (() => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    })();
    const ok =
      res.ok &&
      (!responseData ||
        responseData?.result === "success" ||
        responseData?.success === true ||
        responseData?.ok === true);
    const message = String(
      responseData?.message ||
        responseData?.error ||
        raw ||
        `Request failed (${res.status} ${res.statusText})`
    );

    if (!ok) {
      setStatus("error", message);
      notify(errorMessage.value || "Not submitted");
      return;
    }

    setStatus("ok");
    email.value = "";
    comment.value = "";
  } catch (e) {
    console.error(e);
    setStatus("error", String(e?.message || "Not submitted"));
    notify(errorMessage.value);
  } finally {
    isSubmitting.value = false;
    if (status.value === "process") setStatus("init");
  }
}
</script>

<style scoped>
.support-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: calc(var(--gap) * 2);
  align-items: start;
}

.support-card {
  padding: calc(var(--gap) * 1.25);
  border-radius: var(--radius-lg);
  max-width: 860px;
  width: 100%;
  margin: 0 auto;
}

.field {
  display: grid;
  gap: calc(var(--gap) * 0.5);
  margin-top: calc(var(--gap) * 1);
}

.support-actions {
  margin-top: calc(var(--gap) * 1.1);
  display: grid;
  gap: calc(var(--gap) * 0.6);
}

.support-actions .button {
  border-radius: calc(var(--app-inputbradius) * 1.4);
}

.support-fineprint {
  margin: 0;
  font-size: calc(var(--font-size) * 0.95);
  color: color-mix(in srgb, var(--app-textcolor), transparent 40%);
}

.support-status {
  border-radius: 14px;
  padding: 0.8rem 0.95rem;
  font-weight: 800;
  line-height: 1.35;
}

.support-status--ok {
  background: color-mix(in srgb, var(--color-green) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-green) 30%, transparent);
}

.support-status--error {
  background: color-mix(in srgb, var(--color-red) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-red) 28%, transparent);
}
</style>
