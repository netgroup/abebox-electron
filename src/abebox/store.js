const Store = require("electron-store");

const schema = {
  configured: {
    type: "boolean",
    default: false,
  },
  conf: {
    type: "object",
  },
  keys: {
    type: "object",
  },
  users: {
    type: "array",
    default: [],
  },
  files: {
    type: "array",
    default: [],
  },
};

const local_store = new Store({ schema });

const is_configured = function() {
  return local_store.get("configured");
};

const get_conf = function() {
  return local_store.get("conf", {});
};

const set_conf = function(conf) {
  local_store.set("conf", conf);
};

module.exports = {
  is_configured,
  get_conf,
};
