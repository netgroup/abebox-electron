<template>
  <v-card>
    <v-dialog v-model="dialog" persistent max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h6  ">{{ editedItem.file_name }}</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <div v-for="(element, index) in editedAttrs" :key="index">
              <v-row align="center">
                <v-col cols="12" sm="10">
                  <v-select
                    :items="all_items_attrs"
                    label="AND Attributes Group"
                    v-model="element.and_list"
                    multiple
                    chips
                    persistent-hint
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="2">
                  <v-icon class="mr-2" @click="addValutazione">
                    mdi-plus
                  </v-icon>
                  <v-icon @click="remValutazione(index)">
                    mdi-delete
                  </v-icon>
                </v-col>
              </v-row>
            </div>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="close">
            Cancel
          </v-btn>
          <v-btn color="blue darken-1" text @click="save">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-card-title
      ><v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
      ></v-text-field
      ><v-spacer></v-spacer>
      <v-btn color="primary" dark class="mb-2" @click="getFileList">
        Refresh List
      </v-btn>
    </v-card-title>
    <v-row style="height:100%">
      <v-col class="col-12">
        <v-treeview
          :items="items"
          item-key="id"
          activatable
          color="warning"
          rounded
          dense
          :active.sync="active"
          :search="search"
          open-on-click
        >
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
      <!--<v-divider vertical></v-divider>

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
      </v-col>-->
    </v-row>
  </v-card>
</template>

<script>
const { ipcRenderer } = window.require("electron");
const { get_tree } = require("../abebox/utils");

export default {
  name: "Repository",
  data: () => ({
    active: [],
    open: ["dir1  "],
    search: "",
    dialog: false,
    editedIndex: -1,
    editedItem: {
      file_name: "",
      file_id: "",
      policy: [],
    },
    defaultItem: {
      file_name: "",
      file_id: "",
      policy: [],
    },
    editedAttrs: [],
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
    all_items_attrs: [], // list of attributes and slugs
    attrs: [], // list of valid attributes
  }),
  watch: {
    dialog(val) {
      val || this.close();
    },
    dialogDelete(val) {
      val || this.closeDelete();
    },
  },
  mounted() {
    this.getAttrsList();
    this.getFileList();
  },
  methods: {
    /*editItem(item) {
      this.editedIndex = 1;
      this.editedItem = Object.assign({}, item);
      this.editedAttrs = [];
      for (val in item.policy) {
        this.editedAttrs.push({ and_list: val });
      }
      this.dialog = true;
    },*/
    close() {
      this.dialog = false;
      console.log("close");
      this.active = [];
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      });
    },
    closeDelete() {
      this.dialogDelete = false;
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      });
    },
    async save() {
      console.log("ALL ATTR: ", JSON.stringify(this.all_items_attrs));
      console.log("ED IT: ", JSON.stringify(this.editedItem));
      console.log("ED ATTR: ", JSON.stringify(this.editedAttrs));
      const new_pol = [];
      for (el of this.editedAttrs) {
        console.log("EL:", el, el.and_list);
        new_pol.push(el.and_list);
      }
      //await this.submitPolicy(new_pol);
      this.close();
    },
    handleActive() {
      if (!this.active) return;
      console.log(this.active[0]);
      const item_sel = this.fileItems.find(
        (el) => el.file_id === this.active[0]
      );
      if (!item_sel) {
        return;
      }
      this.editedItem = item_sel;
      this.editedAttrs = [];
      for (let attr of item_sel.policy) {
        this.editedAttrs.push({ and_list: attr });
      }
      if (this.editedAttrs.length === 0) {
        this.addValutazione();
      }
      console.log("EDIT ITEM", JSON.stringify(this.editedItem));
      this.dialog = true;
    },
    openDialog(item) {
      console.log(item);
    },
    async getFileList() {
      if (this.dialog) return;
      this.fileItems = await ipcRenderer.invoke("list-files", "");
      this.items = await get_tree(this.fileItems);
      console.log("getFileList", this.fileItems, this.items);
    },
    async getAttrsList() {
      this.attrs = await ipcRenderer.invoke("list-attrs", "");
      this.all_items_attrs = await Promise.all(
        this.attrs.map((el) => {
          return { text: `${el.univ}:${el.attr}:${el.vers}`, value: el };
        })
      );
      console.log("getAttrsList:", this.attrs);
    },

    async onSubmit(event) {
      console.log("ON SUBMIT");
    },
    async submitPolicy(new_pol) {
      const data = {
        file_id: this.editedItem.file_id,
        policy: new_pol,
      };
      this.fileItems = await ipcRenderer.invoke("set-policy", data);
      console.log("SUB:", data);
      console.log(this.fileItems);
      this.items = await get_tree(this.fileItems);
    },
    addValutazione() {
      this.editedAttrs.push({ and_list: [] });
    },
    remValutazione(index) {
      this.editedAttrs.splice(index, 1);
      if (this.editedAttrs.length === 0) {
        this.addValutazione();
      }
    },
  },
  watch: {
    active: "handleActive",
  },
};
</script>
