import { open } from "rosbag";
import { cat as ipfsCat } from "./ipfs";

function rosBag(data, cb, options = {}) {
  return open(data).then((bag) => {
    return bag.readMessages(options, (result) => {
      cb(result);
    });
  });
}

export function parseResult(result, options = { topics: ["/data", "/geo"] }) {
  let message = {};
  return ipfsCat(result).then(function (r) {
    return rosBag(
      new Blob([r]),
      function (bag) {
        try {
          message[bag.topic] = JSON.parse(bag.message.data);
        } catch (error) {
          message[bag.topic] = bag.message.data;
        }
      },
      options
    ).then(function () {
      return message;
    });
  });
}

export function getAgents() {
  return require("../agents.json").map((agent) => agent.toLowerCase());
}
