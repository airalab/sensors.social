/**
 * Health of the services the map depends on, shown in the header.
 *
 * Connectivity: the time of the last datalog record of each agent, read from the chain.
 * A slowed-down agent shows up here even while the other agents keep the map alive.
 * RoSeMAN: how far the indexer is behind the head of the chain.
 * Robonomics: the age of the newest block.
 */
import { reactive } from "vue";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { settings } from "@config";

const WS_ENDPOINT = "wss://polkadot.rpc.robonomics.network/";
const POLL_MS = 60 * 1000;
const CONNECT_TIMEOUT_MS = 15 * 1000;

const AGENT_STALE_MS = 15 * 60 * 1000;
// Blocks come about every 6 seconds: 100 blocks is 10 minutes, 600 blocks is an hour.
const INDEXER_LAG_WARN = 100;
const INDEXER_LAG_DOWN = 600;
const BLOCK_AGE_WARN_MS = 2 * 60 * 1000;
const BLOCK_AGE_DOWN_MS = 10 * 60 * 1000;
// The sensor list is heavier than the other checks and a 24 h figure barely moves in a minute.
const SENSORS_POLL_MS = 10 * 60 * 1000;
const DAY_S = 24 * 60 * 60;

const status = reactive({
  connectivity: { state: "unknown", active: 0, total: 0, lastRecordAt: null },
  roseman: { state: "unknown", lag: null },
  robonomics: { state: "unknown", blockAt: null },
  sensors24h: null,
});

let apiPromise = null;
let timer = null;
let sensorsCheckedAt = 0;

function connect() {
  if (!apiPromise) {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("RPC connection timeout")), CONNECT_TIMEOUT_MS)
    );
    const api = ApiPromise.create({
      provider: new WsProvider(WS_ENDPOINT),
      noInitWarn: true,
    });
    apiPromise = Promise.race([api, timeout]).catch((error) => {
      apiPromise = null;
      throw error;
    });
  }
  return apiPromise;
}

async function fetchResult(path) {
  const response = await fetch(new URL(path, settings.REMOTE_PROVIDER));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()).result;
}

/** Time of the newest record in an agent's ring buffer, or null if it has none. */
async function lastRecordTime(api, windowSize, agent) {
  const { end } = (await api.query.datalog.datalogIndex(agent)).toJSON();
  const newest = (end - 1 + windowSize) % windowSize;
  const item = (await api.query.datalog.datalogItem([agent, newest])).toJSON();
  return item?.[0] ?? null;
}

async function checkConnectivity(api) {
  const agents = await fetchResult("api/status/agents");
  const windowSize = api.consts.datalog.windowSize.toNumber();
  const times = await Promise.all(agents.map((agent) => lastRecordTime(api, windowSize, agent)));
  const active = times.filter((time) => time && Date.now() - time < AGENT_STALE_MS).length;

  status.connectivity.total = agents.length;
  status.connectivity.active = active;
  status.connectivity.lastRecordAt = Math.max(0, ...times) || null;
  status.connectivity.state =
    active === agents.length && active > 0 ? "ok" : active > 0 ? "degraded" : "down";
}

async function checkRoseman(head) {
  try {
    const lastBlock = await fetchResult("api/status/last-block");
    if (head === null) {
      status.roseman.state = "unknown";
      status.roseman.lag = null;
      return;
    }
    const lag = Math.max(0, head - lastBlock);
    status.roseman.lag = lag;
    status.roseman.state =
      lag > INDEXER_LAG_DOWN ? "down" : lag > INDEXER_LAG_WARN ? "degraded" : "ok";
  } catch {
    status.roseman.state = "down";
    status.roseman.lag = null;
  }
}

async function checkSensors() {
  if (Date.now() - sensorsCheckedAt < SENSORS_POLL_MS) return;
  try {
    const end = Math.floor(Date.now() / 1000);
    const sensors = await fetchResult(`api/v2/sensor/list/${end - DAY_S}/${end}`);
    status.sensors24h = new Set(sensors.map((sensor) => sensor.sensor_id)).size;
    sensorsCheckedAt = Date.now();
  } catch {
    status.sensors24h = null;
  }
}

async function check() {
  if (document.hidden) return;

  await checkSensors();

  let api = null;
  let head = null;
  try {
    api = await connect();
    const [header, now] = await Promise.all([api.rpc.chain.getHeader(), api.query.timestamp.now()]);
    head = header.number.toNumber();
    const blockAt = now.toNumber();
    const age = Date.now() - blockAt;
    status.robonomics.blockAt = blockAt;
    status.robonomics.state =
      age > BLOCK_AGE_DOWN_MS ? "down" : age > BLOCK_AGE_WARN_MS ? "degraded" : "ok";
  } catch {
    status.robonomics.state = "down";
    status.robonomics.blockAt = null;
  }

  await checkRoseman(head);

  if (!api) {
    status.connectivity.state = "unknown";
    return;
  }
  try {
    await checkConnectivity(api);
  } catch {
    status.connectivity.state = "unknown";
  }
}

export function useServiceStatus() {
  if (!timer) {
    check();
    timer = setInterval(check, POLL_MS);
  }
  return status;
}
