<template>
  <v-container class="admin-step-1 pb-0 pt-5">
    <v-row class="text-center">
      <!--<v-col cols="12">
        <v-img :src="require('../assets/img/logo.png')" contain height="65" />
      </v-col>-->
      <v-col class="mt-0 mb-0" offset="3" cols="6">
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
              <p style="font-size: 11px" class="mb-2">03. ADD ATTRIBUTE</p>
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
  </v-container>
</template>

<script>
const { ipcRenderer } = window.require("electron");

export default {
  name: "AdminStep2",

  data: () => ({
    folder_shared: "",
    folder_local: "",
    rs: true,
    rsn: "App Repo",
    ls: true,
    lsn: "Local Folder",
  }),
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
      const data = {
        remote: this.folder_shared,
        local: this.folder_local,
      };
      this.$emit("submit", data);
    },
    async selectRemote() {
      const folder = await ipcRenderer.invoke("select-folder");
      console.log(folder);
      this.folder_shared = folder.filePaths[0];
    },
    async selectLocal() {
      const folder = await ipcRenderer.invoke("select-folder");
      console.log(folder);
      this.folder_local = folder.filePaths[0];
    },
  },
};
</script>
