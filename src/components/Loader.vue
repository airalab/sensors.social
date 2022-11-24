<template>
  <div class="sensors-screen loading">
    <div class="loader">
      <img src="../assets/images/loader.png" alt="loader" />
    </div>
  </div>
</template>

<style>
.loader {
  animation: rotateLoader 3s linear infinite;
}

body:not(.dark) .loader {
  filter: invert(100%);
}

@keyframes rotateLoader {
  100% {
    transform: rotate(360deg);
    -webkit-transform: rotate(360deg);
  }
}
</style>
