<template>
  <v-container class="hello-page pb-0">
    <v-row class="text-center">
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
          <v-btn>Reset Configuration</v-btn>
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
export default {
  name: "Config",
  data: () => ({
    remote: "",
    local: "",
    name: "",
  }),
  watch: {
    "$store.state.conf": function() {
      console.log("New conf: ", this.$store.state.conf);
    },
  },
};
</script>
