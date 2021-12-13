import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);
const { ipcRenderer } = window.require("electron");

export default new Vuex.Store({
  state: {
    conf: {},
  },
  mutations: {
    set_conf(state, conf) {
      state.conf = conf;
    },
  },
  actions: {
    get_conf({ commit }) {
      ipcRenderer.invoke("get-conf").then((conf) => {
        commit("set_conf", conf);
      });
    },
  },
  getters: {
    conf: (state) => {
      state.conf;
    },
  },
});
