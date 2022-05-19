<template>
  <div class="sensors-panel sensors-panel--top">
    <div class="sensors-panel-section">
      <h1 class="sensors-panel-title">{{ $t("header.title") }}</h1>

      <!-- если город один -->
      <div class="sensors-panel-title green">
        {{ city }}
      </div>

      <!-- <div class="sensors-select green">
          <select>
            <option>Тольятти</option>
            <option>Киров</option>
          </select>
          <i class="fa-solid fa-sort-down"></i>
        </div> -->
    </div>

    <div class="sensors-panel-section">
      <a href="#nav" class="sensors-panel-top-nav-selector"
        ><i class="fa-solid fa-bars"></i
      ></a>

      <nav id="nav" class="sensors-panel-top-nav">
        <div class="sensors-panel-top-nav-content">
          <ul>
            <li>
              <a
                href="https://wiki.robonomics.network/docs/en/sensors-network-introduction/"
                target="_blank"
                rel="noreferrer noopener"
                >{{ $t("header.connect") }}</a
              >
            </li>
            <li>
              <a
                href="https://github.com/airalab/sensors.robonomics.network/issues"
                target="_blank"
                rel="noreferrer noopener"
                >{{ $t("header.issue") }}</a
              >
            </li>
            <li>
              <a
                href="https://github.com/airalab/sensors.robonomics.network"
                target="_blank"
                rel="noreferrer noopener"
                >{{ $t("header.fork") }}</a
              >
            </li>
          </ul>
          <a class="sensors-panel-top-nav--close" href="#"
            ><i class="fa-solid fa-circle-xmark"></i
          ></a>
        </div>
      </nav>

      <div class="sensors-select blue">
        <select v-model="locale">
          <option value="en">English</option>
          <option value="ru">Русский</option>
        </select>
        <i class="fa-solid fa-sort-down"></i>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ["localeCurrent", "city"],
  data() {
    return {
      locale: this.localeCurrent,
    };
  },
  watch: {
    locale(newValue) {
      this.$i18n.locale = newValue;
      localStorage.setItem("locale", newValue);
    },
  },
};
</script>
