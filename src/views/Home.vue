<template>
  <div>
    <user-info v-if="state === 0" />
    <login-user v-else-if="state === 1" />
  </div>
</template>

<script>
import LoginUser from "../components/LoginUser.vue";
const { ipcRenderer } = window.require("electron");

export default {
  data: () => ({
    state: 1,
  }),
  name: "Home",
  model: {
    event: "configured",
  },
  components: {
    LoginUser,
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
      console.log("CONF:", conf);
      if (Object.keys(conf).length === 0) {
        this.$vueEventBus.$emit("configured", false);
      } else {
        this.$vueEventBus.$emit("configured", true);
      }
    },
  },
};
</script>
