const assert = require("assert");
const fs = require("fs");

const file_utils = require("../src/abebox/file_utils");

const envPaths = require("env-paths");
const paths = envPaths("electron-store");

// paths
const tmp_dir = `${__dirname}/tmp`;
const abs_local_repo_path = `${tmp_dir}/repo-local`;
const user_token_file = `${tmp_dir}/user_token.txt`;
const abs_remote_repo_path = `${tmp_dir}/repo-shared`;
const abs_remote_repo_repo_path = `${abs_remote_repo_path}/repo`;

const abs_user_local_repo_path = `${tmp_dir}/repo-user-local`;

const cfg_filename_user = "user_config.json";

// plaintext files
const local_dir = "mytestfolder";
const plaintext_filename = "hello_index.txt"; // we are creating /mytestfolder/hello.txt file in the local repo
const rel_plaintext_file_path = `${local_dir}/${plaintext_filename}`;
const abs_plaintext_file_path = `${abs_local_repo_path}/${rel_plaintext_file_path}`;
const abs_dec_plaintext_file_path = `${abs_plaintext_file_path}.decripted.txt`;

// remove and create test files
before(() => {
  // Rename cfg file
  if (fs.existsSync(paths.config + "/" + cfg_filename_user))
    fs.rmSync(paths.config + "/" + cfg_filename_user);

  fs.mkdirSync(`${abs_user_local_repo_path}`, { recursive: true });
});

after(() => {
  // stop abebox!!
});

let abe;
let user_sk;

let admin_abebox;
let user_abebox;

const sym_key = "sym_key";
const iv = "iv";
let invited_user_token = "";

const user_conf = {
  configured: true,
  isAdmin: false,
  local: abs_user_local_repo_path,
  name: "user@uniroma2.it",
  remote: abs_remote_repo_path,
  token: "",
};

function delay(t, v) {
  return new Promise(function(resolve) {
    setTimeout(resolve.bind(null, v), t);
  });
}

const attr_data_1 = { univ: "UN", attr: "A", vers: "1" };
const attr_data_2 = { univ: "UN", attr: "B", vers: "1" };
const attr_data_3 = { univ: "UN", attr: "C", vers: "1" };

describe("Abebox Tests", () => {
  it("setup abebox user with token", async () => {
    user_abebox = require("../src/abebox/index");

    user_abebox.boot(cfg_filename_user.split(".")[0]);

    user_conf.token = fs.readFileSync(user_token_file, "utf-8");

    // loading new configuration
    user_abebox.set_config(user_conf);

    user_abebox.send_user_rsa_pk(); // send the token
    const token_hash = file_utils.get_hash(user_conf.token);
    const user_rsa_pk_filename = `${
      user_conf.remote
    }/pub_keys/${token_hash.toString("hex")}`;
    assert.ok(fs.existsSync(user_rsa_pk_filename));
    const user_rsa_file_content = fs.readFileSync(
      user_rsa_pk_filename,
      "utf-8"
    );
    const user_rsa_obj = JSON.parse(user_rsa_file_content);
    assert.ok(user_rsa_obj.hasOwnProperty("rsa_pub_key"));
    assert.ok(user_rsa_obj.hasOwnProperty("sign"));
    console.log("Token file: ", user_rsa_obj);

    await delay(10000);
    console.log("FILE LIST =", user_abebox.get_files_list());
    //user_abebox.share_files(); // send the token
  }).timeout(50000);
});

/*
stop,
  OK get_files_list,
  OK set_policy,
  OK share_files,
  OK get_config,
  OK set_config,
  N/A reset_config,
  OK get_attrs,
  OK new_attr,
  OK set_attr,
  OK del_attr,
  OK get_users,
  OK new_user,
  OK set_user,
  OK del_user,
  invite_user,
  test users
*/
