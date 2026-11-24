/**
 * What the config says about a sensor beyond its data: a display name, a logo for its marker,
 * who runs it and a link. Two kinds of entries, one lookup:
 *
 * - pinned_sensors: partners pinned by sensor id (a logo, a link);
 * - GOV_NETWORKS: government stations republished by RoSeMAN's gov-stations module. Their ids
 *   start with the network id ("nl-rivm-NL10742"); the network gives the logo, the operator and the
 *   link, and the station name comes from RoSeMAN (GET api/v2/gov/stations?brief=1, loaded once).
 *
 * A sensor gets a network's branding only when RoSeMAN lists it as that network's station: the id
 * prefix alone is not trusted, since any sensor could be given an id that starts with "de-uba-".
 * The list is requested when this module loads, before the first markers arrive.
 */
import { reactive } from "vue";
import { pinned_sensors, settings } from "@config";

const govStations = reactive({}); // station id -> { name, network }
let govListLoading = null;

function loadGovStations() {
  if (govListLoading || !settings.REMOTE_PROVIDER || !settings.GOV_NETWORKS) return;
  govListLoading = fetch(`${settings.REMOTE_PROVIDER}api/v2/gov/stations?brief=1`)
    .then((res) => (res.ok ? res.json() : { result: [] }))
    .then(({ result }) => {
      for (const source of result || []) {
        for (const st of source.stations || []) {
          govStations[st.id] = { name: st.name, network: source.id };
        }
      }
    })
    .catch((e) => console.error("Government stations:", e));
}

loadGovStations();

/** The government network RoSeMAN lists this sensor id under, with its id, or null. */
export function govNetworkOf(sensorId) {
  const station = govStations[String(sensorId || "")];
  const network = station && (settings.GOV_NETWORKS || {})[station.network];
  return network ? { id: station.network, ...network } : null;
}

/**
 * { name?, icon?, owner?, link?, kind? } for a sensor, or null when the config knows nothing of it.
 * Reactive for government stations: they are recognised once RoSeMAN's list arrives.
 */
export function sensorPin(sensorId) {
  const sid = String(sensorId || "");
  const pinned = pinned_sensors[sid] || null;
  const network = govNetworkOf(sid);
  if (!network) return pinned;
  return {
    kind: "gov",
    name: `Gov. station · ${govStations[sid].name}`,
    icon: network.icon,
    owner: network.owner,
    link: network.link,
    ...pinned,
  };
}
