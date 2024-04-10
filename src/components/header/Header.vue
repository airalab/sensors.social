<template>
  <header class="header">
    <div class="container header__container">
      <div class="header__wrapper">
        <h1 class="title">
          <router-link to="/">{{ $t("header.title") }}</router-link>
        </h1>
        <div class="title title-city">{{ city }}</div>
      </div>

      <div class="header__wrapper">
        <div
          @click="colorMap('menu')"
          class="menu-link header--mr"
          tabindex="0"
        >
          <details :open="!helper">
            <summary class="header__about-btn">About</summary>

            <div class="header-popup header-popup--menu popup-wrapper">
              <MenuPopup />
            </div>
          </details>
        </div>

        <div class="sensors-select">
          <select v-model="locale">
            <option value="en">EN</option>
            <option value="ru">RU</option>
          </select>
        </div>
        <ThemeSwitcher />
        <div
          @click="colorMap('bookmark')"
          class="header__bookmark"
          tabindex="0"
        >
          <details :open="!helper">
            <summary>
              <svg
                width="19"
                height="23"
                viewBox="0 0 19 23"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16.0479 17.0509L18.0539 18.0539V2.00599C18.0539 0.902696 17.1512 0 16.0479 0H6.00794C4.90465 0 4.01198 0.902696 4.01198 2.00599H14.0419C15.1452 2.00599 16.0479 2.90869 16.0479 4.01198V17.0509ZM12.0359 4.01198H2.00599C0.902696 4.01198 0 4.91468 0 6.01797V22.0659L7.02097 19.0569L14.0419 22.0659V6.01797C14.0419 4.91468 13.1392 4.01198 12.0359 4.01198Z"
                  fill="white"
                />
              </svg>
            </summary>

            <div class="header-popup header-popup--bookmark popup-wrapper">
              <BookmarkPopup />
            </div>
          </details>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
import { useStore } from "@/store";
import MenuPopup from "./MenuPopup.vue";
import BookmarkPopup from "./BookmarkPopup.vue";
import ThemeSwitcher from "./ThemeSwitcher.vue";

export default {
  components: { MenuPopup, BookmarkPopup, ThemeSwitcher },
  props: ["localeCurrent", "city"],
  data() {
    return {
      locale: this.localeCurrent,
      helper: localStorage.getItem("helper"),
      store: useStore(),
      curr: "",
      isMenuOpen: false,
      allDetailsClose: true,
    };
  },
  watch: {
    locale(newValue) {
      this.$i18n.locale = newValue;
      localStorage.setItem("locale", newValue);
    },
  },
  methods: {
    // making map black&white when popup opens
    colorMap(item) {
      if (this.curr && this.curr === item) {
        this.curr = "";
        this.store.removeColorMap();
      } else {
        this.curr = item;
        this.store.colorMap();
      }
    },

    closeAllDetails(e) {
      const current = e.target.closest("details");

      if (this.allDetailsClose && this.curr && !current) {
        this.curr = "";
        this.store.removeColorMap();
      }

      document.body.querySelectorAll("details").forEach((event) => {
        if (
          event !== current ||
          e.target.classList.contains("header__close-popup")
        ) {
          event.open = false;
          this.allDetailsClose = true;
          if (!this.helper) {
            localStorage.setItem("helper", true);
          }
        }
      });
    },
  },
  mounted() {
    document.body.querySelectorAll("details").forEach((e) => {
      e.open = false;
    });

    // Close all opened details on body click
    document.body.onclick = (e) => {
      this.closeAllDetails(e);
    };
  },
};
</script>

<style scoped>
h1.title > a {
  color: var(--color-middle-gray);
}

.header {
  position: sticky;
  top: 0;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.74);
  backdrop-filter: blur(4.5px);
  z-index: 15;
}

.header--mr {
  margin-right: var(--gap);
}

.header__container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header__wrapper {
  display: flex;
  align-items: center;
}

.header__wrapper:first-of-type {
  max-width: 450px;
  flex-wrap: wrap;
  flex-direction: column;
  align-items: flex-start;
  margin-right: var(--gap);
}

.title-city {
  text-transform: capitalize;
}

.sensors-select select {
  padding: calc(var(--gap) * 0.1) calc(var(--gap) * 0.5);
  min-height: 30px;
  font-size: calc(var(--font-size) * 0.9);
}

.sensors-select select option {
  color: var(--color-dark);
  background-color: var(--color-light);
}

.header__about-btn {
  padding: calc(var(--gap) * 0.2) calc(var(--gap) * 0.5);
  font-family: var(--font-family--normal);
  font-weight: 600;
  font-size: calc(var(--font-size) * 0.8);
  color: #fff;
  background-color: transparent;
  border: 2px solid #fff;
  border-radius: 5px;
  text-transform: uppercase;
  cursor: pointer;
}

.menu-link {
  position: relative;
}

.menu-link details[open] summary {
  background-color: var(--color-blue);
}

.header__bookmark {
  margin-top: 6px;
}

.header__bookmark details[open] summary svg path {
  fill: var(--color-blue);
}

.header__wrapper summary::-webkit-details-marker,
.header__wrapper summary::marker {
  display: none;
  font-size: 0;
}
.header__wrapper summary {
  cursor: pointer;
  display: inline-block;
  user-select: none;
}

.header-popup {
  top: 40px;
  right: 0;
  width: 380px;
  padding-top: var(--gap);
  padding-bottom: var(--gap);
  background-color: var(--color-light);
  color: var(--color-dark);
}

.header-popup::after {
  content: "";
  position: absolute;
  bottom: 100%;
  left: 90%;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 6px solid #fff;
}

.header-popup--bookmark {
  top: 52px;
}

@media screen and (max-width: 640px) {
  .header {
    z-index: 40;
  }

  .header__wrapper h1 {
    margin-right: 0;
    margin-bottom: 5px;
  }

  .header__container {
    position: relative;
    padding-bottom: var(--gap);
    min-height: 100px;
  }

  .header__wrapper:first-of-type {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 5px;
  }

  .menu-link {
    position: static;
  }

  .header-popup {
    position: absolute;
    max-width: unset;
    width: 100%;
    top: 88px;
  }

  .header-popup::after {
    left: calc(100% - 180px);
  }

  .header-popup--bookmark::after {
    left: calc(100% - 32px);
  }
}

@media screen and (max-width: 376px) {
  .header__container {
    flex-direction: column;
  }

  .header-popup {
    top: 105px;
  }

  .header-popup::after {
    left: calc(100% - 230px);
  }

  .header-popup--bookmark::after {
    left: calc(100% - 102px);
  }
}
</style>
