<template>
  <div id="menu" class="sensors-panel container">
    <div class="popup__content">
      <h3>{{ $t("header.subtitleAbout") }}</h3>
      <p class="text">
        {{ $t("header.description1") }}
        <a
          href="https://www.fsf.org/campaigns/priority-projects/decentralization-federation"
          target="_blank"
          rel="noreferrer noopener"
          >{{ $t("header.descriptionLink1") }}</a
        >
        {{ $t("header.description2") }}
        <a
          href="https://robonomics.academy/en/learn/sensors-connectivity-course/sensors-connectivity-module/"
          target="_blank"
          rel="noreferrer noopener"
          >{{ $t("header.descriptionLink2") }}</a
        >
      </p>

      <nav id="nav" class="sensors-panel-top-nav">
        <div class="sensors-panel-top-nav-content">
          <h3>{{ $t("header.subtitleSupport") }}</h3>
          <ul class="nav__list">
            <li class="nav__item">
              <a
                href="hhttps://github.com/airalab/sensors.robonomics.network"
                class="nav__link"
                target="_blank"
                rel="noreferrer noopener"
              >
                {{ $t("header.fork") }}
              </a>
            </li>
            <li class="nav__item">
              <a
                href="https://robonomics.academy/en/learn/sensors-connectivity-course/sensor-hardware/"
                class="nav__link"
                target="_blank"
                rel="noreferrer noopener"
              >
                {{ $t("header.connect") }}
              </a>
            </li>
            <li class="nav__item">
              <a
                href="https://robonomics.academy/en/learn/sensors-connectivity-course/sensors-connectivity-module/"
                class="nav__link"
                target="_blank"
                rel="noreferrer noopener"
              >
                {{ $t("header.create") }}
              </a>
            </li>
          </ul>
          <h3>{{ $t("header.subtitleOther") }}</h3>
          <ul class="nav__list">
            <li class="nav__item">
              <router-link class="nav__link" :to="{ name: 'air-measurements' }">
                {{ $t("header.measurements") }}
              </router-link>
            </li>
            <li class="nav__item">
              <router-link class="nav__link" :to="{ name: 'privacy-policy' }">
                {{ $t("header.policy") }}
              </router-link>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  </div>
</template>

<style scope>
#menu a {
  cursor: pointer;
}
</style>
