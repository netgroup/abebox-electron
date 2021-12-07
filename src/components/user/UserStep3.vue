<template>
  <v-container class="admin-step-1 pb-0 mt-5">
    <v-row class="text-center">
      <!--<v-col cols="12">
        <v-img :src="require('../assets/img/logo.png')" contain height="65" />
      </v-col>-->
      <v-col class="mt-0 mb-0" offset="2" cols="8">
        <p class="body-2 font-weight-bold mb-0">STEP #3</p>
        <div class="text-h5 font-weight-bold">Data Confirmation</div>
        <div class="d-flex justify-center mt-2 mb-2">
          <div
            style="width: 30px; height: 5px; background: #ffffff; opacity: 0.5"
          />
        </div>
      </v-col>
    </v-row>
    <v-row class="mt-0">
      <v-col cols="6" offset="3">
        <v-card color="white" class="pa-10">
          <v-row>
            <v-col ocols="12" class="pa-0 mb-0"
              ><p class="caption mb-0">Name:</p>
              <p class="font-weight-bold mb-2">Pierpaolo</p></v-col
            >
            <v-col cols="12" class="pa-0 mb-0"
              ><p class="caption mb-0">Email:</p>
              <p class="font-weight-bold mb-2">pierpaolo.loreti@pp.it</p></v-col
            >
            <v-col cols="12" class="pa-0"
              ><p class="caption mb-0">Key Code:</p>
              <p class="font-weight-bold mb-5">
                29cf50c7e4a0c01d4f0a4f6a2cc9f3a9368ed4f41c9ac3e5c9f284a226840db1
              </p></v-col
            >
            <v-col cols="12" class="pl-0"
              ><v-btn style="width: 50%" color="#2046d1" dark class="ml-0 mr-5"
                >Submit</v-btn
              ><v-btn style="width: 20%" primary class="ml-10"
                >Reset</v-btn
              ></v-col
            >
          </v-row>
        </v-card>
      </v-col>
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
            <div style="text-align: left; margin-top: 10px; opacity: 0.2">
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
            <div style="text-align: left; margin-top: 10px">
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
  name: "UserStep3",

  data: () => ({
    name: "",
    email: "",
  }),
};
</script>
<style scoped>
.v-text-field--outlined >>> fieldset {
  border-color: transparent;
}
</style>
