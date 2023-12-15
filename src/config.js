export default {
  LIBP2P: {
    bootstrappers: [
      "/dns4/1.pubsub.aira.life/tcp/443/wss/ipfs/QmdfQmbmXt6sqjZyowxPUsmvBsgSGQjm4VXrV7WGy62dv8",
      "/dns4/2.pubsub.aira.life/tcp/443/wss/ipfs/QmPTFt7GJ2MfDuVYwJJTULr6EnsQtGVp8ahYn9NSyoxmd9",
      "/dns4/3.pubsub.aira.life/tcp/443/wss/ipfs/QmWZSKTEQQ985mnNzMqhGCrwQ1aTA6sxVsorsycQz9cQrw",
    ],
  },
  REMOTE_PROVIDER: "https://roseman.airalab.org/",
  // REMOTE_PROVIDER: "http://localhost:3000/",
  WIND_PROVIDER: "https://wind.airalab.org/latest",
  MAP: {
    zoom: "13",
    position: {
      lat: "53.5197",
      lng: "49.3647",
    },
  },
  SHOW_MESSAGES: true,
  DEFAUL_TYPE_PROVIDER: "remote",
};
