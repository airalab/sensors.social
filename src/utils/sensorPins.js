/**
 * What the config says about a sensor beyond its data: a display name, a logo for its marker,
 * who runs it and a link. Two kinds of entries, one lookup:
 *
 * - pinned_sensors: partners pinned by sensor id (a logo, a link);
 * - GOV_NETWORKS: government stations republished by RoSeMAN's gov-stations module. Their ids
 *   start with the network id ("nl-rivm-NL10742"); the network gives the logo, the operator and the
 *   link, and the station name comes from RoSeMAN (GET api/v2/gov/stations?brief=1, loaded once).
 */
import { reactive } from "vue";
import { pinned_sensors, settings } from "@config";

const govNames = reactive({});
let govNamesLoading = null;

function loadGovNames() {
  if (govNamesLoading || !settings.REMOTE_PROVIDER) return;
  govNamesLoading = fetch(`${settings.REMOTE_PROVIDER}api/v2/gov/stations?brief=1`)
    .then((res) => (res.ok ? res.json() : { result: [] }))
    .then(({ result }) => {
      for (const source of result || []) {
        for (const st of source.stations || []) govNames[st.id] = st.name;
      }
    })
    .catch((e) => console.error("Government station names:", e));
}

/** The government network a sensor id belongs to, with its id, or null. */
export function govNetworkOf(sensorId) {
  const sid = String(sensorId || "");
  const networks = settings.GOV_NETWORKS || {};
  for (const [id, network] of Object.entries(networks)) {
    if (sid.startsWith(`${id}-`)) return { id, ...network };
  }
  return null;
}

/**
 * { name?, icon?, owner?, link?, kind? } for a sensor, or null when the config knows nothing of it.
 * A government station's name is reactive: it fills in once RoSeMAN's list arrives.
 */
export function sensorPin(sensorId) {
  const sid = String(sensorId || "");
  const pinned = pinned_sensors[sid] || null;
  const network = govNetworkOf(sid);
  if (!network) return pinned;
  loadGovNames();
  const station = govNames[sid];
  return {
    kind: "gov",
    name: station ? `Gov. station · ${station}` : "Gov. station",
    icon: network.icon,
    owner: network.owner,
    link: network.link,
    ...pinned,
  };
}
