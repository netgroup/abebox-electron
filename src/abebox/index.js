const fs = require("fs");
const path = require("path");

const chokidar = require("chokidar");
const { v4: uuidv4 } = require("uuid");
const openurl = require("openurl");

const file_utils = require("./file_utils"); // TODO Rename
const rsa = require("./rsa"); // TODO Remove
const store = require("./store"); // local storage
const attribute = require("./attribute");
const core = require("./core");

const { assert } = require("console");
const { on } = require("events");

/* Constants */
//const attrs_file_rel_path = "attributes/attributes_list.json";
const attr_rel_path = "attributes";
const pk_dir_rel_path = "pub_keys";
const keys_dir_rel_path = "keys";
const repo_rel_path = "repo";
const remote_repo_dirs = [
  attr_rel_path,
  keys_dir_rel_path,
  repo_rel_path,
  pk_dir_rel_path,
];

const file_status = {
  sync: 0,
  local_change: 1,
  remote_change: 2,
};

let files_list = [];
let watcher;

// Note sulla logica del modulo
// 1 Il modulo quando parte cerca il file di configurazione
// - Se non lo trova si mette in attesa di una set_config
// - Se la trova si avvia ...

// Avvio:
// - inizializzazione del core
// - avvio dei listner repo_local e repo_shared

// Operazioni di Base Admin
// Aggiunta attibuiti
// 1 Viene aggiunto/modificato/eliminato un attributo
// - si aggiorna la lista degli attributi
// - si aggiorna la chiave sk (TBD cosa si fa con i file già cifrati con gli attibuti vecchi???)

// Condivisione di file local
// 1 viene aggiunto un file in repo_local:
//   - viene aggiunto alla lista dei file da gestire (si aspetta la policy)
// 2 viene aggiunta la policy del file
//   - nel nella lista dei file viene scritta la policy
// 3 si condivide il file
//   - si copia il file nel repo_shared

// Ricezione di un file da remote
// 1 viene aggiunto un file in repo_shared:
//   - si prova a decodificare i metadati ed eventualmente si aggiunge a repo_local

let _conf = {};
let _configured = false;

const boot = function(config_name = "config") {
  store.setup(config_name);
  if (store.is_configured()) {
    _configured = true;
    _conf = store.get_conf();
    console.log("ABEBox booting - Loading Configuration \n", _conf);
    _init_attribute(_conf.remote + "/" + attr_rel_path);
    _start_watchers();
  } else {
    console.log("ABEBox booting - NO Configuration Find");
  }
};

// called when a new configuration is set
const _setup = function() {
  if (_configured) throw Error("ABEBox already configured - no setup needed");
  _configured = true;
  _conf = store.get_conf();
  _create_dirs(remote_repo_dirs);
  _init_core();
  _init_attribute(_conf.remote + "/" + attr_rel_path);
  _start_watchers();
};
/*
const _setup_core = function() {
  if (!_configured) throw Error("Setup called without configuration");
};
*/

const _init_core = function() {
  if (!_configured) throw Error("Setup called without configuration");
  if (_conf.isAdmin) {
    _conf.keys = {};
    _conf.keys.rsa = core.init_rsa_keys(); // Admin RSA Keys
    _conf.keys.abe = core.init_abe_keys(); // Admin ABE Keys
    store.set_keys(_conf.keys);
  } else {
    _conf.keys = {};
    _conf.keys.rsa = core.init_rsa_keys(); // User RSA Keys
    store.set_keys(_conf.keys);
  }
};

const _init_attribute = function(attribute_path) {
  attribute.init(attribute_path);
};

const _start_watchers = function() {
  if (!_configured) throw Error("Start Watchers called without configuration");

  watch_paths = [_conf.local, _conf.remote];
  //console.log("_start_watchers \n", watch_paths);

  watcher = chokidar.watch(watch_paths, {
    awaitWriteFinish: true,
    ignored: [
      // Local
      _conf.local + "/.*",
      _conf.local + "/*/.*",
      // Remote
      _conf.remote + "/" + attr_rel_path + "/*",
      _conf.remote + "/" + repo_rel_path + ".*",
      _conf.remote + "/" + repo_rel_path + "/*/.*",
    ],
  });

  watcher
    .on("add", (file_path) => {
      console.log(`File ${file_path} has been added`);
      if (file_path.includes(watch_paths[0])) {
        // New local file
        handle_local_add(file_path);
      } else {
        // New remote file
        try {
          handle_remote_add(file_path);
        } catch (err) {
          console.log("Catched chokidar: " + String(err));
        }
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
    })
    .on("error", (err) => {
      console.log("Error from chokidar: " + String(err));
    });
};

const _stop_watchers = async function() {
  await watcher.close();
};

const stop = async function() {
  await _stop_watchers();
};

const _create_dirs = function(dirs) {
  dirs.forEach((dir) => {
    absolute_dir = _conf.remote + "/" + dir;
    if (!fs.existsSync(absolute_dir)) {
      fs.mkdirSync(absolute_dir, { recursive: true });
    }
  });
};

/*const setup = function() {
  const data = local_store.get("data", {});
  if (data.length >= 0 && data.isAdmin) {
    // ADMIN
    create_dirs(remote_repo_dirs, data.remote);
    try {
      core.init_rsa_keys();
      core.init_abe_keys();
      const rsa_keys = core.get_rsa_keys();
      const abe_keys = core.get_abe_keys();
    } catch {
      console.log("ERROR during keys creation");
      // GESTIRE ERRORI
      return null;
    }
    keys = {};
    keys.rsa_pub_key = rsa_keys.pk;
    keys.rsa_priv_key = rsa_keys.sk;
    // keys.abe_pub_key = pk;
    // keys.abe_msk_key = msk;
    local_store.set("keys", keys);
    //SALVA OPPORTUNAMENTE LE CHIAVI
  } else {
    //CREA CHIAVI RSA
    //RECUPERA CHIAVE ABE
    //SALVA OPPORTUNAMENTE LE CHIAVI
  }
};

const init = function() {
  const data = local_store.get("data", {});
  if (data.length >= 0 && !data.configured) {
    console.log("LOADING ABEBOX CONFIGURATION: ", data);
    files_list = local_store.get("files", []);
    start_services(data.local, data.remote);
  } else {
    console.log("ABEBOX NOT CONFIGURED");
  }
};*/

const handle_local_add = function(file_path) {
  const fid = uuidv4();
  const { original_file_name, relative_path } = file_utils.split_file_path(
    file_path,
    _conf.local
  );
  
  console.log(`${file_path} split into ${relative_path} ${original_file_name}`);

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
    store.set_files(files_list);
  }
};

//TODO rivedere
const handle_remote_add = async function(full_file_path) {
  try {
    const { original_file_name, relative_path } = file_utils.split_file_path(
      full_file_path,
      _conf.remote
    );
    console.log(
      `FILE NAME = ${original_file_name}   REL PATH = ${relative_path}`
    );
    if (relative_path.includes(pk_dir_rel_path + "/")) {
      if (_conf.isAdmin) {
        retrieve_pub_key(full_file_path, original_file_name);
      }
      return files_list;
    }
    if (relative_path.includes(keys_dir_rel_path + "/")) {
      if (!_conf.isAdmin) {
        retrieve_abe_secret_key(full_file_path);
      }
      return files_list;
    }

    if (!core.is_abe_configured()) return;

    const [file_id, file_ext] = original_file_name.split(".");

    // we discard files without .abebox extensions since they are just
    // fragments.
    if (file_ext != "abebox") return files_list;

    const { file_name, sym_key, iv, policy } = core.retrieve_metadata(
      full_file_path
    );

    console.log("EXTRACTED METADATA = ", sym_key, iv, file_name);

    if (file_name === null) {
      // if metadata.file_path is null, decoding was not possible
      throw Error("Metadata file name is empty");
    }

    // separate folder and name of the encrypted file
    const last_sep_index = file_name.lastIndexOf(path.sep);
    const plaintext_file_folder = file_name.substr(0, last_sep_index + 1); // myfolder
    const plaintext_file_name = file_name.substr(last_sep_index + 1); // myfolder/foo.txt
    if (!fs.existsSync(`${_conf.local}/${plaintext_file_folder}`))
      fs.mkdirSync(`${_conf.local}/${plaintext_file_folder}`, {
        recursive: true,
      });
    console.log(
      `plaintext_file_name=${plaintext_file_name} plaintext_file_folder=${plaintext_file_folder}`
    );
    //const { sym_key, iv, file_name } = retrieve_metadata(metadata_file);
    //if (file_name === null) {
    //  throw Error(`File name not defined`);
    //}
    // File content symmetric decryption
    const encrypted_content_file = core.get_encrypted_content_file_name(
      full_file_path
    );
    await core.retrieve_decrypted_file(
      encrypted_content_file,
      _conf.local + "/" + file_name,
      sym_key,
      iv
    );

    // search if file has been already added in the file list
    const el = files_list.find(
      (el) =>
        el.file_path === plaintext_file_folder &&
        el.file_name === plaintext_file_name &&
        el.file_id === file_id
    );

    if (el === undefined) {
      // file is added externally (not by me!)
      files_list.push({
        file_path: plaintext_file_folder, //relative_path, // ESTRARRE PATH RELATIVO DA FILE PATH, VERIFICARE SE SERVE / INIZIALE
        file_name: plaintext_file_name, // metadata.file_path, // ESTRARRE NOME FILE DA FILE PATH
        file_id: file_id,
        policy: attribute.policy_from_string(policy), // TODO DESERIALIZZARE POLICY CON UNIVERSO, ATTR, VERSIONE
        status: file_status.remote_change,
      });
      store.set_files(files_list);
      return files_list;
    }
  } catch (err) {
    console.log(err);
  }
};

const handle_local_change = function(file_path) {
  const { original_file_name, relative_path } = file_utils.split_file_path(
    file_path,
    _conf.local
  );
  /*const original_file_name = file_path.replace(/^.*[\\\/]/, "");
console.log(file_path, original_file_name);
const path = file_path.replace(original_file_name, "");
const relative_path = path.replace(abebox_repo.local_repo_path, "");*/
  console.log("HANDLE LOCAL CHANGE", file_path);
  console.log("FILE LIST", files_list);
  console.log("REL PATH", relative_path);
  console.log("FILE NAME", original_file_name);
  const index = files_list.findIndex(
    (el) =>
      el.file_path === relative_path && el.file_name === original_file_name
  );
  console.log("ELEM", files_list[index], index);
  if (index >= 0) {
    console.log("SO' ENTRATO", index);
    files_list[index].status = file_status.local_change;
  }
};

const handle_remote_change = function(file_path) {
  const { original_file_name, relative_path } = file_utils.split_file_path(
    file_path,
    _conf.remote_repo_path
  );

  if (relative_path.includes(pk_dir_rel_path + "/")) {
    if (_conf.isAdmin) {
      retrieve_pub_key(file_path, original_file_name);
    }
    return files_list;
  }
  if (relative_path.includes(keys_dir_rel_path + "/")) {
    if (!_conf.isAdmin) {
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
  const { original_file_name, relative_path } = file_utils.split_file_path(
    file_path,
    _conf.local_repo_path
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
    store.set_files(files_list);
  }
};

const handle_remote_remove = function(file_path) {
  const { original_file_name, relative_path } = file_utils.split_file_path(
    file_path,
    _conf.remote_repo_path
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
    store.set_files(files_list);
  }
};

const send_invite = function(recv) {
  return openurl.mailto([recv.mail], {
    subject: "ABEBox invitation!",
    body: `${_conf.name} has invited you to download ABEBox!\nYou can dowload it from this link [LINK].\n
    Here is your invitation token ${recv.token}\n`,
  });
};

// User send the RSA PK to Admin, writing it on pub keys.
const send_user_rsa_pk = function() {
  const token_hash = file_utils.get_hash(_conf.token);
  const rsa_keys = core.get_rsa_keys();
  // Scrivere il file con nome token_hash e path repo

  const signature = file_utils.get_hmac(_conf.token, rsa_keys.pk + _conf.name);
  console.log("SIGNATURE CHECK send_user_rsa_pk: ", rsa_keys.pk + _conf.name);

  const data = {
    rsa_pub_key: rsa_keys.pk,
    sign: signature.toString("hex"),
  };
  fs.writeFileSync(
    `${_conf.remote}/${pk_dir_rel_path}/${token_hash.toString("hex")}`,
    JSON.stringify(data)
  );
};
/*
const get_token = function(user) {
  const token = user.token;
  const rsa_keys = core.get_rsa_keys();

  if (token != undefined) {
    const token_hash = file_utils.get_hash(token);
    const res = http.get_token(token_hash);
    const res_token_hash = res.token;
    if (res != null && res_token_hash.toString("utf8") === token_hash) {
      const rsa_pk = res.rsa_pub_key.toString("utf8");
      const sign = res.sign.toString("utf8");
      if (sign === file_utils.get_hmac(res_token_hash, rsa_pk + user.mail)) {
        user.rsa_pub_key = rsa_pk;
        const users = store.get_users();
        // Check if already exists
        const index = users.findIndex((item) => item.mail == user.mail);
        if (index >= 0) {
          // Remove old
          const rem = users.splice(index, 1);
          console.log("Removing:", rem, users);
        }
        users.push(user);
        store.set_users(users);
        console.log("Adding:", user, users);
      }
    }
  }
};
*/

// Admin retrieves the user RSA PK and send the ABE SK.
const retrieve_pub_key = async function(full_file_name, file_name) {
  const users = store.get_users();
  const index = users.findIndex(
    (item) => file_utils.get_hash(item.token).toString("hex") === file_name
  );
  if (index >= 0) {
    // Test sign
    const data = JSON.parse(fs.readFileSync(full_file_name, "utf-8"));
    const rsa_pk = data.rsa_pub_key;
    const sign = data.sign;
    const signature = file_utils.get_hmac(
      users[index].token,
      rsa_pk + users[index].mail
    );
    if (sign == signature.toString("hex")) {
      // Add pub key to the specific user and update users list
      users[index].rsa_pub_key = rsa_pk;
      store.set_users(users);
      // Create user secret key
      const user_abe_sk_filename = file_utils
        .get_hash(users[index].mail)
        .toString("hex");

      const user_abe_sk_path = `${_conf.remote}/${keys_dir_rel_path}/${user_abe_sk_filename}.sk`;
      //filename: conf.remote_repo_path + "/keys/" + file_name + ".sk",
      console.log("admin create SK of user at ", user_abe_sk_path);
      console.log("user attributes: ", users[index].attrs);
      send_abe_user_secret_key(
        users[index].rsa_pub_key,
        attribute.compress_list(users[index].attrs),
        users[index].token,
        user_abe_sk_path
      );
    } else {
      console.log("Invalid signature");
      throw Error("Invalid signature on retrieve_pub_key");
    }
  }
};

// user retrieves her ABE SK
const retrieve_abe_secret_key = function(full_file_name) {
  console.log("RETRIEVING USER ABE SECRET KEY...");
  const { admin_keys, user_abe_sk } = JSON.parse(
    fs.readFileSync(full_file_name, "utf-8")
  );
  const { keys, sign } = admin_keys;
  const computed_signature = file_utils.get_hmac(
    _conf.token,
    JSON.toString(keys)
  );
  if (sign != computed_signature.toString("hex"))
    throw Error("Admin RSA PK has not been signed correctly");

  const abe_enc_sk = core.verify_jwt(user_abe_sk, keys.rsa_pk);
  console.log("ENC SK", abe_enc_sk);
  //TODO controllo d'errore
  const abe_sk = rsa
    .decrypt(JSON.stringify(abe_enc_sk), core.get_rsa_keys().sk)
    .toString("utf-8");
  core.set_abe_keys(keys.abe_pk, abe_sk);
  //core.set_abe_sk(abe_enc_sk);
  console.log("ABE KEYS =", core.get_abe_keys());
  // ABE is now configured, we can download files in remote repo
  const remote_repo_file_list = walk(`${_conf.remote}/${repo_rel_path}`, []);
  console.log("REPO FILE LIST =", remote_repo_file_list);
  remote_repo_file_list.forEach((file) => {
    handle_remote_add(`${_conf.remote}/${repo_rel_path}/${file}`);
  });
};

// admin calls this function to send the user ABE sk.
const send_abe_user_secret_key = function(
  user_rsa_pk,
  attr_list,
  user_token,
  file_name
) {
  console.log(
    `user_rsa_pk: ${user_rsa_pk},attr_list: ${attr_list},user_token: ${user_token},file_name: ${file_name}`
  );

  try {
    const sk = core.create_user_abe_sk(attr_list, false);
    console.log("USER SK =", sk);
    const enc_sk = rsa.encrypt(Buffer.from(sk), user_rsa_pk);

    const abe_enc_sk_jwt = core.generate_jwt(enc_sk);
    const admin_keys = {
      abe_pk: core.get_abe_keys().pk,
      rsa_pk: core.get_rsa_keys().pk,
    };
    const signature = file_utils.get_hmac(
      user_token,
      JSON.toString(admin_keys)
    );
    const data = {
      admin_keys: {
        keys: admin_keys,
        sign: signature.toString("hex"),
      },
      user_abe_sk: abe_enc_sk_jwt,
    };
    fs.writeFileSync(file_name, JSON.stringify(data));
  } catch (err) {
    console.log("catched error", err);
  }
};

// List all files in a directory in Node.js recursively in a synchronous fashion
const walk = function(dir, file_list) {
  if (!fs.statSync(dir).isDirectory()) throw Error(`${dir} is not a folder`);
  filelist = file_list || [];
  files = fs.readdirSync(dir);
  files.forEach(function(file) {
    const full_path = path.join(dir, file);
    if (fs.statSync(full_path).isDirectory()) {
      filelist = walkSync(full_path, filelist);
    } else {
      filelist.push(file);
    }
  });
  return filelist;
};

/**************** FILES *****************/
const get_files_list = function() {
  //console.log(`GET_FILES_LIST`);
  files_list = store.get_files();
  return files_list;
};

const set_policy = function(data) {
  //console.log(`SET_POLICY ${data.toString()}`);
  //console.log("SET POLICY", data.file_id, data.policy);
  const el = files_list.find((el) => el.file_id === data.file_id);
  if (el !== undefined) {
    el.policy = data.policy;
    console.log("NEW POL - FILE =", JSON.stringify(el));
  }
  store.set_files(files_list);
  return files_list;
};

const share_files = function() {
  files_list.forEach((file) => {
    const file_name =
      file.file_path.charAt(0) === "/"
        ? file.file_path.substring(1) + file.file_name
        : file.file_path + file.file_name;
    if (file.status == file_status.local_change && file.policy.length != 0) {
      const res = core.file_encrypt(
        file_name,
        `${_conf.local}/${file_name}`,
        `${_conf.remote}/${repo_rel_path}`,
        file.file_id,
        attribute.policy_as_string(file.policy)
      );
      if (res) file.status = file_status.sync;
      else {
        throw Error("Error encrypting local file " + file_name);
      }
    }
    if (file.status == file_status.remote_change) {
      console.log("SHARE FILES: ", file);
      const enc_file_name = `${_conf.remote}/${repo_rel_path}/${file.file_id}`;
      const enc_file_name_no_ext = enc_file_name.substring(
        0,
        enc_file_name.lastIndexOf(".")
      );
      const encrypted_content_file = `${enc_file_name_no_ext}.0`;
      /*await retrieve_decrypted_file(
      encrypted_content_file,
      _conf.local + "/" + file_name,
      sym_key,
      iv
    );*/
      const res = core.file_decrypt(enc_file_name_no_ext);
      if (res) file.status = file_status.sync;
      else console.log("[ERROR] DECRYPTING REMOTE FILE " + enc_file_name);
    }
  });
  return files_list;
};

/**************** CONFIGURATION *****************/

const get_config = function() {
  return store.get_conf();
};

const reset_config = async function() {
  store.reset();
};

const set_config = function(config_data) {
  if (_conf.configured) throw Error("ABEBox already configured");
  // store the new configuration
  store.set_conf(config_data);

  _setup(); //Activating the new configuration

  return config_data;
};

/**************** ATTRIBUTES *****************/
const get_attrs = function() {
  if (!_conf.configured) throw Error("ABEBox not configured in get_attrs");
  return attribute.get_all();
};

const new_attr = function(new_obj) {
  if (!_conf.configured) throw Error("ABEBox not configured");
  if (!_conf.isAdmin) throw Error("To Add an Attribute need to be admin");
  const attrs = attribute.add(new_obj);
  const attrs_comp = attribute.compress_list(attrs);
  _conf.keys.abe.sk = core.create_abe_sk(attrs_comp);
  return attrs;
};

const set_attr = function(old_obj, new_obj) {
  if (!_conf.configured) throw Error("ABEBox not configured");
  if (!_conf.isAdmin) throw Error("To Modify an Attribute need to be admin");
  const attrs = attribute.set(old_obj, new_obj);
  const attrs_comp = attribute.compress_list(attrs);
  _conf.keys.abe.sk = core.create_abe_sk(attrs_comp);
  return attrs;
};

const del_attr = function(obj_del) {
  const attrs = attribute.del(obj_del);
  const attrs_comp = attribute.compress_list(attrs);
  _conf.keys.abe.sk = core.create_abe_sk(attrs_comp);
  return attrs;
};

/**************** USERS *****************/
const get_users = function() {
  return store.get_users();
};

const new_user = function(new_obj) {
  const users = store.get_users();
  // Check if already exists
  const index = users.findIndex((item) => item.mail == new_obj.mail);
  if (index >= 0) {
    throw Error("User already exists");
  } else {
    // Add new
    users.push(new_obj);
    store.set_users(users);
  }
  return users;
};

const set_user = function(new_obj) {
  const users = store.get_users();
  // Check if already exists
  const index = users.findIndex((item) => item.mail == new_obj.mail);
  if (index < 0) {
    throw Error("User not present");
  } else {
    users[index] = new_obj;
    store.set_users(users);
  }
  return users;
};

const invite_user = function(user) {
  const users = store.get_users();
  // Check if already exists
  const index = users.findIndex((el) => el.mail == user.mail);
  if (index < 0) {
    throw Error("User not present");
  } else {
    const token = file_utils.get_random(32).toString("hex");
    users[index].token = token;
    store.set_users(users);
    // send_invite(users[index]); // ==> to open the email
    return users[index];
  }
};

const del_user = function(mail) {
  const users = store.get_users();
  const index = users.findIndex((item) => item.mail == mail);
  // Check if already exists
  if (index < 0) {
    throw Error("User not present");
  } else {
    // Remove
    const rem = users.splice(index, 1);
    store.set_users(users);
  }
  return users;
};

const debug_core = function() {
  console.log("MY CONF:", core._conf);
};

module.exports = {
  boot,
  stop,
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
  send_user_rsa_pk,
  debug_core, // DEBUG
};
