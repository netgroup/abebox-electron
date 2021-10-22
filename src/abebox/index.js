const abebox = require("./core");
const chokidar = require("chokidar");
const fs = require("fs");
const { parse_metadata, split_file_path } = require("./file_utils");
const rabe = require("./rabejs/rabejs.node");
const rsa = require("./rsa");
const Store = require("electron-store");
const { v4: uuidv4 } = require("uuid");

////////// LOCAL STORE
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
};

const local_store = new Store();
//local_store.clear();

/////////// CONFIGURATION

const conf = {};

/////////// FILES LIST
const dir_ignore_list = ["keys/"];
const start_filename_ignore_list = ["."];
const file_status = {
  ok: 0,
  modified: 1,
};
const files_list = [];



/////////////// FUNCTIONS

const init = function() {
  if (local_store.get("configured")) {
    load_config();
    start_services(conf.local, conf.remote);
  } else {
    console.log("ABEBOX NOT CONFIGURED");
  }
};

const load_config = function() {
  console.log("LOADING ABEBOX CONFIGURATION...");
  const data = local_store.get("data");
  conf.local_repo_path = data.local;
  conf.remote_repo_path = data.remote;
  conf.abe_pub_path_remote = conf.remote_repo_path + "/keys/abe.pub";
  conf.abe_sec_path_remote = conf.remote_repo_path + "/keys/abe.sk";

  create_dirs();
  if (!local_store.get("keys")) {
    create_keys(local_store);
  }
  const keys = local_store.get("keys");
  conf.rsa_pub_key = keys.rsa_pub_key; //rsa.getPubKey();
  conf.rsa_priv_key = keys.rsa_priv_key; //rsa.getPrivKey();

  if (!fs.existsSync(conf.abe_pub_path_remote)) {
    create_abe_keys();
  }
  conf.abe_pub_key = fs.readFileSync(conf.abe_pub_path_remote).toString();
  conf.abe_secret_key = rsa
    .decrypt(fs.readFileSync(conf.abe_sec_path_remote), conf.rsa_priv_key)
    .toString();
};

const create_dirs = function() {
  dirs = ["keys", "repo"];
  console.log("CREATING DIRS", dirs);
  dirs.forEach((dir) => {
    absolute_dir = conf.remote_repo_path + "/" + dir;
    console.log("Checking dir", absolute_dir);
    if (!fs.existsSync(absolute_dir)) {
      fs.mkdirSync(absolute_dir, { recursive: true });
    }
  });
};

const create_keys = function(local_store) {
  console.log("CREATING KEYS");
  const { publicKey, privateKey } = rsa.create_keys();
  const [msk] = rabe.setup();
  keys = {};
  keys.rsa_pub_key = publicKey;
  keys.rsa_priv_key = privateKey;
  // keys.abe_pub_key = pk;
  keys.abe_msk_key = msk;
  local_store.set("keys", keys);
};

const create_abe_keys = function() {
  const [pk, msk] = rabe.setup();
  //fs.writeFileSync(conf.abe_pub_path, pk);
  //fs.writeFileSync(conf.abe_msk_path, msk);
  const sk = rabe.keygen(pk, msk, JSON.stringify(["A", "B", "C"]));
  fs.writeFileSync(conf.abe_pub_path_remote, pk);
  fs.writeFileSync(
    conf.abe_sec_path_remote,
    rsa.encrypt(Buffer.from(sk), conf.rsa_pub_key)
  );
};

const handle_local_add = function(file_path) {
  const fid = uuidv4();
  const { original_file_name, relative_path } = split_file_path(
    file_path,
    conf.local_repo_path
  );
  const el = files_list.find(
    (el) =>
      el.file_path === relative_path && el.file_name === original_file_name
  );
  if (el === undefined) {
    files_list.push({
      file_path: relative_path,
      file_name: original_file_name,
      file_id: fid,
      policy: "",
      status: file_status.ok,
    });
  }
};

const handle_remote_add = function(file_path) {
  if (dir_ignore_list.some((el) => file_path.includes(el))) {
    return;
  }
  const { original_file_name, relative_path } = split_file_path(
    file_path,
    conf.remote_repo_path
  );
  const fid_no_ext = original_file_name.split(".")[0];
  try {
    // Read raw metadata
    const raw_metadata = fs.readFileSync(
      conf.remote_repo_path + "/repo/" + fid_no_ext + ".abebox"
    );
    const { enc_metadata } = JSON.parse(raw_metadata);
    //console.log("ENC META = ", enc_metadata);

    const parsed_enc_metadata = JSON.parse(enc_metadata);
    //console.log("PARSED ENC META = ", parsed_enc_metadata);

    const { _policy } = parsed_enc_metadata;
    console.log(_policy[0]);

    // Parse metadata
    const { file_path } = parse_metadata(raw_metadata, conf.abe_secret_key);
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
    }
  } catch (error) {
    console.log("Decryption failed: " + error);
    return false;
  }
};

const handle_local_change = function(file_path) {
  const { original_file_name, relative_path } = split_file_path(
    file_path,
    conf.local_repo_path
  );
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
    conf.remote_repo_path
  );
  const fid_no_ext = original_file_name.split(".")[0];
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
    conf.local_repo_path
  );
  const el = files_list.find(
    (el) =>
      el.file_path === relative_path && el.file_name === original_file_name
  );
  if (el !== undefined) {
    files_list.pop(el);
  }
};

const handle_remote_remove = function(file_path) {
  const { original_file_name, relative_path } = split_file_path(
    file_path,
    conf.remote_repo_path
  );
  const fid_no_ext = original_file_name.split(".")[0];
  const el = files_list.find(
    (el) => el.file_path === relative_path && el.fid === fid_no_ext
  );
  if (el !== undefined) {
    files_list.pop(el);
  }
};

const start_watcher = function(watch_paths) {
  console.log(`Starting watching on ${watch_paths}`);

  let watcher = chokidar.watch(watch_paths, {
    awaitWriteFinish: true,
  });

  console.log("Setting on event listening...");

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
};

const start_services = function(local_repo, remote_repo) {
  // local_repo = loc_repo;
  // remote_repo = rem_repo;
  //abebox.init(local_repo, remote_repo, local_store);
  start_watcher([conf.local_repo_path, conf.remote_repo_path]);
};

/* Funzioni Esportate*/
const get_files_list = function() {
  console.log("FILE LIST", files_list);
  return files_list;
};

const get_config = async function() {
  const conf = await local_store.get();
  console.log("INDEX.JS get_config()", conf);
  return conf;

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
  }
};

const set_config = function(config_data) {
  console.log("Saving configuration data", config_data);
  local_store.set("data", config_data);
  local_store.set("configured", true);
  init();
  return true;

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
  }
};

const set_policy = function(fid, policy) {
  const el = files_list.find((el) => el.fid === fid);
  if (el !== undefined) {
    el.policy = policy;
  }
};

init();

module.exports = {
  get_files_list,
  set_policy,
  get_config,
  set_config,
};
