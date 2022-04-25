export default {
  IPFS: {
    fallback: {
      repo: "ipfs/robonomics/5",
      config: {
        Addresses: {
          Swarm: [
            "/dns4/1.webrtcstar.aira.life/tcp/443/wss/p2p-webrtc-star/",
            "/dns4/2.webrtcstar.aira.life/tcp/443/wss/p2p-webrtc-star/",
            "/dns4/3.webrtcstar.aira.life/tcp/443/wss/p2p-webrtc-star/",
          ],
        },
        Bootstrap: [
          "/dns4/1.pubsub.aira.life/tcp/443/wss/ipfs/QmdfQmbmXt6sqjZyowxPUsmvBsgSGQjm4VXrV7WGy62dv8",
          "/dns4/2.pubsub.aira.life/tcp/443/wss/ipfs/QmPTFt7GJ2MfDuVYwJJTULr6EnsQtGVp8ahYn9NSyoxmd9",
          "/dns4/3.pubsub.aira.life/tcp/443/wss/ipfs/QmWZSKTEQQ985mnNzMqhGCrwQ1aTA6sxVsorsycQz9cQrw",
        ],
      },
    },
    cdn: "https://cdn.jsdelivr.net/npm/ipfs@0.61.0/index.min.js",
    permission: [
      "id",
      "files.cat",
      "files.add",
      "pubsub.peers",
      "pubsub.publish",
      "pubsub.subscribe",
      "swarm.peers",
      "swarm.connect",
    ],
  },
  REMOTE_PROVIDER: "https://roseman.airalab.org/",
  WIND_PROVIDER: "https://wind.airalab.org/latest",
  MAP: {
    zoom: "3",
    position: {
      lat: "50.1206",
      lng: "92.9883",
    },
  },
};
