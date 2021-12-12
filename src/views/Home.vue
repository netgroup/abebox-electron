<template>
  <div style="position: relative; height: 100vh;" class="home-page">
    <v-overlay :value="status == 0">
      <v-progress-circular
        indeterminate
        persistentx
        color="yellow"
        size="64"
      ></v-progress-circular>
    </v-overlay>
    <v-dialog v-model="userWaiting" persistent max-width="400">
      <v-card>
        <v-card-title class="text-h5">
          Abebox Information
        </v-card-title>
        <v-card-text
          >The system is waiting to receive your ABE system keys from the
          Admin.</v-card-text
        >
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" text @click="close">
            Close the App
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <registration
      v-if="status == 1"
      @done="handlRegistrationDone"
    ></registration>
    <dashboard v-else-if="status == 2" :isAdmin="isAdmin"></dashboard>
  </div>
</template>

<script>
import Registration from "../components/Registration.vue";
import Dashboard from "../components/Dashboard.vue";

const { ipcRenderer } = window.require("electron");

export default {
  data: () => ({
    isAdmin: false,
    userWaiting: false,
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
    async close() {
      console.log("Cliked CLOSE");
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
      if (conf.configured) {
        this.configuration = conf;
        this.isAdmin = conf.isAdmin;
        this.status = 2;
        this.$vueEventBus.$emit("configured", conf);
      } else {
        this.status = 1;
      }
    },
    handlRegistrationDone(conf) {
      console.log("handlRegistrationDone", conf);
      this.handleConf(conf);
    },
  },
};
</script>
