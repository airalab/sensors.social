<template>
  <footer class="footer">
    <div class="container">
      <a
        href="javascript:;"
        class="footer__mobile-menu"
        @click="toggleMobileMenu"
        :class="{ active: isActiveMenu }"
      >
        <font-awesome-icon icon="fa-solid fa-sliders" />
      </a>

      <div id="dateSelect" class="sensors-dateselect">
        <Measures :current="type.toLowerCase()" />
        <div
          id="switchers"
          class="sensors-switchers__wrapper"
          :class="{ active: isActiveMenu }"
        >
          <div
            class="sensors-switchers__settings"
            :class="{ active: isActiveMenu }"
          >
            <font-awesome-icon icon="fa-solid fa-sliders" />
            Settings
          </div>
          <a class="popup__close" @click="toggleMobileMenu" href="javascript:;">
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </a>
          <Switcher
            id="realtime"
            v-model="realtime"
            :title="$t('provider.realtime')"
          />
          <Switcher
            id="wind"
            v-model="wind"
            :title="$t('layer.wind')"
            class="title__top"
            :class="[!realtime ? 'disabled' : null]"
            :helper="$t('layer.help')"
          />
          <Switcher
            id="messages"
            v-model="messages"
            :title="$t('layer.messages')"
          />
        </div>

        <a
          href="javascript:;"
          class="sensors__history"
          @click="toggleIsActive"
          :class="{ active: isActive }"
          aria-label="download history"
        >
          <!-- {{ $t("footer.history") }} -->
          <img
            src="../../assets/images/download_icon.svg"
            alt="download history icon"
          />
        </a>
        <div class="sensors-dateselect__calendar">
          <!-- calendar -->
          <input
            type="date"
            v-model="start"
            :max="maxDate"
            :disabled="currentProvider == 'realtime'"
          />
          <span class="sensors-dateselect__calendar-button">
            <button type="button">
              <svg
                width="17"
                height="19"
                viewBox="0 0 17 19"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clip-path="url(#clip0_23_68)">
                  <path
                    d="M4.85714 0C5.52879 0 6.07143 0.530664 6.07143 1.1875V2.375H10.9286V1.1875C10.9286 0.530664 11.4712 0 12.1429 0C12.8145 0 13.3571 0.530664 13.3571 1.1875V2.375H15.1786C16.1842 2.375 17 3.17285 17 4.15625V5.9375H0V4.15625C0 3.17285 0.815848 2.375 1.82143 2.375H3.64286V1.1875C3.64286 0.530664 4.18549 0 4.85714 0ZM0 7.125H17V17.2188C17 18.2021 16.1842 19 15.1786 19H1.82143C0.815848 19 0 18.2021 0 17.2188V7.125ZM2.42857 10.0938V11.2812C2.42857 11.6078 2.70179 11.875 3.03571 11.875H4.25C4.58393 11.875 4.85714 11.6078 4.85714 11.2812V10.0938C4.85714 9.76719 4.58393 9.5 4.25 9.5H3.03571C2.70179 9.5 2.42857 9.76719 2.42857 10.0938ZM7.28571 10.0938V11.2812C7.28571 11.6078 7.55893 11.875 7.89286 11.875H9.10714C9.44107 11.875 9.71429 11.6078 9.71429 11.2812V10.0938C9.71429 9.76719 9.44107 9.5 9.10714 9.5H7.89286C7.55893 9.5 7.28571 9.76719 7.28571 10.0938ZM12.75 9.5C12.4161 9.5 12.1429 9.76719 12.1429 10.0938V11.2812C12.1429 11.6078 12.4161 11.875 12.75 11.875H13.9643C14.2982 11.875 14.5714 11.6078 14.5714 11.2812V10.0938C14.5714 9.76719 14.2982 9.5 13.9643 9.5H12.75ZM2.42857 14.8438V16.0312C2.42857 16.3578 2.70179 16.625 3.03571 16.625H4.25C4.58393 16.625 4.85714 16.3578 4.85714 16.0312V14.8438C4.85714 14.5172 4.58393 14.25 4.25 14.25H3.03571C2.70179 14.25 2.42857 14.5172 2.42857 14.8438ZM7.89286 14.25C7.55893 14.25 7.28571 14.5172 7.28571 14.8438V16.0312C7.28571 16.3578 7.55893 16.625 7.89286 16.625H9.10714C9.44107 16.625 9.71429 16.3578 9.71429 16.0312V14.8438C9.71429 14.5172 9.44107 14.25 9.10714 14.25H7.89286ZM12.1429 14.8438V16.0312C12.1429 16.3578 12.4161 16.625 12.75 16.625H13.9643C14.2982 16.625 14.5714 16.3578 14.5714 16.0312V14.8438C14.5714 14.5172 14.2982 14.25 13.9643 14.25H12.75C12.4161 14.25 12.1429 14.5172 12.1429 14.8438Z"
                    fill="black"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_23_68">
                    <rect width="17" height="19" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </button>
          </span>
        </div>
      </div>

      <div class="history-popup" :class="{ visible: isActive }">
        <HistoryPopup :isActive="isActive" @toggleIsActive="toggleIsActive" />
      </div>
    </div>
  </footer>
</template>

<script>
import { useStore } from "@/store";
import moment from "moment";
import config from "../../config";
import { instanceMap } from "../../utils/map/instance";
import { switchMessagesLayer } from "../../utils/map/marker";
import { switchLayer } from "../../utils/map/wind";
import HistoryPopup from "./HistoryPopup.vue";
import Switcher from "./Switcher.vue";
import Measures from "../../components/measures/Measures.vue";

export default {
  emits: ["history"],
  props: ["currentProvider", "canHistory", "type"],
  components: { Switcher, HistoryPopup, Measures },

  data() {
    return {
      isActive: false,
      isActiveMenu: false,

      realtime: this.currentProvider === "realtime",
      wind: false,
      messages: config.SHOW_MESSAGES,
      start: moment().format("YYYY-MM-DD"),
      maxDate: moment().format("YYYY-MM-DD"),
      store: useStore(),
    };
  },
  computed: {
    startTimestamp: function () {
      return Number(
        moment(this.start + " 00:00:00", "YYYY-MM-DD HH:mm:ss").format("X")
      );
    },
    endTimestamp: function () {
      return Number(
        moment(this.start + " 23:59:59", "YYYY-MM-DD HH:mm:ss").format("X")
      );
    },
  },
  watch: {
    async realtime(v) {
      await this.$router.push({
        name: "main",
        params: {
          provider: v ? "realtime" : "remote",
          type: this.$route.params.type,
          zoom: this.$route.params.zoom,
          lat: this.$route.params.lat,
          lng: this.$route.params.lng,
          sensor: this.$route.params.sensor,
        },
      });
      this.$router.go(0);
    },
    start() {
      this.getHistory();
    },
    canHistory: {
      handler(newValue) {
        if (newValue) {
          this.getHistory();
        }
      },
      immediate: true,
    },
    wind(value) {
      switchLayer(instanceMap(), value);
    },
    messages(value) {
      switchMessagesLayer(instanceMap(), value);
    },
  },

  methods: {
    toggleIsActive() {
      if (!this.isActive) {
        this.isActive = true;
        this.store.colorMap();
      } else {
        this.isActive = false;
        this.store.removeColorMap();
      }
    },

    toggleMobileMenu() {
      if (!this.isActiveMenu) {
        this.isActiveMenu = true;
        this.store.colorMap();
      } else {
        this.isActiveMenu = false;
        this.store.removeColorMap();
      }
    },

    getHistory() {
      if (this.realtime) {
        return;
      }
      this.$emit("history", {
        start: this.startTimestamp,
        end: this.endTimestamp,
      });
    },
  },
};
</script>

<style>
.footer {
  position: fixed;
  bottom: 5px;
  width: 99%;
  z-index: 12;
  padding-bottom: var(--gap);
}

.footer .sensors-dateselect {
  display: flex;
  align-items: center;
}

.footer .sensors-dateselect .sensors-switchers__wrapper {
  margin-right: auto;
}

.sensors-switchers__settings {
  display: none;
  text-transform: none;
  margin-bottom: calc(var(--gap) * 2);
  color: var(--color-dark);
}

.footer .sensors-dateselect .popup__close {
  display: none;
}

.sensors-dateselect__history {
  display: flex;
  align-items: center;
}

.sensors-dateselect__calendar {
  position: relative;
}

.footer .sensors-dateselect input[type="date"] {
  margin-right: var(--gap);
  min-width: 130px;
}

.sensors-dateselect__calendar-button {
  position: absolute;
  top: 8px;
  right: 20px;
  width: 25px;
  height: 25px;
  background-color: #fff;
  pointer-events: none;
}

.sensors-dateselect__calendar-button button {
  border: none;
  background: transparent;
}

.sensors__history {
  position: relative;
  display: inline-block;
  width: 32px;
  height: 34px;
  margin-right: 35px;
  padding: 0.2rem 1.2rem;
  /* z-index: 11; */
}

.sensors__history:hover {
  color: #fff;
}

.history-popup {
  position: absolute;
  bottom: calc(var(--gap) * 2);
  right: calc(var(--gap) * 2);
  z-index: 10;
  border-radius: 0;
}

.footer__mobile-menu {
  display: none;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: var(--color-light);
  background-color: var(--color-dark);
  border: 2px solid var(--color-light);
  border-radius: 100%;
  transition: background-color 0.33s ease-in-out;
}

.footer__mobile-menu:hover {
  color: var(--color-light);
}

.footer__mobile-menu.active {
  background-color: var(--color-dark);
}

@media screen and (max-width: 940px) {
  .footer__mobile-menu {
    display: flex;
    position: absolute;
    right: var(--gap);
    bottom: 23px;
    z-index: 9;
  }

  .measures {
    order: 1;
  }

  .sensors-dateselect__calendar {
    order: 1;
    margin-right: auto;
  }

  .sensors-switchers__wrapper {
    order: 3;
  }

  .sensors__history {
    margin-right: 60px;
    border: 1px solid transparent;
    z-index: 2;
    order: 2;
  }

  .footer .history-popup {
    bottom: var(--gap);
    right: var(--gap);
    right: 3px;
    max-width: 300px;
    visibility: hidden;
    transition: visibility 0.33s ease-in-out;
  }

  .footer .history-popup.visible {
    visibility: visible;
  }

  .footer .sensors-switchers__wrapper .popup__close {
    display: block;
    top: -25px;
    right: 0px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: calc(var(--font-size) * 0.8);
    background-color: var(--color-light);
    z-index: 5;
  }

  .footer .sensors-switchers__wrapper {
    display: none;
    position: absolute;
    bottom: var(--gap);
    right: var(--gap);
    min-height: 220px;
    flex-direction: column;
    align-items: flex-start;
    padding: calc(var(--gap) * 1) calc(var(--gap) * 2);
    max-width: 300px;
    width: 100%;
    height: 100%;
    background-color: var(--color-light);
    z-index: 15;
  }

  .sensors-switchers__settings svg {
    margin-right: 5px;
    color: var(--color-dark);
  }

  .footer .sensors-dateselect__wrapper {
    margin-bottom: calc(var(--gap) * 2);
  }

  .footer .sensors-switchers__wrapper.active {
    display: block;
    animation: popup 0.2s linear 0.2s forwards;
  }

  .sensors-switchers__settings.active {
    display: block;
  }

  [data-title] {
    z-index: 10;
  }
}

@media screen and (max-width: 580px) {
  .footer {
    z-index: 8;
  }
}

@media screen and (max-width: 450px) {
  .footer .sensors-dateselect {
    flex-direction: column;
    align-items: flex-end;
  }

  .sensors-dateselect__calendar {
    margin-right: 0;
    margin-top: var(--gap);
    margin-bottom: var(--gap);
  }

  .footer .sensors-dateselect input[type="date"] {
    margin-right: 0;
  }

  .sensors-dateselect__calendar-button {
    right: 5px;
  }
}
</style>
