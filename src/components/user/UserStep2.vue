<template>
  <v-container class="admin-step-1 pb-0 pt-5">
    <v-row class="text-center">
      <v-col class="mt-0 mb-0" offset="3" cols="6">
        <v-dialog v-model="errorDialog" persistent max-width="500">
          <!--<template v-slot:activator="{ on, attrs }">
            <v-btn color="primary" dark v-bind="attrs" v-on="on">
              Open Dialog
            </v-btn>
          </template>-->
          <v-card>
            <v-card-title class="text-h5 red--text">
              Shared Folder Selection Error:
            </v-card-title>
            <v-card-text class="text-body-1">{{ errorText }}</v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="warning darken-1" @click="errorDialog = false">
                OK
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <p class="body-2 font-weight-bold mb-0">STEP #2</p>
        <div class="text-h5 font-weight-bold">Configure your folders</div>
        <div class="d-flex justify-center mt-2 mb-2">
          <div
            style="width: 30px; height: 5px; background: #ffffff; opacity: 0.5"
          />
        </div>
      </v-col>
    </v-row>
    <v-row class="mt-0">
      <v-col cols="8" offset="2">
        <v-card color="white" class="pa-10 mt-5">
          <v-row>
            <v-col offset="2" cols="8" class="mb-0 mt-0 pb-0"
              ><v-btn dense style="width: 100%" @click="selectLocal()"
                ><span v-if="folder_local_name == ''">Select local folder</span
                ><span v-else>
                  <v-icon left> mdi-folder </v-icon>
                  {{ folder_local_name }}</span
                ></v-btn
              ></v-col
            ><v-col cols="2" class="mb-0 pl-0">
              <v-btn class="px-0" icon @click="folder_local = ''">
                <v-icon dark v-if="folder_local == ''">
                  mdi-information-outline
                </v-icon>
                <v-icon dark v-else> mdi-close </v-icon>
              </v-btn>
            </v-col>
            <v-col offset="2" cols="8" class="mb-0 mt-0 pb-0"
              ><v-btn
                style="width: 100%"
                class="mb-5"
                dense
                @click="selectRemote()"
                ><span v-if="folder_shared == ''">Select shared folder</span
                ><span v-else>
                  <v-icon left> mdi-folder </v-icon>
                  {{ folder_shared_name }}</span
                ></v-btn
              ></v-col
            ><v-col cols="2" class="mb-0 pl-0"
              ><v-btn class="px-0'" icon @click="folder_shared = ''">
                <v-icon dark v-if="folder_shared == ''">
                  mdi-information-outline
                </v-icon>
                <v-icon dark v-else> mdi-close </v-icon>
              </v-btn></v-col
            >
            <v-col offset="2" cols="8" class="mb-0 mt-5 pt-0"
              ><v-btn
                dark
                dense
                style="width: 100%"
                color="#2046d1"
                @click="done"
                >Done</v-btn
              ></v-col
            >
          </v-row>
        </v-card>
      </v-col>
    </v-row>
    <div
      style="
        position: absolute;
        bottom: 0px;
        height: 60px;
        width: 100%;
        margin-left: -12px;
        margin-bottom: 30px;
      "
    >
      <v-container>
        <v-row>
          <v-col cols="4">
            <div style="text-align: left; margin-top: 10px; opacity: 0.2">
              <p style="font-size: 11px" class="mb-2">01. ACCOUNT INFO</p>
              <div
                style="
                  opacity: 0.7;
                  height: 4px;
                  width: 100%;
                  background: #ffffff;
                "
              />
            </div>
          </v-col>
          <v-col cols="4">
            <div style="text-align: left; margin-top: 10px">
              <p style="font-size: 11px" class="mb-2">02. CONFIGURE FOLDER</p>
              <div
                style="
                  opacity: 0.7;
                  height: 4px;
                  width: 100%;
                  background: #ffffff;
                "
              />
            </div> </v-col
          ><v-col cols="4">
            <div style="text-align: left; margin-top: 10px; opacity: 0.2">
              <p style="font-size: 11px" class="mb-2">03. ADD ENJOY</p>
              <div
                style="
                  opacity: 0.7;
                  height: 4px;
                  width: 100%;
                  background: #ffffff;
                "
              />
            </div>
          </v-col>
        </v-row>
      </v-container>
    </div>
    <div
      style="
        position: absolute;
        top: 0px;
        left: 0px
        z-index: 100;
        margin-left: 10px;
        margin-top: 10px;
      "
    >
      <v-btn
        class="ma-2"
        text
        icon
        color="white lighten-2"
        @click="$emit('back')"
        ><v-icon large>mdi-arrow-left</v-icon></v-btn
      >
    </div>
  </v-container>
</template>

<script>
const { ipcRenderer } = window.require("electron");

export default {
  name: "UserStep2",
  props: ["formdata"],

  data: () => ({
    errorDialog: false,
    errorText: "",
    folder_shared: "",
    folder_local: "",
  }),
  created() {
    console.log("created ", this.formdata);
    if (this.formdata) {
      if (this.formdata.hasOwnProperty("remote")) {
        this.folder_shared = this.formdata.remote;
      }
      if (this.formdata.hasOwnProperty("local")) {
        this.folder_local = this.formdata.local;
      }
    }
  },
  computed: {
    folder_shared_name: function() {
      if (this.folder_shared)
        return this.folder_shared.match(/([^\/]*)\/*$/)[1];
      else return "";
    },
    folder_local_name: function() {
      if (this.folder_local) return this.folder_local.match(/([^\/]*)\/*$/)[1];
      else return "";
    },
  },
  methods: {
    done() {
      console.log("USERSTEP2: ", this.folder_local, this.folder_shared);
      if (!this.folder_local || !this.folder_shared) {
        console.log("USERSTEP2: ERROR"); //TODO
        return;
      }
      const data = {
        remote: this.folder_shared,
        local: this.folder_local,
      };
      this.$emit("next", data);
    },
    async selectRemote() {
      const folder = await ipcRenderer.invoke("select-remote-folder", true);
      console.log(folder);
      if (!folder.canceled) {
        if (!folder.isRepo) {
          this.errorText =
            "The folder you selected is not an Abebox repository. You have to select the folder shared by the Abebox administrator.";
          this.errorDialog = true;
        } else {
          this.folder_shared = folder.filePaths[0];
        }
      }
    },
    async selectLocal() {
      const folder = await ipcRenderer.invoke("select-local-folder");
      console.log(folder);
      if (!folder.canceled) this.folder_local = folder.filePaths[0];
    },
  },
};
</script>
