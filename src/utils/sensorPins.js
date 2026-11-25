/**
 * What the config says about a sensor beyond its data: a display name, a logo for its marker,
 * who runs it and a link. Two kinds of entries, one lookup:
 *
 * - pinned_sensors: partners pinned by sensor id (a logo, a link);
 * - government stations republished by RoSeMAN's gov-stations module: one grey "government"
 *   icon for every network (GOV_STATIONS.icon); the station's name, its network's publisher and
 *   link, and the agency running it where the network names one, come from RoSeMAN:
 *   with FEEDS configured, from the feed markers of the areas a visitor switched on
 *   (registerFeedStations, utils/map/feeds); else from GET api/v2/gov/stations?brief=1, loaded once.
 *
 * A sensor is shown as a government station only when RoSeMAN lists it: the id prefix alone is
 * not trusted, since any sensor could be given an id that starts with "de-uba-".
 * The list is requested when this module loads, before the first markers arrive.
 */
import { reactive } from "vue";
import { pinned_sensors, settings } from "@config";

const govStations = reactive({}); // station id -> { name, network, operator, publisher, link }
let govListLoading = null;

/** A publisher's link as RoSeMAN gives it, kept only if it is http(s): it ends up in an href. */
function webLink(raw) {
  try {
    const url = new URL(String(raw || ""));
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}

function loadGovStations() {
  if (govListLoading || !settings.REMOTE_PROVIDER || !settings.GOV_STATIONS || settings.FEEDS) return;
  govListLoading = fetch(`${settings.REMOTE_PROVIDER}api/v2/gov/stations?brief=1`)
    .then((res) => (res.ok ? res.json() : { result: [] }))
    .then(({ result }) => {
      for (const source of result || []) {
        for (const st of source.stations || []) {
          govStations[st.id] = {
            name: st.name,
            network: source.network || source.publisher || "",
            operator: st.operator || "",
            publisher: source.publisher || "",
            link: webLink(source.url),
          };
        }
      }
    })
    .catch((e) => console.error("Government stations:", e));
}

loadGovStations();

/** Stations of a feed area the visitor switched on: known from here on as government stations. */
export function registerFeedStations(feed, markers) {
  for (const m of markers) {
    govStations[m.id] = {
      name: m.name,
      network: feed.network || feed.publisher || "",
      operator: m.operator || "",
      publisher: feed.publisher || "",
      link: webLink(feed.url),
      geo: { lat: m.lat, lng: m.lng },
      feed: true,
    };
  }
}

/** A station that came from a feed (its history is read from api/v2/feeds), with its position. */
export function feedStation(sensorId) {
  const st = govStations[String(sensorId || "")];
  return st?.feed ? st : null;
}

/**
 * { name?, icon?, owner?, link?, kind? } for a sensor, or null when the config knows nothing of it.
 * A government station also gives `station` (its own name) and `network` ("AirNow, U.S. EPA").
 * Reactive for government stations: they are recognised once RoSeMAN's list arrives.
 */
export function sensorPin(sensorId) {
  const sid = String(sensorId || "");
  const pinned = pinned_sensors[sid] || null;
  const station = govStations[sid];
  if (!station) return pinned;
  const source = [station.publisher, station.operator].filter(Boolean).join(" · ");
  return {
    kind: "gov",
    name: `Gov. station · ${station.name}`,
    station: station.name,
    network: station.network,
    icon: settings.GOV_STATIONS.icon,
    owner: `Government station (public data) · ${source}`,
    link: station.link,
    ...pinned,
  };
}
