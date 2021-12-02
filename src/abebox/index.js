const fs = require("fs");
const path = require("path");

const chokidar = require("chokidar");
const { v4: uuidv4 } = require("uuid");
const openurl = require("openurl");

const file_utils = require("./file_utils"); // TODO Rename
const rsa = require("./rsa"); // TODO Remove
const AbeboxStore = require("./store"); // local storage
const AbeboxCore = require("./core");
const AttributeManager = require("./attribute");

const { assert } = require("console");

/* Constants */
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

const Abebox = (config_name = "config") => {
  const store = AbeboxStore(config_name);
  const core = AbeboxCore();
  const attribute = AttributeManager(core);

  let files_list = [];
  let watcher;
  let _conf = {};
  let _configured = false;
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

  const _boot = function() {
    if (store.is_configured()) {
      _configured = true;
      _conf = store.get_conf();
      console.log("ABEBox booting - Loading Configuration \n", _conf);
      _init_attribute(path.join(_conf.remote, attr_rel_path));
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
    _init_attribute(path.join(_conf.remote, attr_rel_path));
    _start_watchers();
  };

  const _init_core = function() {
    if (!_configured) throw Error("Setup called without configuration");
    _conf.keys = {};
    if (_conf.isAdmin) {
      _conf.keys.abe = core.init_abe_keys();
    }
    _conf.keys.rsa = core.init_rsa_keys();
    store.set_keys(_conf.keys);
  };

  const _init_attribute = function(attribute_path) {
    attribute.init(attribute_path);
  };

  const _start_watchers = function() {
    if (!_configured)
      throw Error("Start Watchers called without configuration");

    watch_paths = [_conf.local, _conf.remote];
    //console.log("_start_watchers \n", watch_paths);

    watcher = chokidar.watch(watch_paths, {
      awaitWriteFinish: true,
      ignored: [
        // Local
        path.join(_conf.local, ".*"),
        path.join(_conf.local, "*", ".*"),
        // Remote
        path.join(_conf.remote, attr_rel_path, "*"),
        path.join(_conf.remote, repo_rel_path, ".*"),
        path.join(_conf.remote, repo_rel_path, "*", ".*"),
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
      absolute_dir = path.join(_conf.remote, dir);
      if (!fs.existsSync(absolute_dir)) {
        fs.mkdirSync(absolute_dir, { recursive: true });
      }
    });
  };

  const handle_local_add = function(file_path) {
    console.log("handle_local_add of admin?" + _conf.isAdmin);
    console.log(files_list);
    const fid = uuidv4();
    const { filename, rel_dir } = file_utils.split_file_path(
      file_path,
      _conf.local
    );
    const index = files_list.findIndex(
      (el) => el.file_dir === rel_dir && el.file_name === filename
    );
    if (index < 0) {
      files_list.push({
        file_dir: rel_dir,
        file_name: filename,
        file_id: fid,
        policy: [],
        status: file_status.local_change,
      });
      console.log(`pushing ${filename} into the file list`);
      store.set_files(files_list);
      return files_list;
    }
  };

  const handle_remote_add = async function(file_path) {
    console.log("handle_remote_add of admin?" + _conf.isAdmin);
    console.log(files_list);
    try {
      const { filename, rel_dir } = file_utils.split_file_path(
        file_path,
        _conf.remote
      );

      if (handle_key_files(rel_dir, file_path, filename)) return files_list;

      if (!core.is_abe_configured()) return;
      const [file_id, file_ext] = filename.split(".");
      // we discard files without .abebox extensions since they are just
      // fragments.
      if (file_ext != "abebox") return files_list;
      const { file_name, sym_key, iv, policy } = core.retrieve_metadata(
        file_path
      );
      if (file_name === null) {
        // if metadata.file_path is null, decoding was not possible
        throw Error("Metadata file name is empty");
      }
      // search if file has been already added in the file list
      const index = files_list.findIndex(
        (el) => el.file_id === file_id && el.status === file_status.local_change
      );
      if (index < 0) {
        // REMOTE EVENT
        const {
          plaintext_file_folder,
          plaintext_file_name,
        } = await download_file(file_name, file_path, sym_key, iv);
        assert(plaintext_file_name);
        files_list.push({
          file_dir: plaintext_file_folder,
          file_name: plaintext_file_name,
          file_id: file_id,
          policy: attribute.policy_from_string(policy),
          status: file_status.sync,
        });
      } else {
        // TRIGGERED BY LOCAL ADD
        files_list[index].status = file_status.sync;
      }
      store.set_files(files_list);
      return files_list;
    } catch (err) {
      console.log(err);
    }
  };

  const handle_local_change = function(file_path) {
    console.log("handle_local_change of admin?" + _conf.isAdmin);
    console.log(files_list);
    const { filename, rel_dir } = file_utils.split_file_path(
      file_path,
      _conf.local
    );
    const index = files_list.findIndex(
      (el) => el.file_dir === rel_dir && el.file_name === filename
    );
    if (index >= 0) {
      files_list[index].status = file_status.local_change;
      store.set_files(files_list);
      return files_list;
    } else throw Error(`Local change error: ${file_path} already exists`);
  };

  const handle_remote_change = function(file_path) {
    console.log("Handle remote change");
    try {
      const { filename, rel_dir } = file_utils.split_file_path(
        file_path,
        _conf.remote
      );

      if (handle_key_files(rel_dir, file_path, filename)) return files_list;

      if (!core.is_abe_configured()) return;

      // POSSIBLE BUG e' cambiato il .0 ma non il .abebox?
      const [file_id, file_ext] = filename.split(".");

      // we discard files without .abebox extensions since they are just
      // fragments.
      if (file_ext != "abebox") return files_list;

      const { file_name, sym_key, iv } = core.retrieve_metadata(file_path);

      if (file_name === null) {
        // if metadata.file_path is null, decoding was not possible
        throw Error("Metadata file name is empty");
      }
      // search if file has been already added in the file list
      const index = files_list.findIndex((el) => el.file_id === file_id);
      if (index >= 0) {
        if (files_list[index].status != file_status.local_change)
          // REMOTE EVENT
          download_file(file_name, file_path, sym_key, iv); // it's an async function
      }
      files_list[index].status = file_status.sync; // in all case we are synched.
      store.set_files(files_list);
      return files_list;
    } catch (err) {
      console.log(err);
    }
  };

  const handle_local_remove = function(file_path) {
    const { filename, rel_dir } = file_utils.split_file_path(
      file_path,
      _conf.local
    );
    const index = files_list.findIndex(
      (el) => el.file_dir === rel_dir && el.file_name === filename
    );
    if (index >= 0) {
      const rem = files_list.pop(files_list[index]);
      store.set_files(files_list);
      const remote_file = path.join(_conf.remote, repo_rel_path, rem.fid);
      const metadata_file = `${remote_file}.abebox`;
      const encrypted_content_file = `${remote_file}.0`;
      if (fs.existsSync(metadata_file)) fs.rmSync(metadata_file);
      if (fs.existsSync(encrypted_content_file))
        fs.rmSync(encrypted_content_file);
    }
  };

  const handle_remote_remove = function(file_path) {
    const { filename } = file_utils.split_file_path(file_path, _conf.remote);
    const fid_no_ext = filename.split(".")[0];
    const index = files_list.findIndex((el) => el.file_id === fid_no_ext);
    if (index >= 0) {
      // REMOTE EVENT
      const rem = files_list.pop(files_list[index]);
      store.set_files(files_list);
      const local_file = path.join(_conf.local, rem.file_dir, rem.file_name);
      if (fs.existsSync(local_file)) fs.rmSync(local_file);
    }
  };

  const handle_key_files = function(dir, file_path, filename) {
    if (dir.includes(`${pk_dir_rel_path}${path.sep}`)) {
      if (_conf.isAdmin) {
        retrieve_pub_key(file_path, filename);
      }
      return true;
    }
    if (dir.includes(`${keys_dir_rel_path}${path.sep}`)) {
      if (!_conf.isAdmin) {
        retrieve_abe_secret_key(file_path);
      }
      return true;
    }
    return false;
  };

  const download_file = async function(file_name, file_path, sym_key, iv) {
    // separate folder and name of the encrypted file
    const last_sep_index = file_name.lastIndexOf(path.sep);
    const plaintext_file_folder = file_name.substr(0, last_sep_index + 1); // myfolder
    const plaintext_file_name = file_name.substr(last_sep_index + 1); // myfolder/foo.txt
    if (!fs.existsSync(path.join(_conf.local, plaintext_file_folder)))
      fs.mkdirSync(path.join(_conf.local, plaintext_file_folder), {
        recursive: true,
      });
    // File content symmetric decryption
    const encrypted_content_file = core.get_encrypted_content_file_name(
      file_path
    );
    await core.retrieve_decrypted_file(
      encrypted_content_file,
      path.join(_conf.local, file_name),
      sym_key,
      iv
    );
    return {
      plaintext_file_folder,
      plaintext_file_name,
    };
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

    const signature = file_utils.get_hmac(
      _conf.token,
      rsa_keys.pk + _conf.name
    );

    const data = {
      rsa_pub_key: rsa_keys.pk,
      sign: signature.toString("hex"),
    };
    fs.writeFileSync(
      path.join(_conf.remote, pk_dir_rel_path, token_hash.toString("hex")),
      JSON.stringify(data)
    );
  };

  // Admin retrieves the user RSA PK and send the ABE SK.
  const retrieve_pub_key = async function(full_file_name, file_name) {
    const users = store.get_users();

    assert(_conf.isAdmin);
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

        const user_abe_sk_path = `${path.join(
          _conf.remote,
          keys_dir_rel_path,
          user_abe_sk_filename
        )}.sk`;
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
    //TODO controllo d'errore
    const abe_sk = rsa
      .decrypt(JSON.stringify(abe_enc_sk), core.get_rsa_keys().sk)
      .toString("utf-8");
    core.set_abe_keys(keys.abe_pk, abe_sk);

    _conf.keys.abe = core.get_abe_keys();
    store.set_keys(_conf.keys);

    // ABE is now configured, we can download files in remote repo
    const remote_repo_file_list = walk(
      path.join(_conf.remote, repo_rel_path),
      []
    );
    remote_repo_file_list.forEach((file) => {
      handle_remote_add(path.join(_conf.remote, repo_rel_path, file));
    });
  };

  // admin calls this function to send the user ABE sk.
  const send_abe_user_secret_key = function(
    user_rsa_pk,
    attr_list,
    user_token,
    file_name
  ) {
    assert(_conf.isAdmin);

    try {
      const sk = core.create_user_abe_sk(attr_list, false);
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
    }
    store.set_files(files_list);
    return files_list;
  };

  const share_files = function() {
    console.log("SHARE FILES: ", files_list);
    files_list.forEach((file) => {
      assert(file.file_dir.charAt(0) != path.sep); // directory should not start with /
      const relative_file_path = file.file_dir + file.file_name;
      const abs_local_file_path = path.join(_conf.local, relative_file_path);
      const abs_remote_file_path = path.join(_conf.remote, repo_rel_path);

      // Encrypt the local files and copy in the remote repo
      if (file.status == file_status.local_change && file.policy.length != 0) {
        console.log("Share file, local file to share: " + relative_file_path);
        core
          .file_encrypt(
            relative_file_path,
            abs_local_file_path,
            abs_remote_file_path,
            file.file_id,
            attribute.policy_as_string(file.policy)
          )
          .then(() => {
            //file.status = file_status.sync;
            //store.set_files(files_list);
            // setting file status is done by handle remote change
            console.log("SHARE FILE SET SYNCH for LOCAL FILE");
            //console.log(files_list);
          })
          .catch((err) => {
            console.log("SHARE FILE ERROR in SYNC LOCAL FILE");
            throw Error(
              `Error ${err} encrypting local file ${relative_file_path}`
            );
          });
      }

      // Decrypt remote files and copy in the local repo
      if (file.status == file_status.remote_change) {
        console.log("Share file, remote file to share: " + relative_file_path);
        const enc_file_name = path.join(
          _conf.remote,
          repo_rel_path,
          file.file_id
        );
        const enc_file_name_no_ext = enc_file_name.substring(
          0,
          enc_file_name.lastIndexOf(".")
        );
        core
          .file_decrypt(enc_file_name_no_ext)
          .then(() => {
            file.status = file_status.sync;
            store.set_files(files_list);
            console.log("SHARE FILE SET SYNCH for REMOTE FILE");
          })
          .catch((err) => {
            console.log("SHARE FILE ERROR in SYNC REMOTE FILE");
            throw Error(`Error ${err} decrypting remote file ${file.file_id}`);
          });
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

  const debug_get_conf = function() {
    return _conf;
  };

  _boot();

  return {
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
    debug_get_conf, // DEBUG
  };
};

module.exports = Abebox;
