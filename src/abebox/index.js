"use strict";

const fs = require("fs");
const path = require("path");

const chokidar = require("chokidar");
const { v4: uuidv4 } = require("uuid");
const openurl = require("openurl");
const electronLog = require("electron-log");
const log = electronLog;
log.transports.console.level = false;
const envPaths = require("env-paths");

const aes = require("./aes");
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
  downloaded: 3,
};

const Abebox = (config_name = "config", name = "") => {
  // setup logfile

  log.debug("\n*********************************** Abebox Starting");
  if (name != "") {
    const log = electronLog.create(`log_${name}`);
    log.transports.console.level = true;
    log.transports.file.resolvePath = () =>
      path.join(__dirname, "log", `${name}.log`);
  }

  const store = AbeboxStore(config_name);
  const core = AbeboxCore(log);
  const attribute = AttributeManager(core);

  let files_list = [];
  let watcher;
  let _conf = {};
  let _configured = false; // conf and rsa ok
  let _configured_user_abe = false; // abe ok

  const _boot = function() {
    if (store.is_configured()) {
      _configured = true;
      _conf = store.get_conf();
      log.debug("BOOT WITH CONF: " + JSON.stringify(_conf));
      _conf.keys = store.get_keys();
      core.set_rsa_keys(_conf.keys.rsa.pk, _conf.keys.rsa.sk);

      _init_attribute(path.join(_conf.remote, attr_rel_path));
      if (_conf.isAdmin) {
        core.set_admin_abe_keys(
          _conf.keys.abe.pk,
          _conf.keys.abe.msk,
          _conf.keys.abe.sk
        );
      } else {
        // User section
        // TODO per user abe potrebbe essere vuoto
        if (Object.keys(_conf.keys.abe).length > 0) {
          core.set_abe_keys(_conf.keys.abe.pk, _conf.keys.abe.sk);
          core.set_admin_rsa_pk(_conf.keys.rsa_admin_pk);
          _configured_user_abe = true;
        } else {
          // if the abe keys are not found, send the RSA key to the admin
          send_user_rsa_pk();
        }
      }
      files_list = store.get_files(); // locading the cached file list important!!!
      _start_watchers();
    } else {
      log.debug("BOOTING NO CONF");
    }
  };

  // called when a new configuration is set
  const _setup = function() {
    log.debug("Abebox Setup");
    if (_configured) throw Error("ABEBox already configured - no setup needed");
    _configured = true;
    _conf = store.get_conf();
    if (_conf.isAdmin) {
      _init_dirs();
    } else {
      if (!_check_dirs())
        throw Error("Shared folder is not correctly configured");
    }
    //_create_dirs(remote_repo_dirs); // potrebbero essere piene admin - potrebbero non esistere
    _init_core();
    _init_attribute(path.join(_conf.remote, attr_rel_path));
    _start_watchers();
  };

  const _init_core = function() {
    log.debug("Abebox InitCore");
    if (!_configured) throw Error("Setup called without configuration");
    _conf.keys = {};
    _conf.keys.rsa = core.init_rsa_keys();
    if (_conf.isAdmin) {
      _conf.keys.abe = core.init_abe_keys(); // non crei sk
    } else {
      _conf.keys.abe = {};
      send_user_rsa_pk();
    }
    store.set_keys(_conf.keys);
  };

  const _init_attribute = function(attribute_path) {
    attribute.init(attribute_path);
  };

  const _start_watchers = function() {
    if (!_configured)
      throw Error("Start Watchers called without configuration");

    log.debug("Starting watchers");
    const watch_paths = [_conf.local, _conf.remote];
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
        path.join(_conf.remote, repo_rel_path, "*.0"),
        path.join(_conf.remote, repo_rel_path, "*", "*.0"),
      ],
    });

    watcher
      .on("add", (file_path) => {
        if (file_path.includes(watch_paths[0])) {
          // New local file
          log.debug(`ADD LOCAL ${file_path}`);
          handle_local_add(file_path);
        } else {
          // New remote file
          try {
            log.debug(`ADD REMOTE ${file_path}`);
            handle_remote_add(file_path);
          } catch (err) {
            log.debug("Catched chokidar: " + String(err));
          }
        }
      })
      .on("change", (file_path) => {
        if (file_path.includes(watch_paths[0])) {
          // Change on local file
          log.debug(`CHANGE LOCAL ${file_path}`);
          handle_local_change(file_path);
        } else {
          // Change on remote file
          log.debug(`CHANGE REMOTE ${file_path}`);
          handle_remote_change(file_path);
        }
      })
      .on("unlink", (file_path) => {
        if (file_path.includes(watch_paths[0])) {
          // Remove local file
          log.debug(`REM LOCAL ${file_path}`);
          handle_local_remove(file_path);
        } else {
          // Remove remote file
          log.debug(`REM REMOTE ${file_path}`);
          handle_remote_remove(file_path);
        }
      })
      .on("error", (err) => {
        console.log("Error from chokidar: " + String(err));
      });
  };

  const _stop_watchers = async function() {
    log.debug(`STOP WATCHERS`);
    return await watcher.close();
  };

  const stop = async function() {
    //TODO save conf
    return await _stop_watchers();
  };

  const _init_dirs = function() {
    remote_repo_dirs.forEach((dir) => {
      const absolute_dir = path.join(_conf.remote, dir);
      if (fs.existsSync(absolute_dir)) {
        fs.rmSync(absolute_dir, {
          recursive: true,
          force: true,
        });
        fs.mkdirSync(absolute_dir, { recursive: true });
      } else {
        fs.mkdirSync(absolute_dir, { recursive: true });
      }
    });
  };

  const _check_dirs = function(remote_path) {
    let is_ok = true;

    if (!remote_path) {
      remote_path = _conf.remote;
    }

    remote_repo_dirs.forEach((dir) => {
      const absolute_dir = path.join(remote_path, dir);
      if (!fs.existsSync(absolute_dir)) {
        is_ok = false;
      }
    });

    const attr_abs_path = path.join(remote_path, attr_rel_path);
    if (!fs.existsSync(attr_abs_path)) is_ok = false;

    return is_ok;
  };

  const is_repository = function(path) {
    return _check_dirs(path);
  };

  const _create_dirs = function(dirs) {
    dirs.forEach((dir) => {
      const absolute_dir = path.join(_conf.remote, dir);
      if (!fs.existsSync(absolute_dir)) {
        fs.mkdirSync(absolute_dir, { recursive: true });
      }
    });
  };

  const handle_local_add = function(file_path) {
    const { filename, rel_dir } = file_utils.split_file_path(
      file_path,
      _conf.local
    );
    log.debug("HL ADD: ", filename, rel_dir);

    const index = files_list.findIndex(
      (el) => el.file_dir === rel_dir && el.file_name === filename
    );
    if (index < 0) {
      const fid = uuidv4();
      files_list.push({
        file_dir: rel_dir,
        file_name: filename,
        file_id: fid,
        policy: [],
        status: file_status.local_change,
      });
      store.set_files(files_list);
      log.debug(`LOCAL ADD - UPDATED FILE LIST ${JSON.stringify(files_list)}`);
      return files_list;
    } else {
      if (files_list[index].status == file_status.downloaded) {
        files_list[index].status = file_status.sync;
        store.set_files(files_list);
        log.debug(
          `LOCAL ADD - UPDATED FILE LIST ${JSON.stringify(files_list)}`
        );
        return files_list;
      }
    }
  };

  const handle_remote_add = async function(file_path) {
    const { filename, rel_dir } = file_utils.split_file_path(
      file_path,
      _conf.remote
    );
    log.debug("HR ADD: ", filename, rel_dir);

    if (handle_key_files(rel_dir, file_path, filename)) {
      return;
    }

    if (!core.is_abe_configured()) {
      log.debug(`ABEBOX NOT CONFIGURED`);
      return;
    }
    const [file_id, file_ext] = filename.split(".");
    // we discard files without .abebox extensions since they are just
    // fragments.
    if (file_ext != "abebox") return files_list;
    const { file_name, sym_key, iv, tag, policy } = core.retrieve_metadata(
      file_path
    );

    if (file_name === null) {
      // if metadata.file_path is null, decoding was not possible
      throw Error("Metadata file name is empty");
    }
    // search if file has been already added in the file list
    const index = files_list.findIndex((el) => el.file_id === file_id);
    if (index < 0) {
      // REMOTE EVENT
      const {
        plaintext_file_folder,
        plaintext_file_name,
      } = await download_file(file_name, file_path, sym_key, iv, tag);
      assert(plaintext_file_name);
      files_list.push({
        file_dir: plaintext_file_folder,
        file_name: plaintext_file_name,
        file_id: file_id,
        policy: attribute.policy_from_string(policy),
        status: file_status.downloaded,
      });
    } else {
      if (files_list[index].status === file_status.local_change) {
        throw Error("Bad File status - local change in remote add");
        files_list[index].status = file_status.sync;
      } else {
        /*const {
          plaintext_file_folder,
          plaintext_file_name,
        } = await download_file(file_name, file_path, sym_key, iv);
        files_list[index].status = file_status.downloaded;*/
      }
      // TRIGGERED BY LOCAL ADD
    }
    store.set_files(files_list);
    log.debug(`REMOTE ADD - UPDATED FILE LIST ${JSON.stringify(files_list)}`);
    return files_list;
  };

  const handle_local_change = function(file_path) {
    const { filename, rel_dir } = file_utils.split_file_path(
      file_path,
      _conf.local
    );
    log.debug("HL CH: ", filename, rel_dir);

    const index = files_list.findIndex(
      (el) => el.file_dir === rel_dir && el.file_name === filename
    );
    if (index >= 0) {
      if (files_list[index].status == file_status.downloaded) {
        files_list[index].status = file_status.sync;
      } else {
        files_list[index].status = file_status.local_change;
      }
      store.set_files(files_list);
      log.debug(
        `LOCAL CHANGE - UPDATED FILE LIST ${JSON.stringify(files_list)}`
      );
      return files_list;
    } else throw Error(`Local change error: ${file_path} already exists`);
  };

  const handle_remote_change = function(file_path) {
    const { filename, rel_dir } = file_utils.split_file_path(
      file_path,
      _conf.remote
    );
    log.debug("HR CH: ", filename, rel_dir);

    if (handle_key_files(rel_dir, file_path, filename)) return files_list;

    if (!core.is_abe_configured()) return;

    // POSSIBLE BUG e' cambiato il .0 ma non il .abebox?
    const [file_id, file_ext] = filename.split(".");

    // we discard files without .abebox extensions since they are just
    // fragments.
    if (file_ext != "abebox") return files_list;

    const { file_name, sym_key, iv, tag } = core.retrieve_metadata(file_path);

    if (file_name === null) {
      // if metadata.file_path is null, decoding was not possible
      throw Error("Metadata file name is empty");
    }
    // search if file has been already added in the file list
    const index = files_list.findIndex((el) => el.file_id === file_id);
    if (index >= 0) {
      if (
        files_list[index].status == file_status.sync ||
        files_list[index].status == file_status.local_change // TODO errore
      ) {
        // REMOTE EVENT
        download_file(file_name, file_path, sym_key, iv, tag); // it's an async function
        files_list[index].status = file_status.downloaded;
      } else {
        log.error("Handle remote change bad file status " + file_name);
        throw Error("Handle remote change bad file status: " + file_name);
      }
    }
    store.set_files(files_list);
    log.debug(
      `REMOTE CHANGE - UPDATED FILE LIST ${JSON.stringify(files_list)}`
    );
    return files_list;
  };

  const handle_local_remove = function(file_path) {
    const { filename, rel_dir } = file_utils.split_file_path(
      file_path,
      _conf.local
    );
    log.debug("HL REM: ", filename, rel_dir);
    const index = files_list.findIndex(
      (el) => el.file_dir === rel_dir && el.file_name === filename
    );
    if (index >= 0) {
      const removed_file = files_list.splice(index, 1)[0];
      store.set_files(files_list);
      log.debug(`LOCAL REM - UPDATED FILE LIST ${JSON.stringify(files_list)}`);
      const remote_file = path.join(
        _conf.remote,
        repo_rel_path,
        removed_file.file_id
      );
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
      const removed_file = files_list.splice(index, 1)[0];
      store.set_files(files_list);
      log.debug(`REMOTE REM - UPDATED FILE LIST ${JSON.stringify(files_list)}`);
      const local_file = path.join(
        _conf.local,
        removed_file.file_dir,
        removed_file.file_name
      );
      if (fs.existsSync(local_file)) fs.rmSync(local_file);
    }
  };

  const handle_key_files = function(dir, file_path, filename) {
    if (dir.includes(`${pk_dir_rel_path}${path.sep}`)) {
      log.debug(`DETECTED PUB KEY FILE`);
      if (_conf.isAdmin) {
        retrieve_pub_key(file_path, filename);
      }
      return true;
    }
    if (dir.includes(`${keys_dir_rel_path}${path.sep}`)) {
      log.debug(`DETECTED ABE USER KEY FILE`);
      if (!_conf.isAdmin) {
        const expected_file_name = file_utils
          .get_hash(_conf.token)
          .toString("hex");
        if (filename.includes(expected_file_name)) {
          retrieve_abe_secret_key(file_path, _conf.token);
        }
      }
      return true;
    }
    return false;
  };

  const download_file = async function(file_name, file_path, sym_key, iv, tag) {
    // separate folder and name of the encrypted file
    log.debug("FN ", file_name);
    log.debug("FP ", file_path);
    const last_sep_index = file_name.lastIndexOf(path.sep);
    const plaintext_file_folder = file_name.substr(0, last_sep_index + 1); // myfolder
    const plaintext_file_name = file_name.substr(last_sep_index + 1); // myfolder/foo.txt
    log.debug("FF ", plaintext_file_folder);
    log.debug("DN ", plaintext_file_name);

    const abs_plaintext_file_folder = path.join(
      _conf.local,
      plaintext_file_folder
    );
    log.debug("ADN ", abs_plaintext_file_folder);

    if (!fs.existsSync(abs_plaintext_file_folder))
      fs.mkdirSync(abs_plaintext_file_folder, {
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
      iv,
      tag
    );
    return {
      plaintext_file_folder,
      plaintext_file_name,
    };
  };
  /*
  const send_invite = function(recv) {
    return openurl.mailto([recv.mail], {
      subject: "ABEBox invitation!",
      body: `${_conf.name} has invited you to download ABEBox!\nYou can dowload it from this link [LINK].\n
    Here is your invitation token ${recv.token}\n`,
    });
  };
  */

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

    console.log("RSA PK", typeof rsa_keys.pk, rsa_keys.pk);
    console.log("NAME", typeof _conf.name, _conf.name);
    console.log("TOKEN", typeof _conf.token, _conf.token);
    console.log("TOKEN HASH", typeof token_hash, token_hash);
    console.log("SIGNATURE", typeof signature, signature);
    console.log("DATA", typeof data, data);

    const key_filename = path.join(
      _conf.remote,
      pk_dir_rel_path,
      token_hash.toString("hex")
    );
    log.debug(
      `send_user_rsa_pk: writing ${key_filename} for token ${_conf.token}`
    );
    fs.writeFileSync(key_filename, JSON.stringify(data));
  };

  // Admin retrieves the user RSA PK and send the ABE SK.
  const retrieve_pub_key = async function(full_file_name, file_name) {
    const users = store.get_users();

    assert(_conf.isAdmin);
    const index = users.findIndex(
      (item) => file_utils.get_hash(item.token).toString("hex") === file_name
    );
    if (index >= 0) {
      log.debug(`GET PUB KEY OF ${users[index].name}`);
      // Test sign
      const data = JSON.parse(fs.readFileSync(full_file_name, "utf-8"));
      const rsa_pk = data.rsa_pub_key;
      const sign = data.sign;
      const signature = file_utils.get_hmac(
        users[index].token,
        rsa_pk + users[index].name
      );

      console.log("RSA PK", typeof rsa_pk, rsa_pk);
      console.log("NAME", typeof users[index].name, users[index].name);
      console.log("TOKEN", typeof users[index].token, users[index].token);
      //console.log("TOKEN HASH", typeof token_hash, token_hash);
      console.log("SIGNATURE", typeof signature, signature);
      console.log("DATA", typeof data, data);

      if (sign == signature.toString("hex")) {
        // Add pub key to the specific user and update users list
        users[index].rsa_pub_key = rsa_pk;
        store.set_users(users);
        // // Create user secret key
        // const user_abe_sk_filename = file_utils
        //   .get_hash(users[index].name)
        //   .toString("hex");

        // const user_abe_sk_path = `${path.join(
        //   _conf.remote,
        //   keys_dir_rel_path,
        //   user_abe_sk_filename
        // )}.sk`;
        // send_abe_user_secret_key(
        //   attribute.compress_list(users[index].attrs),
        //   users[index].token,
        //   users[index].name
        // );
      } else {
        log.debug(`INVALID SIGNATURE PUB KEY OF ${users[index].name}`);
        throw Error("Invalid signature on retrieve_pub_key");
      }
    } else {
      log.debug(`NO USER MATCHING`);
    }
  };

  // user retrieves her ABE SK
  const retrieve_abe_secret_key = function(full_file_name, user_token) {
    let dec_data;
    const { data, iv, tag } = JSON.parse(
      fs.readFileSync(full_file_name, "utf-8")
    );

    log.debug(`USER ABE PK RETRIEVED`);

    const decipher = aes.init_decipher(
      Buffer.from(user_token, "hex"),
      Buffer.from(iv, "hex"),
      Buffer.from(tag, "hex")
    );

    //decipher.setAuthTag(Buffer.from(tag, "hex"));

    try {
      dec_data = aes.decrypt(decipher, data);
      //decipher.update(data, "hex", "utf8");
      //dec_data += decipher.final("utf8");
    } catch (err) {
      log.debug(`Error decoding user SK from file ${full_file_name} - ${err}`);
      throw Error(`Error decoding user SK from file ${full_file_name}`);
    }

    const { abe_pk, rsa_admin_pk, user_abe_sk, user_name } = JSON.parse(
      dec_data
    );
    core.set_abe_keys(abe_pk, user_abe_sk);

    _conf.keys.abe = core.get_abe_keys();
    core.set_admin_rsa_pk(rsa_admin_pk);
    _conf.keys.rsa_admin_pk = rsa_admin_pk;
    _conf.name = user_name;
    store.set_keys(_conf.keys);

    log.debug(`USER ABE SK RETIEVED` + JSON.stringify(user_abe_sk));

    // ABE is now configured, we can download files in remote repo
    const remote_repo_file_list = _walk(
      path.join(_conf.remote, repo_rel_path),
      []
    );
    // rescan the whole repo now that we have the right key
    remote_repo_file_list.forEach((file) => {
      handle_remote_add(path.join(_conf.remote, repo_rel_path, file));
    });
  };

  // admin calls this function to send the user ABE sk.
  const send_abe_user_secret_key = function(attr_list, user_token, username) {
    assert(_conf.isAdmin);

    const sk = core.create_user_abe_sk(attr_list, false);

    const user_data = {
      abe_pk: core.get_abe_keys().pk,
      rsa_admin_pk: core.get_rsa_keys().pk,
      user_abe_sk: sk,
      user_name: username,
    };

    const sym_key = Buffer.from(user_token, "hex");
    // Create IV
    const iv = aes.gen_iv();
    // Create symmetric cipher
    //const algorithm = "aes-256-gcm";
    const cipher = aes.init_cipher(sym_key, iv);
    //crypto.createCipheriv(algorithm, sym_key, iv);

    const { ciphertext, tag } = aes.encrypt(cipher, JSON.stringify(user_data));
    //cipher.update(JSON.stringify(user_data), "utf8", "hex");
    //enc += cipher.final("hex");
    const file_name = file_utils.get_hash(user_token).toString("hex");

    const data = {
      data: ciphertext,
      iv: iv.toString("hex"),
      tag: tag,
    };

    const file_path = `${path.join(
      _conf.remote,
      keys_dir_rel_path,
      file_name
    )}.sk`;

    fs.writeFileSync(file_path, JSON.stringify(data));
    log.debug(`ABE SK SENT WITH TOKEN  ${user_token}`);
  };

  // List all files in a directory in Node.js recursively in a synchronous fashion
  const _walk = function(dir, file_list) {
    if (!fs.statSync(dir).isDirectory()) throw Error(`${dir} is not a folder`);
    let filelist = file_list || [];
    let files = fs.readdirSync(dir);
    files.forEach(function(file) {
      const full_path = path.join(dir, file);
      if (fs.statSync(full_path).isDirectory()) {
        filelist = _walk(full_path, filelist);
      } else {
        const last_dot = file.lastIndexOf(".");
        if (file.substring(last_dot) != "0") filelist.push(file);
      }
    });
    return filelist;
  };

  const _update_users_attr = function(old_attr, new_attr) {
    const users = get_users();
    users.forEach((user) => {
      const index = user.attrs.findIndex(
        (attr) =>
          attr.univ == old_attr.univ &&
          attr.attr == old_attr.attr &&
          attr.vers == old_attr.vers
      );
      if (index >= 0) {
        user.attrs[index] = new_attr;
      }
    });
    store.set_users(users);
  };

  const _del_users_attr = function(del_attr) {
    const users = get_users();
    users.forEach((user) => {
      const index = user.attrs.findIndex(
        (attr) =>
          attr.univ == del_attr.univ &&
          attr.attr == del_attr.attr &&
          attr.vers == del_attr.vers
      );
      if (index >= 0) {
        user.attrs.splice(index, 1);
      }
    });
    store.set_users(users);
  };

  /**************** FILES *****************/
  const get_files_list = function() {
    files_list = store.get_files();
    return files_list;
  };

  const set_policy = function(data) {
    const el = files_list.find((el) => el.file_id === data.file_id);
    if (el !== undefined) {
      el.policy = data.policy;
    }
    log.debug(
      `SET POLICY TO ${data.file_id} DATA: ${attribute.policy_as_string(
        data.policy
      )}`
    );
    store.set_files(files_list);
    return files_list;
  };

  const share_local_file = function(file) {
    if (!fs.existsSync(path.join(_conf.local, file.file_dir, file.file_name)))
      throw Error(`File does not exist`);
    if (!file.policy) throw Error(`Policy is undefined`);
    const relative_file_path = path.join(file.file_dir, file.file_name);
    const abs_local_file_path = path.join(_conf.local, relative_file_path);
    const abs_remote_file_path = path.join(_conf.remote, repo_rel_path);
    log.debug(`SHARE LOCAL FILE  ${relative_file_path}`);
    core
      .file_encrypt(
        relative_file_path,
        abs_local_file_path,
        abs_remote_file_path,
        file.file_id,
        attribute.policy_as_string(file.policy)
      )
      .catch((err) => {
        log.debug("ERROR IN SYNC LOCAL FILE " + String(err));
        throw Error(`Error ${err} encrypting local file ${relative_file_path}`);
      });
  };

  const share_single_file = function(file_id) {
    const index = files_list.findIndex((el) => el.file_id === file_id);
    if (index < 0) {
      return { status: "error", message: "file non trovato" };
    } else {
      if (files_list[index].status == file_status.local_change) {
        share_local_file(files_list[index]);
        files_list[index].status = file_status.sync;
        store.set_files(files_list);
        log.debug(
          `LOCAL CHANGE - UPDATED FILE LIST ${JSON.stringify(files_list)}`
        );
      } else {
        return {
          status: "error",
          message: "wrong status " + String(files_list[index].status),
        };
      }
    }
  };

  const share_files = function() {
    files_list.forEach((file) => {
      assert(file.file_dir.charAt(0) != path.sep); // directory should not start with /
      // Encrypt the local files and copy in the remote repo
      if (file.status == file_status.local_change && file.policy.length != 0) {
        share_local_file(file);
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
    // Update admin ABE sk
    const attrs_comp = attribute.compress_list(attrs);
    _conf.keys.abe.sk = core.create_abe_sk(attrs_comp);
    store.set_keys(_conf.keys);
    return attrs;
  };

  const set_attr = function(old_obj, new_obj) {
    if (!_conf.configured) throw Error("ABEBox not configured");
    if (!_conf.isAdmin) throw Error("To Modify an Attribute need to be admin");
    const attrs = attribute.set(old_obj, new_obj);
    // Update admin ABE sk
    const attrs_comp = attribute.compress_list(attrs);
    _conf.keys.abe.sk = core.create_abe_sk(attrs_comp);
    store.set_keys(_conf.keys);
    // Update users attributes
    _update_users_attr(old_obj, new_obj);
    return attrs;
  };

  const del_attr = function(del_obj) {
    const attrs = attribute.del(del_obj);
    // Update admin ABE sk
    const attrs_comp = attribute.compress_list(attrs);
    _conf.keys.abe.sk = core.create_abe_sk(attrs_comp);
    store.set_keys(_conf.keys);
    // Delete users attributes
    _del_users_attr(del_obj);
    return attrs;
  };

  /**************** USERS *****************/
  const get_users = function() {
    return store.get_users();
  };

  const new_user = function(new_obj) {
    const users = store.get_users();
    // Check if already exists
    const index = users.findIndex((item) => item.name == new_obj.name);
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
    const index = users.findIndex((item) => item.name == new_obj.name);
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
    const index = users.findIndex((el) => el.name == user.name);

    if (index < 0) {
      throw Error("User not present");
    } else {
      if (!users[index].token) {
        const token = file_utils.get_random(32).toString("hex");
        users[index].token = token;
        store.set_users(users);
      }
      // write user SK to a file and encrypt with a token
      send_abe_user_secret_key(
        attribute.compress_list(users[index].attrs),
        users[index].token,
        users[index].name
      );

      return users[index].token;
    }
  };

  const del_user = function(name) {
    const users = store.get_users();
    const index = users.findIndex((item) => item.name == name);
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

  const get_user_info = function() {
    let list_attrs = [];
    try {
      list_attrs = attribute.get_all();
    } catch (err) {
      log.error("Error retrieving Attr in get_user_info " + err.message);
    }
    return { num_files: files_list.length, num_attrs: list_attrs.length };
  };

  const get_admin_info = function() {
    let list_attrs = [];
    try {
      list_attrs = attribute.get_all();
    } catch (err) {
      log.error("Error retrieving Attr in get_user_info " + err.message);
    }
    return {
      num_files: files_list.length,
      num_attrs: list_attrs.length,
      num_users: get_users().length,
    };
  };

  _boot();

  return {
    stop,
    get_files_list,
    is_repository,
    set_policy,
    share_single_file,
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
    get_user_info,
    get_admin_info,
    del_user,
    // send_user_rsa_pk, // removed with new key exchance
    debug_get_conf, // DEBUG
  };
};

module.exports = Abebox;
