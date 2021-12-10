<template>
  <div>
    <v-container class="step1-cont" ma-0 pa-0>
      <v-row style="text-align: center;">
        <v-img
          :src="require('../assets/img/logo2.png')"
          contain
          height="60px"
        />
        <div style="text-align: center; margin-top: 15px; width: 100%;">
          <p>STEP #1</p>
        </div>
      </v-row>
      <v-row>
        <v-col>
          <div class=" darken-2 text-center">
            <span class="white--text"
              >Please fill s your personal info below to use Abebox App</span
            >
          </div>
        </v-col>
      </v-row>
      <v-row>
        <v-col class="pb-0 pt-0" offset="4" cols="4" sm="4">
          <v-text-field
            v-model="name"
            label="Name"
            required
            solo
            rounded-lg
          ></v-text-field>
        </v-col>
        <v-col class="pb-0 pt-0" offset="4" cols="4" sm="4">
          <v-text-field
            v-model="email"
            label="Email Address"
            required
            solo
            rounded-lg
          ></v-text-field>
        </v-col>
        <v-col offset="4" cols="4" sm="4" ma-0 pa-0
          ><span class="text-sm-11">I agree on terms and conditions</span>
        </v-col>
        <v-col offset="4" cols="4" sm="4"
          ><v-btn style="width: 267px; height: 48px; margin: 0; padding: 0"
            >Sign In</v-btn
          >
        </v-col>
      </v-row>
    </v-container>
    <div class="nav">
      <v-container>
        <v-row>
          <v-col sm="4">
            <div style="text-align: center; margin-top: 10px;">
              <p style="font-size: 11px">
                01. ACCOUNT INFO
              </p>
              <hr style="opacity: 0.4" />
            </div>
          </v-col>
          <v-col sm="4">
            <div style="text-align: center; margin-top: 10px; opacity: 0.2;">
              <p style="font-size: 11px">
                02. CONFIGURE FOLDER
              </p>
              <hr style="opacity: 0.4" />
            </div> </v-col
          ><v-col sm="4">
            <div style="text-align: center; margin-top: 10px; opacity: 0.2;">
              <p style="font-size: 11px">
                03. ADD ATTRIBUTE
              </p>
              <hr style="opacity: 0.4" />
            </div>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<script>
const { ipcRenderer } = window.require("electron");
const { get_tree } = require("../abebox/utils");

export default {
  name: "Step01",
  data: () => ({
    name: "",
    email: "",
  }),
};
</script>
