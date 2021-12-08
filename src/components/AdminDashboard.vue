<template>
  <v-container>
    <v-row>
      <v-col cols="12"><h1>Dashboard</h1></v-col>
      <v-col cols="4"
        ><v-card
          ><v-card-title>Documents</v-card-title>
          <v-card-text
            ><div class="text-h3 text--primary">3</div>
            <div class="text-h6 text--primary">
              Encript and Share your documents
            </div></v-card-text
          ><v-card-actions
            ><v-btn width="100%" color="primary" @click="handleGo('docs')">
              Go
            </v-btn></v-card-actions
          ></v-card
        ></v-col
      ><v-col cols="4"
        ><v-card
          ><v-card-title>Attributes</v-card-title
          ><v-card-text
            ><div class="text-h3 text--primary">1</div>
            <div class="text-h6 text--primary">
              Create attributes for your group
            </div></v-card-text
          ><v-card-actions
            ><v-btn width="100%" color="primary" @click="handleGo('attr')">
              Go
            </v-btn></v-card-actions
          ></v-card
        ></v-col
      ><v-col cols="4"
        ><v-card
          ><v-card-title>Users</v-card-title
          ><v-card-text
            ><div class="text-h3 text--primary">3</div>
            <div class="text-h6 text--primary">
              Insert users to share your documents with
            </div></v-card-text
          ><v-card-actions
            ><v-btn width="100%" color="primary" @click="handleGo('usr')">
              Go
            </v-btn></v-card-actions
          ></v-card
        ></v-col
      ></v-row
    >
  </v-container>
</template>

<script>
const { ipcRenderer } = window.require("electron");

export default {
  name: "AdminDashboard",
  data: () => ({}),

  created() {
    console.log("APP: CREATED");
    //this.getConfiguration();
  },
  mounted() {
    console.log("APP: MLOUNTED");
  },
  methods: {
    handleGo(btn) {
      if (btn == "docs") {
        this.$router.push({ path: "/docs" });
      } else if (btn == "attr") {
        this.$router.push({ path: "/attrs" });
      } else {
        this.$router.push({ path: "/users" });
      }
    },
    async getUserInfo() {
      console.log("getInfo");
      const conf = await ipcRenderer.invoke("get-conf");
      this.handleConf(conf);
    },
  },
};
</script>
