<template>
  <div>
    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Set Sharing Policy</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12" sm="6" md="4">
                <v-text-field
                  v-model="item.fid"
                  label="FID"
                ></v-text-field>
              </v-col>
              
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
  </div>
</template>

<script>
const { ipcRenderer } = window.require("electron");

export default {
  name: "SetPolicy",
  prop: ["value"],
  data: () => ({
    item: {fid:"prova"},
    valid: true,
    dialog: true,
    email: "",
    emailRules: [
      (v) => !!v || "E-mail is required",
      (v) => /.+@.+/.test(v) || "E-mail must be valid",
    ],
    remote_repo: null,
    local_repo: null,
  }),
  mounted() {
    console.log("Set Policy:" + this.value);
    
  },
  methods: {
    close() {
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      });
    },

    save() {
      if (this.editedIndex < 0) {
        this.newAttr(Object.assign({}, this.editedItem));
      } else {
        this.setAttr(Object.assign({}, this.editedItem));
      }
      this.close();
    },
  },
};
</script>
