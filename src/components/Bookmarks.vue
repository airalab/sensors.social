<template>
    <template v-if="!bookmarks || bookmarks.length < 1">{{$t("bookmarks.listempty")}}</template>
    <template v-else>
        <section v-for="bookmark in bookmarks" :key="bookmark.id" class="flexline">
            <a :href="bookmark.link" target="_blank">
                <b v-if="bookmark.customName" class="name">{{bookmark.customName}}</b>
                <b v-if="bookmark.address" :class="bookmark.customName ? 'addresssm' : 'adresslg'">{{bookmark.address}}</b>
            </a>
            <button title="Remove this sensor" @click.prevent="deletebookmark(bookmark.id)"><font-awesome-icon icon="fa-solid fa-xmark" /></button>
        </section>
    </template>
</template>

<script>
import { useStore } from "@/store";
import {IDBgettable, IDBworkflow} from "../idb";

export default {
    data() {
        return {
            bookmarks: [],
            store: useStore()
        }
    },

    methods: {

        async getbookmarks() {
            this.bookmarks = await IDBgettable(this.store.idbBookmarkDbname, this.store.idbBookmarkVDbver, this.store.idbBookmarkVDbtable)
        },

        deletebookmark(id) {
            IDBworkflow(this.store.idbBookmarkDbname, this.store.idbBookmarkVDbver, this.store.idbBookmarkVDbtable, 'readwrite', store => {
                store.delete(id)
                this.getbookmarks()
            })
        }
    },

    mounted() {
        this.getbookmarks()

        const bc = new BroadcastChannel(this.store.idbWatcherBroadcast)
        bc.onmessage = e => {
            if(e.data) {
                this.getbookmarks()
            }
        };
    }
}
</script>

<style scoped>
    a, a b {
        display: block;
    }

    .addresssm {
        color: var(--app-textcolor);
        font-size: .7em;
    }

    section {
        justify-content: space-between;
    }

    section:not(:last-child) {
        padding-bottom: var(--gap);
        border-bottom: 1px solid var(--app-textcolor);
    }

    button {
        border: 0;
        cursor: pointer;
        font-size: 1.2em;
        transition: color 0.2s ease-in;
    }

    button:hover {
        color: var(--color-red);
    }
</style>