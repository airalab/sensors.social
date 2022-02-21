import { init as initIpfs } from "../utils/ipfs";
import { getAgents } from "../utils/utils";
import { measurements as converter } from "../utils/measurement";

class Provider {
  constructor(config) {
    this.ipfs = null;
    this.isReady = false;
    this.whiteListAccounts = [];
    this.history = {};
    this.init(config).then(() => {
      this.isReady = true;
      this.peers();
    });
  }

  async peers() {
    setTimeout(async () => {
      const peers = await this.ipfs.pubsub.peers(
        "airalab.lighthouse.5.robonomics.eth"
      );
      const robonomicsPeers = {
        // QmdfQmbmXt6sqjZyowxPUsmvBsgSGQjm4VXrV7WGy62dv8:
        //   "/dns4/1.pubsub.aira.life/tcp/443/wss/ipfs/QmdfQmbmXt6sqjZyowxPUsmvBsgSGQjm4VXrV7WGy62dv8",
        QmPTFt7GJ2MfDuVYwJJTULr6EnsQtGVp8ahYn9NSyoxmd9:
          "/dns4/2.pubsub.aira.life/tcp/443/wss/ipfs/QmPTFt7GJ2MfDuVYwJJTULr6EnsQtGVp8ahYn9NSyoxmd9",
        QmWZSKTEQQ985mnNzMqhGCrwQ1aTA6sxVsorsycQz9cQrw:
          "/dns4/3.pubsub.aira.life/tcp/443/wss/ipfs/QmWZSKTEQQ985mnNzMqhGCrwQ1aTA6sxVsorsycQz9cQrw",
      };
      for (const key in robonomicsPeers) {
        if (peers.length === 0 || !peers.includes(key)) {
          try {
            await this.ipfs.swarm.connect(robonomicsPeers[key]);
          } catch (error) {
            console.log(error);
          }
        }
      }
      this.peers();
    }, 3000);
  }

  async init(config) {
    this.ipfs = await initIpfs(config);
    this.whiteListAccounts = getAgents();
  }

  ready() {
    return new Promise((res) => {
      const t = setInterval(() => {
        if (this.isReady) {
          res();
          clearInterval(t);
        }
      }, 100);
    });
  }

  canExport() {
    return false;
  }

  getSensors() {
    return Promise.resolve([]);
  }

  getHistoryByDate(start, end) {
    const history = this.history;
    for (const sensor in history) {
      history[sensor] = history[sensor].filter((point) => {
        return point.timestamp >= start && point.timestamp <= end;
      });
    }
    return Promise.resolve(history);
  }

  getHistoryBySensor(sensor) {
    return Promise.resolve(this.history[sensor]);
  }

  getCountTxBySender() {
    return false;
  }

  watch(cb) {
    this.ipfs.pubsub.subscribe(
      "airalab.lighthouse.5.robonomics.eth",
      (r) => {
        const sender = r.from;
        if (!this.whiteListAccounts.includes(sender)) {
          // console.log(`skip from ${sender}`);
          return;
        }

        let json;
        try {
          json = JSON.parse(Buffer.from(r.data).toString("utf8"));
        } catch (e) {
          console.error(e.message);
          return;
        }

        for (const sensor_id in json) {
          const data = json[sensor_id];
          if (
            Object.prototype.hasOwnProperty.call(data, "model") &&
            (!Object.prototype.hasOwnProperty.call(this.history, sensor_id) ||
              this.history[sensor_id].find((item) => {
                return item.timestamp === data.measurement.timestamp;
              }) === undefined)
          ) {
            const { timestamp, ...measurement } = data.measurement;
            const measurementLowerCase = {};
            for (var key in measurement) {
              const name = key.toLowerCase();
              measurementLowerCase[name] = converter[name]?.calc
                ? converter[name].calc(measurement[key])
                : measurement[key];
            }
            const point = {
              sensor_id,
              sender,
              model: data.model,
              geo: data.geo,
              data: measurementLowerCase,
              timestamp,
            };

            if (
              !Object.prototype.hasOwnProperty.call(this.history, sensor_id)
            ) {
              this.history[sensor_id] = [];
            }
            this.history[sensor_id].push(point);

            cb(point);
          }
        }
      },
      { discover: true }
    );
  }
}

export default Provider;
