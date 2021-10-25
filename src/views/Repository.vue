<template>
  <v-row style="height:100%">
    <v-col class="col-6">
      <v-treeview :items="items" activatable :active.sync="active">
        <template v-slot:prepend="{ item, open }">
          <v-icon v-if="item.hasOwnProperty('children')" :color="item.color">
            {{ open ? "mdi-folder-open" : "mdi-folder" }}
          </v-icon>
          <v-icon v-else :color="item.color">
            {{ "mdi-file-document-outline" }}
          </v-icon>
        </template>
      </v-treeview>
    </v-col>
    <v-divider vertical></v-divider>

    <v-col class="d-flex col-6">
      <v-scroll-y-transition mode="out-in">
        <div
          v-if="!activeItem"
          class="text-h6 grey--text text--lighten-1 font-weight-light"
        >
          Select a File
        </div>
        <v-card v-else :key="activeItem.fid" style="width:100%">
          <v-card-text>
            <p>File Name:</p>
            <h3 class="mb-20">
              {{ activeItem.name }}
            </h3>
          </v-card-text>
          <v-divider></v-divider>
          <v-row class="text-left" tag="v-card-text">
            <v-col class="col-12 pt-0 pb-0"
              ><v-textarea
                outlined
                label="Policy"
                v-model="activeItem.policy"
              ></v-textarea
            ></v-col>
            <v-col class="col-12">
              <v-btn @click="submitPolicy">Modify</v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-scroll-y-transition>
    </v-col>
  </v-row>
</template>

<script>
const { ipcRenderer } = window.require("electron");
const { get_tree } = require("../abebox/utils");

export default {
  name: "Repository",
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
    items: [], // visualized in the tree
    fileItems: [], // flat file list
    activeItem: undefined, //
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
      if (this.active[0].hasOwnProperty("children")) return;
      console.log(this.active[0]);
      this.activeItem = this.fileItems.find(
        (el) => el.file_id === this.active[0]
      );

      if (this.activeItem.name[0] == "O") {
        this.activeItem.policy = '"A" and "B"';
      }
      console.log("ACTIVE ITEM", JSON.stringify(this.activeItem));
    },
    openDialog(item) {
      console.log(item);
    },
    setListener() {
      console.log("setListener");
      ipcRenderer.removeListener("list-files-resp", this.handleFileList);
      ipcRenderer.removeListener("update-list", (data) => console.log(data));
      ipcRenderer.on("list-files-resp", this.handleFileList);
      ipcRenderer.on("update-list", this.getFileList);
    },
    getFileList: async function() {
      console.log("getFileList");
      ipcRenderer.send("list-files", "reponame");
    },
    async handleFileList(event, data) {
      console.log("FILE-LIST-DATA:", data);
      this.fileItems = data;
      this.items = await get_tree(data);
    },
    async submitPolicy(event) {
      console.log(this.activeItem.policy);
      //TODO testare
      ipcRenderer.send("set-policy", {
        file_id: this.activeItem.file_id,
        policy: this.activeItem.policy,
      });
      //this.getFileList();
    },
  },
  watch: {
    active: "handleActive",
  },

  beforeUpdate() {
    //console.log("beforeUpdate");
  },
  updated() {
    //console.log("updated");
  },
  beforeDestroy() {
    console.log("beforeDestroy");
    if (this.attached) {
      console.log("listener removed");
      ipcRenderer.removeListener("list-files-resp", this.handleFileList);
      ipcRenderer.removeListener("update-list", (data) => console.log(data));
      this.attached = false;
    }
  },
  destroyed() {
    //console.log("destroyed");
  },
};
</script>
