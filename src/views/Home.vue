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
      const conf = ipcRenderer.invoke("set-conf", event);
      this.handleConf(conf);
    },
    async handleConf(conf) {
      console.log("CONF:", conf);
      this.configured = conf.configured;
      console.log("CONFIGURED", this.configured);
      if (this.configured) {
        this.$vueEventBus.$emit("configured", true);
        this.info = conf.data;
      } else {
        this.$vueEventBus.$emit("configured", false);
        this.info = {};
      }
    },
  },
};
</script>
