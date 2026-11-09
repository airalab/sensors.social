# sensors.social

[![License: AGPL-3.0](https://img.shields.io/github/license/airalab/sensors.social)](LICENSE)
[![Release](https://img.shields.io/github/v/release/airalab/sensors.social)](https://github.com/airalab/sensors.social/releases)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fsensors.social&label=sensors.social)](https://sensors.social)

---

![sensors.social — map of independent air quality sensors](public/og-default.webp)

**sensors.social** is a decentralized application that visualizes data from sensors sending their measurements to the blockchain (Polkadot network, Robonomics parachain). Live map: **[sensors.social](https://sensors.social)**.

The platform supports two modes of operation:

- **Peer-to-peer connectivity** for direct access to sensor data.
- **Federative concept** for accumulating sensor data and displaying measurement history.

Sensor data comes from [Altruist](https://github.com/airalab/altruist-firmware) and other citizen sensors via [sensors-connectivity](https://github.com/airalab/sensors-connectivity) and is served by [RoSeMAN](https://github.com/airalab/RoSeMAN). For connectivity and running your own server, see [Robonomics Academy](https://robonomics.academy/en/learn/sensors-connectivity-course/overview/).

## Quick start

Requires Node.js 16+ and npm.

```sh
git clone https://github.com/airalab/sensors.social.git
cd sensors.social
npm install
npm run dev
```

## Documentation

- [Set up your own map](docs/self-hosting.md) — fork, `config.json`, geocoding, map themes, libp2p agents, sensor types
- [Blog](docs/blog.md) — adding posts, drafts, publishing checklist
- [Localization & translations](docs/localization.md) — adding a language, measurement texts, auto-translation, translating posts
- [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Changelog](CHANGELOG.md) · [Release process](RELEASE.md)

## 📄 License

- **Code** — [GNU AGPL v3.0](LICENSE), Copyright (C) 2026 Pinout Limited. Code released before this change stays available under [BSD 3-Clause](LICENSES/BSD-3-Clause-Airalab.txt), Copyright (c) 2018, Airalab.
- **Blog content** (`src/blog/`) — [CC BY 4.0](src/blog/LICENSE.md).
- **Open measurement data** — [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/), attribution "© sensors.social contributors".
- The names "sensors.social" and "Altruist" are not covered by these licences.

Details — [NOTICE](NOTICE).

## ❓ Support

For questions or suggestions, create an **issue** in the repository.
