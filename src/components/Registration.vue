<template>
  <div style="position: relative; height: 100vh;" class="register-pages">
    <start-page v-if="status == 0" @onpath="handlePathSelection"></start-page>
    <user-path
      v-else-if="status == 1"
      @done="handleRegistrationDone"
      @reset="handleReset"
    ></user-path>
    <admin-path
      v-else-if="status == 2"
      @done="handleRegistrationDone"
      @reset="handleReset"
    ></admin-path>
    <v-overlay :value="registering">
      <v-progress-circular
        indeterminate
        persistent
        size="64"
      ></v-progress-circular>
    </v-overlay>
  </div>
</template>

<script>
const { ipcRenderer } = window.require("electron");

import StartPage from "./StartPage.vue";
import UserPath from "../components/user/UserPath.vue";
import AdminPath from "../components/admin/AdminPath.vue";
//import Registering from "./Registering.vue";

export default {
  data: () => ({
    status: 0,
    registering: false,
  }),
  name: "Registration",
  components: {
    UserPath,
    AdminPath,
    StartPage,
  },
  mounted() {
    console.log("APP: MLOUNTED");
  },
  methods: {
    handlePathSelection(path) {
      console.log("handlePathSelection", path);
      if (path == "admin") {
        this.status = 2;
      } else {
        this.status = 1;
      }
    },
    async handleRegistrationDone(data) {
      console.log("handleRegistrationDone ", data); // the full configurqtion submitted
      const old_status = this.status;
      this.registering = true;

      let conf;
      if (old_status == 2) {
        const admin_conf = {
          name: data.email,
          remote: data.remote,
          local: data.local,
          token: "",
          isAdmin: true, // admin path
          configured: true,
        };
        conf = await this.saveConf(admin_conf);

        if (data.univ != "" && data.attr != "") {
          const attr = {
            univ: data.univ,
            attr: data.attr,
            vers: 1,
          };
          await this.createAttr(attr);
        }
      } else {
        const user_conf = {
          name: data.email,
          remote: data.remote,
          local: data.local,
          token: data.token,
          isAdmin: false, // user path
          configured: true,
        };

        conf = await this.saveConf(user_conf);
      }

      this.registering = false;
      this.$emit("done", conf);
    },
    async saveConf(new_conf) {
      console.log("saveConf ", new_conf); // the full configurqtion submitted
      return await ipcRenderer.invoke("set-conf", new_conf);
    },
    async createAttr(new_attr) {
      console.log("createAttr ", new_attr);
      await ipcRenderer.invoke("new-attr", new_attr);
    },
    handleReset() {
      console.log("handleReset ");
      this.status = 0;
    },
  },
};
</script>
