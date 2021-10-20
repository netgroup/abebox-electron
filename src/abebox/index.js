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

const select_folder = async function() {
  const { dialog } = require("electron");
  const res = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  console.log();
  return res;
};

module.exports = {
  start_services,
  get_files_list,
  set_policy,
  get_config,
  select_folder,
};
