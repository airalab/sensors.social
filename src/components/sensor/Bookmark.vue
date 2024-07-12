<template>
  <form class="flexline" @submit.prevent="addbookmark">
    <input type="text" v-model="bookmarkname" :placeholder="$t('sensorpopup.bookmarkplaceholder')" @input="IsBookmarked = false" />
    <button :class="buttonclasses" :disabled="IsBookmarked" :area-label="$t('sensorpopup.bookmarkbutton')">
      <template v-if="!IsBookmarked"><font-awesome-icon icon="fa-solid fa-bookmark" /></template>
      <template v-else><font-awesome-icon icon="fa-solid fa-check" /></template>
    </button>
  </form>
</template>

<script>
import { useStore } from "@/store";
import { IDBgettable, IDBworkflow } from "../../idb";

export default {
  props: ["address", "link", "geo"],

  data() {
    return {
      IsBookmarked: false,
      db: null,
      bookmarks: [],
      bookmarkid: null,
      bookmarkname: "",
      store: useStore(),
    };
  },

  computed: {
    buttonclasses() {
      return {
        [`button`]: true,
        [`button-green`]: this.IsBookmarked,
        // [`flexline`]: true,
      };
    }
  },

  methods: {

    async findbookmark() {
      const bookmarks = await IDBgettable(this.store.idbBookmarkDbname, this.store.idbBookmarkVDbver, this.store.idbBookmarkVDbtable)
      return bookmarks.find(bookmark => bookmark.address === this.$props.address)
    },

    async addbookmark() {

      const bookmark = await this.findbookmark();

      if(bookmark) {
        if(this.bookmarkid) {
          
          IDBworkflow(this.store.idbBookmarkDbname, this.store.idbBookmarkVDbver, this.store.idbBookmarkVDbtable, 'readwrite', store => {
            const request = store.get(this.bookmarkid);
            
            request.addEventListener('error', e => {
              console.log(e)
            })

            request.addEventListener('success', e => {
              const data = e.target.result;
              data.customName = this.bookmarkname;
              const requestUpdate = store.put(data);

              requestUpdate.addEventListener('error', e => {
                console.log(e)
              })

              requestUpdate.addEventListener('success', e => {
                this.IsBookmarked = true
              })
            })
          })
        }
      } else {
        IDBworkflow(this.store.idbBookmarkDbname, this.store.idbBookmarkVDbver, this.store.idbBookmarkVDbtable, 'readwrite', store => {
            store.add({
              customName: this.bookmarkname,
              address: this.$props.address,
              link: this.$props.link,
              geo: JSON.stringify(this.$props.geo)
            });
            this.IsBookmarked = true;
          })
        }

        const bc = new BroadcastChannel(this.store.idbWatcherBroadcast)
        bc.postMessage(this.store.idbBookmarkVDbtable)
        bc.close()
    },
  },

  async mounted() {
    const bookmark = await this.findbookmark();
    if(bookmark) {
      this.IsBookmarked = true;
      this.bookmarkid = bookmark.id;
      this.bookmarkname = bookmark.customName;
    }
  }
}
</script>

<style scoped>
button {
  padding-right: calc(var(--app-inputpadding)*2);
  padding-left: calc(var(--app-inputpadding)*2);
}
</style>