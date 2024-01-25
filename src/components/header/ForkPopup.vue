<template>
  <div id="fork" class="sensors-panel container">
    <div class="popup__content">
      <h3>{{ $t("header.subtitleFork") }}</h3>
      <p class="text">
        {{ $t("header.description5") }}
      </p>

      <nav id="nav" class="sensors-panel-top-nav">
        <div class="sensors-panel-top-nav-content">
          <ul class="nav__list">
            <li class="nav__item text">
              <a
                href="https://github.com/airalab/sensors.robonomics.network"
                target="_blank"
                rel="noreferrer noopener"
              >
                {{ $t("header.descriptionLink5") }}
              </a>
            </li>
            <li class="nav__item text">
              <a
                href="https://robonomics.academy/en/learn/sensors-connectivity-course/overview/"
                target="_blank"
                rel="noreferrer noopener"
              >
                {{ $t("header.descriptionLink6") }}
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
