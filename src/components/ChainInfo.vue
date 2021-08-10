<template>
  <div class="panel">
    <h4>Chain Info</h4>
    <div v-if="status === null" class="red">
      No connection
    </div>
    <template v-else>
      <div :class="[status ? 'green' : 'red']">
        Block: <b>{{ block }}</b>
      </div>
      <div :class="[status ? 'green' : 'red']">
        Date: <b>{{ time }}</b>
      </div>
    </template>
  </div>
</template>

<script>
import substrate from "../utils/substrate";

export default {
  data() {
    return {
      status: null,
      block: null,
      time: null,
    };
  },
  async mounted() {
    await substrate.init({
      endpoint: "wss://ipci.rpc.robonomics.network",
      types: {
        EverUSDBalance: "u64",
        BondPeriod: "u64",
      },
    });

    await substrate.api.rpc.chain.subscribeNewHeads(async (header) => {
      const time = (await substrate.api.query.timestamp.now()).toNumber();
      const currentTime = Date.now();
      if (time + 15000 < currentTime) {
        this.status = false;
      } else {
        this.status = true;
      }
      this.block = header.number;
      this.time = new Date(time).toLocaleString();
    });
  },
};
</script>

<style scoped>
.panel {
  /* overflow: hidden; */
  width: 230px;
  position: absolute;
  top: 29px;
  left: 0;
  z-index: 10000000;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border: 5px solid #e0e0e0;
  font-size: 12px;
  height: 55px;
}
h4 {
  margin: 5px;
  font-size: 14px;
}
.green {
  color: #3e8228;
}
.red {
  color: #a72929;
}
</style>
