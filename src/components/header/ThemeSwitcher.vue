<template>
  <div class="theme-switcher">
    <button
      @click="store.toggleTheme()"
      class="theme-switcher__btn"
      :class="{ dark: store.theme === 'dark' }"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="23"
        height="23"
        viewBox="0 0 23 23"
      >
        <g
          id="Group_42"
          data-name="Group 42"
          transform="translate(-1245.324 -10)"
        >
          <g
            id="Ellipse_15"
            data-name="Ellipse 15"
            transform="translate(1245.324 10)"
            fill="none"
            stroke="#03a5ed"
            stroke-width="1"
          >
            <circle cx="11.5" cy="11.5" r="11.5" stroke="none" />
            <circle cx="11.5" cy="11.5" r="11" fill="none" />
          </g>
          <path
            id="moon-solid"
            d="M6.376,32a6.39,6.39,0,1,0,4.445,10.972.456.456,0,0,0-.4-.776,5.022,5.022,0,0,1-3.318-9.32.456.456,0,0,0-.188-.85c-.18-.014-.359-.023-.542-.023Z"
            transform="translate(1251.175 -16.721)"
            stroke="#03a5ed"
            stroke-width="1"
          />
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
}

.theme-switcher__btn {
  margin-left: var(--gap);
  display: flex;
  border: 1px solid transparent;
  cursor: pointer;
}

.theme-switcher__btn.dark svg circle {
  fill: var(--color-blue);
}

.theme-switcher__btn.dark svg path {
  stroke: #000;
}
</style>
