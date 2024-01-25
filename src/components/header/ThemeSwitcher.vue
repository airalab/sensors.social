<template>
  <div class="theme-switcher">
    <button
      @click="store.toggleTheme()"
      class="theme-switcher__btn"
      :class="{ dark: store.theme === 'dark' }"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="Group 3">
          <g id="Group 2">
            <circle
              id="Ellipse 2"
              cx="12"
              cy="12"
              r="11"
              stroke="white"
              stroke-width="2"
            />
          </g>
          <g id="Mask group">
            <mask
              id="mask0_9_36"
              style="mask-type: alpha"
              maskUnits="userSpaceOnUse"
              x="4"
              y="4"
              width="16"
              height="16"
            >
              <circle id="Ellipse 2_2" cx="12" cy="12" r="8" fill="white" />
            </mask>
            <g mask="url(#mask0_9_36)">
              <rect
                id="Rectangle 3"
                x="4"
                y="4"
                width="8"
                height="16"
                fill="white"
              />
            </g>
          </g>
        </g>
      </svg>
    </button>
  </div>
</template>

<script>
import { useStore } from "@/store";
import { onMounted, watchEffect } from "vue";

export default {
  setup() {
    const store = useStore();

    onMounted(() => {
      store.initTheme();
    });

    watchEffect(() => {
      store.theme === "light"
        ? document.querySelector("body").classList.remove("dark")
        : document.querySelector("body").classList.add("dark");
    });

    return {
      store,
    };
  },
};
</script>

<style>
.theme-switcher {
  margin-top: -1px;
  margin-right: 10px;
}

.theme-switcher__btn {
  margin-left: var(--gap);
  display: flex;
  border: 1px solid transparent;
  cursor: pointer;
}

.theme-switcher__btn.dark svg circle {
  fill: var(--color-light);
}

.theme-switcher__btn.dark svg mask circle {
  fill: rgba(255, 255, 255, 0.75);
}

.header__wrapper--mobile .theme-switcher svg {
  fill: var(--color-dark);
}

.header__wrapper--mobile-active .theme-switcher__btn {
  margin-top: var(--gap);
  margin-bottom: calc(var(--gap) * 0.5);
  margin-left: 0;
}
</style>
