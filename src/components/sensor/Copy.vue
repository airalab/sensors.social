<template>
  <a
    class="nowrap"
    v-clipboard:copy="msg"
    v-clipboard:success="success"
    :title="title"
  >
    <slot /> <font-awesome-icon icon="fa-solid fa-copy" />
  </a>
</template>

<script>
export default {
  props: ["msg", "title"],
  methods: {
    success() {
      // this.$notify({
      //   group: "alert",
      //   position: "top left",
      //   title: "Сlipboard",
      //   text: "Address copied",
      // });
    },
  },
};
</script>

<style scoped>
.copy {
  cursor: copy;
}
</style>
