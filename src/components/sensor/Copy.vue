<template>
  <a
    class="nowrap copy"
    v-clipboard:copy="msg"
    v-clipboard:success="success"
    :title="title"
  >
    <slot /> <font-awesome-icon icon="fa-solid fa-copy" />
  </a>
</template>

<script>
export default {
  props: ["msg", "title", "notify"],
  methods: {
    success() {
      this.$notify({
        position: "top right",
        text: this.notify,
      });
    },
  },
};
</script>

<style scoped>
.copy {
  cursor: pointer;
}
</style>
