<template>
  <header class="header">
    <div class="container header__container">
      <div class="header__wrapper">
        <h1 class="title">
          <router-link to="/">{{ $t("header.title") }}</router-link>
        </h1>
        <div class="title">{{ city }}</div>
      </div>

      <div
        class="header__wrapper header__wrapper--mobile"
        :class="{ 'header__wrapper--mobile-active': isMenuOpen }"
      >
        <div
          @click="colorMap('menu')"
          class="menu-link header--mr"
          tabindex="0"
        >
          <details :open="!helper">
            <summary>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="11"
                  stroke="white"
                  stroke-width="2"
                />
                <path
                  d="M10.834 13.178C10.834 12.87 10.8713 12.5947 10.946 12.352C11.0207 12.1093 11.142 11.8807 11.31 11.666C11.4873 11.4513 11.73 11.232 12.038 11.008C12.318 10.8027 12.5327 10.6207 12.682 10.462C12.8313 10.3033 12.934 10.1447 12.99 9.986C13.046 9.82733 13.074 9.65 13.074 9.454C13.074 9.15533 12.9807 8.93133 12.794 8.782C12.6073 8.62333 12.3553 8.544 12.038 8.544C11.6927 8.544 11.3333 8.60467 10.96 8.726C10.596 8.84733 10.2133 9.01067 9.812 9.216L9.014 7.718C9.47133 7.466 9.96133 7.26067 10.484 7.102C11.0067 6.94333 11.5807 6.864 12.206 6.864C13.1487 6.864 13.8767 7.09733 14.39 7.564C14.9127 8.03067 15.174 8.62333 15.174 9.342C15.174 9.72467 15.118 10.056 15.006 10.336C14.894 10.6067 14.726 10.8633 14.502 11.106C14.278 11.3487 13.9933 11.6053 13.648 11.876C13.396 12.072 13.1953 12.24 13.046 12.38C12.906 12.52 12.808 12.6553 12.752 12.786C12.696 12.9167 12.668 13.08 12.668 13.276V13.682H10.834V13.178ZM10.582 16.02C10.582 15.5907 10.7033 15.292 10.946 15.124C11.1887 14.9467 11.4827 14.858 11.828 14.858C12.164 14.858 12.4533 14.9467 12.696 15.124C12.9387 15.292 13.06 15.5907 13.06 16.02C13.06 16.4307 12.9387 16.7293 12.696 16.916C12.4533 17.0933 12.164 17.182 11.828 17.182C11.4827 17.182 11.1887 17.0933 10.946 16.916C10.7033 16.7293 10.582 16.4307 10.582 16.02Z"
                  fill="white"
                />
              </svg>
            </summary>

            <div class="header-popup header-popup--menu popup-wrapper">
              <MenuPopup />
            </div>
          </details>
        </div>

        <div
          @click="colorMap('join')"
          class="header__join header--mr"
          tabindex="0"
        >
          <details :open="!helper">
            <summary>
              <svg
                width="17"
                height="17"
                viewBox="0 0 17 17"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clip-path="url(#clip0_50_166)">
                  <path
                    d="M9.80769 1.30769C9.80769 0.584375 9.22332 0 8.5 0C7.77668 0 7.19231 0.584375 7.19231 1.30769V7.19231H1.30769C0.584375 7.19231 0 7.77668 0 8.5C0 9.22332 0.584375 9.80769 1.30769 9.80769H7.19231V15.6923C7.19231 16.4156 7.77668 17 8.5 17C9.22332 17 9.80769 16.4156 9.80769 15.6923V9.80769H15.6923C16.4156 9.80769 17 9.22332 17 8.5C17 7.77668 16.4156 7.19231 15.6923 7.19231H9.80769V1.30769Z"
                    fill="white"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_50_166">
                    <rect width="17" height="17" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </summary>

            <div class="header-popup header-popup--join popup-wrapper">
              <JoinPopup />
            </div>
          </details>
        </div>
        <div class="header__fork" @click="colorMap('fork')">
          <details :open="!helper">
            <summary>
              <svg
                width="21"
                height="18"
                viewBox="0 0 21 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16.7344 3.21429C16.7344 3.74665 17.1753 4.17857 17.7188 4.17857C18.2622 4.17857 18.7031 3.74665 18.7031 3.21429C18.7031 2.68192 18.2622 2.25 17.7188 2.25C17.1753 2.25 16.7344 2.68192 16.7344 3.21429ZM17.7188 6.42857C16.3734 6.42857 15.2168 5.63705 14.7123 4.5L13.125 4.5C12.399 4.5 11.8125 5.07455 11.8125 5.78571V12.2143C11.8125 12.9254 12.399 13.5 13.125 13.5H14.7123C15.2168 12.3629 16.3734 11.5714 17.7188 11.5714C19.5316 11.5714 21 13.0098 21 14.7857C21 16.5616 19.5316 18 17.7188 18C16.3734 18 15.2168 17.2085 14.7123 16.0714H13.125C10.9512 16.0714 9.1875 14.3438 9.1875 12.2143V10.2857L6.28769 10.2857C5.7832 11.4228 4.62656 12.2143 3.28125 12.2143C1.46836 12.2143 0 10.7759 0 9C0 7.22411 1.46836 5.78571 3.28125 5.78571C4.62656 5.78571 5.7832 6.57723 6.28769 7.71429H9.1875V5.78571C9.1875 3.65625 10.9512 1.92857 13.125 1.92857H14.7123C15.2168 0.791518 16.3734 0 17.7188 0C19.5316 0 21 1.43839 21 3.21429C21 4.99018 19.5316 6.42857 17.7188 6.42857ZM16.7344 14.7857C16.7344 15.3181 17.1753 15.75 17.7188 15.75C18.2622 15.75 18.7031 15.3181 18.7031 14.7857C18.7031 14.2533 18.2622 13.8214 17.7188 13.8214C17.1753 13.8214 16.7344 14.2533 16.7344 14.7857ZM3.28125 9.96429C3.82471 9.96429 4.26562 9.53237 4.26562 9C4.26562 8.46763 3.82471 8.03571 3.28125 8.03571C2.73779 8.03571 2.29688 8.46763 2.29688 9C2.29688 9.53237 2.73779 9.96429 3.28125 9.96429Z"
                  fill="white"
                />
              </svg>
            </summary>

            <div class="header-popup header-popup--fork popup-wrapper">
              <ForkPopup />
            </div>
          </details>
        </div>

        <ThemeSwitcher />
        <div class="sensors-select">
          <select v-model="locale">
            <option value="en">EN</option>
            <option value="ru">RU</option>
          </select>
        </div>
      </div>
      <button @click="openMenu" class="mobile" :class="{ active: isMenuOpen }">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </header>
</template>

<script>
import { useStore } from "@/store";
import MenuPopup from "./MenuPopup.vue";
import JoinPopup from "./JoinPopup.vue";
import ForkPopup from "./ForkPopup.vue";
import ThemeSwitcher from "./ThemeSwitcher.vue";

export default {
  components: { MenuPopup, JoinPopup, ForkPopup, ThemeSwitcher },
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
    // open mobile menu
    openMenu() {
      if (!this.isMenuOpen) {
        this.allDetailsClose = false;
        this.isMenuOpen = true;
        this.store.colorMap();
      } else {
        this.allDetailsClose = true;
        this.isMenuOpen = false;
        this.store.removeColorMap();
      }
    },
  },
  mounted() {
    // Close all opened details on body click
    document.body.onclick = (e) => {
      const current = e.target.closest("details");
      // const emojis = e.target.closest(".colorful-scale");
      // const history = e.target.closest(".sensors__history");
      // const mobile = e.target.closest(".mobile");
      // const footerMenu = e.target.closest(".footer__mobile-menu");

      // // popups
      // const sensorPopup = document.querySelector(".sensor-popup");
      // const historyPopup = document.querySelector("#history");
      // const footerMobilePopup = document.querySelector(
      //   ".sensors-switchers__wrapper"
      // );
      // const measures = document.querySelector("#measures");

      if (this.allDetailsClose && this.curr && !current) {
        this.curr = "";
        this.store.removeColorMap();
      }

      document.body.querySelectorAll("details").forEach((e) => {
        if (e !== current) {
          e.open = false;
          this.allDetailsClose = true;
          if (!this.helper) {
            localStorage.setItem("helper", true);
          }
        }
      });
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
  margin-right: var(--gap);
}

.header__wrapper h1 {
  margin-right: var(--gap);
}

.header__join {
  margin-top: 2px;
}

.header__fork {
  margin-top: 5px;
  margin-right: calc(var(--gap) * 2);
}

.menu-link {
  position: relative;
  margin-top: 2px;
}

.header .menu-link summary svg {
  color: var(--color-blue);
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

.menu-link details[open] summary svg {
  fill: var(--color-dark);
}

.dark .menu-link details[open] summary svg {
  fill: var(--color-blue);
}

.header__join details[open]::after,
.header__fork details[open]::after {
  content: "";
  position: absolute;
  top: 0;
  right: 162px;
  width: 34px;
  height: 62px;
  background-color: #000;
  z-index: -1;
}

.header__fork details[open]::after {
  right: 128px;
}

.header-popup {
  top: 38px;
  right: -158px;
  width: 350px;
  padding-top: var(--gap);
  padding-bottom: var(--gap);
  /* padding-right: calc(var(--gap) * 2.2) !important; */
  background-color: var(--color-light);
  color: var(--color-dark);
}

.header-popup::after {
  content: "";
  position: absolute;
  bottom: 100%;
  left: 50%;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 10px solid #fff;
}

.header-popup--join {
  top: 48px;
  right: 27px;
  width: 312px;
}

.header-popup--fork {
  top: 48px;
  right: 14px;
  width: 272px;
}

/* styles for mobile menu */
.mobile {
  display: none;
  position: relative;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border: 2px solid #fff;
  border-radius: 100%;
  cursor: pointer;
  z-index: 10;
}

.mobile.active {
  border-color: var(--color-dark);
}

.mobile span {
  position: absolute;
  display: inline-block;
  width: 11px;
  height: 2px;
  top: 7px;
  background-color: #fff;
  border-radius: 4px;
  transition: transform 0.33s ease-in-out, background-color 0.33s ease-in-out;
}

.mobile span:nth-child(2) {
  top: 12px;
}

.mobile span:last-child {
  top: 17px;
}

.mobile.active span:first-child {
  background-color: transparent;
  transform: translateY(30%);
}

.mobile.active span:nth-child(2) {
  top: 13px;
  width: 16px;
  transform: rotate(45deg);
}

.mobile.active span:nth-child(3) {
  position: relative;
  top: 0;
  width: 16px;
  transform: rotate(-45deg);
}

.mobile.active span {
  background-color: var(--color-dark);
}

@media screen and (max-width: 640px) {
  .header {
    z-index: 40;
  }
  .mobile {
    display: flex;
  }

  .header__wrapper h1 {
    margin-right: 0;
    margin-bottom: 5px;
  }

  .header__container {
    padding-bottom: var(--gap);
  }

  .header__wrapper:first-of-type {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 5px;
  }

  .header-popup {
    max-width: 220px;
    /* position: fixed; */
    /* top: calc(var(--gap) * 6.5);
    right: 12px;
    left: 12px; */
    /* width: auto; */
    /* width: auto; */
  }

  .header__wrapper--mobile {
    position: absolute;
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    padding: calc(var(--gap) * 3.5) calc(var(--gap) * 1);
    top: 0;
    right: 0;
    width: 120px;
    height: 100vh;
    color: var(--color-dark);
    background-color: var(--color-light);
    transform: translateX(100%);
    transition: transform 0.33s ease-in-out;
  }

  .header__wrapper--mobile-active {
    transform: translateX(0);
  }

  .header__wrapper--mobile svg {
    fill: var(--color-dark);
  }

  .dark .menu-link svg path {
    fill: #333;
  }

  .header__join svg path,
  .header__fork svg path {
    fill: var(--color-dark);
  }

  .header-popup--menu {
    top: 22px;
    left: -234px;
  }

  .header-popup--join {
    top: 80px;
    left: -220px;
  }

  .header-popup--fork {
    top: 80px;
    left: -220px;
  }

  .header__join details[open]::after,
  .header__fork details[open]::after {
    display: none;
  }

  .header-popup::after {
    bottom: 99%;
    left: unset;
    right: 0;
    transform: rotate(90deg);
    border-bottom: 10px solid var(--color-dark);
  }

  .header-popup--join::after {
    bottom: 95%;
  }

  .header-popup--fork::after {
    bottom: 83%;
  }

  .sensors-select select {
    border-color: var(--color-dark);
  }
}
</style>
