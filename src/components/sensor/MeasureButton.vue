<template>
  <li :class="classList">
    <a
      href="javascript:;"
      @click="activateInfo(item)"
      class="sensor-popup__link"
    >
      <div
        class="sensor-popup__item__wrapper"
        :class="
          currentMeasure.includes(item.text.replace('.', '').toUpperCase())
            ? `sensor-popup__item__wrapper--${item.state} sensor-popup__item__wrapper--activated`
            : ''
        "
      >
        <span
          class="sensor-popup__item-status"
          :class="`sensor-popup__item-status--${item.state}`"
        >
        </span>
        <span class="sensor-popup__item__title">
          <span>
            {{ item.text.replace(/[0-9, .]/g, "")
            }}<sub>{{ item.text.replace(/[^0-9, .]/g, "") }}</sub></span
          >
          {{ item.title }}</span
        >
      </div>
    </a>
  </li>
</template>

<script>
import { useStore } from "@/store";
export default {
  emits: ["select"],
  props: {
    item: {
      type: Object,
    },
    currentMeasure: {
      type: Array,
      default: () => [],
    },
  },

  data() {
    return {
      activated: false,
      store: useStore(),
    };
  },

  computed: {
    classList() {
      return {
        [`sensor-popup__item`]: true,
        [`sensor-popup__item--${this.item.state}`]: this.item.state,
      };
    },
  },

  methods: {
    activateInfo(item) {
      this.$emit("select", this.$props.item.text);
      this.store.selectCurrentActiveMeasure(
        item.text.replace(".", "").toUpperCase()
      );
    },
  },
};
</script>

<style scoped>
.sensor-popup__item {
  cursor: pointer;
  padding: 0;
  border: 3px solid transparent;
  /* flex-direction: column; */
}

.sensor-popup__link {
  display: flex;
  height: 100%;
  width: 100%;
  color: #fff;
}

.sensor-popup__item .icon {
  margin-right: 5px;
}

.sensor-popup__item__wrapper {
  display: flex;
  gap: calc(var(--gap) * 0.5);
  width: 100%;
  text-transform: none;
  height: 100%;
  /* padding-top: 2px; */
}

.sensor-popup__item {
  margin-right: calc(var(--gap) * 1.4);
  margin-bottom: calc(var(--gap) * 0.8);
}

.sensor-popup__item__title {
  display: flex;
  flex-direction: column;
  font-size: calc(var(--font-size) * 0.7);
  color: #000;
  opacity: 0.5;
}

.sensor-popup__item__status {
  padding: calc(var(--gap) * 0.5);
  font-family: var(--font-family--normal);
}

.sensor-popup__item-status {
  display: inline-block;
  width: 20px;
  height: 20px;
  background-image: url("data:image/svg+xml,%3Csvg width='17' height='15' viewBox='0 0 17 15' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0.672546 13.6222L15.6725 0.622192' stroke='white' stroke-linecap='round'/%3E%3Cpath d='M8 3.33333C10.5267 3.33333 12.78 4.75333 13.88 7C12.78 9.24667 10.5333 10.6667 8 10.6667C5.46666 10.6667 3.22 9.24667 2.12 7C3.22 4.75333 5.47333 3.33333 8 3.33333ZM8 2C4.66666 2 1.82 4.07333 0.666664 7C1.82 9.92667 4.66666 12 8 12C11.3333 12 14.18 9.92667 15.3333 7C14.18 4.07333 11.3333 2 8 2ZM8 5.33333C8.92 5.33333 9.66666 6.08 9.66666 7C9.66666 7.92 8.92 8.66667 8 8.66667C7.08 8.66667 6.33333 7.92 6.33333 7C6.33333 6.08 7.08 5.33333 8 5.33333ZM8 4C6.34666 4 5 5.34667 5 7C5 8.65333 6.34666 10 8 10C9.65333 10 11 8.65333 11 7C11 5.34667 9.65333 4 8 4Z' fill='white'/%3E%3C/svg%3E%0A");
  background-size: 15px 15px;
  background-repeat: no-repeat;
  background-position: center;
  background-color: #000;
}

.sensor-popup__item__wrapper--activated .sensor-popup__item__title {
  opacity: 1;
}

.sensor-popup__item__wrapper--activated .sensor-popup__item-status {
  background-image: url("data:image/svg+xml,%3Csvg width='16' height='10' viewBox='0 0 16 10' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7.99996 1.33333C10.5266 1.33333 12.78 2.75333 13.88 5C12.78 7.24667 10.5333 8.66667 7.99996 8.66667C5.46663 8.66667 3.21996 7.24667 2.11996 5C3.21996 2.75333 5.47329 1.33333 7.99996 1.33333ZM7.99996 0C4.66663 0 1.81996 2.07333 0.666626 5C1.81996 7.92667 4.66663 10 7.99996 10C11.3333 10 14.18 7.92667 15.3333 5C14.18 2.07333 11.3333 0 7.99996 0ZM7.99996 3.33333C8.91996 3.33333 9.66663 4.08 9.66663 5C9.66663 5.92 8.91996 6.66667 7.99996 6.66667C7.07996 6.66667 6.33329 5.92 6.33329 5C6.33329 4.08 7.07996 3.33333 7.99996 3.33333ZM7.99996 2C6.34663 2 4.99996 3.34667 4.99996 5C4.99996 6.65333 6.34663 8 7.99996 8C9.65329 8 11 6.65333 11 5C11 3.34667 9.65329 2 7.99996 2Z' fill='white'/%3E%3C/svg%3E%0A");
  background-color: var(--color-blue);
}

@media screen and (max-width: 580px) {
  .sensor-popup__item {
    min-width: 102px;
    height: unset;
    margin-bottom: 0;
  }

  .sensor-popup__link {
    font-size: 0.7rem;
  }

  .sensor-popup__item:not(:last-child) {
    margin-right: 5px;
    margin-bottom: 0;
  }
}
</style>
