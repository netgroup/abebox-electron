<template>
  <v-app>
    <v-navigation-drawer
      v-if="configured"
      v-model="drawer"
      app
      permanent
      mini-variant
    >
      <v-list-item class="px-2">
        <v-list-item-avatar>
          <v-img :src="require('./assets/gb.jpg')"></v-img>
        </v-list-item-avatar>

        <v-list-item-title>Giuseppe Bianchi</v-list-item-title>

        <v-btn icon @click.stop="mini = !mini">
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
      </v-list-item>

      <v-divider></v-divider>

      <v-list dense>
        <v-list-item
          v-for="item in items"
          :key="item.title"
          link
          router
          @click="$router.push({ path: item.route })"
        >
          <v-list-item-icon>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <v-container fluid>
        <router-view></router-view>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
const { ipcRenderer } = window.require("electron");

export default {
  name: "App",
  data: () => ({
    drawer: true,
    items: [
      { title: "Home", icon: "mdi-home-city", route: "/" },
      { title: "Repository", icon: "mdi-folder-key", route: "/repository" },
      { title: "Users", icon: "mdi-account-group-outline", route: "/users" },
    ],
    mini: false,
    configured: false,
  }),
  created() {
    console.log("APP: CREATED");
    this.getConfiguration();
  },
  mounted() {
    console.log("APP: MLOUNTED");
  },
  methods: {
    async getConfiguration() {
      console.log("App - get configuration");
      const conf = await ipcRenderer.invoke("get-conf");
      console.log("CONF:", conf);
      if (Object.keys(conf).length === 0) {
        this.$router.push({ path: "loginuser" });
      } else {
      }
    },
  },
};
</script>
