<template>
  <div id="join" class="sensors-panel container">
    <div class="popup__content">
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

      <nav id="nav" class="sensors-panel-top-nav">
        <div class="sensors-panel-top-nav-content">
          <h3>{{ $t("header.subtitleAdditionalSupport") }}</h3>
          <ul class="nav__list">
            <li class="nav__item">
              <a
                href="https://youtu.be/AQ7ZzgbN7jU?si=Y_FsDCEw5T97"
                class="nav__link"
                target="_blank"
                rel="noreferrer noopener"
              >
                {{ $t("header.assembly") }}
              </a>
            </li>
            <li class="nav__item text">
              {{ $t("header.additionalSupportText") }}
              <a
                href="https://github.com/airalab/sensors.robonomics.network"
                target="_blank"
                rel="noreferrer noopener"
              >
                {{ $t("header.additionalSupportLink") }}
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  </div>
</template>

<style scoped>
#join a {
  cursor: pointer;
}
</style>
