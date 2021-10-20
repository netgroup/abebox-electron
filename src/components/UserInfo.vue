<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <v-img
          :src="require('../assets/logo.svg')"
          class="my-3"
          contain
          height="200"
        />
      </v-col>
      <v-col cols="12">{{ info.name }}</v-col>
      <v-col cols="12">{{ info.remote }}</v-col>
      <v-col cols="12">{{ info.local }}</v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: "HelloWorld",
  props: ["info"],

  data: () => ({
    //
  }),
  mounted() {
    console.log("PPL HELLO WORLD");
  },
};
</script>
