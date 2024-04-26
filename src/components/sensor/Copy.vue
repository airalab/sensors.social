<template>
  <a
    class="nowrap copy"
    v-clipboard:copy="msg"
    v-clipboard:success="success"
    :title="title"
  >
    <slot />
    <button
      class="copy-btn"
      v-if="!successCopy"
      @click="showSuccessesCopy"
    ></button>
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
  margin-left: calc(var(--gap) * 0.8);
  color: var(--color-blue);
}

.copy-btn {
  margin-left: calc(var(--gap) * 0.8);
  width: 14px;
  height: 16px;
  padding: calc(var(--gap) * 0.1);
  background-image: url("data:image/svg+xml,%0A%3Csvg width='14' height='17' viewBox='0 0 14 17' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4.3752 0H12.3964C13.1986 0 13.8549 0.656284 13.8549 1.45841V10.9381C13.8549 11.3391 13.5267 11.6673 13.1257 11.6673C12.7246 11.6673 12.3964 11.3391 12.3964 10.9381V2.18761C12.3964 1.78655 12.0683 1.45841 11.6672 1.45841H4.3752C3.97414 1.45841 3.646 1.13027 3.646 0.729204C3.646 0.328142 3.97414 0 4.3752 0ZM1.45839 2.91682H9.47963C10.2818 2.91682 10.938 3.5731 10.938 4.37523V14.5841C10.938 15.3862 10.2818 16.0425 9.47963 16.0425H1.45839C0.656261 16.0425 -2.19345e-05 15.3862 -2.19345e-05 14.5841V4.37523C-2.19345e-05 3.5731 0.656261 2.91682 1.45839 2.91682ZM2.18759 14.5841H8.75043C9.15149 14.5841 9.47963 14.2559 9.47963 13.8549V5.10443C9.47963 4.70337 9.15149 4.37523 8.75043 4.37523H2.18759C1.78653 4.37523 1.45839 4.70337 1.45839 5.10443V13.8549C1.45839 14.2559 1.78653 14.5841 2.18759 14.5841Z' fill='%2303A5ED'/%3E%3C/svg%3E%0A");
  background-size: 100%;
  background-position: center;
  background-repeat: no-repeat;
  border: none;
  cursor: pointer;
}

@media screen and (max-width: 680px) {
  .copy {
    font-size: calc(var(--font-size) * 0.8);
  }
}
</style>
