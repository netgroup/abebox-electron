<template>
  <v-container class="admin-step-1 pb-0 mt-5">
    <v-row class="text-center">
      <!--<v-col cols="12">
        <v-img :src="require('../assets/img/logo.png')" contain height="65" />
      </v-col>-->
      <v-col class="mt-0 mb-0" offset="3" cols="6">
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
      <v-col class="pb-0 pt-0 mb-0" cols="4" offset="4">
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
      <v-col class="pb-0 pt-0 mb-0 mt-0" cols="4" offset="4">
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
      <v-col class="pb-0 pt-0 mb-0 mt-0" cols="4" offset="4">
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
        ><v-btn style="width: 100%; height: 40px; margin: 0; padding: 0"
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
        margin-bottom: 30px;
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
  </v-container>
</template>

<script>
export default {
  name: "UserStep1",
  data: () => ({
    name: "",
    email: "",
    token: "",
  }),
};
</script>
<style scoped>
.v-text-field--outlined >>> fieldset {
  border-color: transparent;
}
</style>
