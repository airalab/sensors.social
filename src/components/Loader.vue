<template>
  <div class="loader">Waiting for the first data...</div>
</template>

<style scoped>
.loader {
  overflow: hidden;
  position: absolute;
  top: 29px;
  left: 0;
  right: 0;
  z-index: 10000000;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border: 5px solid #e0e0e0;
  width: 200px;
  margin: 0 auto;
  font-weight: bold;
}
</style>
