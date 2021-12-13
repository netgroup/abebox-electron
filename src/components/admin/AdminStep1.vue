<template>
  <v-container class="admin-step-1 pb-0 pt-5">
    <v-row class="text-center">
      <!--<v-col cols="12">
        <v-img :src="require('../assets/img/logo.png')" contain height="65" />
      </v-col>-->
      <v-col class="mt-0 mb-0" offset="3" cols="6">
        <p class="body-2 font-weight-bold mb-0">STEP #1</p>
        <div class="text-h5 font-weight-bold">
          Please fill your personal info<br />
          below to use Abebox App
        </div>
        <div class="d-flex justify-center mt-2 mb-5">
          <div
            style="width: 30px; height: 5px; background: #ffffff; opacity: 0.5"
          />
        </div>
      </v-col>
    </v-row>
    <v-row class="mt-0">
      <v-col class="pb-0 pt-0" cols="4" offset="4">
        <v-text-field
          class="mb-0"
          v-model="name"
          label="Name"
          dense
          solo
          rounded-lg
        ></v-text-field>
      </v-col>
      <v-col class="pb-0 pt-0 mb-0" cols="4" offset="4">
        <v-text-field
          v-model="email"
          label="Email Address"
          required
          :rules="emailRules"
          dense
          solo
          rounded-lg
          class="form-input"
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
              <p style="font-size: 11px" class="mb-2">03. ADD ATTRIBUTE</p>
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
  name: "AdminStep1",
  props: ["formdata"],
  data: () => ({
    name: "",
    email: "",
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
    }
  },
  methods: {
    signin() {
      if (this.email) {
        const data = { email: this.email, name: this.name };
        console.log(data);
        this.$emit("next", data);
      }
    },
    back() {
      this.$emit("back");
    },
  },
};
</script>

<style>
.v-text-field--outlined >>> fieldset {
  border-color: transparent;
}
body .v-application .error--text {
  color: darkorange !important;
  caret-color: yellow !important;
}
</style>
