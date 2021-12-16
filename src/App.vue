<template>
  <v-app class="abebox-app">
    <v-navigation-drawer
      v-if="configured"
      v-model="drawer"
      app
      permanent
      mini-variant
      class="nav-drawer"
      dark
    >
      <v-divider></v-divider>
      <v-list>
        <v-list-item class="px-2">
          <v-list-item-avatar>
            <v-img :src="require('./assets/img/logo_blu.png')"></v-img>
          </v-list-item-avatar>
        </v-list-item>
      </v-list>
      <v-list>
        <v-list-item-group v-model="model">
          <v-list-item
            v-for="item in items"
            :key="item.title"
            :value="item.active"
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
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <router-view></router-view>
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: "App",
  data: () => ({
    model: 0,
    drawer: false,
    items: [],
    mini: false,
  }),
  created() {
    this.$store.dispatch("get_conf");

    /*this.$vueEventBus.$on("configured", (conf) => {
      if (!conf.configured) {
        this.configured = false;
        this.configuration = {};
      } else {
        this.configured = true;
        this.configuration = conf;
      }
    });*/
  },
  beforeDestroy() {
    //this.$vueEventBus.$off("configured");
  },
  computed: {
    configured: function() {
      return this.$store.state.conf.configured;
    },
    isAdmin: function() {
      return this.$store.state.conf.isAdmin;
    },
  },
  watch: {
    "$store.state.conf": function() {
      console.log("New conf: ", this.$store.state.conf);
    },
    configured: function(val) {
      console.log("configured: ", val);
      if (this.configured) {
        this.items.push({
          title: "Home",
          icon: "mdi-home",
          route: "/",
        });
        this.items.push({
          title: "Documents",
          icon: "mdi-folder-key",
          route: "/docs",
        });
        this.items.push({
          title: "Attributes",
          icon: "mdi-format-list-bulleted",
          route: "/attrs",
        });

        if (this.isAdmin) {
          this.items.push({
            title: "Users",
            icon: "mdi-account-multiple",
            route: "/users",
          });
        }
      }
    },
  },
};
</script>
<style>
@import "./assets/styles/main.css";
.v-navigation-drawer .v-list .v-list-item {
  background-color: #2046d1 !important;
}
.nav-drawer.theme--dark.v-navigation-drawer {
  background-color: transparent !important;
}
</style>
