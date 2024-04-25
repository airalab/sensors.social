<template>
  <form class="sensor-popup__bookmark-form" @submit.prevent="addBookmark">
    <input
      type="text"
      v-model="bookmark"
      placeholder="type in a name for sensor here"
    />
    <button
      class="sensor-popup__bookmark button"
      :class="{ bookmarked: IsBookmarked }"
    ></button>
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
      bookmarkCustomNameDB: null,
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
          this.bookmarkCustomNameDB = bookmark.customName;
        }
      });
    },

    async addBookmark() {
      if (!this.IsBookmarked) {
        await this.addDataToDb();
        this.bookmarks = await this.getData();
        this.checkIsBookmarked();
      } else {
        if (this.bookmark === this.bookmarkCustomNameDB) {
          this.deleteBookmark(this.bookmarkId);
        } else {
          this.changeCustomName();
        }
      }
    },

    async changeCustomName() {
      if (this.IsBookmarked) {
        const objectStore = this.db
          .transaction(["bookmarks"], "readwrite")
          .objectStore("bookmarks");

        objectStore.openCursor().onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            if (cursor.value.id === this.bookmarkId) {
              const updateCustomName = cursor.value;
              updateCustomName.customName = this.bookmark;
              const request = cursor.update(updateCustomName);
              request.onsuccess = () => {
                this.bookmarkCustomNameDB = this.bookmark;
              };
            }
          }
        };
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
.sensor-popup__bookmark-form {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.sensor-popup__bookmark-form input {
  border: 2px solid hsla(0, 0%, 0%, 1);
  transition: border-bottom 0.33s ease-in-out;
}

.sensor-popup__bookmark-form input::placeholder {
  font-size: calc(var(--font-size) * 0.75);
  font-weight: 300;
  color: #000;
  opacity: 0.7;
}

.sensor-popup__bookmark-form input:focus {
  border-bottom: 2px solid var(--color-blue);
}

.sensor-popup__bookmark {
  width: 30px;
  height: 34px;
  color: #fff;
  font-size: calc(var(--font-size) * 0.8);
  font-weight: 600;
  font-family: var(--font-family--normal);
  background-image: url("data:image/svg+xml,%3Csvg width='30' height='35' viewBox='0 0 19 23' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M16.0479 17.0509L18.0539 18.0539V2.00599C18.0539 0.902696 17.1512 0 16.0479 0H6.00794C4.90465 0 4.01198 0.902696 4.01198 2.00599H14.0419C15.1452 2.00599 16.0479 2.90869 16.0479 4.01198V17.0509ZM12.0359 4.01198H2.00599C0.902696 4.01198 0 4.91468 0 6.01797V22.0659L7.02097 19.0569L14.0419 22.0659V6.01797C14.0419 4.91468 13.1392 4.01198 12.0359 4.01198Z' fill='%2303a5ed'/%3E%3C/svg%3E%0A");
  background-size: 25px;
  background-position: center;
  background-repeat: no-repeat;
  border: 1px solid transparent;
  cursor: pointer;
}

.sensor-popup__bookmark.bookmarked {
  background-image: url("data:image/svg+xml,%3Csvg width='31' height='27' viewBox='0 0 31 27' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M16.8889 21.5947L19 22.6503V5.76138C19 4.60027 18.05 3.65027 16.8889 3.65027H6.32278C5.16167 3.65027 4.22222 4.60027 4.22222 5.76138H14.7778C15.9389 5.76138 16.8889 6.71138 16.8889 7.87249V21.5947ZM12.6667 7.87249H2.11111C0.95 7.87249 0 8.82249 0 9.9836V26.8725L7.38889 23.7058L14.7778 26.8725V9.9836C14.7778 8.82249 13.8278 7.87249 12.6667 7.87249Z' fill='%2360BC2A'/%3E%3Cpath d='M21 3L24.5 6.5L30 1' stroke='%2360BC2A' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E%0A");
  background-size: 100%;
}
</style>
