<template>
  <MetaInfo
    :pageTitle="productName ? $t('ai.productPageTitle', { name: productName }) : $t('ai.pageTitle')"
    :pageDescription="subtitle"
    pageImage="/og-altruist-setup.webp"
  />
  <PageTextLayout>
    <div class="ai-page">
      <div class="ai-main">
        <div class="ai-eyebrow">Altruist</div>
        <h1 class="ai-title">{{ title }}</h1>
        <p class="ai-subtitle">{{ subtitle }}</p>

        <nav class="ai-assistants" :aria-label="title">
          <a
            v-for="assistant in assistants"
            :key="assistant.name"
            class="ai-row"
            :href="assistant.url(prompt)"
            target="_blank"
            rel="noopener"
            @click="copyPrompt"
          >
            <span>{{ assistant.name }}</span>
            <font-awesome-icon icon="fa-solid fa-arrow-right" aria-hidden="true" />
          </a>
        </nav>

        <p class="ai-note">
          {{ $t("ai.forAi") }}
          <a :href="GUIDE_URL">{{ $t("ai.guide") }}</a>
        </p>
      </div>

      <section class="ai-card">
        <h2 class="ai-card-title">{{ $t("ai.receives") }}</h2>
        <p class="ai-prompt">{{ prompt }}</p>
        <Copy class="ai-copy" :msg="prompt" :notify="$t('ai.copied')">{{ $t("ai.copy") }}</Copy>
        <p class="ai-note">{{ $t("ai.hint") }}</p>
      </section>
    </div>
  </PageTextLayout>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { altruistProducts } from "@/config/altruistProducts";
import Copy from "../components/controls/Copy.vue";
import MetaInfo from "../components/MetaInfo.vue";
import PageTextLayout from "../components/layouts/PageText.vue";

// ?raw=1 keeps the address out of a browser-only redirect to this page, so assistants
// that read through a real browser reach the guide instead of looping back here.
const GUIDE_URL = "https://sensors.social/altruist-ai-guide.md?raw=1";

// Prefill via URL is undocumented and may stop working, and mobile apps can drop
// the query, so every button also copies the prompt. Gemini has no prefill at all.
const assistants = [
  { name: "ChatGPT", url: (q) => `https://chatgpt.com/?q=${encodeURIComponent(q)}` },
  { name: "Claude", url: (q) => `https://claude.ai/new?q=${encodeURIComponent(q)}` },
  { name: "Gemini", url: () => "https://gemini.google.com/app" },
  { name: "Grok", url: (q) => `https://grok.com/?q=${encodeURIComponent(q)}` },
  { name: "Qwen", url: (q) => `https://chat.qwen.ai/?q=${encodeURIComponent(q)}` },
];

const { t, locale } = useI18n();
const route = useRoute();

// ?product=insight|urban|dual comes from the landing pages and the shop cards: the visitor
// is still deciding, so the prompt sends the assistant to the guide's pre-purchase section.
const productName = computed(() => altruistProducts[route.query.product]?.title || "");

// ?lang= lets the shop open the page in its own language; only en and ru exist here.
// Saved like the header's language switch, because the header restores the saved locale
// when it mounts and would override a value set only on i18n.
if (route.query.lang) {
  const lang = route.query.lang === "ru" ? "ru" : "en";
  localStorage.setItem("locale", lang);
  locale.value = lang;
}

const title = computed(() =>
  productName.value ? t("ai.productTitle", { name: productName.value }) : t("ai.title")
);
const subtitle = computed(() =>
  productName.value ? t("ai.productSubtitle", { name: productName.value }) : t("ai.subtitle")
);
const prompt = computed(() =>
  productName.value
    ? t("ai.productPrompt", { name: productName.value, url: GUIDE_URL })
    : t("ai.prompt", { url: GUIDE_URL })
);

// Not awaited: the link must still open if the browser refuses clipboard access.
const copyPrompt = () => {
  navigator.clipboard?.writeText(prompt.value).catch(() => {});
};
</script>

<style scoped>
.ai-page {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 2rem 3.5rem;
  max-width: 1080px;
  margin: 0 auto;
  text-align: left;
}

.ai-main {
  flex: 999 1 460px;
  min-width: 0;
}

.ai-eyebrow {
  color: #555;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.ai-title {
  margin: 0.6rem 0 0;
  font-size: clamp(2.1rem, 5vw, 3.25rem);
  font-weight: 800;
  line-height: 1.1;
}

.ai-subtitle {
  margin: 0.8rem 0 0;
  color: #333;
  font-size: 1.1rem;
  line-height: 1.45;
}

.ai-assistants {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
  margin-top: 1.6rem;
}

.ai-row:last-child:nth-child(odd) {
  grid-column: 1 / -1;
}

@media (max-width: 600px) {
  .ai-assistants {
    grid-template-columns: minmax(0, 1fr);
  }
}

.ai-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  min-height: 62px;
  padding: 0 1.2rem;
  border: 2px solid var(--color-dark);
  border-radius: var(--radius-md);
  color: var(--color-dark);
  font-size: 1.125rem;
  font-weight: 700;
  text-decoration: none;
  transition: background-color 0.2s ease-in-out;
}

.ai-row:hover,
.ai-row:focus-visible {
  background-color: var(--color-green-bright);
  color: var(--color-dark);
}

.ai-card {
  flex: 1 1 340px;
  min-width: 0;
  box-sizing: border-box;
  padding: 1.3rem;
  border-radius: var(--radius-lg);
  background: var(--color-light-gray);
}

.ai-card-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
}

.ai-prompt {
  margin: 0.7rem 0 0;
  color: #222;
  font-size: 1rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.ai-copy {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-sizing: border-box;
  min-height: 48px;
  margin-top: 0.9rem;
  border-radius: var(--radius-md);
  background: var(--color-dark);
  color: var(--color-light);
  font-size: 1rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}

/* a.copy.ai-copy outranks the margins and icon color that Copy.vue sets for inline use */
.ai-card a.copy.ai-copy {
  display: flex;
  width: 100%;
  margin-right: 0;
  margin-left: 0;
}

.ai-card a.copy.ai-copy :deep(svg) {
  color: inherit;
}

.ai-card a.copy.ai-copy:hover {
  color: var(--color-green-bright);
}

.ai-note {
  margin: 1rem 0 0;
  color: #444;
  font-size: 0.9rem;
  line-height: 1.45;
}
</style>
