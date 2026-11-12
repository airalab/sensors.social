import { ref } from "vue";

/**
 * On the map page the site footer is not below the map but in a sheet over it:
 * a page that scrolls under a wheel-zoom map makes the wheel fight between the two.
 * One shared flag, so the map controls and the header menu open the same sheet.
 */
export const ABOUT_HASH = "#about-project";

const aboutOpen = ref(false);

export function useAboutSheet() {
  return {
    aboutOpen,
    openAbout: () => {
      aboutOpen.value = true;
    },
    closeAbout: () => {
      aboutOpen.value = false;
    },
  };
}
