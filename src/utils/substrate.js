import { ApiPromise, WsProvider } from "@polkadot/api";

export default {
  config: null,
  api: null,
  provider: null,
  isReady: false,
  createProvider(endpoint) {
    this.provider = new WsProvider(endpoint);
  },
  async createApi(types) {
    this.api = await ApiPromise.create({
      provider: this.provider,
      types: types,
    });
  },
  onReady(cb) {
    if (this.isReady) {
      cb();
    } else {
      setTimeout(() => {
        this.onReady(cb);
      }, 100);
    }
  },
  async init(config) {
    if (this.api) {
      return;
    }
    this.createProvider(config.endpoint);
    await this.createApi(config.types);
    this.isReady = true;
  },
};
