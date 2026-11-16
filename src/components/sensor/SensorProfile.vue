<template>
  <section v-if="state !== 'hidden'" class="sensor-profile" :class="`sensor-profile--${state}`">
    <template v-if="state === 'filled'">
      <div class="sensor-profile__head">
        <span class="sensor-profile__title">{{ $t("sensorpopup.profileTitle") }}</span>
        <span class="sensor-profile__by">{{ $t("sensorpopup.profileByOwner") }}</span>
      </div>
      <div class="sensor-profile__body">
        <button
          v-for="cid in profile.images"
          :key="cid"
          type="button"
          class="sensor-profile__thumb"
          :aria-label="$t('sensorpopup.profilePhotoAlt')"
          @click="open = cid"
        >
          <img :src="imageUrl(cid)" alt="" loading="lazy" />
        </button>
        <p
          v-if="profile.description"
          class="sensor-profile__text"
          :class="{ 'sensor-profile__text--open': expanded }"
          @click="expanded = !expanded"
        >
          {{ profile.description }}
        </p>
      </div>
    </template>

    <a v-else class="sensor-profile__empty" :href="appLink" target="_blank" rel="noopener">
      <span class="sensor-profile__slot" aria-hidden="true">
        <font-awesome-icon icon="fa-solid fa-camera" />
      </span>
      <span class="sensor-profile__empty-text">
        <b>{{ $t("sensorpopup.profileTitle") }}</b>
        <span>{{ $t("sensorpopup.profileEmpty") }}</span>
        <u>{{ $t("sensorpopup.profileEmptyCta") }}</u>
      </span>
    </a>

    <Teleport to="body">
      <div
        v-if="open"
        class="sensor-profile-lightbox"
        role="dialog"
        :aria-label="$t('sensorpopup.profilePhotoAlt')"
        @click="open = null"
        @keydown.esc="open = null"
      >
        <img :src="imageUrl(open)" :alt="$t('sensorpopup.profilePhotoAlt')" />
      </div>
    </Teleport>
  </section>
</template>

<script setup>
// Sensor social profile: the owner's photos and a few words, set from the sensors.social app
// (CPS node on Robonomics → profile.json → photos pinned by RoSeMAN's Kubo).
// Shown under the chart as thumbnails, so it is in view without pushing the controls down.
// No profile: one line inviting the owner to add one. API unreachable: nothing at all.
import { ref, watch } from "vue";
import { settings } from "@config";

const props = defineProps({ sensorId: { type: String, default: null } });

const api = String(settings?.PROFILE_API || "").replace(/\/*$/, "/");
const appLink = "/blog/sensors-social-android-app/";
const state = ref("hidden"); // hidden | empty | filled
const profile = ref({ images: [], description: "" });
const open = ref(null);
const expanded = ref(false);
const imageUrl = (cid) => `${api}v2/profile/image/${encodeURIComponent(cid)}`;

let seq = 0;
watch(
  () => props.sensorId,
  async (id) => {
    const my = ++seq;
    state.value = "hidden";
    expanded.value = false;
    open.value = null;
    if (!id || !settings?.PROFILE_API) return;
    try {
      const res = await fetch(`${api}v2/profile/${encodeURIComponent(id)}`);
      if (!res.ok || my !== seq) return;
      const p = (await res.json())?.result;
      if (my !== seq) return;
      const images = Array.isArray(p?.images) ? p.images.slice(0, 3) : [];
      const description = p?.description || "";
      profile.value = { images, description };
      state.value = images.length || description ? "filled" : "empty";
    } catch {
      // the map works without profiles
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.sensor-profile {
  margin: calc(var(--gap) * 0.5) 0 var(--gap);
}
.sensor-profile--filled {
  border: 1px solid var(--color-light-gray, #e3e3e3);
  border-radius: 12px;
  padding: 10px 12px;
  display: grid;
  gap: 8px;
}
.sensor-profile__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.sensor-profile__title {
  font-weight: 700;
}
.sensor-profile__by {
  font-size: 0.8em;
  opacity: 0.6;
}
.sensor-profile__body {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}
.sensor-profile__thumb {
  flex: none;
  width: 64px;
  height: 64px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  overflow: hidden;
  cursor: zoom-in;
  background: var(--color-light-gray, #eee);
}
.sensor-profile__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.sensor-profile__text {
  margin: 0;
  min-width: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  cursor: pointer;
}
.sensor-profile__text--open {
  -webkit-line-clamp: unset;
  white-space: pre-line;
}
.sensor-profile__empty {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 8px 12px 8px 8px;
  border: 1px dashed var(--color-gray, #b9b9b9);
  border-radius: 12px;
  color: inherit;
  text-decoration: none;
}
.sensor-profile__empty:hover {
  border-style: solid;
}
.sensor-profile__slot {
  flex: none;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-light-gray, #f0f0f0);
  opacity: 0.8;
}
.sensor-profile__empty-text {
  display: grid;
  gap: 1px;
  font-size: 0.85em;
  line-height: 1.35;
}
.sensor-profile__empty-text u {
  color: var(--color-blue, #0066cc);
}
.sensor-profile-lightbox {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
}
.sensor-profile-lightbox img {
  max-width: 94vw;
  max-height: 90vh;
  border-radius: 8px;
}
</style>
