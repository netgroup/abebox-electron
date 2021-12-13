<template>
  <v-container class="main-page">
    <v-row>
      <v-col cols="12"><h1>Documents</h1></v-col>
      <v-col cols="12">
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
                Share
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <v-data-table
          :headers="headers"
          :items="items"
          sort-by="id"
          class="elevation-1"
        >
          <template v-slot:[`item.file`]="{ item }">
            <div style="padding: 10px 0px">
              <span style="" class="font-weight-bold">{{ item.file }}</span
              ><br />
              <span class="caption">{{ item.dir }}</span>
            </div>
          </template>
          <template v-slot:[`item.policy`]="{ item }">
            <v-icon v-if="item.pol_ok" color="green"
              >mdi-check-circle-outline</v-icon
            >
            <v-icon v-else color="red">mdi-close-circle-outline</v-icon>
          </template>
          <template v-slot:[`item.actions`]="{ item }">
            <v-btn color="primary" @click="handleShare(item.id)">SHARE</v-btn>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
const { ipcRenderer } = window.require("electron");

export default {
  name: "Repository",
  data: () => ({
    headers: [
      { text: "FILE NAME", value: "file", sortable: false },
      { text: "SHARED", value: "policy", sortable: false, align: "center" },
      { text: "ACTION", value: "actions", sortable: false, align: "center" },
    ],
    items: [], // visualized in the tree
    fileItems: [], // flat file list
    all_items_attrs: [], // list of attributes and slugs
    attrs: [], // list of valid attributes
    dialog: false,
    editedIndex: -1,
    editedItem: {
      file_name: "",
      file_id: "",
      policy: [],
    },
    editedAttrs: [],
  }),
  watch: {
    dialog(val) {
      val || this.close();
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
      for (let el of this.editedAttrs) {
        console.log("EL:", el, el.and_list);
        new_pol.push(el.and_list);
      }
      await this.submitPolicy(new_pol);
      this.close();
    },
    handleShare(item_id) {
      console.log("SHARE ", item_id);
      const item_sel = this.fileItems.find((el) => el.file_id === item_id);
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
      this.items = await Promise.all(
        this.fileItems.map((el) => {
          return {
            file: el.file_name,
            dir: "/" + el.file_dir,
            pol_ok: el.status == 0 ? true : false,
            id: el.file_id,
          };
        })
      );

      console.log("Documents - getFileList - ", this.fileItems);
    },

    async getAttrsList() {
      this.attrs = await ipcRenderer.invoke("list-attrs", "");
      /*if (attrs.hasOwnProperty("status") && attrs.status === "error") {
        this.attrs = [];
        return;
      }*/
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
      const res = await ipcRenderer.invoke(
        "share-single",
        this.editedItem.file_id
      );
      this.getFileList();
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
<style>
.v-data-table tbody tr:nth-of-type(odd) {
  background-color: rgba(0, 0, 0, 0.02) !important;
}
.v-data-table tbody tr:nth-of-type(even) {
  background-color: rgba(0, 0, 0, 0.07) !important;
}
</style>
