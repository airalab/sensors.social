<template>
  <div class="sensors-panel popup-js active">
    <slot />
    <a class="popup__close" href="" @click.stop.prevent="$emit('close')"
      ><i class="fa-solid fa-circle-xmark"></i
    ></a>
  </div>
</template>
