<template>
  <v-container class="main-page">
    <v-row>
      <v-col cols="12"><h1>Users</h1></v-col>
      <v-col cols="12">
        <v-data-table
          :headers="headers"
          :items="users"
          sort-by="mail"
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
                  <v-btn
                    color="primary"
                    dark
                    class="mb-2"
                    v-bind="attrs"
                    v-on="on"
                  >
                    New User
                  </v-btn>
                </template>
                <v-card>
                  <v-card-title>
                    <span class="text-h5">{{ formTitle }}</span>
                  </v-card-title>
                  <v-card-text>
                    <v-container>
                      <v-row class="m-0" v-if="editedIndex !== -1">
                        <v-col cols="12" sm="12" md="12">
                          <h2>{{ editedItem.mail }}</h2>
                        </v-col>
                      </v-row>
                      <v-row class="m-0" v-else>
                        <v-col cols="12" sm="12" md="12">
                          <v-text-field
                            v-model="editedItem.mail"
                            label="Mail"
                            :rules="checkRule"
                          ></v-text-field>
                        </v-col>
                      </v-row>
                      <v-row class="m-0">
                        <v-col cols="12" sm="12" md="12">
                          <v-select
                            :items="items"
                            label="Attributes"
                            v-model="editedItem.attrs"
                            multiple
                            chips
                            persistent-hint
                          ></v-select>
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
            <v-icon small class="mr-2" @click="editItem(item)">
              mdi-pencil
            </v-icon>
            <v-icon small @click="deleteItem(item)">
              mdi-delete
            </v-icon>
            <v-icon small @click="share(item)">
              mdi-share
            </v-icon>
          </template>
          <template v-slot:[`item.attributes`]="{ item }">
            <span v-for="(att, index) in item.attrs" :key="index"
              >{{ att.univ }}:{{ att.attr }}:{{ att.vers }}
            </span>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
const { ipcRenderer } = window.require("electron");

export default {
  name: "UsersView",
  data: () => ({
    dialog: false,
    dialogDelete: false,
    search: "",
    checkRule: [(v) => !!v || "Please fill this field"],

    headers: [
      {
        text: "Email",
        value: "mail",
      },
      { text: "Attributes", value: "attributes" }, //${el.univ}:${el.attr}:${el.vers}
      { text: "Actions", value: "actions", sortable: false },
    ],
    users: [],
    attrs: [],
    items: [],
    editedIndex: -1,
    editedItem: {
      mail: "",
      attrs: [],
    },
    defaultItem: {
      mail: "",
      attrs: [],
    },
  }),

  computed: {
    formTitle() {
      return this.editedIndex === -1 ? "New User" : "Edit User";
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
    if (!this.users || this.users.length === 0) {
      this.getUsersList();
    }
    if (!this.attrs || this.attrs.length === 0) {
      this.getAttrsList();
    }
  },
  methods: {
    filterUsers(value, search, item) {
      //TODO fix non funziona
      return (
        value != null &&
        search != null &&
        value.mail.toLocaleUpperCase().indexOf(search) !== -1
      );
    },

    editItem(item) {
      this.editedIndex = this.users.indexOf(item);
      this.editedItem = Object.assign({}, item);
      this.dialog = true;
    },

    deleteItem(item) {
      this.editedIndex = this.users.indexOf(item);
      this.editedItem = Object.assign({}, item);
      this.dialogDelete = true;
    },
    async share(item) {
      const user_mail = item.mail;
      console.log(user_mail);
      const ret = await ipcRenderer.invoke("invite-user", { mail: user_mail });
      console.log(ret);
    },

    deleteItemConfirm() {
      this.delUser(this.editedItem.mail);
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
        this.newUser(Object.assign({}, this.editedItem));
      } else {
        this.setUser(Object.assign({}, this.editedItem));
      }
      this.close();
    },
    async getUsersList() {
      const list = await ipcRenderer.invoke("list-users", "");
      console.log("getUsersList:", list);
      this.users = list;
    },
    async getAttrsList() {
      this.attrs = await ipcRenderer.invoke("list-attrs", "");
      this.items = this.attrs.map((el) => {
        return { text: `${el.univ}:${el.attr}:${el.vers}`, value: el };
      });
    },
    async newUser(user) {
      console.log("newUser", user);
      const new_users_list = await ipcRenderer.invoke("new-user", user);
      console.log("New User List:", new_users_list);
      this.users = new_users_list;
    },
    async setUser(user) {
      console.log("setUser", user);
      const new_users_list = await ipcRenderer.invoke("set-user", user);
      console.log("New User List:", new_users_list);
      this.users = new_users_list;
    },
    async delUser(mail) {
      console.log("delUser", mail);
      const new_users_list = await ipcRenderer.invoke("del-user", mail);
      this.users = new_users_list;
    },
  },
};
</script>
