<template>
  <div class="panel">
    <button @click="set('ipfs')" :class="{active:current=='ipfs'}" :disabled="current=='ipfs'">Real-time</button>
    <button @click="set('chain')" :class="{active:current=='chain'}" disabled>History</button>
  </div>
</template>

<script>
export default {
  props: ["current"],
  methods: {
    set(type) {
      this.$router.push({
        name: "main",
        params: {
          provider: type,
          type: this.$route.params.type,
          zoom: this.$route.params.zoom,
          lat: this.$route.params.lat,
          lng: this.$route.params.lng
        }
      });
      window.location.reload(false);
    }
  }
};
</script>

<style scoped>
.panel {
  overflow: hidden;
  position: absolute;
  bottom: 0;
  left: 193px;
  z-index: 10000000;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border: 5px solid #e0e0e0;
}
button {
  padding: 11px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  background-color: #fff;
  border: 1px solid #a2a2a2;
  border-radius: 2px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
}
button.active {
  background-color: #eee;
  color: black;
  cursor: pointer;
}
button:hover {
  background-color: #eee;
}
button:not(:first-child) {
  margin-left: -2px;
}
button:disabled {
  cursor: not-allowed;
}
</style>
