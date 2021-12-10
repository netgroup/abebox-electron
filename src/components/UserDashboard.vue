<template>
  <v-container>
    <v-row>
      <v-col cols="12"><h1>Dashboard</h1></v-col>
      <v-col cols="4"
        ><v-card><v-card-title>Documents</v-card-title></v-card></v-col
      ><v-col cols="4"
        ><v-card><v-card-title>Attributes</v-card-title></v-card></v-col
      >
    </v-row>
  </v-container>
</template>

<script>
const { ipcRenderer } = window.require("electron");

export default {
  name: "UserDashboard",
  data: () => ({}),

  created() {
    console.log("APP: CREATED");
    //this.getConfiguration();
  },
  mounted() {
    console.log("APP: MLOUNTED");
  },
  methods: {
    async getUserInfo() {
      console.log("getInfo");
      const conf = await ipcRenderer.invoke("get-conf");
      this.handleConf(conf);
    },
  },
};
</script>
