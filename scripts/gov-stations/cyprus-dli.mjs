#!/usr/bin/env node
/**
 * Feeder for the "Government stations" map layer: Cyprus national air-quality network.
 *
 * Source: the public site of the Department of Labour Inspection (DLI), Ministry of Labour,
 * Welfare and Social Insurance — https://airquality.dli.mlsi.gov.cy/. Its front page carries the
 * latest hourly value of every pollutant per station; there is no public JSON API, so the page is
 * read and turned into JSON. Hourly is the source's own rate: run this every 15–30 min.
 *
 * Coordinates are not on the DLI page. They come from the EEA station metadata
 * (EEA_stations_meta_table.parquet, Zenodo 17085064) where the station is listed, otherwise from the
 * WAQI/aqicn station map, which republishes the same DLI stations; both agree within ~150 m where
 * both have a station. A station whose position is known only roughly carries `approx: true`.
 * Stations without a trustworthy position are left out (Mari, Kalavasos, Ormidia — see README).
 *
 * Usage: node scripts/gov-stations/cyprus-dli.mjs [out.json]   (stdout when no path)
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import process from "node:process";

const SOURCE_URL = "https://airquality.dli.mlsi.gov.cy/";

const STATIONS = [
  {
    id: "cy-dli-nictra",
    page: "Nicosia - Traffic Station",
    name: "Nicosia — traffic",
    kind: "traffic",
    lat: 35.1519,
    lng: 33.3478,
    geo: "EEA CY0004A",
  },
  {
    id: "cy-dli-nicres",
    page: "Nicosia - Residential Station",
    name: "Nicosia — residential",
    kind: "residential",
    lat: 35.1269,
    lng: 33.3317,
    geo: "EEA CY0006A",
  },
  {
    id: "cy-dli-limtra",
    page: "Limassol - Traffic Station",
    name: "Limassol — traffic",
    kind: "traffic",
    lat: 34.70713,
    lng: 33.02262,
    geo: "WAQI",
  },
  {
    id: "cy-dli-lartra",
    page: "Larnaca - Traffic Station",
    name: "Larnaca — traffic",
    kind: "traffic",
    lat: 34.91591,
    lng: 33.6275,
    geo: "WAQI",
  },
  {
    id: "cy-dli-paftra",
    page: "Paphos - Traffic Station",
    name: "Paphos — traffic",
    kind: "traffic",
    lat: 34.71017,
    lng: 32.57307,
    geo: "WAQI",
  },
  {
    id: "cy-dli-partra",
    page: "Paralimni - Traffic Station",
    name: "Paralimni — traffic",
    kind: "traffic",
    lat: 35.03584,
    lng: 33.96159,
    geo: "WAQI",
  },
  {
    id: "cy-dli-agmbac",
    page: "Ayia Marina Xyliatou - Background Station",
    name: "Ayia Marina Xyliatou — rural background (EMEP)",
    kind: "background",
    lat: 35.038,
    lng: 33.0578,
    geo: "EEA CY0002R",
  },
  {
    id: "cy-dli-zygind",
    page: "Zygi - Industrial Station",
    name: "Zygi — industrial",
    kind: "industrial",
    lat: 34.7333,
    lng: 33.3333,
    geo: "WAQI, rounded",
    approx: true,
  },
];

// Labels on the DLI page → measurement keys of the sensors.social map
const POLLUTANTS = {
  "PM₁₀": "pm10",
  "PM₂.₅": "pm25",
  "O₃": "o3",
  "NO₂": "no2",
  NO: "no",
  NOx: "nox",
  "SO₂": "so2",
  CO: "co",
  "C₆H₆": "c6h6",
};

const decode = (s) =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();

// "24/11/2026 13:00" in Cyprus time → epoch seconds
function cyprusTime(text) {
  const m = text.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/);
  if (!m) return null;
  const [, d, mo, y, h, mi] = m.map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  const offset = new Date(asUtc)
    .toLocaleString("en-US", { timeZone: "Asia/Nicosia", timeZoneName: "longOffset" })
    .match(/GMT([+-]\d{2}):?(\d{2})?/);
  const minutes = offset
    ? Number(offset[1]) * 60 + Math.sign(Number(offset[1])) * Number(offset[2] || 0)
    : 120;
  return Math.round((asUtc - minutes * 60e3) / 1000);
}

export function parse(html) {
  const blocks = html
    .split(/class="[^"]*station-basic-info[^"]*"/)
    .slice(1)
    .map(decode);
  const label = Object.keys(POLLUTANTS)
    .sort((a, b) => b.length - a.length)
    .map((k) => k.replace(/[.]/g, "\\."))
    .join("|");
  const valueRe = new RegExp(`(${label}):\\s*([0-9]+(?:\\.[0-9]+)?)\\s*μg/m³`, "g");
  const out = [];
  for (const st of STATIONS) {
    // The page repeats a station in several widgets. Its own block starts with its name and ends
    // with "Updated on: <time>"; whatever follows belongs to the next station on the page.
    const text = blocks
      .filter((b) => b.replace(/^>\s*/, "").startsWith(st.page))
      .map((b) => b.match(/^.*?Updated on: \d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/)?.[0])
      .filter(Boolean)
      .sort((a, b) => b.length - a.length)[0];
    if (!text) continue;
    const values = {};
    for (const [, k, v] of text.matchAll(valueRe)) values[POLLUTANTS[k]] ??= Number(v);
    const { id, name, kind, lat, lng, approx } = st;
    out.push({ id, name, kind, lat, lng, approx, timestamp: cyprusTime(text), values });
  }
  return out;
}

async function main() {
  const res = await fetch(SOURCE_URL, {
    headers: { "User-Agent": "sensors.social gov-stations feeder" },
  });
  if (!res.ok) throw new Error(`DLI answered ${res.status}`);
  const stations = parse(await res.text());
  if (!stations.length) throw new Error("no stations parsed — the DLI page layout changed");
  const doc = {
    source:
      "Department of Labour Inspection, Ministry of Labour, Welfare and Social Insurance, Republic of Cyprus",
    source_url: SOURCE_URL,
    note: "Public data of the national air quality monitoring network, hourly means, μg/m³. Republished as is.",
    fetched_at: Math.round(Date.now() / 1000),
    stations,
  };
  const json = JSON.stringify(doc, null, 1);
  if (process.argv[2]) await writeFile(process.argv[2], json);
  else process.stdout.write(json + "\n");
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
