import agents from "../agents.json";
import config from "../config";

export function getAgents() {
  return agents;
}

export function setTypeProvider(type) {
  localStorage.setItem("provider_type", type);
}

export function getTypeProvider() {
  return localStorage.getItem("provider_type") || config.DEFAUL_TYPE_PROVIDER;
}
