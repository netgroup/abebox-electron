<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <p>Inserisci le tue info</p>
      </v-col>
      <v-col cols="12"
        ><v-text-field
          v-model="email"
          :rules="emailRules"
          label="E-mail"
          required
        ></v-text-field
      ></v-col>
      <v-col cols="4">
        <v-btn @click="selectRemote()">Select Remote Folder</v-btn>
      </v-col>
      <v-col cols="8">
        <span v-if="remote_repo"> PATH Remote: {{ remote_repo }}</span>
      </v-col>
      <v-col cols="4"
        ><v-btn @click="selectLocal()">select Local Folder</v-btn> </v-col
      ><v-col cols="8">
        <span v-if="local_repo"> PATH Local: {{ local_repo }}</span>
      </v-col>
      <v-col cols="12"
        ><v-text-field v-model="token" label="Token" required></v-text-field
      ></v-col>
      <v-col cols="2">
        <v-btn @click="submitConf()" color="success">Submit</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
const { ipcRenderer } = window.require("electron");

export default {
  name: "LoginUser",

  data: () => ({
    valid: true,
    email: "",
    token: "",
    emailRules: [
      (v) => !!v || "E-mail is required",
      (v) => /.+@.+/.test(v) || "E-mail must be valid",
    ],
    remote_repo: null,
    local_repo: null,
  }),
  mounted() {
    console.log("COMP:" + this.email);
  },
  methods: {
    async selectRemote() {
      const folder = await ipcRenderer.invoke("select-folder");
      this.remote_repo = folder.filePaths[0];
    },
    async selectLocal() {
      const folder = await ipcRenderer.invoke("select-folder");
      this.local_repo = folder.filePaths[0];
    },
    async submitConf() {
      if (this.local_repo == undefined || this.remote_repo == undefined) {
        // Mostra errore
        return;
      }

      const isAdmin = false;
      if (this.token === "") {
        const isAdmin = true;
      }

      this.$emit("submit", {
        name: this.email,
        remote: this.remote_repo,
        local: this.local_repo,
        token: this.token,
        isAdmin: isAdmin,
        configured: true,
      });
    },
  },
};
</script>
