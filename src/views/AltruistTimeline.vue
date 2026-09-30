<template>
  <MetaInfo
    :pageTitle="$t('8 Years of Altruism - Altruist Timeline')"
    :pageDescription="
      $t(
        'At the end of July 2025, a team of open source developers working on a smart home device ecosystem will present their first product in a planned line of smart home devices for the year — a consumer device called “Altruist”.'
      )
    "
    pageImage="/og-altruist-timeline.webp"
  />
  <PageTextLayout>
    <div class="pagetext-prose">
      <div class="pagetext-header">
        <div class="pagetext-eyebrow">sensors.social</div>
        <h1 class="pagetext-title">{{ $t("8 Years of Altruism") }}</h1>
        <p class="pagetext-subtitle">
          {{
            $t(
              "At the end of July 2025, a team of open source developers working on a smart home device ecosystem will present their first product in a planned line of smart home devices for the year — a consumer device called “Altruist”."
            )
          }}
        </p>
      </div>

      <section>
        <img
          alt=""
          class="pagetext-fullwidth-image"
          src="../assets/images/pages/altruist-timeline/timeline.webp"
        />
      </section>

      <section>
        <p>
          {{
            $t(
              "Altruist is a two-module air quality sensor that will be useful for residents of large cities, home automation enthusiasts, and those who want to create their own local environmental monitoring community anywhere in the world. Altruist has many advantages in its class of devices, which we’ll discuss separately, but in this publication, we want to tell the story leading up to the launch of this consumer product — a unique and fascinating story!"
            )
          }}
        </p>
      </section>

      <section>
        <h2>
          {{
            $t(
              "Year 2017: The 1st R&D – Air Quality Measurement on Playgrounds in an Industrial City"
            )
          }}
        </h2>
        <p>
          {{
            $t(
              "In the winter of 2017–2018, Robonomics engineers purchased professional air quality sensors certified for the European market, which allowed detailed analysis of air quality for specific impurities, such as NOx, SOx — typical of car and factory emissions. The sensor also measured dust particles in the air and basic environmental parameters."
            )
          }}
        </p>
        <p>
          {{
            $t(
              "The uniqueness of this sensor — which might seem funny in 2025 — was that in 2017 it was still difficult to find well-known sensors with IoT modules for cloud data transfer. The Spanish manufacturer Libelium offered expensive sensors, but we decided to buy them to develop software for real-time connection of the sensor to an information page and a cloud database — that was the experiment. Thus, for the first time, we started monitoring air quality using modern methods, which, unlike state systems at that time, allowed data to be collected not manually and more frequently than twice a day, and sensors could be placed almost anywhere — for example, on a lamppost in a residential courtyard at a playground."
            )
          }}
        </p>
      </section>

      <section>
        <h2>
          {{
            $t(
              "Year 2018: The Problem of Trust in Society and Searching for Alternatives for Citizen Monitoring"
            )
          }}
        </h2>
        <p>
          {{
            $t(
              "The summer of 2018 was a real test for us! We prepared our first report on the development of a 24/7 civic monitoring mechanism based on modern open source internet technologies and wanted to present the results of a one-year trial from a single playground in an industrial city. But things did not go as expected. In local social network groups, our report was met with a wave of criticism, insults, and all kinds of accusations! The problem was that citizens did not like the fact that in a specific city area, near water, far from factories, the air turned out to be not that bad, which angered residents of less environmentally favorable areas. They accused us of being hired by the government to prepare such a report, called us corrupt, claimed we were spending some federal budget (even though everything was paid for by the project team). So, a huge amount of criticism, and no focus on the software we developed or discussion of the data website. Only criticism of where the measurements were taken."
            )
          }}
        </p>
        <p>
          {{
            $t(
              "Realizing that no matter what we did, we could not motivate citizens to equip playgrounds with sensors using funds from house maintenance fees and provide them with an online service for residents, we started looking for an alternative to our initial idea. This is how we found a project from Stuttgart (also an industrial region with an automotive industry, like Tolyatti on the Volga, where we did our tests). Luftdaten or sensors.community was already, in our view, the first successful citizen monitoring project, whose organizational approach helped overcome the public trust issue for sensor data. The idea was that instead of expensive monitoring funded by an entire building, you could offer individual enthusiasts a DIY kit to build a home air quality station, dramatically reducing both costs and complexity. By then, the project already had thousands of users in Europe. Inspired by their approach and considering our own experience from the previous year, we continued developing the open source online service, shifting towards a sensor map instead of a local air quality portal for residential courtyards."
            )
          }}
        </p>
      </section>

      <section>
        <h2>{{ $t("Year 2019: Three Cool R&D Projects in Air and Water Quality Monitoring") }}</h2>
        <p>
          {{
            $t(
              "By mid-2018, we began experimenting with affordable, but high-quality dust sensors without detailed analysis of specific substances. We also tried futuristic mobility scenarios for environmental sensors."
            )
          }}
        </p>
        <p>
          {{
            $t(
              "Over about 12–14 months, we deployed dozens of sensors in city billboards in Tolyatti, created a solar-powered water drone capable of analyzing water quality online in a similar way, and conducted experiments with ecologists to test the hypothesis that air quality sensors on aerial drones could be used in hard-to-reach areas, such as around landfill sites."
            )
          }}
        </p>
        <p>
          {{
            $t(
              "Our water drone project was ultimately chosen as a showcase at the largest IoT World Congress in Europe, in Barcelona in 2019. The billboard sensors proved reliable and gave the first insights during city pollution events, as data came from many points across the city."
            )
          }}
        </p>
        <p>
          {{
            $t(
              "We even managed to arrange for a certified mobile laboratory to visit for detailed analysis when we detected sustained particle exceedances from 2–3 neighboring sensors. But in 2019, COVID started, and almost all activity except laboratory work had to be stopped for a while…"
            )
          }}
        </p>
      </section>

      <section>
        <h2>
          {{
            $t(
              "Year 2021: Launching the sensors.social Prototype and Showcasing at the UN COP25 Platform"
            )
          }}
        </h2>
        <p>
          {{
            $t(
              "By early 2021, the Altruist developer team, together with partners, launched an initiative to create an open environmental data repository that could potentially replace audit checks in the MRV (monitoring, reporting, verification) field. We hope to return to the UN platform in a few years and show how sensor networks, without human involvement, can verify sustainable emissions reduction — or, on the contrary, prove the opposite regardless of company claims in your region."
            )
          }}
        </p>
        <p>
          {{
            $t(
              "We also started focusing on the quality of sensor network architecture with mapping. We developed an architecture allowing the creation of federated sensor networks based on Altruist, providing great freedom for local communities to set up their own services as needed, and released all the code on GitHub. Today, sensors.social serves as a reference implementation, available for anyone in the world to create their own sensor network."
            )
          }}
        </p>
        <p>
          {{
            $t(
              "Over the past four years, we have made dozens of software releases necessary to build a user sensor network without corporate clouds. Today, sensors.social is both one of the most complex examples of sensor network integration and at the same time…"
            )
          }}
        </p>
      </section>

      <section>
        <h2>
          {{ $t("Years 2022–2025: Hardware Design and the Start of Altruist Dev Kit Sales") }}
        </h2>
        <p>
          {{
            $t(
              "Having built involvement in civic sensor networks, sensor maps, and analytics online services, we decided to develop our own sensor device, rather than assembling them from kits for each user who wanted to join the project."
            )
          }}
        </p>
        <p>
          {{
            $t(
              "This took us three years, about seven design iterations — ordering PCB manufacturing from Chinese factories, assembling cases, and testing in real conditions. As a result, by mid-2025, the two-module Altruist air quality sensor is ready for sale on online platforms."
            )
          }}
        </p>
      </section>

      <section>
        <h2>{{ $t("What’s Next?") }}</h2>
        <p>
          {{
            $t(
              "Soon, we will launch on Indiegogo, and then we want to make the Altruist sensor available worldwide through online platforms like Amazon, as well as on regional distributor websites. Check the “devices” section at robonomics.network, select “Altruist”, and purchase it in the way that is most convenient for you."
            )
          }}
        </p>
        <p>
          {{ $t("Find out who Altruist was designed for") }}
          <router-link to="/altruist-use-cases">{{ $t("on this page") }}</router-link>
        </p>
      </section>
    </div>

    <div class="pagetext-wide-1920 pagetext-no-text-all">
      <AltruistCompare />
    </div>
  </PageTextLayout>
</template>

<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";

import MetaInfo from "../components/MetaInfo.vue";
import PageTextLayout from "../components/layouts/PageText.vue";
import AltruistCompare from "../components/devices/altruist/AltruistCompare.vue";

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

      // Track the initial page load
      trackPage();
    }
  }, 100);
});
</script>
