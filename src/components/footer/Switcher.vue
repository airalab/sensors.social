<template>
  <div class="sensors-switcher" :data-title="helper ? helper : null">
    <div class="sensors-switchers">
      <input
        :id="id"
        v-model="computedValue"
        :checked="checked"
        type="checkbox"
      />
      <label :for="id"></label>
      <span>{{ title }}</span>
    </div>
    <div v-if="helper" class="switcher-helper">
      {{ helper }}
    </div>
  </div>
</template>

<script>
import { ref, watchEffect } from "vue";

export default {
  props: {
    title: { type: String },
    modelValue: [Boolean],
    checked: Boolean,
    id: String,
    helper: String,
  },
  emits: ["update:modelValue"],
  setup: (props, { emit }) => {
    const computedValue = ref(props.modelValue);
    watchEffect(() => {
      emit("update:modelValue", computedValue);
    });
    return { computedValue };
  },
};
</script>

<style>
/* SWITCHER */
.sensors-switcher {
  display: inline-block;
  white-space: nowrap;
  text-transform: none;
}

.sensors-switcher:not(:last-child) {
  margin-right: calc(var(--gap) * 2);
}

.sensors-switcher input[type="checkbox"] {
  height: 0;
  width: 0;
  visibility: hidden;
  display: block;
}

.sensors-switcher label {
  cursor: pointer;
  text-indent: -9999px;
  width: 2.5rem;
  height: 1.5rem;
  background: #000;
  display: block;
  border-radius: 2rem;
  position: relative;
  display: inline-block;
  vertical-align: middle;
  user-select: none;
}

.dark .sensors-switcher label {
  background: var(--color-middle-gray);
}

.sensors-switcher label:after {
  content: "";
  position: absolute;
  top: 0.2rem;
  left: 0.2rem;
  width: 1.1rem;
  height: 1.1rem;
  background: #fff;
  border-radius: 1.1rem;
  transition: 0.3s;
}

.sensors-switcher input:checked + label {
  background: var(--color-green);
}

.sensors-switcher input:checked + label:after {
  left: calc(100% - 0.2rem);
  transform: translateX(-100%);
}

label:active:after {
  width: 1rem;
}

.sensors-switcher input:checked ~ span {
  color: var(--color-green);
}

.sensors-switcher.disabled label,
.sensors-switcher.disabled span {
  filter: grayscale(1);
  opacity: 0.5;
  pointer-events: none;
}
/* end of SWITCHER */

[data-title] {
  cursor: help;
  position: relative;
  z-index: 12;
}

div[data-title]::after {
  background-color: var(--color-dark);
  border-radius: 4px;
  color: var(--color-light);
  content: attr(data-title);
  max-height: 300px;
  opacity: 0;
  overflow-y: auto;
  padding: var(--gap);
  position: absolute;
  white-space: break-spaces;
  width: 250px;
  visibility: hidden;
  z-index: 9999;
}

div[data-title]:hover::after {
  animation: fadeIn 0.2s ease-in-out 0.2s forwards;
}

.title__top:after {
  bottom: calc(var(--gap) * 1.8);
  left: 0;
}

.switcher-helper {
  display: none;
}

@media screen and (max-width: 1060px) {
  .sensors-dateselect .sensors-switcher label {
    margin-right: 1rem !important;
  }
}

@media screen and (max-width: 940px) {
  .sensors-switcher:not(last-child) {
    margin-bottom: var(--gap);
  }

  .switcher-helper {
    display: block;
    font-family: var(--font-family--normal);
    font-style: italic;
    font-weight: 400;
    line-height: 1.5;
    font-size: 0.7rem;
    color: #a3a3a3;
    text-transform: none;
  }
}
</style>
