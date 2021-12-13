<template>
  <v-container class="admin-step-1 pb-0 mt-0">
    <v-row class="text-center">
      <!--<v-col cols="12">
        <v-img :src="require('../assets/img/logo.png')" contain height="65" />
      </v-col>-->
      <v-col class="mt-0 mb-0" offset="3" cols="6">
        <v-dialog v-model="errorDialog" persistent max-width="500">
          <v-card>
            <v-card-title class="text-h5 orange--text">
              Warning
            </v-card-title>
            <v-card-text class="text-body-1"
              >You need to provide the token received by the admin.</v-card-text
            >
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="warning darken-1" @click="errorDialog = false">
                OK
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <p class="body-2 font-weight-bold mb-0">STEP #1</p>
        <div class="text-h5 font-weight-bold">
          Please fill your personal info below to use Abebox App
        </div>
        <div class="d-flex justify-center mt-2 mb-5">
          <div
            style="width: 30px; height: 5px; background: #ffffff; opacity: 0.5"
          />
        </div>
      </v-col>
    </v-row>
    <v-row class="mt-0">
      <v-col class="pb-0 pt-0 mb-0" cols="6" offset="3">
        <v-text-field
          v-model="name"
          class="ma-0"
          label="Name"
          required
          dense
          rounded-lg
          outlined
          background-color="#637Fdb"
          dark
        ></v-text-field>
      </v-col>
      <v-col class="pb-0 pt-0 mb-0 mt-0" cols="6" offset="3">
        <v-text-field
          v-model="email"
          label="Email Address"
          class="ma-0"
          required
          dense
          rounded-lg
          outlined
          background-color="#637Fdb"
          dark
        ></v-text-field>
      </v-col>
      <v-col class="pb-0 pt-0 mb-0 mt-0" cols="6" offset="3">
        <v-text-field
          v-model="token"
          label="Key Code"
          class="ma-0"
          required
          dense
          rounded-lg
          outlined
          background-color="#637Fdb"
          dark
        ></v-text-field>
      </v-col>
      <v-col offset="4" cols="4" sm="4" class="mt-0 mb-0 pa-0 text-center"
        ><span class="caption">I agree on terms and conditions</span>
      </v-col>
      <v-col offset="4" cols="4" sm="4"
        ><v-btn
          style="width: 100%; height: 40px; margin: 0; padding: 0"
          @click="signin"
          >Sign In</v-btn
        ></v-col
      >
    </v-row>
    <div
      style="
        position: absolute;
        bottom: 0px;
        height: 60px;
        width: 100%;
        margin-left: -12px;
      "
    >
      <v-container>
        <v-row>
          <v-col cols="4">
            <div style="text-align: left; margin-top: 10px">
              <p style="font-size: 11px" class="mb-2">01. ACCOUNT INFO</p>
              <div
                style="
                  opacity: 0.7;
                  height: 4px;
                  width: 100%;
                  background: #ffffff;
                "
              />
            </div>
          </v-col>
          <v-col cols="4">
            <div style="text-align: left; margin-top: 10px; opacity: 0.2">
              <p style="font-size: 11px" class="mb-2">02. CONFIGURE FOLDER</p>
              <div
                style="
                  opacity: 0.7;
                  height: 4px;
                  width: 100%;
                  background: #ffffff;
                "
              />
            </div> </v-col
          ><v-col cols="4">
            <div style="text-align: left; margin-top: 10px; opacity: 0.2">
              <p style="font-size: 11px" class="mb-2">03. ENJOY</p>
              <div
                style="
                  opacity: 0.7;
                  height: 4px;
                  width: 100%;
                  background: #ffffff;
                "
              />
            </div>
          </v-col>
        </v-row>
      </v-container>
    </div>
    <div
      style="
        position: absolute;
        top: 0px;
        left: 0px
        z-index: 100;
        margin-left: 10px;
        margin-top: 10px;
      "
    >
      <v-btn
        class="ma-2"
        text
        icon
        color="white lighten-2"
        @click="$emit('back')"
        ><v-icon large>mdi-arrow-left</v-icon></v-btn
      >
    </div>
  </v-container>
</template>

<script>
export default {
  name: "UserStep1",
  props: ["formdata"],
  data: () => ({
    errorDialog: false,
    name: "",
    email: "",
    token: "",
    valid: false,
    emailRules: [
      (v) =>
        !v ||
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v) ||
        "E-mail must be valid",
    ],
  }),
  created() {
    console.log("created ", this.formdata);
    if (this.formdata) {
      if (this.formdata.hasOwnProperty("name")) {
        this.name = this.formdata.name;
      }
      if (this.formdata.hasOwnProperty("email")) {
        this.email = this.formdata.email;
      }
      if (this.formdata.hasOwnProperty("token")) {
        this.token = this.formdata.token;
      }
    }
  },
  methods: {
    signin() {
      if (this.email && this.token) {
        const data = { email: this.email, name: this.name, token: this.token };
        console.log(data);
        this.$emit("next", data);
      } else {
        this.errorDialog = true;
      }
    },
    back() {
      this.$emit("back");
    },
  },
};
</script>
<style scoped>
.v-text-field--outlined >>> fieldset {
  border-color: transparent;
}

body .v-application .error--text {
  color: darkorange !important;
  caret-color: yellow !important;
}
</style>
