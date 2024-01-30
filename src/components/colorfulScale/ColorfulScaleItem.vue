<template>
  <div class="colorful-scale__wrapper" :class="color.color">
    <div class="colorful-scale__line"></div>
    <div class="colorful-scale__icon">
      <img alt="emoji icon" :src="imageUrl" />
    </div>
    <span
      :class="`colorful-scale__text colorful-scale__text--${color.color}`"
      v-show="isActive"
      >{{ color.text }}</span
    >
  </div>
</template>

<script>
export default {
  props: {
    color: {
      type: Object,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      imageUrl: new URL(
        `/src/assets/images/${this.$props.color.icon}.svg`,
        import.meta.url
      ),
    };
  },
};
</script>

<style scoped>
.colorful-scale__wrapper {
  position: relative;
  display: flex;
  align-items: center;
  z-index: 10;
}

.colorful-scale__line {
  width: 5px;
  height: 38px;
  margin-right: 8px;
}

.colorful-scale__wrapper svg {
  font-size: 1.25rem;
}

.colorful-scale__icon {
  position: relative;
}

.green svg {
  color: var(--color-green);
}
.orange svg {
  color: var(--color-orange);
}
.yellow svg {
  color: var(--color-yellow);
}
.red svg {
  color: var(--color-red);
}

.green .colorful-scale__line {
  background: var(--color-green);
}
.yellow .colorful-scale__line {
  background: var(--color-yellow);
}
.orange .colorful-scale__line {
  background: var(--color-orange);
}
.red .colorful-scale__line {
  background: var(--color-red);
}

.colorful-scale__text {
  text-transform: none;
  margin-left: 10px;
  opacity: 0;
  animation: fadeIn 0.5s ease-in-out 0.2s forwards;
}

.colorful-scale__text--green {
  color: var(--color-green);
}

.colorful-scale__text--orange {
  color: var(--color-orange);
}

.colorful-scale__text--red {
  color: var(--color-red);
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}
</style>
