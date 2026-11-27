import { cryptoWaitReady, decodeAddress, encodeAddress } from "@polkadot/util-crypto";

void cryptoWaitReady();

const HEX64 = /^[0-9a-fA-F]{64}$/;
const aliasCache = new Map();

function hexToPk(sid) {
  if (!HEX64.test(sid)) return null;
  const pk = new Uint8Array(32);
  for (let i = 0; i < 32; i += 1) {
    pk[i] = parseInt(sid.slice(i * 2, i * 2 + 2), 16);
  }
  return pk;
}

function pkAliases(pk, ids) {
  if (!(pk instanceof Uint8Array) || pk.length !== 32) return;
  ids.add([...pk].map((b) => b.toString(16).padStart(2, "0")).join(""));
  try {
    ids.add(encodeAddress(pk, 32));
  } catch {
    // WASM not ready yet
  }
}

/** Hex and SS58 forms of a 32-byte sensor public key. */
export function sensorIdAliases(sensorId) {
  const sid = String(sensorId || "").trim();
  if (!sid) return [];
  const cached = aliasCache.get(sid);
  if (cached) return cached;
  const ids = new Set([sid]);
  const fromHex = hexToPk(sid);
  if (fromHex) {
    pkAliases(fromHex, ids);
  } else {
    try {
      pkAliases(decodeAddress(sid, false, 32), ids);
    } catch {
      // not SS58
    }
  }
  const result = [...ids];
  aliasCache.set(sid, result);
  return result;
}

/** Prefer 64-char hex for v2 / IndexedDB keys; keep the original if it is not a pubkey. */
export function canonicalHexSensorId(sensorId) {
  const aliases = sensorIdAliases(sensorId);
  return aliases.find((id) => HEX64.test(id)) || aliases[0] || String(sensorId || "");
}

export function sensorIdsEqual(a, b) {
  if (a == null || b == null) return false;
  const left = String(a).trim();
  const right = String(b).trim();
  if (!left || !right) return false;
  if (left === right) return true;
  if (HEX64.test(left) && HEX64.test(right)) {
    return left.toLowerCase() === right.toLowerCase();
  }
  const other = new Set(sensorIdAliases(right));
  return sensorIdAliases(left).some((id) => other.has(id));
}
