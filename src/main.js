import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";

/*const rabe = require("./abebox-core/rabejs/rabejs.node");
const [pk, msk] = rabe.setup();
console.log("PPL", pk);*/

Vue.config.productionTip = false;
Vue.prototype.$vueEventBus = new Vue(); // Global event bus

new Vue({
  router,
  store,
  vuetify,
  render: function(h) {
    return h(App);
  },
}).$mount("#app");
