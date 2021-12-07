<template>
  <v-container class="admin-step-1 pb-0 mt-5">
    <v-row class="text-center">
      <!--<v-col cols="12">
        <v-img :src="require('../assets/img/logo.png')" contain height="65" />
      </v-col>-->
      <v-col class="mt-0 mb-0" offset="3" cols="6">
        <p class="body-2 font-weight-bold mb-0">STEP #2</p>
        <div class="text-h5 font-weight-bold">Configure your folders</div>
        <div class="d-flex justify-center mt-2 mb-2">
          <div
            style="width: 30px; height: 5px; background: #ffffff; opacity: 0.5"
          />
        </div>
      </v-col>
    </v-row>
    <v-row class="mt-0">
      <v-col cols="6" offset="3">
        <v-card color="white" class="pa-10 mt-5">
          <v-row>
            <v-col offset="2" cols="8" class="mb-0 mt-0 pb-0"
              ><v-btn style="width: 100%" class="mb-5" dense
                ><span v-if="!rs">Select shared folder</span
                ><span v-else>
                  <v-icon left> mdi-folder </v-icon> {{ rsn }}</span
                ></v-btn
              ></v-col
            ><v-col cols="2" class="mb-0 pl-0"
              ><v-btn class="px-0'" icon>
                <v-icon dark v-if="!rs"> mdi-information-outline </v-icon>
                <v-icon dark v-else> mdi-close </v-icon>
              </v-btn></v-col
            >
            <v-col offset="2" cols="8" class="mb-0 mt-0 pb-0"
              ><v-btn dense style="width: 100%"
                ><span v-if="!ls">Select local folder</span
                ><span v-else>
                  <v-icon left> mdi-folder </v-icon> {{ lsn }}</span
                ></v-btn
              ></v-col
            ><v-col cols="2" class="mb-0 pl-0">
              <v-btn class="px-0" icon>
                <v-icon dark v-if="!ls"> mdi-information-outline </v-icon>
                <v-icon dark v-else> mdi-close </v-icon>
              </v-btn>
            </v-col>
            <v-col offset="2" cols="8" class="mb-0 mt-5 pt-0"
              ><v-btn dark dense style="width: 100%" color="#2046d1"
                >Done</v-btn
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
            <div style="text-align: left; margin-top: 10px">
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
              <p style="font-size: 11px" class="mb-2">03. ADD ENJOY</p>
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
  name: "UserStep2",

  data: () => ({
    name: "",
    email: "",
    rs: true,
    rsn: "App Repo",
    ls: true,
    lsn: "Local Folder",
  }),
};
</script>
