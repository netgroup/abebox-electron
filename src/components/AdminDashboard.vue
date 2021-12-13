<template>
  <v-container>
    <v-row>
      <v-col cols="12"><h1>Dashboard</h1></v-col>
      <v-col cols="4"
        ><v-card
          ><v-card-title>Documents</v-card-title>
          <v-card-text
            ><div class="text-h3 text--primary">{{ num_files }}</div>
            <div class="text-body-1 text--primary">
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
            ><div class="text-h3 text--primary">{{ num_attrs }}</div>
            <div class="text-body-1 text--primary">
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
            ><div class="text-h3 text--primary">{{ num_users }}</div>
            <div class="text-body-1 text--primary">
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
  data: () => ({
    num_files: "",
    num_attrs: "",
    num_users: "",
  }),

  created() {
    console.log("APP: CREATED");
    this.getAdminInfo();
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
    async getAdminInfo() {
      const info = await ipcRenderer.invoke("get-admin-info");
      console.log("getInfo: ", info);
      this.handleInfo(info);
    },
    handleInfo(data) {
      this.num_files = data.num_files;
      this.num_attrs = data.num_attrs;
      this.num_users = data.num_users;
    },
  },
};
</script>
