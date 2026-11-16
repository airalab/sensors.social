<template>
  <section v-if="profile" class="sensor-profile" :aria-label="$t('sensorpopup.profileTitle')">
    <div
      v-if="profile.images.length"
      class="sensor-profile__photos"
      :class="`n${profile.images.length}`"
    >
      <a
        v-for="cid in profile.images"
        :key="cid"
        :href="imageUrl(cid)"
        target="_blank"
        rel="noopener"
        class="sensor-profile__photo"
      >
        <img :src="imageUrl(cid)" :alt="$t('sensorpopup.profilePhotoAlt')" loading="lazy" />
      </a>
    </div>
    <p v-if="profile.description" class="sensor-profile__text">{{ profile.description }}</p>
    <p class="sensor-profile__by">{{ $t("sensorpopup.profileByOwner") }}</p>
  </section>
</template>

<script setup>
// Sensor social profile: the owner's photos and a few words, set from the sensors.social app.
// Stored as a CPS node on Robonomics (CID of profile.json), photos pinned by RoSeMAN's Kubo.
// No profile, or the profile API unreachable — the block simply does not render.
import { ref, watch } from "vue";
import { settings } from "@config";

const props = defineProps({ sensorId: { type: String, default: null } });

const api = String(settings?.PROFILE_API || "").replace(/\/*$/, "/");
const profile = ref(null);
const imageUrl = (cid) => `${api}v2/profile/image/${encodeURIComponent(cid)}`;

let seq = 0;
watch(
  () => props.sensorId,
  async (id) => {
    const my = ++seq;
    profile.value = null;
    if (!id || !settings?.PROFILE_API) return;
    try {
      const res = await fetch(`${api}v2/profile/${encodeURIComponent(id)}`);
      if (!res.ok) return;
      const p = (await res.json())?.result;
      if (my !== seq || !p) return;
      const images = Array.isArray(p.images) ? p.images.slice(0, 3) : [];
      if (!images.length && !p.description) return;
      profile.value = { images, description: p.description || "" };
    } catch {
      // the map works without profiles
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.sensor-profile {
  display: grid;
  gap: calc(var(--gap) * 0.5);
  margin-bottom: var(--gap);
}
.sensor-profile__photos {
  display: grid;
  gap: 6px;
  grid-template-columns: repeat(3, 1fr);
}
.sensor-profile__photos.n1 {
  grid-template-columns: 1fr;
}
.sensor-profile__photos.n2 {
  grid-template-columns: 1fr 1fr;
}
.sensor-profile__photo img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 10px;
  background: var(--color-light-gray, #eee);
}
.sensor-profile__photos.n1 .sensor-profile__photo img {
  aspect-ratio: 16 / 9;
}
/* Photos are context for the readings, not the headline: keep the strip low. */
.sensor-profile__photo img {
  max-height: 180px;
}
.sensor-profile__text {
  margin: 0;
  white-space: pre-line;
  line-height: 1.45;
}
.sensor-profile__by {
  margin: 0;
  font-size: 0.85em;
  opacity: 0.6;
}
</style>
