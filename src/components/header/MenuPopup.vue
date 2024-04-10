<template>
  <div id="menu" class="sensors-panel container">
    <button class="header__close-popup"></button>
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

      <h3>{{ $t("header.subtitleJoin") }}</h3>
      <p class="text">
        {{ $t("header.description3") }}
        <a
          href="https://robonomics.academy/en/learn/sensors-connectivity-course/sensor-hardware/"
          target="_blank"
          rel="noreferrer noopener"
          >{{ $t("header.descriptionLink3") }}</a
        >
        {{ $t("header.description4") }}
        <a
          href="https://robonomics.academy/en/learn/sensors-connectivity-course/setting-up-and-connecting-sensors/"
          target="_blank"
          rel="noreferrer noopener"
          >{{ $t("header.descriptionLink4") }}</a
        >
        {{ $t("header.description5") }}
      </p>

      <a
        href="https://youtu.be/AQ7ZzgbN7jU?si=Y_FsDCEw5T97"
        class="text"
        target="_blank"
        rel="noreferrer noopener"
      >
        {{ $t("header.assembly") }}
      </a>

      <nav id="nav" class="sensors-panel-top-nav">
        <div class="sensors-panel-top-nav-content">
          <h3>{{ $t("header.subtitleSupport") }}</h3>
          <ul class="nav__list text">
            <li class="nav__item">
              <a
                href="hhttps://github.com/airalab/sensors.robonomics.network"
                target="_blank"
                rel="noreferrer noopener"
              >
                {{ $t("header.fork") }}
              </a>
            </li>
            <li class="nav__item">
              <a
                href="https://robonomics.academy/en/learn/sensors-connectivity-course/sensor-hardware/"
                target="_blank"
                rel="noreferrer noopener"
              >
                {{ $t("header.connect") }}
              </a>
            </li>
            <li class="nav__item">
              <a
                href="https://robonomics.academy/en/learn/sensors-connectivity-course/sensors-connectivity-module/"
                target="_blank"
                rel="noreferrer noopener"
              >
                {{ $t("header.create") }}
              </a>
            </li>
            <li></li>
          </ul>
          <router-link class="text" :to="{ name: 'privacy-policy' }">
            {{ $t("header.policy") }}
          </router-link>
        </div>
      </nav>
    </div>
  </div>
</template>

<style scope>
#menu {
  padding-top: 0;
  display: flex;
  flex-direction: column;
}

#menu a {
  cursor: pointer;
}

#menu .popup__content {
  max-height: 700px;
}

@media screen and (max-width: 640px) {
  #menu .popup__content {
    max-height: 300px;
  }
}
</style>
