<template>
  <footer class="footer">
    <div class="container">
      <a
        href="javascript:;"
        class="footer__mobile-menu"
        @click="isActiveMenu = !isActiveMenu"
        :class="{ active: isActiveMenu }"
      >
        <font-awesome-icon icon="fa-solid fa-sliders" />
      </a>

      <div
        id="dateSelect"
        class="sensors-dateselect"
        :class="{ active: isActiveMenu }"
      >
        <a
          class="popup__close"
          @click="isActiveMenu = !isActiveMenu"
          href="javascript:;"
        >
          <font-awesome-icon icon="fa-solid fa-xmark" />
        </a>

        <div class="sensors-dateselect__wrapper">
          <input
            type="date"
            v-model="start"
            :max="maxDate"
            :disabled="currentProvider == 'realtime'"
          />
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

        <div class="sensors-dateselect__history">
          <a
            href="javascript:;"
            class="sensors__history"
            @click="toggleIsActive"
            :class="{ active: isActive }"
          >
            {{ $t("footer.history") }}
          </a>
        </div>

        <div class="history-popup" :class="{ visible: isActive }">
          <HistoryPopup :isActive="isActive" @toggleIsActive="toggleIsActive" />
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
import moment from "moment";
import config from "../../config";
import { instanceMap } from "../../utils/map/instance";
import { switchMessagesLayer } from "../../utils/map/marker";
import { switchLayer } from "../../utils/map/wind";
import HistoryPopup from "./HistoryPopup.vue";
import Switcher from "./Switcher.vue";

export default {
  emits: ["history"],
  props: ["currentProvider", "canHistory"],
  components: { Switcher, HistoryPopup },

  data() {
    return {
      isActive: false,
      isActiveMenu: false,

      realtime: this.currentProvider === "realtime",
      wind: false,
      messages: config.SHOW_MESSAGES,
      start: moment().format("YYYY-MM-DD"),
      maxDate: moment().format("YYYY-MM-DD"),
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
      this.isActive = !this.isActive;
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
  justify-content: space-between;
}

.footer .sensors-dateselect .popup__close {
  display: none;
}

.footer .sensors-dateselect input[type="date"] {
  margin-right: var(--gap);
}

.sensors__history {
  position: relative;
  padding: 0.4rem 1.5rem;
  color: #fff;
  background-color: var(--color-blue);
  border: 2px solid #fff;
  border-radius: 17px;
  z-index: 11;
}

.sensors__history.active {
  background-color: #000;
}

.sensors__history:hover {
  color: #fff;
}

.history-popup {
  position: absolute;
  bottom: calc(var(--gap) * 2);
  right: calc(var(--gap) * 2);
  z-index: 10;
}

.footer__mobile-menu {
  display: none;
  width: 50px;
  height: 50px;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #fff;
  background-color: var(--color-blue);
  border: 2px solid #fff;
  border-radius: 100%;
  transition: background-color 0.33s ease-in-out;
}

.footer__mobile-menu:hover {
  color: #fff;
}

.footer__mobile-menu.active {
  background-color: #000;
}

@media screen and (max-width: 1060px) {
  .footer .sensors-dateselect {
    display: flex;
    align-items: flex-end;
  }

  .footer .sensors-dateselect__wrapper {
    display: inline-flex;
    flex-direction: column;
  }

  .footer .sensors-dateselect input[type="date"] {
    width: 60%;
    margin-right: 0;
    margin-bottom: 10px;
  }
}

@media screen and (max-width: 680px) {
  .footer__mobile-menu {
    display: flex;

    position: absolute;
    bottom: 2px;
    z-index: 10;
  }

  .sensors__history {
    border: 1px solid transparent;
    z-index: 9;
  }

  .sensors__history.active {
    background-color: var(--color-blue);
  }

  .footer .history-popup {
    top: 0;
    bottom: 0;
    left: 0px;
    right: 3px;
    visibility: hidden;
    transition: visibility 0.33s ease-in-out;
  }

  .footer .history-popup.visible {
    visibility: visible;
  }

  .footer .sensors-dateselect .popup__close {
    display: block;
    top: 20px;
    right: 20px;
  }

  .footer .sensors-dateselect {
    display: none;
    flex-direction: column;
    align-items: flex-start;
    padding: calc(var(--gap) * 3) calc(var(--gap) * 2);
    height: 100%;
    border-radius: 28px;
    background-color: var(--color-light);
  }

  .footer .sensors-dateselect__wrapper {
    margin-bottom: calc(var(--gap) * 2);
  }

  .footer .container {
    display: inline-flex;
    flex-direction: column-reverse;
  }

  .footer .sensors-dateselect input[type="date"] {
    margin-bottom: calc(var(--gap) * 2);
  }

  .sensors-dateselect.active {
    display: inline-flex;
    animation: popup 0.2s linear 0.2s forwards;
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

@media screen and (max-width: 400px) {
  .footer .sensors-dateselect {
    padding: calc(var(--gap) * 3) var(--gap);
  }
}
</style>
