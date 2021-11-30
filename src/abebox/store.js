const Store = require("electron-store");

const schema = {
  configured: {
    type: "boolean",
    default: false,
  },
  conf: {
    type: "object",
    default: {},
  },
  keys: {
    type: "object",
    default: {},
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
  local_store.set("configured", true);
};

const set_keys = function(keys) {
  local_store.set("keys", keys);
};

const get_keys = function() {
  return local_store.get("keys", {});
};

const get_users = function() {
  return local_store.get("users");
};

const set_users = function(users) {
  local_store.set("users", users);
};

const get_files = function() {
  return local_store.get("files");
};

const set_files = function(files) {
  local_store.set("files", files);
};

const reset = function() {
  local_store.clear();
};

module.exports = {
  is_configured,
  get_conf,
  set_conf,
  set_keys,
  get_keys,
  get_users,
  set_users,
  get_files,
  set_files,
  reset,
};
