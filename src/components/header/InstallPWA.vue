<template>
  <div class="container install-pwa__container" v-if="!isInstalled">
    <div class="install-pwa__content">
      <img src="@/assets/images/sensors-world-app.png" alt="sensors-cy-app" />
      <div class="install-pwa__text">
        <h3>Available as web application (PWA)</h3>
        <button @click="installApp" class="install-pwa__btn">Install</button>
      </div>
    </div>
    <button @click="removeInstall" class="install-pwa__remove"></button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      deferredPrompt: null,
      isSupported: false,
      db: null,
      isInstalled: "loading",
    };
  },

  methods: {
    async getDb() {
      return new Promise((resolve, reject) => {
        let request = window.indexedDB.open("SensorsDB", 1);

        request.onerror = (e) => {
          console.log("Error opening db", e);
          reject("Error");
        };

        request.onsuccess = (e) => {
          resolve(e.target.result);
          // const transaction = e.target.result.transaction(
          //   ["install"],
          //   "readwrite"
          // );
          // const objectStoreRequest = transaction.objectStore("install").clear();
        };

        request.onupgradeneeded = (e) => {
          let db = e.target.result;
          db.createObjectStore("install", {
            autoIncrement: true,
            keyPath: "id",
          });
        };
      });
    },

    async getData() {
      return new Promise((resolve) => {
        let trans = this.db.transaction(["install"], "readonly");
        trans.oncomplete = () => {
          resolve(isInstalled);
        };

        let store = trans.objectStore("install");
        let isInstalled = null;

        store.openCursor().onsuccess = (e) => {
          let cursor = e.target.result;
          if (cursor) {
            isInstalled = cursor.value;
            cursor.continue();
          }
        };
      });
    },

    async addDataToDb(removed = false, installed = false) {
      return new Promise((resolve) => {
        let trans = this.db.transaction(["install"], "readwrite");
        trans.oncomplete = () => {
          resolve();
        };

        let store = trans.objectStore("install");
        store.delete(1);
        store.add({ id: 1, removed: removed, installed: installed });
      });
    },

    async installApp() {
      this.addDataToDb(false, true);
      if (this.deferredPrompt !== null) {
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        if (outcome === "accepted") {
          this.deferredPrompt = null;
          this.isSupported = false;
          this.isInstalled = "installed";
        }
      }
    },

    removeInstall() {
      this.addDataToDb(true, false);
      this.isInstalled = "removed";
    },
  },

  async created() {
    this.db = await this.getDb();
    this.isInstalled = (await this.getData()) ? await this.getData() : null;
  },

  mounted() {
    // for pwa install button
    window.addEventListener("beforeinstallprompt", (e) => {
      this.isSupported = true;
      this.deferredPrompt = e;
    });

    if (window.matchMedia("(display-mode: standalone)").matches) {
      this.isSupported = true;
    } else {
      this.isSupported = false;
    }
  },
};
</script>

<style scoped>
.install-pwa__container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  z-index: 10;
}

.install-pwa__content img {
  width: 36px;
  height: 36px;
  border-radius: 5px;
}

.install-pwa__content {
  display: flex;
  align-items: center;
  gap: var(--gap);
}

.install-pwa__content h3 {
  margin: 0;
  margin-bottom: calc(var(--gap) * 0.2);
  font-size: calc(var(--font-size) * 0.8);
  text-transform: none;
}

.install-pwa__btn {
  padding: calc(var(--gap) * 0.2) calc(var(--gap) * 1.8);
  font-weight: 700;
  font-family: var(--font-family--normal);
  color: #fff;
  background-color: #3658c6;
  border-radius: 15px;
  border: none;
  cursor: pointer;
}

.install-pwa__remove {
  width: 20px;
  height: 20px;
  background-image: url('data:image/svg+xml,<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.6894 0.321199C13.2753 -0.0929084 12.6064 -0.0929084 12.1923 0.321199L7 5.50284L1.80774 0.31058C1.39363 -0.103527 0.724687 -0.103527 0.31058 0.31058C-0.103527 0.724687 -0.103527 1.39363 0.31058 1.80774L5.50284 7L0.31058 12.1923C-0.103527 12.6064 -0.103527 13.2753 0.31058 13.6894C0.724687 14.1035 1.39363 14.1035 1.80774 13.6894L7 8.49716L12.1923 13.6894C12.6064 14.1035 13.2753 14.1035 13.6894 13.6894C14.1035 13.2753 14.1035 12.6064 13.6894 12.1923L8.49716 7L13.6894 1.80774C14.0929 1.40425 14.0929 0.724687 13.6894 0.321199Z" fill="%232D2C2C"/></svg>');
  background-position: center;
  background-repeat: no-repeat;
  border: none;
  cursor: pointer;
}
</style>
