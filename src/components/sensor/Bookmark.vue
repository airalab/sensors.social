<template>
  <form @submit.prevent="addBookmark" class="sensor-popup__bookmark">
    <input
      type="text"
      v-model="bookmark"
      placeholder="Type a name for sensor here"
      :disabled="IsBookmarked"
    />
    <button v-if="!IsBookmarked">Bookmark</button>
    <button class="bookmarked" v-else>Bookmarked</button>
  </form>
</template>

<script>
export default {
  props: ["address", "link"],

  data() {
    return {
      bookmark: "",
      IsBookmarked: false,
      db: null,
      bookmarks: [],
      bookmarkId: null,
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
          // const transaction = e.target.result.transaction(
          //   ["bookmarks"],
          //   "readwrite"
          // );
          // const objectStoreRequest = transaction.objectStore("bookmarks").clear();
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

    async addDataToDb() {
      return new Promise((resolve) => {
        let trans = this.db.transaction(["bookmarks"], "readwrite");
        trans.oncomplete = () => {
          resolve();
        };

        let store = trans.objectStore("bookmarks");
        store.add({
          customName: this.bookmark,
          address: this.$props.address,
          link: this.$props.link,
        });
      });
    },

    async deleteBookmarkFromDb(id) {
      return new Promise((resolve) => {
        let trans = this.db.transaction(["bookmarks"], "readwrite");
        trans.oncomplete = () => {
          resolve();
        };

        let store = trans.objectStore("bookmarks");
        store.delete(id);
        this.IsBookmarked = false;
        this.bookmarkId = null;
        this.bookmark = "";
      });
    },

    async deleteBookmark(id) {
      await this.deleteBookmarkFromDb(id);
      this.bookmarks = await this.getData();
    },

    checkIsBookmarked() {
      this.bookmarks.forEach((bookmark) => {
        if (bookmark.address === this.$props.address) {
          this.IsBookmarked = true;
          this.bookmarkId = bookmark.id;
          this.bookmark = bookmark.customName;
        }
      });
    },

    async addBookmark() {
      if (!this.IsBookmarked) {
        await this.addDataToDb();
        this.bookmarks = await this.getData();
        this.checkIsBookmarked();
      } else {
        this.deleteBookmark(this.bookmarkId);
      }
    },
  },

  async created() {
    this.db = await this.getDb();
    this.bookmarks = await this.getData();
    this.checkIsBookmarked();
  },
};
</script>

<style scoped>
.sensor-popup__bookmark {
  margin-top: calc(var(--gap) * 1.2);
  display: flex;
  align-items: center;
}

.sensor-popup__bookmark input {
  padding: calc(var(--gap) * 0.2) calc(var(--gap) * 0.6);
  margin-right: var(--gap);
  border-radius: 0;
  border: 1px solid transparent;
  border-bottom: 1px solid #111;
}
.sensor-popup__bookmark input::placeholder {
  font-size: calc(var(--font-size) * 0.8);
  font-weight: 400;
}

.sensor-popup__bookmark button {
  padding: calc(var(--gap) * 0.4) calc(var(--gap) * 0.8);
  padding-left: calc(var(--gap) * 1.8);
  color: #fff;
  background-color: var(--color-blue);
  font-size: calc(var(--font-size) * 0.8);
  font-weight: 600;
  font-family: var(--font-family--normal);
  background-image: url("data:image/svg+xml,%3Csvg width='19' height='23' viewBox='0 0 19 23' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M16.0479 17.0509L18.0539 18.0539V2.00599C18.0539 0.902696 17.1512 0 16.0479 0H6.00794C4.90465 0 4.01198 0.902696 4.01198 2.00599H14.0419C15.1452 2.00599 16.0479 2.90869 16.0479 4.01198V17.0509ZM12.0359 4.01198H2.00599C0.902696 4.01198 0 4.91468 0 6.01797V22.0659L7.02097 19.0569L14.0419 22.0659V6.01797C14.0419 4.91468 13.1392 4.01198 12.0359 4.01198Z' fill='white'/%3E%3C/svg%3E%0A");
  background-size: 12px 15px;
  background-position: 8px;
  background-repeat: no-repeat;
  border: 1px solid transparent;
  cursor: pointer;
}

.sensor-popup__bookmark button.bookmarked {
  background-color: var(--color-green);
}

@media screen and (max-width: 480px) {
  .sensor-popup__bookmark input {
    width: 100%;
  }
}
</style>
