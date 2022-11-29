<template>
  <div
    class="container sensor-popup sensors-panel sensors-panel--center-right active popup-js"
  >
    <div :class="classList">
      <div class="sensor-popup__header-icon">
        <font-awesome-icon icon="fa-solid fa-face-meh" />
      </div>
      <div class="sensor-popup__header-wrapper">
        <h2>
          {{ $t("details.user") }}
          {{ data.username }}
        </h2>

        <div class="sensor-popup--subtitle">
          <span>
            <font-awesome-icon icon="fa-solid fa-stopwatch" /> {{ dateMsg }}
          </span>
        </div>
      </div>
    </div>

    <div ref="content" class="sensor-popup--content">
      <div v-html="replaceWithBr(data.message)"></div>
      <template v-if="isImages">
        <h2>{{ $t("details.photos") }}</h2>
        <div v-if="!imagesLoaded">...</div>
        <template v-else>
          <div v-for="(image, k) in images" :key="k">
            <a :href="image" target="_blank">
              <img style="max-width: 400px" :src="image" />
            </a>
          </div>
          <template>
            <a
              v-for="(image, k) in badImages"
              :key="k"
              :href="image"
              target="_blank"
              >{{ image }}</a
            >
          </template>
        </template>
      </template>
    </div>

    <a
      class="popup__close"
      href="javascript:;"
      @click.stop.prevent="$emit('close')"
    >
      <font-awesome-icon icon="fa-solid fa-xmark" />
    </a>
  </div>
</template>

<script>
import moment from "moment";

function preloadImages(sources, callback) {
  let counter = 0;
  const attempts = {};

  function onLoad() {
    counter++;
    if (counter == sources.length) {
      const images = [];
      const badImages = [];
      for (const image of sources) {
        if (attempts[image] && attempts[image] > 0) {
          console.log(`Bad image ${image}`);
          badImages.push(image);
        } else {
          images.push(image);
        }
      }
      callback(images, badImages);
    }
  }

  for (let source of sources) {
    let img = document.createElement("img");
    img.onload = () => {
      attempts[source] = 0;
      onLoad();
    };
    img.onerror = () => {
      if (!attempts[source]) {
        attempts[source] = 0;
      }
      attempts[source]++;
      if (attempts[source] < 3) {
        img.src = source;
      } else {
        onLoad();
      }
    };
    img.src = source;
  }
}

export default {
  props: ["data"],
  data() {
    return {
      isImages: false,
      images: [],
      badImages: [],
      imagesLoaded: false,
      state: "neutral",
    };
  },
  computed: {
    dateMsg: function () {
      return moment(this.data.timestamp, "X").format("DD.MM.YYYY HH:mm:ss");
    },
    classList() {
      return {
        [`sensor-popup__header`]: true,
        [`sensor-popup__header--${this.state}`]: this.state,
      };
    },
  },
  watch: {
    data() {
      this.imagesLoad();
    },
  },
  created() {
    this.imagesLoad();
  },
  methods: {
    replaceWithBr(v) {
      return v.replace(/\n/g, "<br />");
    },
    imagesLoad() {
      if (this.data.images && this.data.images.length > 0) {
        this.images = [];
        this.badImages = [];
        this.imagesLoaded = false;
        this.isImages = true;
        const images = this.data.images.map(
          (image) =>
            `https://aira.mypinata.cloud/ipfs/${this.data.ipfs}/${image}`
        );
        preloadImages(images, (result, badImages) => {
          if (result.length > 0) {
            this.images = result;
          }
          if (badImages.length > 0) {
            this.badImages = badImages;
          }
          this.imagesLoaded = true;
        });
      } else {
        this.isImages = false;
        this.images = [];
        this.badImages = [];
        this.imagesLoaded = false;
      }
    },
  },
};
</script>

<style scoped>
h2 {
  margin-bottom: calc(var(--gap) * 0.7);
}

.sensors-panel {
  position: absolute;
  top: 40px;
  bottom: 0;
  right: 0;
  z-index: 14;
  width: 48%;
}

.sensor-popup.popup-js {
  padding-right: 0 !important;
  background-color: var(--sensor-popup-bg);
}

.sensor-popup.container {
  /* padding: calc(var(--gap) * 2); */
  padding: 0;
  padding-bottom: calc(var(--gap) * 6);
  /* overflow: hidden; */
}

.sensor-popup .popup__close {
  right: calc(var(--gap) * 2);
  /* top: var(--gap); */
  top: 1.5rem;
  color: #fff;
}

/* SENSOR POPUP */

.sensor-popup__header {
  min-height: 110px;
  padding: calc(var(--gap) * 2) var(--gap);
  display: flex;
  align-items: center;
  color: #fff;
}

.sensor-popup__header-wrapper .fa-copy {
  margin-left: var(--gap);
}

.sensor-popup__header--neutral {
  background-color: #747a80;
}

.sensor-popup__header--good {
  background-color: var(--color-green);
}

.sensor-popup__header--attention {
  background-color: var(--color-orange);
}

.sensor-popup__header--danger {
  background-color: var(--color-red);
}

.sensor-popup__header a {
  color: inherit;
}

.sensor-popup__header-icon {
  font-size: 3rem;
  margin-right: calc(var(--gap) * 2);
}
.sensor-popup--subtitle {
  /* margin-bottom: calc(var(--gap) * 2); */
  display: flex;
  align-items: center;
  /* justify-content: space-between; */
  font-family: var(--font-family--normal);
  text-transform: none;
}

.sensor-popup--subtitle span:not(:last-child) {
  margin-right: calc(var(--gap) * 2);
}

ul.sensor-popup--data {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  list-style: none;
  /* margin: var(--gap) 0; */
  padding: calc(var(--gap) * 0.7) 0;
  /* border-top: 1px solid var(--color-dark);
      border-bottom: 1px solid var(--color-dark); */
}

ul.sensor-popup--data .icon {
  display: inline-block;
  font-size: calc(var(--gap) * 1.5);
  text-align: center;
  width: calc(var(--gap) * 2.5);
}

.sensor-popup--content {
  height: 80%;
  overflow-y: auto;
  padding: calc(var(--gap) * 2);
  padding-top: 0;
  padding-right: calc(var(--gap) * 2.2);
  padding-bottom: calc(var(--gap) * 2);
  margin-top: var(--gap);
  margin-right: calc(var(--gap) * 2);
}

.sensor-popup--content img {
  max-width: 100%;
  width: 100%;
}
/* SENSOR POPUP end */

@media screen and (max-width: 1080px) {
  .sensors-panel {
    width: 90%;
  }
}

@media screen and (max-width: 580px) {
  h2 {
    font-size: 1rem;
  }

  .sensors-panel {
    position: absolute;
    top: calc(var(--gap) * 16);
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9;
    width: 100%;
  }

  .sensor-popup.container {
    /* padding-left: var(--gap);
      padding-right: var(--gap) !important; */
    padding-bottom: calc(var(--gap) * 5);
    /* overflow: hidden; */
  }

  .sensor-popup .popup__close {
    right: var(--gap);
  }

  .sensor-popup__header {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--gap);
  }

  .sensor-popup__header-icon {
    font-size: 2rem;
    line-height: 1.5;
    margin-right: 0;
  }

  .sensor-popup--subtitle span:not(:last-child) {
    margin-right: var(--gap);
  }
}
</style>
