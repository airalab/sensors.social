<template>
  <div class="measures">
    <div
      class="sensors-select sensors-select-border"
      :class="{ tmp: current === 'temperature' }"
    >
      <select v-model="type">
        <option
          v-for="(measurement, k) in measurements"
          :key="k"
          :value="measurement[0]"
        >
          {{ measurement[1] }}
        </option>
      </select>
      <font-awesome-icon icon="fa-solid fa-sort" />
    </div>
  </div>
</template>

<script>
import measurements from "../../measurements";

export default {
  props: ["current"],
  data() {
    return {
      type: this.current,
      measurements: Object.entries(measurements)
        .map((item) => {
          return item[1].colors ? [item[0], item[1].label] : null;
        })
        .filter((item) => item),
    };
  },
  computed: {
    unit() {
      return measurements[this.current].unit;
    },
  },
  watch: {
    type: async function () {
      await this.$router.push({
        name: "main",
        params: {
          provider: this.$route.params.provider || "realtime",
          type: this.type,
          zoom: this.$route.params.zoom,
          lat: this.$route.params.lat,
          lng: this.$route.params.lng,
          sensor: this.$route.params.sensor,
        },
      });
      this.$router.go(0);
    },
  },
};
</script>

<style scoped>
.measures {
  position: relative;
  display: inline-flex;
  width: max-content;
  align-items: center;
  margin-right: 20px;
  z-index: 10;
}

.measures .sensors-select {
  padding-left: 25px;
  background-image: url("data:image/svg+xml,%3Csvg width='17' height='19' viewBox='0 0 17 19' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M16.6092 15.0738L12.1429 7.9748V2.375C12.8145 2.375 13.3571 1.84434 13.3571 1.1875C13.3571 0.530664 12.8145 0 12.1429 0H4.85714C4.18549 0 3.64286 0.530664 3.64286 1.1875C3.64286 1.84434 4.18549 2.375 4.85714 2.375V7.9748L0.390848 15.0738C0.136607 15.482 0 15.9496 0 16.4246C0 17.8459 1.18013 19 2.63348 19H14.3665C15.8199 19 17 17.8459 17 16.4246C17 15.9459 16.8634 15.4783 16.6092 15.0738ZM5.25558 11.875L7.10737 8.93594C7.225 8.74668 7.28571 8.53145 7.28571 8.3125V2.375H9.71429V8.3125C9.71429 8.53516 9.775 8.75039 9.89263 8.93594L11.7444 11.875H5.25558Z' fill='black'/%3E%3C/svg%3E%0A");
  background-position: 5px;
  background-size: 17px 19px;
  background-repeat: no-repeat;
}

.measures .sensors-select.tmp {
  background-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M13 2C13.1978 2 13.3911 2.05865 13.5556 2.16853C13.72 2.27841 13.8482 2.43459 13.9239 2.61732C13.9996 2.80004 14.0194 3.00111 13.9808 3.19509C13.9422 3.38907 13.847 3.56726 13.7071 3.70711C13.5673 3.84696 13.3891 3.9422 13.1951 3.98079C13.0011 4.01937 12.8 3.99957 12.6173 3.92388C12.4346 3.84819 12.2784 3.72002 12.1685 3.55557C12.0586 3.39112 12 3.19778 12 3C12 2.73478 12.1054 2.48043 12.2929 2.29289C12.4804 2.10536 12.7348 2 13 2ZM13 6C13.5933 6 14.1734 5.82405 14.6667 5.49441C15.1601 5.16477 15.5446 4.69623 15.7716 4.14805C15.9987 3.59987 16.0581 2.99667 15.9424 2.41473C15.8266 1.83279 15.5409 1.29824 15.1213 0.878681C14.7018 0.459123 14.1672 0.173401 13.5853 0.0576455C13.0033 -0.0581102 12.4001 0.00129986 11.8519 0.228363C11.3038 0.455426 10.8352 0.839943 10.5056 1.33329C10.1759 1.82664 10 2.40666 10 3C10 3.79565 10.3161 4.55871 10.8787 5.12132C11.4413 5.68393 12.2044 6 13 6ZM3 3.5C3 3.10218 3.15804 2.72065 3.43934 2.43934C3.72064 2.15804 4.10218 2 4.5 2C4.89782 2 5.27936 2.15804 5.56066 2.43934C5.84196 2.72065 6 3.10218 6 3.5V8.64C5.99946 9.13494 6.16891 9.61505 6.48 10C6.81434 10.4288 6.9972 10.9563 7 11.5C7 12.163 6.73661 12.7989 6.26777 13.2678C5.79893 13.7366 5.16304 14 4.5 14C3.83696 14 3.20107 13.7366 2.73223 13.2678C2.26339 12.7989 2 12.163 2 11.5C2.0028 10.9563 2.18566 10.4288 2.52 10C2.83109 9.61505 3.00054 9.13494 3 8.64V3.5ZM4.5 1.35012e-06C3.57174 1.35012e-06 2.6815 0.36875 2.02513 1.02513C1.36875 1.6815 1 2.57174 1 3.5V8.66C0.991059 8.69368 0.973876 8.72461 0.95 8.75C0.334838 9.5347 0.000365806 10.5029 0 11.5C0 12.6935 0.474106 13.8381 1.31802 14.682C2.16193 15.5259 3.30653 16 4.5 16C5.69347 16 6.83807 15.5259 7.68198 14.682C8.52589 13.8381 9 12.6935 9 11.5C9.00249 10.5041 8.67158 9.53601 8.06 8.75C8.03249 8.72575 8.0118 8.69473 8 8.66V3.5C8 2.57174 7.63125 1.6815 6.97487 1.02513C6.3185 0.36875 5.42826 1.35012e-06 4.5 1.35012e-06ZM4.5 13C4.89782 13 5.27936 12.842 5.56066 12.5607C5.84196 12.2794 6 11.8978 6 11.5C5.99831 11.1895 5.90156 10.887 5.72278 10.6331C5.544 10.3792 5.29177 10.1862 5 10.08V3.5C5 3.36739 4.94732 3.24022 4.85355 3.14645C4.75979 3.05268 4.63261 3 4.5 3C4.36739 3 4.24021 3.05268 4.14645 3.14645C4.05268 3.24022 4 3.36739 4 3.5V10.08C3.70823 10.1862 3.456 10.3792 3.27722 10.6331C3.09844 10.887 3.00169 11.1895 3 11.5C3 11.8978 3.15804 12.2794 3.43934 12.5607C3.72064 12.842 4.10218 13 4.5 13Z' fill='black'/%3E%3C/svg%3E%0A");
  background-position: 8px;
}

.measures .sensors-select select {
  border: transparent;
}

@media screen and (max-width: 390px) {
  .measures .sensors-select select {
    font-size: 12px;
  }
}
</style>
