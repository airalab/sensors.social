import { chacha20poly1305, xchacha20poly1305 } from "@noble/ciphers/chacha.js";
import { x25519 } from "@noble/curves/ed25519";
import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha256";
import { sha512 } from "@noble/hashes/sha512";
import bs58 from "bs58";

import { cryptoWaitReady, decodeAddress, mnemonicToMiniSecret } from "@polkadot/util-crypto";
import { getOwnerEd25519Seed } from "@/composables/useAccounts";
import { MEASUREMENT_GROUPS } from "../measurements/groups";
import { pressureToMmHg } from "./pressureMmHg.js";

const ENCRYPTED_PREFIX = "e.";
const PROTO_PLACEHOLDER = "e.proto";
const HKDF_SALT = "robonomics-network";
const HKDF_INFO_AES = "aesgcm256";
const HKDF_INFO_XCHACHA = "xchacha20poly1305";
const HKDF_INFO_CHACHA = "chacha20poly1305";

const P = (1n << 255n) - 19n;

export function isEncryptedPlaceholderValue(value) {
  return typeof value === "string" && value.trim().toLowerCase() === PROTO_PLACEHOLDER;
}

/** JSON `e.<ciphertext>` only — not the proto `e.proto` placeholder (nothing to decrypt). */
export function isEncryptedSensorValue(value) {
  if (typeof value !== "string" || !value.startsWith(ENCRYPTED_PREFIX)) return false;
  if (isEncryptedPlaceholderValue(value)) return false;
  return value.length > ENCRYPTED_PREFIX.length;
}

/** Chart/overlay: ciphertext or sealed placeholder. */
export function isSealedSensorValue(value) {
  return isEncryptedSensorValue(value) || isEncryptedPlaceholderValue(value);
}

/** Uint8Array from proto, IndexedDB, JSON `{0:n,…}`, or hex/SS58. */
export function coerceBytes(value) {
  if (value == null) return null;
  if (value instanceof Uint8Array) return Uint8Array.from(value);
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  if (Array.isArray(value)) {
    return Uint8Array.from(value.map((n) => Number(n) & 0xff));
  }
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return null;
    if (/^[0-9a-fA-F]+$/.test(text) && text.length % 2 === 0 && text.length >= 24) {
      const out = new Uint8Array(text.length / 2);
      for (let i = 0; i < out.length; i += 1) {
        out[i] = parseInt(text.slice(i * 2, i * 2 + 2), 16);
      }
      return out;
    }
    return null;
  }
  if (typeof value === "object") {
    const len = Number(value.length);
    if (Number.isFinite(len) && len > 0) {
      const out = new Uint8Array(len);
      for (let i = 0; i < len; i += 1) out[i] = Number(value[i]) & 0xff;
      return out;
    }
    const keys = Object.keys(value)
      .filter((k) => /^\d+$/.test(k))
      .map(Number)
      .sort((a, b) => a - b);
    if (keys.length > 0 && keys[0] === 0 && keys[keys.length - 1] === keys.length - 1) {
      const out = new Uint8Array(keys.length);
      for (let i = 0; i < keys.length; i += 1) out[i] = Number(value[i]) & 0xff;
      return out;
    }
  }
  return null;
}

function hasEncryptedFields(measurement) {
  if (!measurement || typeof measurement !== "object") return false;
  return Object.values(measurement).some(isEncryptedSensorValue);
}

function base64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

function bytesToBigIntLE(bytes) {
  let value = 0n;
  for (let i = bytes.length - 1; i >= 0; i -= 1) {
    value = (value << 8n) | BigInt(bytes[i]);
  }
  return value;
}

function bigIntToBytesLE(value, len = 32) {
  const out = new Uint8Array(len);
  let v = value;
  for (let i = 0; i < len; i += 1) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}

function modPow(base, exp, mod) {
  let result = 1n;
  let b = base % mod;
  let e = exp;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % mod;
    b = (b * b) % mod;
    e >>= 1n;
  }
  return result;
}

function modInv(a, mod) {
  return modPow(a, mod - 2n, mod);
}

/** Ed25519 compressed public key -> X25519 Montgomery u (RFC 7748 / libcps). */
function ed25519PublicToX25519(edPk) {
  const yLe = new Uint8Array(edPk);
  yLe[31] &= 0x7f;
  const y = bytesToBigIntLE(yLe);
  const one = 1n;
  const num = (one + y) % P;
  const den = (one - y + P) % P;
  const u = (num * modInv(den, P)) % P;
  return bigIntToBytesLE(u, 32);
}

function ed25519SeedToX25519Scalar(seed) {
  const hash = sha512(seed);
  const scalar = hash.slice(0, 32);
  scalar[0] &= 248;
  scalar[31] &= 127;
  scalar[31] |= 64;
  return scalar;
}

function bytesKey(bytes) {
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

const sharedSecretCache = new Map();
const aesCryptoKeyCache = new Map();
const devicePkCache = new Map();

function deriveSharedSecret(ownerSeed, deviceEdPk) {
  const cacheKey = `${bytesKey(ownerSeed)}:${bytesKey(deviceEdPk)}`;
  const cached = sharedSecretCache.get(cacheKey);
  if (cached) return cached;
  const scalar = ed25519SeedToX25519Scalar(ownerSeed);
  const theirX = ed25519PublicToX25519(deviceEdPk);
  const secret = x25519.getSharedSecret(scalar, theirX);
  sharedSecretCache.set(cacheKey, secret);
  return secret;
}

function hkdfKey(shared, info) {
  return hkdf(sha256, shared, HKDF_SALT, info, 32);
}

function normalizeCipherName(algorithm) {
  return String(algorithm || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function decryptWithXchacha(shared, nonce, ciphertext) {
  if (nonce.length !== 24 || ciphertext.length <= 16) return null;
  try {
    return xchacha20poly1305(hkdfKey(shared, HKDF_INFO_XCHACHA), nonce).decrypt(ciphertext);
  } catch {
    return null;
  }
}

function decryptWithChaCha(shared, nonce, ciphertext) {
  if (nonce.length !== 12 || ciphertext.length <= 16) return null;
  try {
    return chacha20poly1305(hkdfKey(shared, HKDF_INFO_CHACHA), nonce).decrypt(ciphertext);
  } catch {
    return null;
  }
}

async function decryptWithAesGcm(shared, nonce, ciphertext) {
  if (nonce.length < 8 || ciphertext.length <= 16) return null;
  try {
    const key = await importAesGcmKey(hkdfKey(shared, HKDF_INFO_AES));
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: nonce },
      key,
      ciphertext
    );
    return new Uint8Array(plain);
  } catch {
    return null;
  }
}

/** CPS / connectivity-protocol: default cipher is xchacha20, firmware JSON is aesgcm256. */
async function decryptSharedSecret(shared, nonce, ciphertext, algorithm) {
  const algo = normalizeCipherName(algorithm);
  const order = [];
  if (algo.includes("xchacha") || nonce.length === 24) order.push("xchacha");
  else if (algo === "chacha20" || algo === "chacha20poly1305") order.push("chacha");
  else if (algo.includes("aesgcm") || nonce.length === 12) order.push("aes");
  else order.push("xchacha", "aes", "chacha");
  for (const name of ["xchacha", "aes", "chacha"]) {
    if (!order.includes(name)) order.push(name);
  }

  for (const name of order) {
    let plain = null;
    if (name === "xchacha") plain = decryptWithXchacha(shared, nonce, ciphertext);
    else if (name === "aes") plain = await decryptWithAesGcm(shared, nonce, ciphertext);
    else plain = decryptWithChaCha(shared, nonce, ciphertext);
    if (plain) return plain;
  }
  return null;
}

async function importAesGcmKey(rawKey) {
  const id = bytesKey(rawKey);
  const cached = aesCryptoKeyCache.get(id);
  if (cached) return cached;
  const key = await crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, ["decrypt"]);
  aesCryptoKeyCache.set(id, key);
  return key;
}

function parseCpsPayload(wire) {
  try {
    const raw = base64ToBytes(wire.slice(ENCRYPTED_PREFIX.length));
    const text = new TextDecoder().decode(raw);
    if (!text.startsWith("{")) return null;
    const json = JSON.parse(text);
    if (json?.version !== 1 || !json?.algorithm) return null;
    return json;
  } catch {
    return null;
  }
}

async function resolveDevicePublicKey(fromField) {
  const raw = String(fromField || "").trim();
  if (!raw) return null;
  if (devicePkCache.has(raw)) return devicePkCache.get(raw);
  await cryptoWaitReady();
  let pk = null;
  try {
    const decoded = decodeAddress(raw, false, 32);
    if (decoded instanceof Uint8Array && decoded.length === 32) pk = decoded;
  } catch {
    // legacy raw base58 pubkey in `from`
  }
  if (!pk) {
    try {
      const decoded = bs58.decode(raw);
      if (decoded.length === 32) pk = decoded;
    } catch {
      pk = null;
    }
  }
  devicePkCache.set(raw, pk);
  return pk;
}

async function decryptCpsValue(wire, ownerSeed) {
  const json = parseCpsPayload(wire);
  if (!json?.from || !json?.nonce || !json?.ciphertext) return null;

  const devicePk = await resolveDevicePublicKey(json.from);
  if (!devicePk) return null;

  const shared = deriveSharedSecret(ownerSeed, devicePk);
  const nonce = base64ToBytes(json.nonce);
  const ciphertext = base64ToBytes(json.ciphertext);
  const plain = await decryptSharedSecret(shared, nonce, ciphertext, json.algorithm);
  return plain ? new TextDecoder().decode(plain) : null;
}

function normalizeDecryptedField(fieldName, plain) {
  const num = Number(plain);
  if (!Number.isFinite(num)) return plain;

  const field = String(fieldName || "").toLowerCase();
  if (field === "pressure") return pressureToMmHg(num);
  return num;
}

async function decryptSensorValue(wire, ownerSeed) {
  if (!isEncryptedSensorValue(wire)) return null;
  return decryptCpsValue(wire, ownerSeed);
}

const ownerSeedByAccount = new WeakMap();
const ownerSeedByAddress = new Map();

async function resolveOwnerSeed(ownerAccount) {
  if (!ownerAccount || typeof ownerAccount !== "object") return null;
  if (ownerAccount.seed instanceof Uint8Array && ownerAccount.seed.length === 32) {
    return ownerAccount.seed;
  }
  const fromObj = ownerSeedByAccount.get(ownerAccount);
  if (fromObj) return fromObj;
  const address = String(ownerAccount.address || "").trim();
  if (address && ownerSeedByAddress.has(address)) {
    return ownerSeedByAddress.get(address);
  }

  let seed = null;
  const seedHex = String(ownerAccount.seedHex || "").trim().replace(/^0x/i, "");
  if (/^[0-9a-fA-F]{64}$/.test(seedHex)) {
    seed = new Uint8Array(32);
    for (let i = 0; i < 32; i += 1) {
      seed[i] = parseInt(seedHex.slice(i * 2, i * 2 + 2), 16);
    }
  } else {
    const phrase = String(ownerAccount.phrase || "").trim();
    if (phrase) {
      await cryptoWaitReady();
      const fromMnemonic = mnemonicToMiniSecret(phrase);
      if (fromMnemonic instanceof Uint8Array && fromMnemonic.length >= 32) {
        seed = fromMnemonic.slice(0, 32);
      }
    }
  }
  if (!seed) {
    if (!address) return null;
    seed = await getOwnerEd25519Seed(address);
  }
  if (seed) {
    ownerSeedByAccount.set(ownerAccount, seed);
    if (address) ownerSeedByAddress.set(address, seed);
  }
  return seed;
}

async function publicKeyFromField(fromField) {
  const bytes = coerceBytes(fromField);
  if (bytes?.length === 32) return bytes;
  if (bytes?.length > 32) {
    try {
      const asText = new TextDecoder().decode(bytes).replace(/\0+$/g, "").trim();
      const fromSs58 = await resolveDevicePublicKey(asText);
      if (fromSs58) return fromSs58;
    } catch {
      // not UTF-8 SS58 in bytes
    }
  }
  return resolveDevicePublicKey(fromField);
}

/**
 * Decrypt a proto `crypto.v1.Encrypted` blob.
 * @returns {Promise<Uint8Array|null>} plaintext bytes or null
 */
export async function decryptCpsBinary({
  from,
  nonce,
  ciphertext,
  ownerAccount,
  fallbackFrom,
  algorithm,
}) {
  const ownerSeed = await resolveOwnerSeed(ownerAccount);
  if (!ownerSeed) return null;

  const devicePk =
    (await publicKeyFromField(from)) || (await publicKeyFromField(fallbackFrom));
  const nonceBytes = coerceBytes(nonce);
  const cipherBytes = coerceBytes(ciphertext);
  if (!devicePk || !nonceBytes || !cipherBytes) return null;

  const shared = deriveSharedSecret(ownerSeed, devicePk);
  return decryptSharedSecret(shared, nonceBytes, cipherBytes, algorithm);
}

/**
 * Decrypt encrypted measurement fields when the logged-in owner seed is available.
 * @param {string} sensorId
 * @param {Object} measurement
 * @param {{ address?: string, seed?: Uint8Array }} ownerAccount
 */
export async function decryptMeasurementBag(sensorId, measurement, ownerAccount) {
  if (!measurement || typeof measurement !== "object" || !hasEncryptedFields(measurement)) {
    return measurement;
  }

  const ownerSeed = await resolveOwnerSeed(ownerAccount);
  if (!ownerSeed) return measurement;

  const out = { ...measurement };
  let changed = false;
  for (const [field, value] of Object.entries(measurement)) {
    if (!isEncryptedSensorValue(value)) continue;
    const plain = await decryptSensorValue(value, ownerSeed);
    if (plain == null) continue;
    out[field] = normalizeDecryptedField(field, plain);
    changed = true;
  }
  return changed ? out : measurement;
}

export function measurementBagHasEncryptedValues(measurement) {
  return hasEncryptedFields(measurement);
}

function legendMemberIds(legendKey) {
  const key = String(legendKey || "").toLowerCase();
  const group = MEASUREMENT_GROUPS[key];
  if (group?.members?.length) {
    return group.members.map((m) => String(m).toLowerCase());
  }
  return key ? [key] : [];
}

function readBagValue(bag, memberId) {
  if (!bag || memberId == null) return undefined;
  const id = String(memberId).toLowerCase();
  if (bag[id] !== undefined) return bag[id];
  for (const [k, v] of Object.entries(bag)) {
    if (String(k).toLowerCase() === id) return v;
  }
  return undefined;
}

export function bagHasEncryptedForLegend(bag, legendKey) {
  if (!bag || !legendKey) return false;
  return legendMemberIds(legendKey).some((memberId) =>
    isSealedSensorValue(readBagValue(bag, memberId))
  );
}

export function logHasEncryptedForLegend(log, legendKey) {
  if (!Array.isArray(log) || !legendKey) return false;
  return log.some((entry) => bagHasEncryptedForLegend(entry?.data, legendKey));
}

function isNumericSensorValue(value) {
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string" && value.trim() && !isSealedSensorValue(value)) {
    return Number.isFinite(Number(value));
  }
  return false;
}

export function bagHasNumericForLegend(bag, legendKey) {
  if (!bag || !legendKey) return false;
  return legendMemberIds(legendKey).some((memberId) =>
    isNumericSensorValue(readBagValue(bag, memberId))
  );
}

export function logHasNumericForLegend(log, legendKey) {
  if (!Array.isArray(log) || !legendKey) return false;
  return log.some((entry) => bagHasNumericForLegend(entry?.data, legendKey));
}
