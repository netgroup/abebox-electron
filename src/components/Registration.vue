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
    <registering v-else-if="status == 3"></registering>
  </div>
</template>

<script>
const { ipcRenderer } = window.require("electron");

import StartPage from "./StartPage.vue";
import UserPath from "../components/user/UserPath.vue";
import AdminPath from "../components/admin/AdminPath.vue";
import Registering from "./Registering.vue";

export default {
  data: () => ({
    status: 0,
  }),
  name: "Registration",
  components: {
    UserPath,
    AdminPath,
    StartPage,
    Registering,
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
      this.status = 3; // saving the conf

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

        const attr = {
          univ: data.univ,
          attr: data.attr,
          vers: 1,
        };
        conf = await this.saveConf(admin_conf);
        await this.createAttr(attr);
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
