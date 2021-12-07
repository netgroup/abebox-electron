<template>
  <v-container class="hello-page pb-0">
    <v-row class="text-center">
      <v-col cols="12">
        <v-img :src="require('../assets/img/logo.png')" contain height="65" />
      </v-col>
      <v-col class="mt-5" offset="1" cols="5">
        <h1 class="display-1 font-weight-bold mb-3">Protect your Data</h1>
        <p class="body-1 font-weight-regular" style="opacity: 0.5">
          Abebox provides end-to-end encryption on top of your file sharing
          service <br />(Dropbox, Google Drive, Owncloud ecc.) using Attribute
          Based Encryption.
        </p>
      </v-col>
      <v-col class="mb-30" cols="7">
        <v-row justify="center"
          ><v-btn primary style="width: 300px" class="text-my-blue">
            <v-icon left dark> mdi-account </v-icon>
            Create user
          </v-btn></v-row
        >
      </v-col>
      <v-col class="mb-4" offset="1" cols="5">
        <v-btn primary style="width: 300px" class="text-my-blue">
          <v-icon left dark> mdi-account </v-icon>
          Create admin user
        </v-btn>
      </v-col>
    </v-row>
    <div style="position: absolute; bottom: 0px; width: 100%">
      <v-col cols="4" offset="4" class="text-center mb-0">
        <hr style="opacity: 0.4" />
        <p class="caption mb-0 font-weight-bold" style="opacity: 0.6">
          Copyright ABEbox
        </p>
      </v-col>
    </div>
  </v-container>
</template>

<script>
export default {
  name: "HelloWorld",

  data: () => ({}),
};
</script>
