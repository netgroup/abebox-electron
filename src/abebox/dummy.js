const Store = require("electron-store");

const schema = {
  configured: {
    type: "boolean",
    default: false,
  },
  name: {
    type: "string",
  },
  local_repo: {
    type: "string",
  },
  remote_repo: {
    type: "string",
  },
};

const local_store = new Store({ schema });

const dev_init = function() {
  local_store.set("name", "PPL");
};

local_store.clear();
//dev_init();

const start_services = function() {};
const get_files_list = function() {};
const set_policy = function() {};
const get_config = async function() {
  return { name: await local_store.get("name") };
};

module.exports = {
  start_services,
  get_files_list,
  set_policy,
  get_config,
};
