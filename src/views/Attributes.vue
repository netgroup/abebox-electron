<template>
  <v-container class="main-page">
    <v-row>
      <v-col cols="12"><h1>Attributes</h1></v-col>
      <v-col cols="12">
        <v-data-table
          :headers="headers"
          :items="attributeList"
          sort-by="id"
          class="elevation-1"
          :search="search"
        >
          <template v-slot:top>
            <v-toolbar flat>
              <v-text-field
                v-model="search"
                append-icon="mdi-magnify"
                label="Search"
                single-line
                hide-details
              ></v-text-field>
              <v-divider class="mx-4" inset vertical></v-divider>
              <v-spacer></v-spacer>
              <v-dialog v-model="dialog" max-width="500px">
                <template v-slot:activator="{ on, attrs }">
                  <div v-if="isAdmin">
                    <v-btn
                      color="primary"
                      dark
                      class="mb-2"
                      v-bind="attrs"
                      v-on="on"
                    >
                      New Attribute
                    </v-btn>
                  </div>
                </template>
                <v-card>
                  <v-card-title>
                    <span class="text-h5">{{ formTitle }}</span>
                  </v-card-title>

                  <v-card-text>
                    <v-container>
                      <v-row>
                        <v-col cols="12">
                          <v-text-field
                            v-model="editedItem.univ"
                            label="Universe"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12">
                          <v-text-field
                            v-model="editedItem.attr"
                            label="Attribute"
                          ></v-text-field>
                        </v-col>
                      </v-row>
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
              <v-dialog v-model="dialogDelete" max-width="500px">
                <v-card>
                  <v-card-title class="text-h5"
                    >Are you sure you want to delete this item?</v-card-title
                  >
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" text @click="closeDelete"
                      >Cancel</v-btn
                    >
                    <v-btn color="blue darken-1" text @click="deleteItemConfirm"
                      >OK</v-btn
                    >
                    <v-spacer></v-spacer>
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </v-toolbar>
          </template>
          <template v-slot:[`item.actions`]="{ item }">
            <div v-if="isAdmin">
              <v-icon small class="mr-2" @click="editItem(item)">
                mdi-pencil
              </v-icon>
              <v-icon small @click="deleteItem(item)">
                mdi-delete
              </v-icon>
            </div>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
const { ipcRenderer } = window.require("electron");

export default {
  name: "AttributeView",
  data: () => ({
    dialog: false,
    dialogDelete: false,
    search: "",
    attached: false,
    headers: [
      /*{
        text: "ID",
        align: "start",
        value: "id",
      },*/
      { text: "Universe", value: "univ" },
      { text: "Attribute", value: "attr" },
      { text: "Version", value: "vers" },
      { text: "Actions", value: "actions", sortable: false },
    ],
    attributeList: [],
    editedIndex: -1,
    oldItem: null,
    editedItem: {
      univ: "",
      attr: "",
      vers: "",
    },
    defaultItem: {
      univ: "",
      attr: "",
      vers: "1",
    },
  }),
  computed: {
    formTitle() {
      return this.editedIndex === -1 ? "New Attribute" : "Edit Attribute";
    },
    isAdmin: function() {
      return this.$store.state.conf.isAdmin;
    },
  },
  watch: {
    dialog(val) {
      val || this.close();
    },
    dialogDelete(val) {
      val || this.closeDelete();
    },
  },
  mounted() {
    if (this.attributeList == undefined || this.attributeList.length === 0) {
      this.getAttrsList();
    }
  },
  methods: {
    filterAttrs(value, search, item) {
      //TODO fix non funziona
      return (
        value != null &&
        search != null &&
        value.attr.toLocaleUpperCase().indexOf(search) !== -1
      );
    },
    editItem(item) {
      this.editedIndex = this.attributeList.indexOf(item);
      this.editedItem = Object.assign({}, item);
      this.oldItem = item;
      this.dialog = true;
    },

    deleteItem(item) {
      this.editedIndex = this.attributeList.indexOf(item);
      this.editedItem = Object.assign({}, item);
      this.dialogDelete = true;
    },

    deleteItemConfirm() {
      this.delAttr(this.editedItem);
      this.closeDelete();
    },

    close() {
      this.dialog = false;
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
    save() {
      if (this.editedIndex < 0) {
        this.newAttr(Object.assign({}, this.editedItem));
      } else {
        this.setAttr(this.oldItem, Object.assign({}, this.editedItem));
      }
      this.close();
    },
    async getAttrsList() {
      console.log("getAttrsList");
      const attrs = await ipcRenderer.invoke("list-attrs", "");
      if (attrs.hasOwnProperty("status") && attrs.status === "error") return;

      this.attributeList = attrs;
    },
    async setAttr(old_attr, attr) {
      console.log("setAttr", attr);
      const new_attrs_list = await ipcRenderer.invoke(
        "set-attr",
        old_attr,
        attr
      );
      this.attributeList = new_attrs_list;
    },
    async newAttr(attr) {
      if (attr.vers == "") attr.vers = 1;
      console.log("newAttr", attr);
      const new_attrs_list = await ipcRenderer.invoke("new-attr", attr);
      this.attributeList = new_attrs_list;
    },
    async delAttr(attr) {
      console.log("delAttr", attr);
      const new_attrs_list = await ipcRenderer.invoke("del-attr", attr);
      this.attributeList = new_attrs_list;
    },
  },
};
</script>
