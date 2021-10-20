const abebox = require("./core");
const chokidar = require("chokidar");
const fs = require("fs");
const { parse_metadata, split_file_path } = require("./file_utils");
const { v4: uuidv4 } = require("uuid");
const { dirname } = require("path");
const { config } = require("process");
const { get } = require("config");

const ignore_list = ["keys/"];
const file_status = {
  ok: 0,
  modified: 1,
};

const files_list = [];

const create_dirs = function() {
  dirs = ["settings", "repo-local", "repo-shared/keys", "repo-shared/repo"];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
  });
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
      policy: "",
      status: file_status.ok,
    });
  }
};

const handle_remote_add = function(file_path) {
  if (ignore_list.some((el) => file_path.includes(el))) {
    return;
  }
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
    (el) => el.file_path === relative_path && el.fid === fid_no_ext
  );
  if (el !== undefined) {
    files_list.pop(el);
  }
};

module.exports = {
  startServices() {

    local_repo = __dirname + "/repo-local";
    remote_repo = __dirname + "/repo-shared";

    create_dirs();

    abebox.init(local_repo, remote_repo);

    watch_paths = [abebox.conf.local_repo_path, abebox.conf.remote_repo_path];

    console.log(`Starting watching on ${watch_paths}`);

    let watcher = chokidar.watch(watch_paths, {
      awaitWriteFinish: true,
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
  },

  get_files_list() {
    return files_list;
  },

  set_policy(fid, policy) {
    const el = files_list.find((el) => el.fid === fid);
    if (el !== undefined) {
      el.policy = policy;
    }
  },

  get_config() {
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
  },

  set_config(fields) {
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
    };
  },
};

//const conf = module.exports.get_config();
//console.log(conf);
