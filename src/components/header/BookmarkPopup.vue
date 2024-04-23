<template>
  <div id="bookmark" class="sensors-panel container">
    <button class="header__close-popup"></button>
    <div class="popup__content">
      <h3>{{ $t("header.bookmarkTitle") }}</h3>
      <ul v-if="bookmarks.length">
        <li
          class="bookmark__item text"
          v-for="bookmark in bookmarks"
          :key="bookmark.id"
        >
          <a target="_blank" :href="bookmark.link">
            <h4>{{ bookmark.customName }}</h4>
            <span>{{ bookmark.address }}</span>
          </a>
        </li>
      </ul>
      <div v-else>no bookmarks yet...</div>
    </div>
  </div>
</template>

<script>
import { nextTick } from "vue";
export default {
  data() {
    return {
      bookmarks: [],
    };
  },

  methods: {
    async getDb() {
      return new Promise((resolve, reject) => {
        let request = window.indexedDB.open("SensorsDBBookmarks", 1);

        request.onerror = (e) => {
          console.log("Error opening db", e);
          reject("Error");
        };

        request.onsuccess = (e) => {
          resolve(e.target.result);
        };

        request.onupgradeneeded = (e) => {
          let db = e.target.result;
          db.createObjectStore("bookmarks", {
            autoIncrement: true,
            keyPath: "id",
          });
        };
      });
    },

    async getData() {
      return new Promise((resolve) => {
        let trans = this.db.transaction(["bookmarks"], "readonly");
        trans.oncomplete = () => {
          resolve(bookmarks);
        };

        let store = trans.objectStore("bookmarks");
        let bookmarks = [];

        store.openCursor().onsuccess = (e) => {
          let cursor = e.target.result;
          if (cursor) {
            bookmarks.push(cursor.value);
            cursor.continue();
          }
        };
      });
    },
  },

  async created() {
    this.db = await this.getDb();
    this.bookmarks = await this.getData();
  },

  mounted() {
    nextTick(() => {
      document
        .querySelector(".header__bookmark")
        .querySelector("details")
        .addEventListener("toggle", async () => {
          this.db = await this.getDb();
          this.bookmarks = await this.getData();
        });
    });
  },
};
</script>

<style scoped>
#bookmark {
  padding-top: 0;
  display: flex;
  flex-direction: column;
}

.bookmark__item:not(:last-child) {
  margin-bottom: var(--gap);
}

.bookmark__item a {
  display: inline-block;
  width: 100%;
  padding: calc(var(--gap) * 0.7);
  color: var(--color-dark);
  background-image: url('data:image/svg+xml,<svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.21944 10.9479C0.511028 11.2395 0.981138 11.2395 1.27273 10.9479L6.21781 6.00283C6.44989 5.77075 6.44989 5.39585 6.21781 5.16377L1.27273 0.218691C0.981138 -0.0728969 0.511028 -0.0728969 0.21944 0.218691C-0.0721472 0.510278 -0.0721472 0.980388 0.21944 1.27198L4.52779 5.58628L0.213489 9.90058C-0.0721473 10.1862 -0.0721472 10.6623 0.21944 10.9479Z" fill="%2303A5ED"/></svg>');
  background-size: 7px 12px;
  background-position: right;
  background-repeat: no-repeat;
  border-top: 0.5px solid var(--color-dark);
  border-bottom: 0.5px solid var(--color-dark);
}

.bookmark__item h4 {
  margin: 0;
  font-size: calc(var(--font-size) * 1.2);
  font-weight: 400;
  color: var(--color-blue);
}

.bookmark__item h4::first-letter {
  text-transform: capitalize;
}

.bookmark__item a:hover {
  border-color: var(--color-blue);
}
</style>
