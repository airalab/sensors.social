import { agents } from "@config";
import converter from "../measurements";
import { createNode } from "../utils/libp2p";
import {
  decryptMeasurementBag,
  isEncryptedSensorValue,
  isSealedSensorValue,
} from "../utils/sensorValueCrypto";
import { normalizeMeasurementBag } from "../utils/pressureMmHg";
import {
  decodeSignedEnvelopeBatchToPoints,
  decodeSignedEnvelopeToPoint,
  decryptProtoPrivate,
} from "../utils/proto/decodeEnvelope";
import { useAccounts, accountHasOwnerSecret } from "@/composables/useAccounts";
import { sensorIdAliases } from "@/utils/sensorId";

const topic = "airalab.lighthouse.5.robonomics.eth";
const protoTopics = ["sensors.social/v1/staging", "sensors.social/v1"];

function isProtoTopic(msgTopic) {
  const t = String(msgTopic || "");
  return protoTopics.some((topicName) => t === topicName || t.endsWith(`/${topicName}`));
}

function findOwnerAccount(sensorId, owner) {
  const { accounts } = useAccounts();
  const sid = String(sensorId || "").trim();
  const ownerAddr = owner ? String(owner).trim() : "";
  const acc = accounts.value.find((a) => {
    if (!accountHasOwnerSecret(a)) return false;
    const addr = String(a?.address || "").trim();
    if (sid && addr === sid) return true;
    if (ownerAddr && addr === ownerAddr) return true;
    if (
      sid &&
      Array.isArray(a.devices) &&
      a.devices.some((deviceId) => String(deviceId).trim() === sid)
    ) {
      return true;
    }
    return false;
  });
  return acc || (owner ? { address: owner } : null);
}

function applyConverter(measurement) {
  const bag = normalizeMeasurementBag(measurement || {});
  const out = {};
  for (const key in bag) {
    const name = String(key).toLowerCase();
    const raw = bag[key];
    if (isSealedSensorValue(raw) || isEncryptedSensorValue(raw)) {
      out[name] = raw;
      continue;
    }
    out[name] = converter[name]?.calculate ? converter[name].calculate(raw) : raw;
  }
  if (out.noisemax == null && out.noise != null && !isSealedSensorValue(out.noise)) {
    out.noisemax = out.noise;
  }
  return out;
}

class Provider {
  constructor(config) {
    this.node = null;
    this.isReady = false;
    this.whiteListAccounts = [];
    this.history = {};
    this.lastGeoBySensor = new Map();
    this.init(config).then(() => {
      this.isReady = true;
      window.pubsubPeers = () => {
        console.log(
          "peers",
          this.node.services.pubsub.getPeers().map((peer) => peer.toString())
        );
        console.log(
          "pubsub",
          this.node.services.pubsub.getSubscribers(topic).map((peer) => peer.toString())
        );
      };
    });
  }

  async init(config) {
    this.node = await createNode(config);
    this.whiteListAccounts = agents;
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

  getHistoryBySensor(sensor) {
    for (const key of sensorIdAliases(sensor)) {
      if (Array.isArray(this.history[key]) && this.history[key].length > 0) {
        return Promise.resolve(this.history[key]);
      }
    }
    const direct = this.history[String(sensor || "")];
    return Promise.resolve(Array.isArray(direct) ? direct : []);
  }

  getHistoryPeriod(start, end) {
    const result = {};
    Object.keys(this.history).forEach((sensorId) => {
      if (this.history[sensorId]) {
        result[sensorId] = this.history[sensorId];
      }
    });
    return Promise.resolve(result);
  }

  upsertHistoryPoint(sensorId, point) {
    const keys = sensorIdAliases(sensorId);
    const sid = keys[0] || String(sensorId || "");
    if (!sid || !point) return;
    let bucket = null;
    for (const key of keys) {
      if (Array.isArray(this.history[key])) {
        bucket = this.history[key];
        break;
      }
    }
    if (!bucket) bucket = [];
    const ts = Number(point.timestamp);
    if (bucket.some((item) => Number(item?.timestamp) === ts)) return;
    bucket.push(point);
    for (const key of keys) this.history[key] = bucket;
  }

  async finalizePoint(point) {
    if (!point?.sensor_id) return null;
    const sid = String(point.sensor_id);
    let next = { ...point };
    if (!next.geo) {
      for (const key of sensorIdAliases(sid)) {
        if (this.lastGeoBySensor.has(key)) {
          next.geo = this.lastGeoBySensor.get(key);
          break;
        }
      }
    }
    if (next.geo) {
      for (const key of sensorIdAliases(sid)) this.lastGeoBySensor.set(key, next.geo);
    }

    const ownerAccount = findOwnerAccount(sid, next.owner);
    if (ownerAccount && Array.isArray(next.protoPrivate) && next.protoPrivate.length > 0) {
      next = await decryptProtoPrivate(next, ownerAccount);
    }
    if (ownerAccount && next.data) {
      try {
        next = {
          ...next,
          data: await decryptMeasurementBag(sid, next.data, ownerAccount),
        };
      } catch (error) {
        console.warn("Failed to decrypt pubsub measurement:", sid, error);
      }
    }
    next.data = applyConverter(next.data);
    return next;
  }

  async redecryptHistoryForSensor(sensorId, ownerAccount) {
    const keys = sensorIdAliases(sensorId);
    const sid = keys.find((key) => Array.isArray(this.history[key])) || String(sensorId || "");
    if (!sid || !Array.isArray(this.history[sid]) || !ownerAccount) return false;

    let changed = false;
    const next = [];
    for (const item of this.history[sid]) {
      let point = item;
      try {
        if (Array.isArray(point.protoPrivate) && point.protoPrivate.length > 0) {
          point = await decryptProtoPrivate(point, ownerAccount);
        }
      } catch (error) {
        console.warn("Failed to decrypt proto private:", sid, error);
      }
      if (!point?.data || typeof point.data !== "object") {
        next.push(point);
        continue;
      }
      let decryptedMeasurement = point.data;
      try {
        decryptedMeasurement = await decryptMeasurementBag(sid, point.data, ownerAccount);
      } catch (error) {
        console.warn("Failed to decrypt history measurement:", sid, error);
      }
      const measurementLowerCase = applyConverter(decryptedMeasurement);
      const protoChanged =
        point.protoPrivate !== item.protoPrivate || point.data !== item.data;
      if (
        protoChanged ||
        JSON.stringify(measurementLowerCase) !== JSON.stringify(item.data)
      ) {
        changed = true;
        next.push({ ...point, data: measurementLowerCase });
      } else {
        next.push(item);
      }
    }
    if (changed) this.history[sid] = next;
    return changed;
  }

  watch(cb) {
    this.node.services.pubsub.subscribe(topic);
    for (const protoTopic of protoTopics) {
      this.node.services.pubsub.subscribe(protoTopic);
    }

    const emitPoint = async (point) => {
      const ready = await this.finalizePoint(point);
      if (!ready) return;
      this.upsertHistoryPoint(ready.sensor_id, ready);
      cb(ready);
    };

    const handleProto = async (raw, sender = "proto") => {
      const opts = { sender, verbose: false, requireGeo: false };
      const single = decodeSignedEnvelopeToPoint(raw, opts);
      const points = single ? [single] : decodeSignedEnvelopeBatchToPoints(raw, opts);
      if (points.length === 0) return false;
      for (const point of points) {
        await emitPoint(point);
      }
      return true;
    };

    const onMessage = async (evt) => {
      const sender = evt.detail.from.toString();
      const msgTopic = String(evt.detail.topic || evt.detail.data?.topic || "");
      const raw = evt.detail.data instanceof Uint8Array
        ? evt.detail.data
        : new Uint8Array(evt.detail.data || []);

      if (isProtoTopic(msgTopic)) {
        await handleProto(raw, sender);
        return;
      }

      if (!this.whiteListAccounts.includes(sender)) {
        return;
      }

      let json;
      try {
        json = JSON.parse(Buffer.from(raw).toString("utf8"));
      } catch (e) {
        if (await handleProto(raw, sender)) return;
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
          const owner = data.owner || undefined;
          const [lat, lng] = String(data.geo || "").split(",");
          const point = {
            sensor_id,
            sender,
            model: data.model,
            geo: { lat, lng },
            data: measurement,
            owner,
            donated_by: data.donated_by || undefined,
            device_model: data.device_model || undefined,
            timestamp,
          };
          await emitPoint(point);
        }
      }
    };
    this.node.services.pubsub.addEventListener("message", onMessage);
    return () => {
      this.node.services.pubsub.removeEventListener("message", onMessage);
    };
  }
}

export default Provider;
