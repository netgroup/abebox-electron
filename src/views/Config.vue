<template>
  <v-container class="main-page pb-0">
    <v-row>
      <v-dialog v-model="errorDialog" persistent max-width="500">
        <v-card>
          <v-card-title class="text-h5 red--text">
            Warning !!!
          </v-card-title>
          <v-card-text class="text-body-1"
            >if you go on you will delete all the Abebox configuration and it
            will no longer be possible to recover it.<br />Do you want to
            proceed anyway?.</v-card-text
          >
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="danger darken-1" @click="resetAbebox">
              Reset and Quit
            </v-btn>
            <v-btn color="primary darken-1" @click="errorDialog = false">
              Cancel
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-col cols="12">
        <h1>Abebox Configuration</h1>
      </v-col>
      <v-col class="mt-5" offset="1" cols="5">
        <p class="body-1 font-weight-regular" style="opacity: 0.5">
          {{ name }}
        </p>
      </v-col>
      <v-col class="mt-5" offset="1" cols="5">
        <p class="body-1 font-weight-regular" style="opacity: 0.5">
          {{ local }}
        </p>
      </v-col>
      <v-col class="mt-5" offset="1" cols="5">
        <p class="body-1 font-weight-regular" style="opacity: 0.5">
          {{ remote }}
        </p>
      </v-col>
      <v-col class="mt-5" offset="1" cols="5">
        <p class="body-1 font-weight-regular" style="opacity: 0.5">
          <v-btn @click="errorDialog = true">Reset Configuration</v-btn>
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
const { ipcRenderer } = window.require("electron");

export default {
  name: "Config",
  data: () => ({
    errorDialog: false,
    remote: "",
    local: "",
    name: "",
  }),
  watch: {
    "$store.state.conf": function() {
      this.remote = this.$store.state.conf.remote;
      this.name = this.$store.state.conf.name;
      this.local = this.$store.state.conf.local;
    },
  },
  methods: {
    async resetAbebox() {
      await ipcRenderer.invoke("reset-abebox", "");
    },
  },
};
</script>
