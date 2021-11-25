const chokidar = require("chokidar");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const Store = require("electron-store");
const openurl = require("openurl");
const { get } = require("config");

const {
  parse_metadata,
  split_file_path,
  policy_as_string,
  get_random,
  get_hash,
  get_hmac,
  generate_jwt,
  verify_jwt,
} = require("./file_utils");
const http = require("./http_utils");
const abebox = require("./core");
const rsa = require("./rsa");

/* Comstants */
const attrs_rel_path = "/attributes/attributes_list.json";
const pub_keys_rel_path = "/pub_keys/";
const keys_rel_path = "/keys/";
const file_status = {
  sync: 0,
  local_change: 1,
  remote_change: 2,
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

let files_list = [];

const init = function() {
  if (local_store.get("configured")) {
    const data = local_store.get("data");
    console.log("LOADING ABEBOX CONFIGURATION: ", data);
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
      status: file_status.local_change,
    });
    local_store.set("files", files_list);
  }
};

const handle_remote_add = function(full_file_path) {
  const { original_file_name, relative_path } = split_file_path(
    full_file_path,
    abebox.conf.remote_repo_path
  );
  const data = local_store.get("data", {});
  if (relative_path.includes(pub_keys_rel_path)) {
    if (data.isAdmin) {
      retrieve_pub_key(full_file_path, original_file_name);
    }
    return files_list;
  }
  if (relative_path.includes(keys_rel_path)) {
    if (!data.isAdmin) {
      retrieve_abe_secret_key(full_file_path);
    }
    return files_list;
  }
  const fid_no_ext = original_file_name.split(".")[0];
  //try {
  // Read raw metadata
  const raw_metadata = fs.readFileSync(
    abebox.conf.remote_repo_path + "/repo/" + fid_no_ext + ".abebox"
  );
  const { enc_metadata } = JSON.parse(raw_metadata);
  //console.log("ENC META = ", enc_metadata);

  const parsed_enc_metadata = JSON.parse(enc_metadata);
  //console.log("PARSED ENC META = ", parsed_enc_metadata);

  const { _policy } = parsed_enc_metadata;
  console.log("POLICY FROM METADATA = ", _policy[0]);

  console.log("SK = ", abebox.conf.abe_secret_key);

  // Parse metadata
  const { file_path } = parse_metadata(
    raw_metadata,
    abebox.conf.abe_secret_key
  );

  if (file_path === null) {
    // DECRYPTION ERROR
    console.log("Decryption failed: " + error);
    return undefined;
  }

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
      status: file_status.remote_change,
    });
    local_store.set("files", files_list);
    return files_list;
  }
  //} catch (error) {
  //  console.log("Decryption failed: " + error);
  //  return undefined;
  //}
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
    el.status = file_status.local_change;
  }
};

const handle_remote_change = function(file_path) {
  const { original_file_name, relative_path } = split_file_path(
    file_path,
    abebox.conf.remote_repo_path
  );
  const data = local_store.get("data", {});
  if (relative_path.includes(pub_keys_rel_path)) {
    if (data.isAdmin) {
      retrieve_pub_key(file_path, original_file_name);
    }
    return files_list;
  }
  if (relative_path.includes(keys_rel_path)) {
    if (!data.isAdmin) {
      retrieve_abe_secret_key(file_path);
    }
    return files_list;
  }
  const fid_no_ext = original_file_name.split(".")[0];
  /*const fid = file_path.replace(/^.*[\\\/]/, "");
  console.log(file_path, fid);
  const path = file_path.replace(fid, "");
  const relative_path = path.replace(abebox_repo.remote_repo_path, "");*/
  const el = files_list.find(
    (el) => el.file_path === relative_path && el.file_id === fid_no_ext
  );
  if (el !== undefined) {
    el.status = file_status.remote_change;
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
  abebox.init(local_repo, remote_repo, local_store);

  create_admin_abe_sk();

  watch_paths = [local_repo, remote_repo];

  console.log(`Starting watching on ${watch_paths}`);

  let watcher = chokidar.watch(watch_paths, {
    awaitWriteFinish: true,
    ignored: [
      // Local
      local_repo + "/.*",
      local_repo + "/*/.*",
      // Remote
      //remote_repo + "/keys/*",
      remote_repo + "/attributes/*",
      remote_repo + "/repo/.*",
      remote_repo + "/repo/*/.*",
    ],
  });

  //console.log("Setting on change event...");

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
      if (file_path.includes(watch_paths[0])) {
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

const send_invite = function(recv) {
  const data = local_store.get("data");
  return openurl.mailto([recv.mail], {
    subject: "ABEBox invitation!",
    body: `${data.name} has invited you to download ABEBox!\nYou can dowload it from this link [LINK].\n
    Here is your invitation token ${recv.token}\n`,
  });
};

const send_token = function(conf) {
  //const data = local_store.get("data", []);
  const token_hash = get_hash(conf.token);
  const rsa_pk = local_store.get("keys").rsa_pub_key;

  // Scrivere il file con nome token_hash e path repo

  const signature = get_hmac(conf.token, rsa_pk + conf.name);
  const data = {
    rsa_pub_key: rsa_pk.toString("hex"),
    sign: signature.toString("hex"),
  };
  fs.writeFileSync(
    `${conf.remote}${pub_keys_rel_path}${token_hash.toString("hex")}`,
    JSON.stringify(data)
  );
};

const get_token = function(user) {
  //const data = local_store.get("data", []);
  const token = user.token;
  if (token != undefined) {
    const token_hash = get_hash(token);
    const res = http.get_token(token_hash);
    const res_token_hash = res.token;
    if (res != null && res_token_hash.toString("utf8") === token_hash) {
      const rsa_pk = res.rsa_pub_key.toString("utf8");
      const sign = res.sign.toString("utf8");
      if (sign === get_hmac(res_token_hash, rsa_pk + user.mail)) {
        user.rsa_pub_key = rsa_pk;
        const users = local_store.get("users", []);
        // Check if already exists
        const index = users.findIndex((item) => item.mail == user.mail);
        if (index >= 0) {
          // Remove old
          const rem = users.splice(index, 1);
          console.log("Removing:", rem, users);
        }
        users.push(user);
        local_store.set("users", users);
        console.log("Adding:", user, users);
      }
    }
  }
};

const retrieve_pub_key = async function(full_file_name, file_name) {
  const users = local_store.get("users", []);
  const index = users.findIndex(
    (item) => get_hash(item.token).toString("hex") === file_name
  );
  if (index >= 0) {
    // Test sign
    const data = fs.readFileSync(full_file_name);
    const rsa_pk = data.rsa_pub_key;
    const sign = data.sign;
    const signature = get_hmac(user.token, rsa_pk + user.mail);
    if (sign === signature) {
      // Add pub key to the specific user and update users list
      const rem = users.splice(index, 1);
      console.log("Removing:", rem, users);
      rem.rsa_pub_key = rsa_pk;
      users.push(rem);
      local_store.set("users", users);
      console.log("Adding:", rem, users);
      // Create user secret key
      const keys = local_store.get("keys", {});
      await abebox.create_abe_secret_key(
        abebox.conf.abe_pub_key,
        keys.abe_msk_key,
        rem.attrs,
        get_hash(rem.mail).toString("hex")
      );
    }
  }
};

const retrieve_abe_secret_key = function(full_file_name) {
  console.log("RETRIEVING USER ABE SECRET KEY...");
  const jwt = fs.readFileSync(full_file_name);
  console.log("USER JWT =", jwt);
  const abe_enc_sk = verify_jwt(jwt, abebox.conf.rsa_pub_key);
  console.log("USER ABE ENC SK =", abe_enc_sk);
  abebox.conf.abe_secret_key = rsa
    .decrypt(abe_enc_sk, abebox.conf.rsa_priv_key)
    .toString();
  console.log("USER ABE SK =", abebox.conf.abe_secret_key);
};

const create_admin_abe_sk = async function() {
  const data = local_store.get("data", {});
  const attrs = await get_attrs();

  if (data.isAdmin && attrs.length > 0) {
    const keys = local_store.get("keys", {});
    const attrs_list = attrs.map((attr) => attr.id.toString());

    console.log(keys.abe_msk_key);
    abebox.conf.abe_secret_key = await abebox.create_abe_secret_key(
      abebox.conf.abe_pub_key,
      keys.abe_msk_key,
      attrs_list,
      get_hash(data.name).toString("hex")
    );
    //console.log("ADMIN ABE SK CREATED: ", abebox.conf.abe_secret_key);
  } else {
    //console.log("ADMIN ABE SK NOT CREATED");
  }
};

/************************ TEST FUNCTIONS ************************/
const create_test_attributes = function() {
  const attrs = [
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
  const attr_list_file = data.remote + attrs_rel_path;
  if (!fs.existsSync(attr_list_file)) {
    const attrs_obj = {
      attributes: attrs,
    };
    const attrs_jwt = generate_jwt(attrs_obj, abebox.conf.rsa_priv_key);
    fs.writeFileSync(
      attr_list_file,
      attrs_jwt //JSON.stringify(attributes)
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
  if (local_store.get("users", []).length == 0) local_store.set("users", users);
};

/******************************** EXPORTED FUNCTIONS ********************************/

/**************** FILES *****************/
const get_files_list = function() {
  //console.log(`GET_FILES_LIST`);
  files_list = local_store.get("files", []);
  //console.log("FILE LIST", files_list);
  return files_list;
};

const set_policy = async function(data) {
  //console.log(`SET_POLICY ${data.toString()}`);
  //console.log("SET POLICY", data.file_id, data.policy);
  const el = await files_list.find((el) => el.file_id === data.file_id);
  if (el !== undefined) {
    el.policy = data.policy;
  }
  local_store.set("files", files_list);
  return files_list;
};

const share_files = function() {
  console.log(`SHARE_FILES`);
  files_list.forEach((file) => {
    if (file.status == file_status.local_change && file.policy.length != 0) {
      const file_name = file.file_path + file.file_name;
      const res = abebox.file_encrypt(
        file_name,
        policy_as_string(file.policy),
        file.file_id
      );
      if (res) file.status = file_status.sync;
      else console.log("[ERROR] ENCRYPTING LOCAL FILE " + file_name);
    }
    if (file.status == file_status.remote_change) {
      let enc_file_name = file.file_path + file.file_id;
      enc_file_name = enc_file_name.substring(
        0,
        enc_file_name.lastIndexOf(".")
      );
      const res = abebox.file_decrypt(enc_file_name);
      if (res) file.status = file_status.sync;
      else console.log("[ERROR] DECRYPTING REMOTE FILE " + enc_file_name);
    }
  });
  return files_list;
};

/**************** CONFIGURATION *****************/

const del_config = async function() {
  console.log(`DEL_CONFIG`);
  const conf = await local_store.clear();
  return conf;
};

const get_config = async function() {
  console.log(`GET_CONFIG`);
  const conf = await local_store.get("data", {});
  return conf;
};

const reset_config = async function() {
  console.log(`RESET_CONFIG`);
  // TODO clear Repo Folder
  local_store.clear();
  return True;
};

const set_config = function(config_data) {
  if (local_store.get("configured", false)) {
    console.log("ERRORE configurazione già presente");
    return "ERRORE"; // No config change
  } else {
    console.log("Saving configuration data", config_data);
    local_store.set("data", config_data);
    local_store.set("configured", true);

    start_services(config_data.local, config_data.remote);
    if (!config_data.isAdmin) {
      send_token(config_data);
    }
    return config_data;
  }
};

/**************** ATTRIBUTES *****************/
const get_attrs = async function() {
  //console.log(`GET_ATTRS`);
  const data = await local_store.get("data");
  const attr_list_file = data.remote + attrs_rel_path;
  if (!fs.existsSync(attr_list_file)) {
    return [];
  } else {
    const attrs_obj = verify_jwt(
      fs.readFileSync(attr_list_file).toString(),
      abebox.conf.rsa_pub_key
    );
    return attrs_obj.attributes;
  }
};

const new_attr = async function(new_obj) {
  //console.log(`NEW_ATTR ${new_obj.toString()}`);
  const data = await local_store.get("data");
  const attrs = await get_attrs();

  // Check if already exists
  const index = attrs.findIndex((item) => item.id == new_obj.id);
  if (index >= 0) {
    throw Error("ID is already present");
  } else {
    // Add new
    new_obj.id = attrs.length + 1;
    attrs.push(new_obj);
    const attrs_obj = {
      attributes: attrs,
    };
    const attrs_jwt = generate_jwt(attrs_obj, abebox.conf.rsa_priv_key);
    fs.writeFileSync(data.remote + attrs_rel_path, attrs_jwt);
    //console.log("Adding:", new_obj, attrs);
    create_admin_abe_sk();
  }
  return attrs;
};

const set_attr = async function(new_obj) {
  console.log(`SET_ATTR ${new_obj.toString()}`);
  const data = await local_store.get("data");

  const attrs = await get_attrs();
  // Check if already exists
  const index = attrs.findIndex((item) => item.id == new_obj.id);
  if (index < 0) {
    throw Error("ID not present");
  } else {
    // Replace
    const rem = attrs.splice(index, 1);
    console.log("Removing:", rem, attrs);
    attrs.push(new_obj);
    const attrs_obj = {
      attributes: attrs,
    };
    const attrs_jwt = generate_jwt(attrs_obj, abebox.conf.rsa_priv_key);
    //const attrs_jwt = generate_jwt(attrs, abebox.conf.rsa_priv_key);
    fs.writeFileSync(
      data.remote + attrs_rel_path,
      attrs_jwt //JSON.stringify(attrs)
    );
    console.log("Adding:", new_obj, attrs);
    create_admin_abe_sk();
  }
  return attrs;
};

const del_attr = async function(id) {
  console.log(`DEL_ATTR ${id.toString()}`);
  const data = await local_store.get("data");
  /*const attrs = JSON.parse(
    fs.readFileSync(data.remote + "/attributes/attributes_list.json")
  );*/
  const attrs = await get_attrs();
  // Check if already exists
  const index = attrs.findIndex((item) => item.id == id);
  if (index < 0) {
    throw Error("ID not present");
  } else {
    // Remove
    const rem = attrs.splice(index, 1);
    const attrs_obj = {
      attributes: attrs,
    };
    const attrs_jwt = generate_jwt(attrs_obj, abebox.conf.rsa_priv_key);
    //const attrs_jwt = generate_jwt(attrs, abebox.conf.rsa_priv_key);
    fs.writeFileSync(
      data.remote + attrs_rel_path,
      attrs_jwt //JSON.stringify(attrs)
    );
    console.log("Removing:", rem, attrs);
    create_admin_abe_sk();
  }
  return attrs;
};

/**************** USERS *****************/
const get_users = async function() {
  console.log(`GET_USERS`);
  return await local_store.get("users");
};

const new_user = async function(new_obj) {
  console.log(`NEW_USER ${new_obj.toString()}`);
  const users = await local_store.get("users");
  // Check if already exists
  const index = users.findIndex((item) => item.mail == new_obj.mail);
  if (index >= 0) {
    throw Error("User already exists");
  } else {
    // Add new
    users.push(new_obj);
    local_store.set("users", users);
    console.log("Adding:", new_obj, users);
  }
  return users;
};

const set_user = async function(new_obj) {
  console.log(`SET_USER ${new_obj.toString()}`);
  const users = await local_store.get("users");
  // Check if already exists
  const index = users.findIndex((item) => item.mail == new_obj.mail);
  if (index < 0) {
    throw Error("User not present");
  } else {
    // Replace
    const rem = users.splice(index, 1);
    console.log("Removing:", rem, users);
    users.push(new_obj);
    local_store.set("users", users);
    console.log("Adding:", new_obj, users);
  }
  return users;
};

const invite_user = async function(user) {
  console.log(`INVITE_USER ${user.toString()}`);
  console.log(user);
  const users = await local_store.get("users");
  // Check if already exists
  const index = users.findIndex((el) => el.mail == user.mail);
  if (index < 0) {
    throw Error("User not present");
  } else {
    const token = get_random(32).toString("hex");
    const rem = users.splice(index, 1)[0];
    console.log("Removing:", rem, users);
    rem.token = token;
    users.push(rem);
    local_store.set("users", users);
    console.log("Adding:", rem, users);
    // TODO SEND EMAIL
    console.log(`SEND INVITE RES = ${send_invite(rem)}`);
    return rem;
    //console.log("Sending email to", rem.mail);
    //return users;
  }
};

const del_user = async function(mail) {
  console.log(`DEL_USER ${mail.toString()}`);
  const users = await local_store.get("users");
  const index = users.findIndex((item) => item.mail == mail);
  // Check if already exists
  if (index < 0) {
    throw Error("User not present");
  } else {
    // Remove
    const rem = users.splice(index, 1);
    local_store.set("users", users);
    console.log("Removing:", rem, users);
  }
  return users;
};

init();

module.exports = {
  get_files_list,
  set_policy,
  share_files,
  get_config,
  set_config,
  reset_config,
  get_attrs,
  new_attr,
  set_attr,
  del_attr,
  get_users,
  new_user,
  set_user,
  invite_user,
  del_user,
};
