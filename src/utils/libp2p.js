import { noise } from "@chainsafe/libp2p-noise";
import { bootstrap } from "@libp2p/bootstrap";
import { floodsub } from "@libp2p/floodsub";
import { mplex } from "@libp2p/mplex";
import { webRTC } from "@libp2p/webrtc";
import { webSockets } from "@libp2p/websockets";
import * as filters from "@libp2p/websockets/filters";
import { createLibp2p } from "libp2p";
import { circuitRelayTransport } from "libp2p/circuit-relay";
import { identifyService } from "libp2p/identify";

export const createNode = async (config) => {
  const node = await createLibp2p({
    addresses: {
      listen: ["/webrtc"],
    },

    transports: [
      webSockets({
        filter: filters.all,
      }),
      webRTC(),
      circuitRelayTransport({
        discoverRelays: 1,
      }),
    ],

    streamMuxers: [mplex()],
    connectionEncryption: [noise()],
    services: {
      pubsub: floodsub(),
      identify: identifyService(),
    },
    peerDiscovery: [
      bootstrap({
        list: config.bootstrappers,
      }),
    ],

    connectionGater: {
      denyDialMultiaddr: () => {
        // by default we refuse to dial local addresses from the browser since they
        // are usually sent by remote peers broadcasting undialable multiaddrs but
        // here we are explicitly connecting to a local node so do not deny dialing
        // any discovered address
        return false;
      },
    },
  });

  return node;
};
