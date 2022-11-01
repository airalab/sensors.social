<template>
  <div>
    <h2>{{ $t("details.user") }} {{ data.username }}</h2>
    <div class="sensor-popup--subtitle">
      <span><i class="fa-solid fa-stopwatch"></i> {{ dateMsg }}</span>
    </div>
    <div style="margin-top: 30px">
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
    };
  },
  computed: {
    dateMsg: function () {
      return moment(this.data.timestamp, "X").format("DD.MM.YYYY HH:mm:ss");
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
