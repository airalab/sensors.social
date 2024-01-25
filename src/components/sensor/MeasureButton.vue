<template>
  <li :class="classList">
    <a
      href="javascript:;"
      @click="activateInfo(item)"
      class="sensor-popup__link"
    >
      <!-- <span class="icon"><font-awesome-icon :icon="item.icon" /></span> -->
      <div
        class="sensor-popup__item__wrapper"
        :class="
          currentMeasure.includes(item.text.replace('.', '').toUpperCase())
            ? `sensor-popup__item__wrapper--${item.state} sensor-popup__item__wrapper--activated`
            : ''
        "
      >
        <span
          class="sensor-popup__item__text"
          :class="`sensor-popup__item-text--${item.state}`"
        >
          {{ item.text.replace(/[0-9, .]/g, "")
          }}<sub>{{ item.text.replace(/[^0-9, .]/g, "") }}</sub>
        </span>
        <span
          v-if="
            currentMeasure.includes(item.text.replace('.', '').toUpperCase())
          "
          class="sensor-popup__item__equals"
        >
          =
        </span>
        <span class="sensor-popup__item__title"> {{ item.title }}</span>
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
  min-width: 175px;
  height: 46px;
  padding: 0;
  border: 3px solid transparent;
  /* flex-direction: column; */
}

.sensor-popup__item--neutral {
  border-color: #747a80;
}
.sensor-popup__item--good {
  border-color: var(--color-green);
}
.sensor-popup__item--attention {
  border-color: var(--color-orange);
}
.sensor-popup__item--danger {
  border-color: var(--color-red);
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
  width: 100%;
  align-items: center;
  text-transform: none;
  height: 100%;
  /* padding-top: 2px; */
}

.sensor-popup__item:not(:last-child) {
  margin-right: calc(var(--gap) * 0.8);
  margin-bottom: calc(var(--gap) * 0.8);
}

.sensor-popup__item__title {
  padding: calc(var(--gap) * 0.4);
}

.sensor-popup__item--neutral .sensor-popup__item__title {
  color: #747a80;
}

.sensor-popup__item--good .sensor-popup__item__title {
  color: var(--color-green);
}

.sensor-popup__item--attention .sensor-popup__item__title {
  color: var(--color-orange);
}

.sensor-popup__item--danger .sensor-popup__item__title {
  color: var(--color-red);
}

.sensor-popup__item__text {
  padding: calc(var(--gap) * 0.5);
  font-family: var(--font-family--normal);
}

.sensor-popup__item-text--neutral {
  background-color: #747a80;
}
.sensor-popup__item-text--good {
  background-color: var(--color-green);
}
.sensor-popup__item-text--attention {
  background-color: var(--color-orange);
}
.sensor-popup__item-text--danger {
  background-color: var(--color-red);
}

.sensor-popup__item__wrapper--neutral {
  background-color: #747a80;
}

.sensor-popup__item__wrapper--good {
  background-color: var(--color-green);
}

.sensor-popup__item__wrapper--attention {
  background-color: var(--color-orange);
}

.sensor-popup__item__wrapper--danger {
  background-color: var(--color-red);
}

.sensor-popup__item__wrapper--activated .sensor-popup__item__title {
  color: #fff;
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
