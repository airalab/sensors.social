<template>
  <header class="header">
    <div class="container header__container">
      <div class="header__wrapper">
        <h1 class="title">{{ $t("header.title") }}</h1>
        <div class="title">{{ city }}</div>
      </div>

      <div class="header__wrapper">
        <div class="sensors-select blue">
          <select v-model="locale">
            <option value="en">English</option>
            <option value="ru">Русский</option>
            <option value="el">Ελληνικά</option>
          </select>
          <font-awesome-icon icon="fa-solid fa-sort" />
        </div>

        <div class="menu-link" tabindex="0">
          <details>
            <summary>
              <font-awesome-icon icon="fa-solid fa-circle-question" />
            </summary>

            <div class="header-popup popup-wrapper">
              <MenuPopup />
            </div>
          </details>
        </div>

        <ThemeSwitcher />
      </div>
    </div>
  </header>
</template>

<script>
import MenuPopup from "./MenuPopup.vue";
import ThemeSwitcher from "./ThemeSwitcher.vue";

export default {
  components: { MenuPopup, ThemeSwitcher },
  props: ["localeCurrent", "city"],
  data() {
    return {
      locale: this.localeCurrent,
    };
  },
  watch: {
    locale(newValue) {
      this.$i18n.locale = newValue;
      localStorage.setItem("locale", newValue);
    },
  },
  mounted() {
    // Close all opened details on body click
    document.body.onclick = (e) => {
      const current = e.target.closest("details");
      document.body.querySelectorAll("details").forEach((e) => {
        if (e !== current) {
          e.open = false;
        }
      });
    };
  },
};
</script>

<style scoped>
h1 {
  color: var(--color-middle-gray);
}

.header {
  position: sticky;
  top: 0;
  color: #fff;
  background-color: #000;
  z-index: 15;
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
  margin-right: var(--gap);
}

.header__wrapper h1 {
  margin-right: var(--gap);
}

.header .fa-sort {
  pointer-events: none;
  position: absolute;
  right: 8px;
  top: calc(50% - 0.65rem * 0.5);
  font-size: 0.7rem;
}

.header .fa-circle-question {
  position: relative;
  font-size: 1.4rem;
  margin-left: var(--gap);
  z-index: 10;
}

.menu-link {
  position: relative;
}

.header .menu-link summary svg {
  color: var(--color-blue);
}
.menu-link summary::-webkit-details-marker,
.menu-link summary::marker {
  display: none;
  font-size: 0;
}
.menu-link summary {
  cursor: pointer;
  display: inline-block;
  user-select: none;
}

.menu-link details[open]::after {
  content: "";
  position: absolute;
  width: 30px;
  height: 30px;
  right: -3.5px;
  top: -3px;
  background: #fff;
  border-radius: 20px;
  transition: opacity 0.33s ease-in-out;
}

.header-popup {
  top: 33px;
  right: 0;
  width: 350px;
  padding-top: var(--gap);
  padding-bottom: var(--gap);
  /* padding-right: calc(var(--gap) * 2.2) !important; */
  background-color: var(--color-light);
  color: var(--color-dark);
  border-radius: 4px;
}

@media screen and (max-width: 520px) {
  .header__wrapper h1 {
    margin-right: 0;
    margin-bottom: 5px;
  }

  .header__container {
    flex-direction: column;
    align-items: flex-start;
    padding-bottom: var(--gap);
  }

  .header__wrapper:first-of-type {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 5px;
  }

  .header-popup {
    position: fixed;
    top: calc(var(--gap) * 6.5);
    right: 12px;
    left: 12px;
    width: auto;
  }
}
</style>
