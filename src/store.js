import { defineStore } from "pinia";

export const useStore = defineStore({
  id: "main",
  state: () => ({
    theme: "",
  }),
  actions: {
    initTheme() {
      const cachedTheme = localStorage.theme ? localStorage.theme : false;
      const userPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      let theme = "light";
      if (cachedTheme) {
        theme = cachedTheme;
      } else if (userPrefersDark) {
        theme = "dark";
      }
      this.theme = theme;
      localStorage.theme = theme;
    },
    toggleTheme() {
      switch (localStorage.theme) {
        case "light":
          this.theme = "dark";
          localStorage.theme = "dark";
          break;

        default:
          this.theme = "light";
          localStorage.theme = "light";
          break;
      }
    },
  },
});
