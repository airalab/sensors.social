<template>
  <li :class="classList">
    <a
      href="javascript:;"
      @click="$emit('select', item.text)"
      class="sensor-popup__link"
    >
      <span class="icon"><font-awesome-icon :icon="item.icon" /></span>
      <div class="sensor-popup__item__wrapper">
        {{ item.title }}
        <span class="sensor-popup__item__text">{{ item.text }}</span>
      </div>
    </a>
  </li>
</template>

<script>
export default {
  emits: ["select"],
  props: {
    item: {
      type: Object,
    },
  },

  computed: {
    classList() {
      return {
        [`sensor-popup__item`]: true,
        [`sensor-popup__item--${this.item.state}`]: this.item.state,
      };
    },
  },
};
</script>

<style scoped>
.sensor-popup__item {
  min-width: 155px;
  border-radius: 4px;
  cursor: pointer;
  /* flex-direction: column; */
}

.sensor-popup__item--neutral {
  background-color: #747a80;
}
.sensor-popup__item--good {
  background-color: var(--color-green);
}
.sensor-popup__item--attention {
  background-color: var(--color-orange);
}
.sensor-popup__item--danger {
  background-color: var(--color-red);
}

.sensor-popup__link {
  display: flex;
  padding: var(--gap);
  color: #fff;
}

.sensor-popup__item .icon {
  margin-right: 5px;
}

.sensor-popup__item__wrapper {
  display: flex;
  flex-direction: column;
  /* padding-top: 2px; */
}

.sensor-popup__item:not(:last-child) {
  margin-right: calc(var(--gap) * 0.8);
  margin-bottom: calc(var(--gap) * 0.8);
}

.sensor-popup__item__text {
  font-family: var(--font-family--normal);
  font-size: 0.7rem;
  font-weight: 400;
}

@media screen and (max-width: 580px) {
  .sensor-popup__item {
    padding: 5px;
    min-width: 102px;
  }

  .sensor-popup__link {
    font-size: 0.7rem;
  }

  .sensor-popup__item:not(:last-child) {
    margin-right: 5px;
  }
  .sensor-popup__item__text {
    font-size: 0.5rem;
  }
}
</style>
