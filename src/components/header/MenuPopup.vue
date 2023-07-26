<template>
  <div id="menu" class="sensors-panel container">
    <div class="popup__content">
      <p class="text">
        {{ $t("header.description") }}
      </p>

      <nav id="nav" class="sensors-panel-top-nav">
        <div class="sensors-panel-top-nav-content">
          <ul class="nav__list">
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
                href="https://github.com/airalab/sensors.robonomics.network/issues"
                class="nav__link"
                target="_blank"
                rel="noreferrer noopener"
              >
                {{ $t("header.issue") }}
              </a>
            </li>
            <li class="nav__item">
              <a
                href="https://github.com/airalab/sensors.robonomics.network"
                class="nav__link"
                target="_blank"
                rel="noreferrer noopener"
              >
                {{ $t("header.fork") }}
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.nav__item {
  padding: 0.8rem 0;
  margin-bottom: 0;
}

.nav__item:not(:last-child) {
  border-bottom: 1px solid var(--color-light-gray);
}

.nav__link {
  font-family: var(--font-family--normal);
  font-weight: 600;
  color: var(--color-blue);
  text-transform: none;
}

#menu .text {
  font-style: italic;
  text-align: left !important;
}
</style>
