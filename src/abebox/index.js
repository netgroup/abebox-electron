const abebox = require("./core");
const chokidar = require("chokidar");
const fs = require("fs");
const {
  parse_metadata,
  split_file_path,
  policy_as_string,
} = require("./file_utils");
const { v4: uuidv4 } = require("uuid");
const Store = require("electron-store");

//const ignore_list = ["keys/", "attributes/"];
const file_status = {
  ok: 0,
  modified: 1,
};

const schema = {
  configured: {
    type: "boolean",
    default: false,
  },
  data: {
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
//local_store.clear();

let files_list = [];

const init = function() {
  if (local_store.get("configured")) {
    console.log("LOADING ABEBOX CONFIGURATION");
    const data = local_store.get("data");
    files_list = local_store.get("files", []);
    start_services(data.local, data.remote);
  } else {
    console.log("ABEBOX NOT CONFIGURED");
  }
};

const handle_local_add = function(file_path) {
  const fid = uuidv4();
  const { original_file_name, relative_path } = split_file_path(
    file_path,
    abebox.conf.local_repo_path
  );
  /*const original_file_name = file_path.replace(/^.*[\\\/]/, "");
  console.log(file_path, fid, original_file_name);
  const path = file_path.replace(original_file_name, "");
  const relative_path = path.replace(abebox_repo.local_repo_path, "");*/
  const el = files_list.find(
    (el) =>
      el.file_path === relative_path && el.file_name === original_file_name
  );
  if (el === undefined) {
    files_list.push({
      file_path: relative_path,
      file_name: original_file_name,
      file_id: fid,
      policy: [],
      status: file_status.ok,
    });
    local_store.set("files", files_list);
  }
};

const handle_remote_add = function(file_path) {
  /*if (ignore_list.some((el) => file_path.includes(el))) {
    return;
  }*/
  const { original_file_name, relative_path } = split_file_path(
    file_path,
    abebox.conf.remote_repo_path
  );
  /*const fid = file_path.replace(/^.*[\\\/]/, "");
  console.log(`${fid} ${fid_no_ext}`);
  const path = file_path.replace(fid, "");
  const relative_path = path.replace(abebox_repo.remote_repo_path, "");*/
  const fid_no_ext = original_file_name.split(".")[0];
  try {
    // Read raw metadata
    const raw_metadata = fs.readFileSync(
      abebox.conf.remote_repo_path + "/repo/" + fid_no_ext + ".abebox"
    );
    const { enc_metadata } = JSON.parse(raw_metadata);
    //console.log("ENC META = ", enc_metadata);

    const parsed_enc_metadata = JSON.parse(enc_metadata);
    //console.log("PARSED ENC META = ", parsed_enc_metadata);

    const { _policy } = parsed_enc_metadata;
    console.log(_policy[0]);

    // Parse metadata
    const { file_path } = parse_metadata(
      raw_metadata,
      abebox.conf.abe_secret_key
    );
    const el = files_list.find(
      (el) =>
        el.file_path === relative_path &&
        el.file_name === file_path &&
        el.file_id === fid_no_ext
    );
    if (el === undefined) {
      files_list.push({
        file_path: relative_path,
        file_name: file_path,
        file_id: fid_no_ext,
        policy: _policy[0],
        status: file_status.ok,
      });
      local_store.set("files", files_list);
    }
  } catch (error) {
    console.log("Decryption failed: " + error);
    return false;
  }
};

const handle_local_change = function(file_path) {
  const { original_file_name, relative_path } = split_file_path(
    file_path,
    abebox.conf.local_repo_path
  );
  /*const original_file_name = file_path.replace(/^.*[\\\/]/, "");
  console.log(file_path, original_file_name);
  const path = file_path.replace(original_file_name, "");
  const relative_path = path.replace(abebox_repo.local_repo_path, "");*/
  const el = files_list.find(
    (el) =>
      el.file_path === relative_path && el.file_name === original_file_name
  );
  if (el !== undefined) {
    el.status = file_status.modified;
  }
};

const handle_remote_change = function(file_path) {
  const { original_file_name, relative_path } = split_file_path(
    file_path,
    abebox.conf.remote_repo_path
  );
  const fid_no_ext = original_file_name.split(".")[0];
  /*const fid = file_path.replace(/^.*[\\\/]/, "");
  console.log(file_path, fid);
  const path = file_path.replace(fid, "");
  const relative_path = path.replace(abebox_repo.remote_repo_path, "");*/
  const el = files_list.find(
    (el) => el.file_path === relative_path && el.file_id === fid_no_ext
  );
  if (el !== undefined) {
    el.status = file_status.modified;
  }
};

const handle_local_remove = function(file_path) {
  const { original_file_name, relative_path } = split_file_path(
    file_path,
    abebox.conf.local_repo_path
  );
  /*const original_file_name = file_path.replace(/^.*[\\\/]/, "");
  console.log(file_path, original_file_name);
  const path = file_path.replace(original_file_name, "");
  const relative_path = path.replace(abebox_repo.local_repo_path, "");*/
  const el = files_list.find(
    (el) =>
      el.file_path === relative_path && el.file_name === original_file_name
  );
  if (el !== undefined) {
    files_list.pop(el);
    local_store.set("files", files_list);
  }
};

const handle_remote_remove = function(file_path) {
  const { original_file_name, relative_path } = split_file_path(
    file_path,
    abebox.conf.remote_repo_path
  );
  const fid_no_ext = original_file_name.split(".")[0];
  /*const fid = file_path.replace(/^.*[\\\/]/, "");
  console.log(file_path, fid);
  const path = file_path.replace(fid, "");
  const relative_path = path.replace(abebox_repo.remote_repo_path, "");*/
  const el = files_list.find(
    (el) => el.file_path === relative_path && el.file_id === fid_no_ext
  );
  if (el !== undefined) {
    files_list.pop(el);
    local_store.set("files", files_list);
  }
};

function start_services(local_repo, remote_repo) {
  // local_repo = loc_repo;
  // remote_repo = rem_repo;

  abebox.init(local_repo, remote_repo, local_store);

  create_test_attributes();
  create_test_users();

  watch_paths = [local_repo, remote_repo];

  console.log(`Starting watching on ${watch_paths}`);

  let watcher = chokidar.watch(watch_paths, {
    awaitWriteFinish: true,
    ignored: [
      remote_repo + "/keys/*",
      remote_repo + "/attributes/*",
      remote_repo + "/repo/.*",
      remote_repo + "/repo/*/.*",
    ],
  });

  console.log("Setting on change event...");

  watcher
    .on("add", (file_path) => {
      console.log(`File ${file_path} has been added`);
      if (file_path.includes(watch_paths[0])) {
        // New local file
        handle_local_add(file_path);
      } else {
        // New remote file
        handle_remote_add(file_path);
      }
    })
    .on("change", (file_path) => {
      console.log(`File ${file_path} has been modified`);
      if (path.includes(watch_paths[0])) {
        // Change on local file
        handle_local_change(file_path);
      } else {
        // Change on remote file
        handle_remote_change(file_path);
      }
    })
    .on("unlink", (file_path) => {
      console.log(`File ${file_path} has been removed`);
      if (file_path.includes(watch_paths[0])) {
        // Remove local file
        handle_local_remove(file_path);
      } else {
        // Remove remote file
        handle_remote_remove(file_path);
      }
    });
}

/************************ TEST FUNCTIONS ************************/
const create_test_attributes = function() {
  const attributes = [
    {
      id: "1",
      univ: "university",
      attr: "professore",
      vers: "1",
    },
    {
      id: "2",
      univ: "university",
      attr: "studente",
      vers: "1",
    },
    {
      id: "3",
      univ: "university",
      attr: "triennale",
      vers: "1",
    },
  ];
  const data = local_store.get("data");
  attr_list_file = data.remote + "/attributes/attributes_list.json";
  if (!fs.existsSync(attr_list_file)) {
    fs.writeFileSync(
      data.remote + "/attributes/attributes_list.json",
      JSON.stringify(attributes)
    );
  }
};

const create_test_users = function() {
  const users = [
    { mail: "ppl0@ppl.it", rsa_pub_key: "", attrs: ["1", "2", "3"] },
    { mail: "ppl1@ppl.it", rsa_pub_key: "", attrs: ["2", "3"] },
    { mail: "ppl2@ppl.it", rsa_pub_key: "", attrs: ["1", "2"] },
    { mail: "ppl3@ppl.it", rsa_pub_key: "", attrs: ["1"] },
    { mail: "ppl4@ppl.it", rsa_pub_key: "", attrs: ["2"] },
  ];
  if (local_store.get("users", []).length == 0)
    local_store.set("users", users);
};

/******************************** EXPORTED FUNCTIONS ********************************/

/**************** FILES *****************/
const get_files_list = function() {
  files_list = local_store.get("files", []);
  console.log("FILE LIST", files_list);
  return files_list;
};

const set_policy = async function(data) {
  console.log("SET POLICY", data.file_id, data.policy);
  const el = await files_list.find((el) => el.file_id === data.file_id);
  if (el !== undefined) {
    el.policy = data.policy;
  }
  local_store.set("files", files_list);
  return files_list;
};

const share_files = function() {
  files_list.forEach((file) => {
    if (file.policy.length != 0) {
      abebox.file_encrypt(
        file.file_path + file.file_name,
        policy_as_string(file.policy),
        file.file_id
      );
    }
  });
  return files_list;
};

/**************** CONFIGURATION *****************/
const get_config = async function() {
  const conf = await local_store.get();
  console.log("INDEX.JS get_config()", conf);
  return conf;
  /*
  const config_file_path = __dirname + "/default.json";
  if (fs.existsSync(config_file_path)) {
    return JSON.parse(fs.readFileSync(config_file_path).toString());
  } else {
    // create an empty file
    fs.writeFileSync(config_file_path, "{}", function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("The file was saved!");
      }
    });
  }*/
};

const set_config = function(config_data) {
  console.log("Saving configuration data", config_data);
  local_store.set("data", config_data);
  local_store.set("configured", true);
  data = local_store.get("data");
  start_services(data.local, data.remote);
  return true;
  /*
  const config_file_path = __dirname + "/default.json";
  if (fs.existsSync(config_file_path)) {
    const config = JSON.parse(fs.readFileSync(config_file_path).toString());
    Object.assign(config, fields);
    fs.writeFileSync(config_file_path, JSON.stringify(config));
  } else {
    // create an empty file
    fs.writeFileSync(config_file_path, JSON.stringify(fields), function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("The file was saved!");
      }
    });
  }*/
};

/**************** ATTRIBUTES *****************/
const get_attrs = async function() {
  const data = await local_store.get("data");
  return JSON.parse(
    fs.readFileSync(data.remote + "/attributes/attributes_list.json")
  );
};

const new_attr = async function(new_obj) {
  const data = await local_store.get("data");
  const attrs = JSON.parse(
    fs.readFileSync(data.remote + "/attributes/attributes_list.json")
  );
  // Check if already exists
  const index = attrs.findIndex((item) => item.id == new_obj.id);
  if (index >= 0) {
    throw Error("ID is already present");
  } else {
    // Add new
    new_obj.id = attrs.length;
    attrs.push(new_obj);
    fs.writeFileSync(
      data.remote + "/attributes/attributes_list.json",
      JSON.stringify(attrs)
    );
    console.log("Adding:", new_obj, attrs);
    return attrs;
  }
};

const set_attr = async function(new_obj) {
  const data = await local_store.get("data");
  const attrs = JSON.parse(
    fs.readFileSync(data.remote + "/attributes/attributes_list.json")
  );
  // Check if already exists
  const index = attrs.findIndex((item) => item.id == new_obj.id);
  if (index < 0) {
    throw Error("ID not present");
  } else {
    // Replace
    const rem = attrs.splice(index, 1);
    console.log("Removing:", rem, attrs);
    attrs.push(new_obj);
    fs.writeFileSync(
      data.remote + "/attributes/attributes_list.json",
      JSON.stringify(attrs)
    );
    console.log("Adding:", new_obj, attrs);
    return attrs;
  }
};

const del_attr = async function(id) {
  const data = await local_store.get("data");
  const attrs = JSON.parse(
    fs.readFileSync(data.remote + "/attributes/attributes_list.json")
  );
  // Check if already exists
  const index = attrs.findIndex((item) => item.id == id);
  if (index < 0) {
    throw Error("ID not present");
  } else {
    // Remove
    const rem = attrs.splice(index, 1);
    fs.writeFileSync(
      data.remote + "/attributes/attributes_list.json",
      JSON.stringify(attrs)
    );
    console.log("Removing:", rem, attrs);
    return attrs;
  }
};

/**************** USERS *****************/
const get_users = async function() {
  return await local_store.get("users");
};

const new_user = async function(new_obj) {
  const users = await local_store.get("users");
  // Check if already exists
  const index = users.findIndex((item) => item.mail == new_obj.mail);
  if (index >= 0) {
    throw Error("Mail already exists");
  } else {
    // Add new
    users.push(new_obj);
    local_store.set("users", users);
    console.log("Adding:", new_obj, users);
    return users;
  }
};

const set_user = async function(new_obj) {
  const users = await local_store.get("users");
  // Check if already exists
  const index = users.findIndex((item) => item.mail == new_obj.mail);
  if (index < 0) {
    throw Error("Mail not present");
  } else {
    // Replace
    const rem = users.splice(index, 1);
    console.log("Removing:", rem, users);
    users.push(new_obj);
    local_store.set("users", users);
    console.log("Adding:", new_obj, users);
    return users;
  }
};

const del_user = async function(mail) {
  const users = await local_store.get("users");
  const index = users.findIndex((item) => item.mail == mail);
  // Check if already exists
  if (index < 0) {
    throw Error("Mail not present");
  } else {
    // Remove
    const rem = users.splice(index, 1);
    local_store.set("users", users);
    console.log("Removing:", rem, users);
    return users;
  }
};

init();

module.exports = {
  get_files_list,
  set_policy,
  share_files,
  get_config,
  set_config,
  get_attrs,
  new_attr,
  set_attr,
  del_attr,
  get_users,
  new_user,
  set_user,
  del_user,
};
