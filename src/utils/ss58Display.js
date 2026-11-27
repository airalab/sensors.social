import { sensorIdAliases } from "./sensorId";

const HEX64 = /^[0-9a-fA-F]{64}$/;

/** Robonomics SS58 (prefix 32) from hex or any-prefix address. */
export function displayAddress(addr) {
  const raw = String(addr || "").trim();
  if (!raw) return "";
  return sensorIdAliases(raw).find((id) => !HEX64.test(id)) || raw;
}

/** Short Robonomics address for lists: 4CgpYi…HrDujP */
export function formatAddress(addr) {
  const ss58 = displayAddress(addr);
  if (!ss58 || ss58.length <= 16) return ss58;
  return `${ss58.slice(0, 6)}…${ss58.slice(-6)}`;
}
