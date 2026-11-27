import assert from "node:assert/strict";
import { create, toBinary } from "@bufbuild/protobuf";
import { SignedEnvelopeSchema } from "@buf/airalab_connectivity-protocol.bufbuild_es/crypto/v1/envelope_pb.js";
import { MessageSchema } from "@buf/airalab_connectivity-protocol.bufbuild_es/core/v1/message_pb.js";
import { UrbanSchema, UrbanSensorSchema } from "@buf/airalab_connectivity-protocol.bufbuild_es/device/v1/urban_pb.js";
import { BME280Schema, GPSSchema } from "@buf/airalab_connectivity-protocol.bufbuild_es/sensor/v1/sensor_pb.js";
import { TemperatureSchema } from "@buf/airalab_connectivity-protocol.bufbuild_es/sensor/v1/measurement_pb.js";
import { ed25519 } from "@noble/curves/ed25519";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { decodeSignedEnvelopeToPoint } from "./decodeEnvelope.js";

function concatBytes(parts) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function signedEnvelopeBytes({ tamperSignature = false } = {}) {
  const secret = new Uint8Array(32).fill(7);
  const sensorId = ed25519.getPublicKey(secret);
  const nonce = new Uint8Array(16).fill(3);
  const message = toBinary(
    MessageSchema,
    create(MessageSchema, {
      metadata: { nodeId: 0n, timestamp: 1_700_000_000_000n },
      payload: {
        case: "urban",
        value: create(UrbanSchema, {
          public: [
            create(UrbanSensorSchema, {
              sensor: { case: "gps", value: create(GPSSchema, { lat: 53.09, lon: 49.99 }) },
            }),
            create(UrbanSensorSchema, {
              sensor: {
                case: "bme280",
                value: create(BME280Schema, {
                  measurement: {
                    case: "temperature",
                    value: create(TemperatureSchema, { centiCelsius: 2100 }),
                  },
                }),
              },
            }),
          ],
        }),
      },
    })
  );
  const signature = ed25519.sign(concatBytes([sensorId, nonce, message]), secret);
  if (tamperSignature) signature[0] ^= 1;
  return toBinary(
    SignedEnvelopeSchema,
    create(SignedEnvelopeSchema, { sensorId, nonce, message, signature })
  );
}

await cryptoWaitReady();

const good = decodeSignedEnvelopeToPoint(signedEnvelopeBytes(), { requireGeo: true });
assert.equal(good?.proto, true);
assert.equal(good?.device_model, "urban");
assert.equal(good?.geo?.lat, 53.09);
assert.equal(good?.geo?.lng, 49.99);
assert.equal(good?.data?.temperature, 21);

const bad = decodeSignedEnvelopeToPoint(signedEnvelopeBytes({ tamperSignature: true }));
assert.equal(bad, null);

console.log("decodeEnvelope: ok");
