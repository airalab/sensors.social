import agents from "../agents.json";
import config from "../config";

export function getAgents() {
  return agents;
}

export function saveMapPosiotion(zoom, lat, lng) {
  localStorage.setItem(
    "map-position",
    JSON.stringify({
      zoom,
      lat,
      lng,
    })
  );
}

export function getMapPosiotion() {
  let result;
  try {
    result = JSON.parse(localStorage.getItem("map-position"));
  } catch (error) {
    console.log(error);
  }
  if (!result) {
    return {
      zoom: config.MAP.zoom,
      lat: config.MAP.position.lat,
      lng: config.MAP.position.lng,
    };
  }
  return result;
}
