<template>
  <MetaInfo
    :pageTitle="$t('Altruist & sensors.social — Environment Monitoring Kit')"
    :pageDescription="
      $t(
        'Two-module environment monitoring kit for indoors and outdoors. Open-source hardware and software for those who care about health, sleep quality, and the air they breathe.'
      )
    "
    pageImage="/og-altruist-info.webp"
  />
  <PageTextLayout>
    <div class="deviceinfo pagetext-prose">
      <div class="pagetext-header">
        <div class="pagetext-eyebrow">sensors.social</div>
        <h1 class="pagetext-title">{{ $t("Altruist & sensors.social") }}</h1>
        <div class="pagetext-subtitle">
          <p>
            {{
              $t("You track your pulse and sleep quality. Now learn about your living environment.")
            }}
          </p>
          <p>
            {{
              $t(
                "Two-module environment monitoring kit for indoors and outdoors — for those who care about health."
              )
            }}
          </p>
        </div>
      </div>

      <section>
        <h2>{{ $t("The Challenge: Measure Your Living Environment") }}</h2>

        <p>
          {{
            $t(
              "You track your pulse, HRV, sleep phases. To achieve the best recovery results — you need to account for sleep conditions and the environment you live in."
            )
          }}
        </p>

        <h3>{{ $t("Indoors") }}</h3>
        <ul>
          <li>{{ $t("CO2 — the main indicator of stuffiness and sleep quality") }}</li>
          <li>{{ $t("Temperature and humidity — comfort and mold prevention") }}</li>
        </ul>

        <h3>{{ $t("Outdoors") }}</h3>
        <ul>
          <li>{{ $t("Dust PM2.5/PM10 — know when it is safe to ventilate") }}</li>
          <li>{{ $t("Noise — explain awakenings and assess your neighborhood") }}</li>
          <li>{{ $t("Temperature and humidity — the full picture outside your window") }}</li>
        </ul>

        <p class="pagetext-highlight">
          {{
            $t(
              "This lets you make data-driven decisions: when to open windows, when to turn on the purifier, how to improve sleep."
            )
          }}
        </p>
      </section>

      <section>
        <h2>{{ $t("Solution: Altruist Bundle") }}</h2>

        <p>
          {{ $t("Two modules — one picture of your living environment:") }}
        </p>

        <h3>{{ $t("Urban (balcony / roof)") }}</h3>
        <ul>
          <li>{{ $t("Dust PM2.5 / PM10 (SDS011)") }}</li>
          <li>{{ $t("Temperature and humidity") }}</li>
          <li>{{ $t("Noise level") }}</li>
          <li>{{ $t("Atmospheric pressure") }}</li>
        </ul>
        <p>
          <i>{{ $t('"What is outside the window right now?"') }}</i>
        </p>

        <h3>{{ $t("Insight (bedroom / living room)") }}</h3>
        <ul>
          <li>{{ $t("CO2") }}</li>
          <li>{{ $t("Temperature") }}</li>
          <li>{{ $t("Humidity") }}</li>
          <li>{{ $t('E-ink display 4.2" + SD card') }}</li>
        </ul>
        <p>
          <i>{{ $t('"What am I breathing at home?"') }}</i>
        </p>

        <p class="pagetext-highlight">
          {{
            $t(
              "Key feature — indoor/outdoor comparison: when to ventilate and when to close the windows."
            )
          }}
        </p>
      </section>

      <section>
        <h2>{{ $t("Market: No Such Product Exists") }}</h2>

        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{{ $t("Product") }}</th>
                <th>{{ $t("Indoor") }}</th>
                <th>{{ $t("Outdoor") }}</th>
                <th>{{ $t("Noise") }}</th>
                <th>{{ $t("Bundle") }}</th>
                <th>{{ $t("Health link") }}</th>
                <th>{{ $t("Price") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>Altruist Bundle</b></td>
                <td>CO2, t, RH</td>
                <td>PM2.5/10, t, RH, {{ $t("noise") }}</td>
                <td>&#10003;</td>
                <td>&#10003;</td>
                <td>open API</td>
                <td>—</td>
              </tr>
              <tr>
                <td>Ultrahuman Home</td>
                <td>CO2, PM, VOC, {{ $t("noise") }}</td>
                <td>—</td>
                <td>&#10003; indoor</td>
                <td>—</td>
                <td>&#10003; Ring AIR</td>
                <td>$349</td>
              </tr>
              <tr>
                <td>IQAir Bundle</td>
                <td>PM2.5, CO2, t, RH</td>
                <td>PM, t, RH</td>
                <td>—</td>
                <td>&#10003;</td>
                <td>—</td>
                <td>~$600</td>
              </tr>
              <tr>
                <td>AirGradient (2 {{ $t("pcs") }})</td>
                <td>PM, CO2, VOC, NOx</td>
                <td>PM, CO2, VOC, NOx</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>~$455</td>
              </tr>
              <tr>
                <td>Awair Element</td>
                <td>CO2, PM, VOC, t, RH</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>$150</td>
              </tr>
              <tr>
                <td>Airthings View Plus</td>
                <td>Radon, PM, CO2, VOC</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>$299</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          {{
            $t(
              "WHOOP, Oura, Garmin, Apple Watch — do not work with environmental sensors and have no plans to. Samsung Sleep Environment Report — indoor-only via SmartThings."
            )
          }}
        </p>
      </section>

      <section>
        <h2>{{ $t("Who Needs Altruist") }}</h2>

        <h3>{{ $t("Health tracking?") }}</h3>
        <p>
          {{
            $t(
              "Wear a WHOOP, Oura, or sleep tracker — Altruist completes the picture. CO2 in the bedroom affects sleep depth. Outdoor noise explains awakenings. Dust triggers allergies and asthma."
            )
          }}
        </p>

        <h3>{{ $t("Asthma and allergies") }}</h3>
        <p>
          {{
            $t(
              "PM2.5 < 30 µg/m³ in the bedroom. Rising outdoor dust → signal to close windows and turn on the purifier."
            )
          }}
        </p>

        <h3>{{ $t("Children") }}</h3>
        <p>
          {{ $t("CO2 and dust in the nursery. Mold prevention through humidity control.") }}
        </p>

        <h3>{{ $t("Real estate") }}</h3>
        <p>
          {{
            $t(
              "Quick environment assessment when moving — data you'll discover over years. Charts boost the appeal of rental housing."
            )
          }}
        </p>

        <h3>{{ $t("Automation") }}</h3>
        <p>
          {{ $t("Control air purifiers and air conditioners using indoor/outdoor sensor data.") }}
        </p>

        <h3>{{ $t("Civic monitoring") }}</h3>
        <p>
          {{
            $t(
              "Dust storms, industrial emissions, noise background. Data is available to everyone via the open map sensors.social."
            )
          }}
        </p>
      </section>

      <section>
        <h2>{{ $t("8 Years of Altruism") }}</h2>

        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{{ $t("Year") }}</th>
                <th>{{ $t("Event") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2017–2018</td>
                <td>
                  {{
                    $t(
                      "First R&D — air quality measurement at playgrounds in an industrial city. Professional certified sensors, IoT cloud transmission."
                    )
                  }}
                </td>
              </tr>
              <tr>
                <td>2018</td>
                <td>
                  {{
                    $t(
                      "Trust problem: society rejects citizen monitoring data. Pivot to the Luftdaten/sensors.community model from Stuttgart — affordable DIY kits instead of expensive stations."
                    )
                  }}
                </td>
              </tr>
              <tr>
                <td>2019</td>
                <td>
                  {{
                    $t(
                      "Three R&D projects: dozens of sensors on city billboards, a solar water drone for water quality analysis, drones over landfills. Recognition at IoT World Congress in Barcelona."
                    )
                  }}
                </td>
              </tr>
              <tr>
                <td>2021</td>
                <td>
                  {{
                    $t(
                      "Launch of sensors.social prototype, showcase at UN COP25 platform. Federated sensor network architecture, all code on GitHub."
                    )
                  }}
                </td>
              </tr>
              <tr>
                <td>2022–2025</td>
                <td>
                  {{
                    $t(
                      "Custom hardware development: ~7 PCB iterations, manufacturing in China, assembly, field tests. By mid-2025 — the two-module Altruist is ready for sale."
                    )
                  }}
                </td>
              </tr>
              <tr>
                <td>2026</td>
                <td>
                  {{ $t("Indiegogo, then Amazon and regional distributors. EU/US certification.") }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="pagetext-highlight">
          {{
            $t(
              "Dozens of software releases over 4 years to build a user sensor network without corporate clouds. 120+ sensors on 4 continents."
            )
          }}
        </p>
      </section>

      <section>
        <h2>{{ $t("Open Stack") }}</h2>

        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{{ $t("Layer") }}</th>
                <th>{{ $t("Technology") }}</th>
                <th>{{ $t("Repository") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ $t("Device") }}</td>
                <td>ESP32-C6, PlatformIO, Arduino</td>
                <td>
                  <a
                    href="https://github.com/airalab/altruist-firmware"
                    target="_blank"
                    rel="noopener"
                    >airalab/altruist-firmware</a
                  >
                </td>
              </tr>
              <tr>
                <td>{{ $t("Connectivity") }}</td>
                <td>Python 3.10+, libp2p, IPFS, MQTT</td>
                <td>
                  <a
                    href="https://github.com/airalab/sensors-connectivity"
                    target="_blank"
                    rel="noopener"
                    >airalab/sensors-connectivity</a
                  >
                </td>
              </tr>
              <tr>
                <td>{{ $t("Blockchain") }}</td>
                <td>Rust, Substrate, Polkadot parachain</td>
                <td>
                  <a href="https://github.com/airalab/robonomics" target="_blank" rel="noopener"
                    >airalab/robonomics</a
                  >
                </td>
              </tr>
              <tr>
                <td>{{ $t("Analytics") }}</td>
                <td>Node.js, MongoDB, Express, Socket.IO</td>
                <td>
                  <a href="https://github.com/airalab/RoSeMAN" target="_blank" rel="noopener"
                    >airalab/RoSeMAN</a
                  >
                </td>
              </tr>
              <tr>
                <td>{{ $t("dApp") }}</td>
                <td>Vue 3, Vite, Leaflet, Highcharts, libp2p</td>
                <td>
                  <a href="https://github.com/airalab/sensors.social" target="_blank" rel="noopener"
                    >airalab/sensors.social</a
                  >
                </td>
              </tr>
              <tr>
                <td>{{ $t("Hardware") }}</td>
                <td>KiCad, 3D {{ $t("models") }}, BOM, {{ $t("certificates") }}</td>
                <td>
                  <a href="https://github.com/airalab/hardware" target="_blank" rel="noopener"
                    >airalab/hardware</a
                  >
                </td>
              </tr>
              <tr>
                <td>{{ $t("Firmware (web)") }}</td>
                <td>Web Serial API</td>
                <td>
                  <a href="https://github.com/airalab/webflasher" target="_blank" rel="noopener"
                    >airalab/webflasher</a
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>{{ $t("Integrations") }}</h3>
        <ul>
          <li>{{ $t("Home Assistant (local + Robonomics cloud)") }}</li>
          <li>{{ $t("sensors.community (Luftdaten compatibility)") }}</li>
          <li>{{ $t("Nova Wallet (mobile access)") }}</li>
        </ul>

        <h3>{{ $t("Everything is open") }}</h3>
        <ul>
          <li>{{ $t("Board schematics, firmware, backend, frontend") }}</li>
          <li>{{ $t("Course on Robonomics Academy") }}</li>
          <li>{{ $t("Data is not sold — open knowledge base") }}</li>
        </ul>
      </section>
      <section>
        <h2>{{ $t("Architecture: From Sensor to User") }}</h2>

        <div class="pagetext-pre-scroll">
          <pre>
Altruist (Urban + Insight)
    |
    v
Robonomics Connectivity Provider — Python, libp2p, IPFS
    |
    |—> Real-time (libp2p) —> sensors.social (Vue 3, Leaflet)
    |
    └—> Polkadot World Computer —> Digital Twins (immutable)
                                    |
                                    v
                            RoSeMAN (Node.js, MongoDB)
                                    |
                                    v
                            sensors.social + API
        </pre
          >
        </div>

        <h3>{{ $t("Three principles") }}</h3>
        <ul>
          <li>{{ $t("No data manipulation (blockchain)") }}</li>
          <li>{{ $t("No single point of failure") }}</li>
          <li>{{ $t("Federated provider model") }}</li>
        </ul>

        <h3>{{ $t("Device") }}</h3>
        <ul>
          <li>{{ $t("ESP32-C6 (RISC-V), open source") }}</li>
          <li>{{ $t("Firmware via browser (Web Serial)") }}</li>
          <li>{{ $t("IoT subscription via XRT token") }}</li>
        </ul>
      </section>

      <section class="pagetext-highlight">
        <p>
          {{ $t("The true picture of your living environment. Open hardware and code. Web3.") }}
        </p>
        <p>
          <a href="https://sensors.social" target="_blank" rel="noopener">sensors.social</a> ·
          <a href="https://github.com/airalab" target="_blank" rel="noopener">GitHub</a>
        </p>
      </section>
    </div>
  </PageTextLayout>
</template>

<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import MetaInfo from "../components/MetaInfo.vue";
import PageTextLayout from "../components/layouts/PageText.vue";

const router = useRouter();

onMounted(() => {
  const waitForMatomo = setInterval(() => {
    if (typeof window.Matomo !== "undefined" && typeof window.Matomo.getTracker === "function") {
      clearInterval(waitForMatomo);

      const trackPage = () => {
        const tracker = window.Matomo.getTracker();
        if (tracker && !tracker.isUserOptedOut()) {
          window._paq.push(["setCustomUrl", router.currentRoute.value.fullPath]);
          window._paq.push(["setDocumentTitle", document.title]);
          window._paq.push(["trackPageView"]);
        }
      };

      trackPage();
    }
  }, 100);
});
</script>

<style scoped>
:global(.container-pagetext) > .deviceinfo {
  max-width: 100%;
}
</style>
