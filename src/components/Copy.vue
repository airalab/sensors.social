<template>
  <a
    class="nowrap"
    v-clipboard:copy="msg"
    v-clipboard:success="success"
    :title="title"
  >
    <slot /> <i class="fa-solid fa-copy"></i>
  </a>
</template>

<script>
export default {
  props: ["msg", "title"],
  methods: {
    success() {
      this.$notify({
        group: "alert",
        position: "top left",
        title: "Сlipboard",
        text: "Address copied",
      });
    },
  },
};
</script>

<style scoped>
.copy {
  cursor: copy;
}
</style>
