class Emulator {
  constructor(provider) {
    this.provider = provider;
    this.history = {};
    this.status = 0;
    this.time = 0;
  }

  canExport() {
    return false;
  }

  getSensors() {
    return Promise.resolve([]);
  }

  getHistoryBySensor(sensor) {
    return Promise.resolve(this.history[sensor]);
  }

  getCountTxBySender() {
    return false;
  }

  stop() {
    this.status = 0;
  }

  play() {
    this.status = 1;
  }

  pause() {
    this.status = 2;
  }

  load() {
    this.status = 3;
  }

  async emulate(
    start,
    end,
    speed,
    stepInterval = 1000,
    sensor_ids = "",
    cb,
    cbEnd
  ) {
    this.time = 0;
    this.load();
    this.history = {};
    let history = {
      ...(await this.provider.getHistoryByDate(start, end, sensor_ids)),
    };
    this.play();

    let isWork = false;

    const sensors = Object.keys(history);
    const filter = (sensors, time) => {
      if (!isWork) {
        isWork = true;
        for (const sensor of sensors) {
          if (!history[sensor]) {
            isWork = false;
            return;
          }
          const points = history[sensor].filter((point) => {
            return point.timestamp <= time;
          });
          if (points.length > 0) {
            history[sensor] = history[sensor].slice(points.length);
            for (const point of points) {
              if (!Object.prototype.hasOwnProperty.call(this.history, sensor)) {
                this.history[sensor] = [];
              }
              this.history[sensor].push(point);
              cb(point);
            }
          }
        }
        isWork = false;
      }
    };

    this.time = start;
    const inter = setInterval(() => {
      if (this.status === 0) {
        clearInterval(inter);
        cbEnd();
      } else if (this.status === 2) {
        return;
      }
      if (this.time >= end) {
        clearInterval(inter);
        filter(sensors, end);
        cbEnd();
        return;
      }
      filter(sensors, this.time);
      this.time = this.time + speed;
    }, stepInterval);
  }
}

export default Emulator;
