const Store = require("electron-store");

const schema = {
  configured: {
    type: "boolean",
    default: false,
  },
  data: {
    type: "object",
  },
};

const local_store = new Store();

const dev_init = function() {
  //local_store.set("name", "PPL");
};

//local_store.clear();
//dev_init();

const start_services = function() {};
const get_files_list = function() {};
const set_policy = function() {};

const set_config = function(conf) {
  console.log("Saving data", conf);
  local_store.set("data", conf);
  local_store.set("configured", true);
  return true;
};
const get_config = async function() {
  const conf = await local_store.get();
  console.log(conf);
  return conf;
};

module.exports = {
  start_services,
  get_files_list,
  set_policy,
  get_config,
  set_config,
};
