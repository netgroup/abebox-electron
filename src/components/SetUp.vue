<template>
  <v-container class="setup">
    <v-row>
      <v-img :src="require('../assets/img/logo.png')" contain height="60px" />
    </v-row>
    <v-row>
      <v-col sm="6">
        <div style="text-align: center; margin-top: 30px;">
          <h1>This is an about page</h1>
          <p class="text-white-50">
            Abebox provides end-to-end encryption on top of your file sharing
            service (Dropbox, Google Drive, Owncloud ecc.) using Attribute Based
            Encryption.
          </p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <v-btn primary style="width: 300px">
            <v-icon left dark>
              mdi-cloud-upload
            </v-icon>
            Create User
          </v-btn>
        </div>
        <div style="text-align: center; margin-top: 20px;">
          <v-btn primary style="width: 300px">
            Create Repo
          </v-btn>
        </div>
      </v-col>
    </v-row>
    <div style="position: absolute; bottom: 0px; width: 100%">
      <v-col sm="6" offset="3">
        <div style="text-align: center; margin-top: 10px;">
          <hr style="opacity: 0.4" />
          <p style="font-size: 11px">
            copyright
          </p>
        </div>
      </v-col>
    </div>
  </v-container>
</template>
