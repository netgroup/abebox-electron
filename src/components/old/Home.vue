<template>
  <div style="position: relative; height: 100vh;">
    <v-progress-circular
      style="position: absolute; top: 30%; left:40%;"
      :size="70"
      :width="9"
      color="yellow"
      indeterminate
      v-if="status == -1"
    ></v-progress-circular>
    <start v-else-if="status == 0" @select="select"></start>
    <admin-step-1
      @signin="signin"
      v-model="formdata"
      v-else-if="status == 1"
    ></admin-step-1>
    <admin-step-2 @done="done" v-else-if="status == 2"></admin-step-2>
    <admin-step-3 @add="add" v-else-if="status == 3"></admin-step-3>
  </div>
</template>

<script>
import LoginUser from "../components/LoginUser.vue";
import UserInfo from "../components/UserInfo.vue";
import InsertData from "../components/InsertData.vue";
import Start from "../components/home/StartPage.vue";
import AdminStep1 from "../components/home/admin/AdminStep1.vue";
import AdminStep2 from "../components/home/admin/AdminStep2.vue";
import AdminStep3 from "../components/home/admin/AdminStep3.vue";

const { ipcRenderer } = window.require("electron");

export default {
  data: () => ({
    configured: false,
    info: {},
    status: 0,
    formdata: {},
  }),
  name: "Home",
  model: {
    event: "configured",
  },
  components: {
    Start,
    LoginUser,
    UserInfo,
    InsertData,
    Start,
    AdminStep1,
    AdminStep2,
    AdminStep3,
  },
  created() {
    console.log("APP: CREATED");
    this.getConfiguration();
  },
  mounted() {
    console.log("APP: MLOUNTED");
  },
  methods: {
    signin(data) {
      console.log("H: SIGNIN ", data);
      this.status = 2;
    },
    add(data) {
      console.log("H: ADD ", data);
      this.status = 0;
    },
    done(data) {
      console.log("H: DONE ", data);
      this.status = -1;
    },
    select(path) {
      console.log("H: SELECT ", path);
      if (path == "admin") {
        this.status = 1;
      } else {
        this.status = 10;
      }
    },
    async getConfiguration() {
      console.log("App - get configuration");
      const conf = await ipcRenderer.invoke("get-conf");
      this.handleConf(conf);
    },
    async handleSubmit(event) {
      console.log(event);
      const conf = await ipcRenderer.invoke("set-conf", event);
      this.handleConf(conf);
    },
    async handleConf(conf) {
      this.configured = conf.configured; // Salvare nello store
      console.log("HOME - handleConf", conf);
      this.$vueEventBus.$emit("configured", conf);
    },
  },
};
</script>
