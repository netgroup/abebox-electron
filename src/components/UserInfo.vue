<template>
  <v-container>
    <v-row>
      <v-col cols="12" sm="8">
        <p>{{ info.name }}</p>
      </v-col>
      <v-col cols="12" sm="4">
        <v-btn color="blue darken-1" text @click="shareFiles">
          Share
        </v-btn>
      </v-col>
    </v-row>
    <v-row v-if="fileItems">
      <v-col cols="12" v-for="(element, index) in fileItems" :key="index">
        <p>{{ element.file_name }}</p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
const { ipcRenderer } = window.require("electron");
const { get_tree } = require("../abebox/utils");

export default {
  name: "HelloWorld",
  props: ["info"],
  data: () => ({
    dialog: false,
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
    fileItems: [],
    editedAttrs: [],
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
    if (!this.attrs || this.attrs.length === 0) {
      this.getAttrsList();
    }

    if (this.items == undefined || this.items.length === 0) {
      this.getFileList();
    }
  },
  methods: {
    editItem(item) {
      //this.editedIndex = this.attributeList.indexOf(item);
      this.editedItem = Object.assign({}, item);
      this.editedAttrs = [];
      for (val in item.policy) {
        this.editedAttrs.push({ and_list: val });
      }
      if (this.editedAttrs.length === 0) {
        this.addValutazione();
      }

      this.dialog = true;
    },
    close() {
      this.dialog = false;
      console.log("close");
      this.active = [];
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      });
    },
    async save() {
      console.log("ED ATTR: ", this.editedAttrs);
      const new_pol = [];
      for (el of this.editedAttrs) {
        console.log("EL:", el, el.and_list);
        new_pol.push(el.and_list);
      }
      await this.submitPolicy(new_pol);
      this.close();
    },
    openDialog(item) {
      console.log(item);
    },
    async getFileList() {
      this.fileItems = await ipcRenderer.invoke("list-files", "");
      console.log("getFileList", this.fileItems);
    },
    async getAttrsList() {
      const list = await ipcRenderer.invoke("list-attrs", "");
      this.attrs = await Promise.all(
        list.map((el) => {
          return Object.assign(el, { slug: `${el.univ}_${el.attr}` });
        })
      );
      console.log("getAttrsList:", this.attrs);
    },
    async shareFiles() {
      this.fileItems = await ipcRenderer.invoke("share-files", "");
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
};
</script>
