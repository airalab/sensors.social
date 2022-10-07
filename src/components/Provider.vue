<template>
  <fragment>
    <input
      type="date"
      v-model="start"
      :max="maxDate"
      :disabled="current == 'ipfs'"
    />
    <div class="sensors-switcher">
      <div class="sensors-switcher">
        <input
          type="checkbox"
          id="realtime"
          v-model="isIpfs"
          :checked="current == 'ipfs'"
        />
        <label for="realtime"></label>
        <span class="sensors-switcher-text">{{ $t("provider.realtime") }}</span>
      </div>
    </div>
  </fragment>
</template>

<script>
import moment from "moment";

export default {
  props: ["current", "canHistory"],
  data() {
    return {
      isIpfs: this.current === "ipfs",
      isConnectionRemote: null,
      start: moment().format("YYYY-MM-DD"),
      maxDate: moment().format("YYYY-MM-DD"),
    };
  },
  computed: {
    startTimestamp: function () {
      return Number(
        moment(this.start + " 00:00:00", "YYYY-MM-DD HH:mm:ss").format("X")
      );
    },
    endTimestamp: function () {
      return Number(
        moment(this.start + " 23:59:59", "YYYY-MM-DD HH:mm:ss").format("X")
      );
    },
  },
  created() {
    if (this.current == "remote") {
      setInterval(() => {
        if (this.$provider) {
          this.isConnectionRemote = this.$provider.connection;
        }
      }, 1000);
    }
  },
  watch: {
    canHistory: {
      handler(newValue) {
        if (newValue) {
          this.getHistory();
        }
      },
      immediate: true,
    },
    start() {
      this.getHistory();
    },
    isIpfs(newValue) {
      if (newValue) {
        this.set("ipfs");
      } else {
        this.set("remote");
      }
    },
  },
  methods: {
    set(type) {
      setTimeout(() => {
        this.$router
          .push({
            name: "main",
            params: {
              provider: type,
              type: this.$route.params.type,
              zoom: this.$route.params.zoom,
              lat: this.$route.params.lat,
              lng: this.$route.params.lng,
              sensor: this.$route.params.sensor,
            },
          })
          .catch(() => {});
        window.location.reload(false);
      }, 500);
    },

    getHistory() {
      if (this.isIpfs) {
        return;
      }
      this.$emit("history", {
        start: this.startTimestamp,
        end: this.endTimestamp,
      });
    },
  },
};
</script>
