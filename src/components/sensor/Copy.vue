<template>
  <a
    class="nowrap copy"
    v-clipboard:copy="msg"
    v-clipboard:success="success"
    :title="title"
  >
    <slot />
    <font-awesome-icon
      v-if="!successCopy"
      @click="showSuccessesCopy"
      icon="fa-solid fa-copy"
    />
    <font-awesome-icon v-if="successCopy" icon="fa-solid fa-check" />
  </a>
</template>

<script>
export default {
  props: ["msg", "title", "notify"],
  data() {
    return {
      successCopy: false,
    };
  },
  methods: {
    success() {
      this.$notify({
        position: "top right",
        text: this.notify,
      });
    },
    showSuccessesCopy() {
      this.successCopy = true;
      setTimeout(() => {
        this.successCopy = false;
      }, 2000);
    },
  },
};
</script>

<style scoped>
.copy {
  cursor: pointer;
}

.fa-copy,
.fa-check {
  margin-left: calc(var(--gap) * 0.5);
  color: var(--color-blue);
}
</style>
