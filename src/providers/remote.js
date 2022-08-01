import axios from "axios";
import io from "socket.io-client";

class Provider {
  constructor(url) {
    this.isReady = false;
    this.url = url.replace(/\/$/, "");
    this.connection = false;
    this.start = null;
    this.end = null;
    this.socket = io(url);
    this.socket.on("connect_error", (e) => {
      console.log("connect error", e);
      this.connection = false;
    });
    this.socket.on("error", function (error) {
      console.warn(error);
    });
    this.init().then(() => {
      this.isReady = true;
    });
  }

  init() {
    return new Promise((resolve) => {
      this.socket.on("connect", () => {
        this.connection = true;
        resolve();
      });
    });
  }

  ready() {
    return new Promise((resolve) => {
      const t = setInterval(() => {
        if (this.isReady) {
          resolve();
          clearInterval(t);
        }
      }, 100);
    });
  }

  canExport() {
    return true;
  }

  exportUrl(start, end) {
    return `${this.url}/api/sensor/csv/${start}/${end}`;
  }

  getSensors() {
    return axios
      .get(`${this.url}/api/sensor/all`)
      .then((result) => {
        return result.data.result;
      })
      .catch(() => {
        return [];
      });
  }

  setStartDate(start) {
    this.start = start;
  }

  setEndDate(end) {
    this.end = end;
  }

  lastValuesForPeriod(start, end) {
    return axios
      .get(`${this.url}/api/sensor/last/${start}/${end}`)
      .then((result) => {
        return result.data.result;
      })
      .catch(() => {
        return {};
      });
  }

  messagesForPeriod(start, end) {
    return axios
      .get(`${this.url}/api/sensor/messages/${start}/${end}`)
      .then((result) => {
        return result.data.result;
      })
      .catch(() => {
        return {};
      });
  }

  getHistoryByDate(start, end, sensor_ids = "") {
    sensor_ids = sensor_ids
      .trim()
      .split(",")
      .filter((item) => {
        return item;
      });
    return axios
      .get(`${this.url}/api/sensor/history/${start}/${end}`)
      .then((result) => {
        if (sensor_ids.length === 0) {
          return result.data.result;
        }
        const list = {};
        for (const sensor_id of sensor_ids) {
          list[sensor_id.trim()] = result.data.result[sensor_id.trim()];
        }
        return list;
      })
      .catch(() => {
        return [];
      });
  }

  getHistoryPeriodBySensor(sensor, start, end) {
    return axios
      .get(`${this.url}/api/sensor/${sensor}/${start}/${end}`)
      .then((result) => {
        return result.data.result;
      })
      .catch(() => {
        return [];
      });
  }

  getHistoryBySensor(sensor) {
    return axios
      .get(`${this.url}/api/sensor/${sensor}`)
      .then((result) => {
        return result.data.result;
      })
      .catch(() => {
        return [];
      });
  }

  getCountTxBySender(sender) {
    return axios
      .get(`${this.url}/api/sensor/count/${sender}`)
      .then((result) => {
        return result.data.result;
      })
      .catch(() => {
        return 0;
      });
  }

  getCountTxAll() {
    return axios
      .get(`${this.url}/api/sensor/count`)
      .then((result) => {
        return result.data.result;
      })
      .catch(() => {
        return 0;
      });
  }

  watch(cb) {
    if (cb) {
      this.socket.on("update", (result) => {
        cb(result);
      });
    }
  }
}

export default Provider;
