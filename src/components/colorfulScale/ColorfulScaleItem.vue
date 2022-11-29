<template>
  <div class="colorful-scale__wrapper" :class="color.color">
    <div class="colorful-scale__line"></div>
    <div class="colorful-scale__icon">
      <font-awesome-icon :icon="'fa-solid ' + color.icon" />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    color: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style scoped>
.colorful-scale__wrapper {
  display: flex;
  align-items: center;
}

.colorful-scale__line {
  width: 5px;
  height: 38px;
  margin-right: 8px;
}

.colorful-scale__wrapper svg {
  font-size: 1.25rem;
  border: 3px solid #fff;
  border-radius: 100%;
}

.colorful-scale__icon {
  position: relative;
}

.colorful-scale__icon::after {
  content: "";
  position: absolute;
  top: -1px;
  left: -1px;
  width: 28px;
  height: 28px;
  background-color: #fff;
  border-radius: 100%;
  z-index: -1;
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
</style>
