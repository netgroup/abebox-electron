<template>
  <div style="position: relative; height: 100vh;">
    <v-progress-circular
      style="position: absolute; top: 30%; left:40%;"
      :size="70"
      :width="9"
      color="yellow"
      indeterminate
      v-if="status == 0"
    ></v-progress-circular>
    <registration v-else-if="status == 1"></registration>
    <dashboard v-else-if="status == 2"></dashboard>
  </div>
</template>

<script>
import Registration from "../components/Registration.vue";
import Dashboard from "../components/Dashboard.vue";

const { ipcRenderer } = window.require("electron");

export default {
  data: () => ({
    status: 0,
    info: {},
    formdata: {},
    configuration: {},
  }),
  name: "Home",
  model: {
    event: "configured",
  },
  components: {
    Registration,
    Dashboard,
  },
  created() {
    this.getConfiguration();
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
      if (conf.configured) {
        this.status = 2;
        this.configuration = conf;
        this.$vueEventBus.$emit("configured", conf);
      } else {
        this.status = 1;
      }
    },
  },
};
</script>
