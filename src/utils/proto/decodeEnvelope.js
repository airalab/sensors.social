/**
 * connectivity-protocol v1-beta.2.
 * Sign: sensor_id || nonce || message. Timestamp and node_id live in Meta.
 * Public Urban/Insight always; private[] is decrypted with the owner seed
 * (CPS xchacha20 by default, aesgcm256 for firmware JSON).
 */

import { fromBinary } from "@bufbuild/protobuf";
import {
  SignedEnvelopeBatchSchema,
  SignedEnvelopeSchema,
} from "@buf/airalab_connectivity-protocol.bufbuild_es/crypto/v1/envelope_pb.js";
import { EncryptedSchema } from "@buf/airalab_connectivity-protocol.bufbuild_es/crypto/v1/encrypted_pb.js";
import { MessageSchema } from "@buf/airalab_connectivity-protocol.bufbuild_es/core/v1/message_pb.js";
import {
  EncryptedUrbanSchema,
  UrbanSchema,
  UrbanSensorSchema,
} from "@buf/airalab_connectivity-protocol.bufbuild_es/device/v1/urban_pb.js";
import {
  EncryptedInsightSchema,
  InsightSchema,
  InsightSensorSchema,
} from "@buf/airalab_connectivity-protocol.bufbuild_es/device/v1/insight_pb.js";
import { ed25519 } from "@noble/curves/ed25519";
import { encodeAddress } from "@polkadot/util-crypto";
import { pressureToMmHg } from "../pressureMmHg.js";
import { coerceBytes, decryptCpsBinary, isEncryptedSensorValue } from "../sensorValueCrypto.js";

function asU8(data) {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  return Uint8Array.from(data);
}

function concatBytes(parts) {
  const len = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function ss58(pubkey) {
  if (!pubkey || pubkey.length !== 32) return "";
  return encodeAddress(pubkey, 32);
}

function finite(n) {
  if (typeof n === "bigint") n = Number(n);
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

function scaled(n, div) {
  const v = finite(n);
  return v == null ? null : v / div;
}

function applyBme(measurement, data) {
  if (!measurement) return;
  if (measurement.case === "temperature") {
    const n = scaled(measurement.value?.centiCelsius, 100);
    if (n != null) data.temperature = n;
  } else if (measurement.case === "humidity") {
    const n = scaled(measurement.value?.centiPercent, 100);
    if (n != null) data.humidity = n;
  } else if (measurement.case === "pressure") {
    const n = scaled(measurement.value?.deciPascal, 10);
    if (n != null) data.pressure = pressureToMmHg(n);
  }
}

function applySds(measurement, data) {
  if (!measurement) return;
  if (measurement.case === "pm25") {
    const n = scaled(measurement.value?.deciUgM3, 10);
    if (n != null) data.pm25 = n;
  } else if (measurement.case === "pm10") {
    const n = scaled(measurement.value?.deciUgM3, 10);
    if (n != null) data.pm10 = n;
  }
}

function readNoiseDb(value) {
  if (value == null) return null;
  if (typeof value === "number" || typeof value === "bigint") return finite(value);
  return (
    finite(value.db) ??
    finite(value.dba) ??
    finite(value.dBA) ??
    finite(value.DBA)
  );
}

function applyMic(measurement, data) {
  if (!measurement) return;
  const kind = String(measurement.case || "");
  if (kind === "noiseMax" || kind === "noise_max") {
    const n = readNoiseDb(measurement.value);
    if (n != null) data.noisemax = n;
  } else if (kind === "noiseAvg" || kind === "noise_avg") {
    const n = readNoiseDb(measurement.value);
    if (n != null) data.noiseavg = n;
  }
}

function applyScd(measurement, data) {
  if (!measurement) return;
  if (measurement.case === "co2") {
    const n = finite(measurement.value?.ppm);
    if (n != null) data.co2 = n;
    return;
  }
  if (measurement.case === "temperature") {
    const n = scaled(measurement.value?.centiCelsius, 100);
    if (n != null) data.temperature = n;
    return;
  }
  if (measurement.case === "humidity") {
    const n = scaled(measurement.value?.centiPercent, 100);
    if (n != null) data.humidity = n;
    return;
  }
  const ppm = finite(measurement.ppm) ?? finite(measurement.co2?.ppm);
  if (ppm != null) data.co2 = ppm;
  const celsius = scaled(measurement.centiCelsius ?? measurement.temperature?.centiCelsius, 100);
  if (celsius != null) data.temperature = celsius;
  const percent = scaled(measurement.centiPercent ?? measurement.humidity?.centiPercent, 100);
  if (percent != null) data.humidity = percent;
}

function applyGps(gps, acc) {
  const lat = finite(gps?.lat);
  const lon = finite(gps?.lon);
  if (lat == null || lon == null) return;
  acc.geo = { lat, lng: lon };
}

const JSON_MEASUREMENT_KEYS = [
  "temperature",
  "humidity",
  "pressure",
  "pm25",
  "pm10",
  "noiseMax",
  "noise_max",
  "noiseAvg",
  "noise_avg",
  "co2",
];

function jsonMeasurementOneof(value) {
  if (!value || typeof value !== "object") return null;
  if (value.case) return value;
  for (const key of JSON_MEASUREMENT_KEYS) {
    if (value[key] != null) return { case: key, value: value[key] };
  }
  return null;
}

function measurementOf(sensorValue) {
  if (!sensorValue) return null;
  if (sensorValue.measurement?.case) return sensorValue.measurement;
  return jsonMeasurementOneof(sensorValue.measurement) || jsonMeasurementOneof(sensorValue);
}

function readSensorOneof(item) {
  const oneof = item?.sensor;
  if (oneof?.case) return { case: oneof.case, value: oneof.value };
  for (const key of ["gps", "bme680", "scd41", "bme280", "sds011", "ics43434"]) {
    if (item?.[key]) return { case: key, value: item[key] };
  }
  return null;
}

function foldSensors(items, kind) {
  const acc = { geo: null, measurement: {} };
  for (const item of items || []) {
    const sensor = readSensorOneof(item);
    if (!sensor?.case) continue;
    if (sensor.case === "gps") {
      applyGps(sensor.value, acc);
      continue;
    }
    const measurement = measurementOf(sensor.value);
    if (kind === "urban") {
      if (sensor.case === "bme280") applyBme(measurement, acc.measurement);
      if (sensor.case === "sds011") applySds(measurement, acc.measurement);
      if (sensor.case === "ics43434") applyMic(measurement, acc.measurement);
    } else {
      if (sensor.case === "bme680") applyBme(measurement, acc.measurement);
      if (sensor.case === "scd41") applyScd(measurement, acc.measurement);
    }
  }
  return acc;
}

function verifyEnvelope(env) {
  if (!env.sensorId || env.sensorId.length !== 32) return false;
  if (!env.signature || env.signature.length !== 64) return false;
  if (!env.nonce || env.nonce.length < 16 || env.nonce.length > 32) return false;
  if (!env.message || env.message.length === 0) return false;
  const preimage = concatBytes([env.sensorId, env.nonce, env.message]);
  try {
    return ed25519.verify(env.signature, preimage, env.sensorId);
  } catch {
    return false;
  }
}

function asBytes(value) {
  return coerceBytes(value);
}

const PROTO_ENCRYPTED_PLACEHOLDER = "e.proto";
const URBAN_KEYS = [
  "temperature",
  "humidity",
  "pressure",
  "pm25",
  "pm10",
  "noisemax",
  "noiseavg",
];
const INSIGHT_KEYS = ["temperature", "humidity", "pressure", "co2"];

function hasMeasurementValue(value) {
  if (typeof value === "string" && value.startsWith("e.")) return true;
  if (isEncryptedSensorValue(value)) return true;
  return typeof value === "number" && Number.isFinite(value);
}

/** Keep chart legend + login overlay for metrics sealed in private[] (same UX as JSON `e.`). */
function fillProtoPrivatePlaceholders(data, kind) {
  if (kind !== "insight" && kind !== "urban") return { ...(data || {}) };
  const keys = kind === "insight" ? INSIGHT_KEYS : URBAN_KEYS;
  const out = { ...(data || {}) };
  for (const key of keys) {
    if (hasMeasurementValue(out[key])) continue;
    out[key] = PROTO_ENCRYPTED_PLACEHOLDER;
  }
  return out;
}

function bytesFromBase64(text) {
  const src = String(text || "").trim();
  if (!src || !/^[A-Za-z0-9+/_-]+=*$/.test(src)) return null;
  try {
    const bin = atob(src.replace(/-/g, "+").replace(/_/g, "/"));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

function parseEncryptedItem(item, fallbackFrom) {
  let enc = item;
  const alreadyDecoded = item && (item.ciphertext != null || item.nonce != null);
  if (!alreadyDecoded) {
    const raw = typeof item === "string" ? bytesFromBase64(item) : coerceBytes(item);
    if (!raw || raw.length === 0) return null;
    try {
      enc = fromBinary(EncryptedSchema, raw);
    } catch {
      return null;
    }
  }
  if (!enc) return null;
  const out = {
    version: enc.version,
    algorithm: String(enc.algorithm || "").trim(),
    from: asBytes(enc.from) || fallbackFrom,
    nonce: asBytes(enc.nonce),
    ciphertext: asBytes(enc.ciphertext),
  };
  return out.from && out.nonce && out.ciphertext ? out : null;
}

function snapshotPrivate(items, fallbackFrom = null) {
  const fallback = asBytes(fallbackFrom);
  return (items || []).map((item) => parseEncryptedItem(item, fallback)).filter(Boolean);
}

function foldedOrNull(folded, kind) {
  if (!folded) return null;
  if (!folded.geo && Object.keys(folded.measurement || {}).length === 0) return null;
  return { ...folded, kind };
}

function knownPayloadKind(value) {
  return value === "insight" || value === "urban" ? value : null;
}

function parseEncryptedSensors(plain, kindHint) {
  const hint = knownPayloadKind(kindHint);
  if (!plain || plain.length === 0) {
    return { geo: null, measurement: {}, kind: hint };
  }
  const order = hint === "urban" ? ["urban", "insight"] : ["insight", "urban"];
  for (const kind of order) {
    try {
      const wrapper =
        kind === "insight"
          ? fromBinary(EncryptedInsightSchema, plain)
          : fromBinary(EncryptedUrbanSchema, plain);
      const folded = foldedOrNull(foldSensors(wrapper.sensors, kind), kind);
      if (folded) return folded;
    } catch {
      // Wrong wrapper type.
    }
    try {
      const payload =
        kind === "insight" ? fromBinary(InsightSchema, plain) : fromBinary(UrbanSchema, plain);
      const folded = foldedOrNull(foldSensors(payload.public, kind), kind);
      if (folded) return folded;
    } catch {
      // Not a full Urban/Insight message.
    }
    try {
      const one =
        kind === "insight"
          ? fromBinary(InsightSensorSchema, plain)
          : fromBinary(UrbanSensorSchema, plain);
      const folded = foldedOrNull(foldSensors([one], kind), kind);
      if (folded) return folded;
    } catch {
      // Not a single sensor row.
    }
  }
  return { geo: null, measurement: {}, kind: hint };
}

/**
 * Decrypt `protoPrivate` blobs onto `point.data`. Leftover ciphertexts stay on the point.
 * @param {object} point
 * @param {object} ownerAccount
 * @returns {Promise<object>}
 */
export async function decryptProtoPrivate(point, ownerAccount) {
  if (!point || !Array.isArray(point.protoPrivate) || point.protoPrivate.length === 0) {
    return point;
  }
  const leftover = [];
  const extra = {};
  let geo = point.geo || null;
  let kind = knownPayloadKind(point.device_model);
  const fallbackFrom = point.sensor_id;
  for (const enc of point.protoPrivate) {
    const plain = await decryptCpsBinary({ ...enc, ownerAccount, fallbackFrom });
    if (!plain) {
      leftover.push(enc);
      continue;
    }
    const folded = parseEncryptedSensors(plain, kind);
    if (!folded.geo && Object.keys(folded.measurement).length === 0) {
      leftover.push(enc);
      continue;
    }
    kind = knownPayloadKind(folded.kind) || kind;
    Object.assign(extra, folded.measurement);
    if (!geo && folded.geo) geo = folded.geo;
  }
  const data = { ...(point.data || {}), ...extra };
  const stillPending = leftover.length > 0;
  return {
    ...point,
    geo,
    device_model: kind || point.device_model || null,
    data: stillPending ? fillProtoPrivatePlaceholders(data, kind) : data,
    protoPrivate: stillPending ? leftover : null,
  };
}

/**
 * @param {object} env
 * @param {{ sender?: string, verbose?: boolean, requireGeo?: boolean, verify?: boolean }} [opts]
 * @returns {object|null} map point or null if the envelope is not usable
 */
function envelopeToPoint(env, opts = {}) {
  const fail = (reason) => {
    if (opts.verbose) console.warn("[proto] decode failed:", reason);
    return null;
  };
  if (opts.verify !== false && !verifyEnvelope(env)) {
    return fail("bad-signature");
  }
  let message;
  try {
    message = fromBinary(MessageSchema, env.message);
  } catch {
    return fail("bad-message");
  }
  const kind = message.payload?.case;
  if (kind !== "urban" && kind !== "insight") {
    return fail(`payload:${kind || "none"}`);
  }
  const payload = message.payload.value;
  const folded = foldSensors(payload?.public, kind);
  if (opts.requireGeo !== false && !folded.geo) {
    return fail("no-public-gps");
  }
  const sensor_id = ss58(env.sensorId);
  if (!sensor_id) {
    return fail("bad-sensor-id");
  }
  const protoPrivate = snapshotPrivate(payload?.private, env.sensorId);
  const hasPrivateWire = Array.isArray(payload?.private) && payload.private.length > 0;
  if (
    Object.keys(folded.measurement).length === 0 &&
    protoPrivate.length === 0 &&
    !hasPrivateWire
  ) {
    return fail("no-measurements");
  }
  const tsMs = finite(message.metadata?.timestamp);
  if (tsMs == null || tsMs <= 0) {
    return fail("bad-timestamp");
  }
  const node_id = finite(message.metadata?.nodeId) ?? 0;
  const data =
    protoPrivate.length > 0 || hasPrivateWire
      ? fillProtoPrivatePlaceholders(folded.measurement, kind)
      : folded.measurement;
  return {
    sensor_id,
    sender: opts.sender,
    model: kind === "insight" ? 3 : 2,
    geo: folded.geo || undefined,
    data,
    node_id,
    device_model: kind,
    timestamp: Math.floor(tsMs / 1000),
    proto: true,
    protoPrivate: protoPrivate.length > 0 ? protoPrivate : null,
  };
}

/**
 * @param {Uint8Array|ArrayBuffer} raw
 * @param {{ sender?: string, verbose?: boolean, requireGeo?: boolean, verify?: boolean }} [opts]
 * @returns {object|null} map point or null if not a valid signed envelope
 */
export function decodeSignedEnvelopeToPoint(raw, opts = {}) {
  let env;
  try {
    env = fromBinary(SignedEnvelopeSchema, asU8(raw));
  } catch {
    if (opts.verbose) console.warn("[proto] decode failed:", "not-envelope");
    return null;
  }
  return envelopeToPoint(env, opts);
}

/**
 * RoSeMAN `/api/v3/messages` body: `crypto.v1.SignedEnvelopeBatch`.
 * History points may omit public GPS; live pubsub still requires it.
 * @param {Uint8Array|ArrayBuffer} raw
 * @param {{ sender?: string, verbose?: boolean, requireGeo?: boolean, verify?: boolean }} [opts]
 * @returns {object[]}
 */
export function decodeSignedEnvelopeBatchToPoints(raw, opts = {}) {
  if (!raw || (raw.byteLength ?? raw.length) === 0) return [];
  let batch;
  try {
    batch = fromBinary(SignedEnvelopeBatchSchema, asU8(raw));
  } catch {
    if (opts.verbose) console.warn("[proto] decode failed:", "not-batch");
    return [];
  }
  const points = [];
  for (const env of batch.batch || []) {
    const point = envelopeToPoint(env, opts);
    if (point) points.push(point);
  }
  return points;
}

/**
 * RoSeMAN `/api/v3/messages/json` items. Private blobs are base64 Encrypted messages.
 * JSON omits nonce/signature, so this path cannot verify the envelope.
 */
export function v3JsonItemsToPoints(items, opts = {}) {
  const points = [];
  for (const item of Array.isArray(items) ? items : []) {
    const point = v3JsonItemToPoint(item, opts);
    if (point) points.push(point);
  }
  return points;
}

function v3JsonItemToPoint(item, opts = {}) {
  const fail = (reason) => {
    if (opts.verbose) console.warn("[proto] json decode failed:", reason);
    return null;
  };
  const message = item?.message;
  if (!message || typeof message !== "object") return fail("no-message");
  const kind = message.insight ? "insight" : message.urban ? "urban" : null;
  if (!kind) return fail("payload:none");
  const payload = message[kind];
  const folded = foldSensors(payload?.public, kind);
  if (opts.requireGeo !== false && !folded.geo) return fail("no-public-gps");
  const sensor_id = String(item.sensorId || item.sensor_id || "").trim();
  if (!sensor_id) return fail("bad-sensor-id");
  const protoPrivate = snapshotPrivate(payload?.private, sensor_id);
  const hasPrivateWire = Array.isArray(payload?.private) && payload.private.length > 0;
  if (
    Object.keys(folded.measurement).length === 0 &&
    protoPrivate.length === 0 &&
    !hasPrivateWire
  ) {
    return fail("no-measurements");
  }
  const tsMs = finite(message.metadata?.timestamp);
  if (tsMs == null || tsMs <= 0) return fail("bad-timestamp");
  const node_id = finite(message.metadata?.nodeId) ?? 0;
  const data =
    protoPrivate.length > 0 || hasPrivateWire
      ? fillProtoPrivatePlaceholders(folded.measurement, kind)
      : folded.measurement;
  return {
    sensor_id,
    sender: opts.sender,
    model: kind === "insight" ? 3 : 2,
    geo: folded.geo || undefined,
    data,
    node_id,
    device_model: kind,
    timestamp: Math.floor(tsMs / 1000),
    proto: true,
    protoPrivate: protoPrivate.length > 0 ? protoPrivate : null,
  };
}
