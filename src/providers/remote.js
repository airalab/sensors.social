import axios from "axios";
import io from "socket.io-client";
import config from "../config";

const axiosConfig = {
  baseURL: `${config.REMOTE_PROVIDER}api/sensor`,
};

export const api = axios.create(axiosConfig);

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

  async status() {
    try {
      const result = await axios.get(
        `${config.REMOTE_PROVIDER}api/sensor/cities`
      );
      if (result.status === 200) {
        return true;
      }
    } catch (error) {
      console.log(error.message);
    }
    return false;
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

  setStartDate(start) {
    this.start = start;
  }

  setEndDate(end) {
    this.end = end;
  }

  lastValuesForPeriod(start, end) {
    return api
      .get(`/last/${start}/${end}`)
      .then((result) => {
        return result.data.result;
      })
      .catch(() => {
        return {};
      });
  }

  maxValuesForPeriod(start, end, type) {
    return api
      .get(`/max/${start}/${end}/${type}`)
      .then((result) => {
        return result.data.result;
      })
      .catch(() => {
        return {};
      });
  }

  messagesForPeriod(start, end) {
    return api
      .get(`/messages/${start}/${end}`)
      .then((result) => {
        return result.data.result;
      })
      .catch(() => {
        return {};
      });
  }

  getHistoryBySensor(sensor) {
    return api
      .get(`/${sensor}`)
      .then((result) => {
        return result.data.result;
      })
      .catch(() => {
        return [];
      });
  }

  getHistoryPeriodBySensor(sensor, start, end) {
    return api
      .get(`/${sensor}/${start}/${end}`)
      .then((result) => {
        return result.data.result;
      })
      .catch(() => {
        return [];
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
