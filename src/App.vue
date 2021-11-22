<template>
  <v-app>
    <v-navigation-drawer
      v-if="configured"
      v-model="drawer"
      app
      permanent
      mini-variant
    >
      <!--<v-list-item class="px-2">
        <v-list-item-avatar>
          <v-img :src="require('./assets/gb.jpg')"></v-img>
        </v-list-item-avatar>

        <v-list-item-title>{{ configuration.name }}</v-list-item-title>

        <v-btn icon @click.stop="mini = !mini">
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
      </v-list-item>-->

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
export default {
  name: "App",
  data: () => ({
    drawer: false,
    items: [],
    mini: false,
    configured: false,
    configuration: {},
  }),
  created() {
    this.$vueEventBus.$on("configured", (conf) => {
      if (!conf.configured) {
        this.configured = false;
        this.configuration = {};
      } else {
        this.configured = true;
        this.configuration = conf;
      }
    });
  },

  beforeDestroy() {
    this.$vueEventBus.$off("configured");
  },
  watch: {
    configured: function(val) {
      console.log("configured: ", val);
      if (this.configured) {
        this.items.push({ title: "Home", icon: "mdi-home-city", route: "/" });
        this.items.push({
          title: "Repository",
          icon: "mdi-folder-key",
          route: "/repository",
        });

        if (this.configuration["isAdmin"]) {
          this.items.push({
            title: "Users",
            icon: "mdi-account-group-outline",
            route: "/users",
          });
          this.items.push({
            title: "Attributes",
            icon: "mdi-cards-variant",
            route: "/attrs",
          });
        }
      }
    },
  },
};
</script>
