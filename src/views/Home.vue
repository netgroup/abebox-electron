<template>
  <v-card>
    <user-info v-bind:info="info" v-if="configured" />
    <login-user v-on:submit="handleSubmit" v-else />
  </v-card>
</template>

<script>
import LoginUser from "../components/LoginUser.vue";
import UserInfo from "../components/UserInfo.vue";
const { ipcRenderer } = window.require("electron");

export default {
  data: () => ({
    configured: false,
    info: {},
  }),
  name: "Home",
  model: {
    event: "configured",
  },
  components: {
    LoginUser,
    UserInfo,
  },
  created() {
    console.log("APP: CREATED");
    this.getConfiguration();
  },
  mounted() {
    console.log("APP: MLOUNTED");
  },
  methods: {
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
