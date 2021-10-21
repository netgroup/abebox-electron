<template>
  <v-container>
    <v-row>
      <v-col>
        <v-treeview
          :items="items"
          activatable
          :active.sync="active"
          color="warning"
          open-all
          dense
        >
          <template v-slot:prepend="{ item, open }">
            <v-icon v-if="item.hasOwnProperty('children')">
              {{ open ? "mdi-folder-open" : "mdi-folder" }}
            </v-icon>
            <v-icon v-else>
              {{ "mdi-file-document-outline" }}
            </v-icon>
          </template>
        </v-treeview>
      </v-col>
      <v-divider vertical></v-divider>

      <v-col class="d-flex text-center">
        <v-scroll-y-transition mode="out-in">
          <div
            v-if="!activeItem"
            class="text-h6 grey--text text--lighten-1 font-weight-light"
            style="align-self: center;"
          >
            Select a File
          </div>
          <v-card
            v-else
            :key="activeItem.fid"
            class="pt-6 mx-auto"
            flat
            max-width="400"
          >
            <v-card-text>
              <h3 class="text-h5 mb-2">
                {{ activeItem.name }}
              </h3>
            </v-card-text>
            <v-divider></v-divider>
            <v-row class="text-left" tag="v-card-text">
              <v-col class="text-right mr-4 mb-2" tag="strong" cols="5">
                Policy:
              </v-col>
              <v-col>{{ activeItem.policy }}</v-col>
            </v-row>
          </v-card>
        </v-scroll-y-transition>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
const { ipcRenderer } = window.require("electron");
const { get_tree } = require("../abebox/utils");

export default {
  data: () => ({
    active: [],
    files: {
      html: "mdi-language-html5",
      js: "mdi-nodejs",
      json: "mdi-code-json",
      md: "mdi-language-markdown",
      pdf: "mdi-file-pdf",
      png: "mdi-file-image",
      txt: "mdi-file-document-outline",
      xls: "mdi-file-excel",
    },
    tree: [],
    selection: [],
    items: [],
    fileItems: [],
    activeItem: undefined,
    attached: false,
  }),
  mounted() {
    console.log("Items:", this.items);
    console.log("Atteched:", this.attached);
    if (!this.attached) {
      this.setListener();
      this.attached = true;
    }
    if (this.items.length === 0) {
      this.getFileList();
    }
  },
  beforeUnmount() {
    console.log("beforeUnmount", this.attached);
  },
  methods: {
    handleActive() {
      if (!this.active) return;
      console.log(this.active[0]);
      this.activeItem = this.fileItems.find((el) => el.fid === this.active[0]);
      console.log("ACTIVE ITEM", JSON.stringify(this.activeItem));
    },
    openDialog(item) {
      console.log(item);
    },
    setListener() {
      console.log("setListener");
      ipcRenderer.removeListener("list-files-resp", this.handleFileList);
      ipcRenderer.on("list-files-resp", this.handleFileList);
    },
    getFileList: async function() {
      console.log("getFileList");
      ipcRenderer.send("list-files", "reponame");
    },
    async handleFileList(event, data) {
      console.log("FILE-LIST-DATA:", data);
      this.fileItems = get_tree(data);
      this.items = get_tree(data);
    },
  },
  watch: {
    active: "handleActive",
  },

  beforeUpdate() {
    console.log("beforeUpdate");
  },
  updated() {
    console.log("updated");
  },
  beforeDestroy() {
    console.log("beforeDestroy");
    if (this.attached) {
      console.log("listener removed");
      ipcRenderer.removeListener("list-files-resp", this.handleFileList);
      this.attached = false;
    }
  },
  destroyed() {
    console.log("destroyed");
  },
};
</script>
