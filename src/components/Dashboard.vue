<template>
  <div class="main-page">
    <user-dashboard v-if="!isAdmin"></user-dashboard>
    <admin-dashboard v-else></admin-dashboard>
  </div>
</template>

<script>
import UserDashboard from "./UserDashboard.vue";
import AdminDashboard from "./AdminDashboard.vue";
const { ipcRenderer } = window.require("electron");

export default {
  props: ["isAdmin"],
  data: () => ({
    configured: false,
    info: {},
  }),
  name: "Dashboard",
  model: {
    event: "configured",
  },
  components: {
    UserDashboard,
    AdminDashboard,
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
