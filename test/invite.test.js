"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const file_utils = require("../src/abebox/file_utils");
const ABEBox = require("../src/abebox/index");

const envPaths = require("env-paths");
const Abebox = require("../src/abebox/index");
const paths = envPaths("electron-store");

// paths
const tmp_dir = path.join(__dirname, "tmp");
const abs_local_repo_path = path.join(tmp_dir, "repo-local");
const abs_remote_repo_path = path.join(tmp_dir, "repo-shared");
const abs_remote_repo_repo_path = path.join(abs_remote_repo_path, "repo");

const abs_user_local_repo_path = path.join(tmp_dir, "repo-user-local");

const cfg_filename_admin = "admin_2_config.json";
const cfg_filename_user = "user_config.json";

// plaintext files
const local_dir = "mytestfolder";
const plaintext_filename = "hello_index.txt"; // we are creating /mytestfolder/hello.txt file in the local repo
const rel_plaintext_file_path = path.join(local_dir, plaintext_filename);
const abs_plaintext_file_path = path.join(
  abs_local_repo_path,
  rel_plaintext_file_path
);
const abs_plaintext_user_file_path = path.join(
  abs_user_local_repo_path,
  rel_plaintext_file_path
);
const abs_dec_plaintext_file_path = path.join(
  abs_plaintext_file_path,
  ".decripted.txt"
);

// other file (#2) for the tests
const plaintext_filename_2 = "hello_index2.txt"; // we are creating /mytestfolder/hello.txt file in the local repo
const rel_plaintext_file_path_2 = path.join(local_dir, plaintext_filename_2);
const abs_plaintext_file_path_2 = path.join(
  abs_local_repo_path,
  rel_plaintext_file_path_2
);

const abs_plaintext_user_file_path_2 = path.join(
  abs_user_local_repo_path,
  rel_plaintext_file_path_2
);

let user_keys;

// remove and create test files
before(() => {
  // Rename cfg file
  if (fs.existsSync(path.join(paths.config, cfg_filename_admin)))
    fs.rmSync(path.join(paths.config, cfg_filename_admin));
  if (fs.existsSync(path.join(paths.config, cfg_filename_user)))
    fs.rmSync(path.join(paths.config, cfg_filename_user));

  // Removing all files in dirs
  if (fs.existsSync(tmp_dir))
    fs.rmSync(tmp_dir, {
      recursive: true,
      force: true,
    });

  fs.mkdirSync(path.join(abs_local_repo_path, local_dir), { recursive: true });
  fs.mkdirSync(abs_user_local_repo_path, { recursive: true });
  fs.mkdirSync(abs_remote_repo_repo_path, { recursive: true });
});

after(() => {
  // stop abebox!!
});

// to reload the module as a separate instance
beforeEach(() => {
  delete require.cache[require.resolve("chokidar")];
});

let abe;
let user_sk;

let admin_abebox;
let user_abebox;
let admin_abebox_init;
let user_abebox_init;

const sym_key = "sym_key";
const iv = "iv";
let invited_user_token = "";

// attributes
const attr_data_1 = { univ: "UN", attr: "A", vers: "1" };
const attr_data_2 = { univ: "UN", attr: "B", vers: "1" };
const attr_data_3 = { univ: "UN", attr: "C", vers: "1" };
const attr_data_4 = { univ: "UN", attr: "D", vers: "1" };
const attr_data_5 = { univ: "UN", attr: "E", vers: "1" };

// configuration used by admin
const conf = {
  configured: true,
  isAdmin: true,
  local: abs_local_repo_path,
  name: "admin@uniroma2.it",
  remote: abs_remote_repo_path,
  token: "",
};

// configuration used by user
const user_conf = {
  configured: true,
  isAdmin: false,
  local: abs_user_local_repo_path,
  name: "user@uniroma2.it",
  remote: abs_remote_repo_path,
  token: "",
};

// information set by admin about a new user invited in abebox
const new_user_info = {
  mail: user_conf.name,
  attrs: [attr_data_1, attr_data_3],
  token: "",
  rsa_pub_key: "",
};

function delay(t, v) {
  return new Promise(function(resolve) {
    setTimeout(resolve.bind(null, v), t);
  });
}

describe("Abebox Tests", () => {
  it("admin setup", async () => {
    admin_abebox_init = Abebox(cfg_filename_admin.split(".")[0], "ADMIN INIT");
    admin_abebox_init.set_config(conf);
    const retrieved_conf = admin_abebox_init.get_config();
    assert.deepEqual(conf, retrieved_conf);
    admin_abebox_init.new_attr(attr_data_1);
    admin_abebox_init.new_attr(attr_data_2);
    const attr_list = admin_abebox_init.new_attr(attr_data_3);
    assert.equal(attr_list.length, 3);
  }).timeout(15000);

  it("stop and reload", async () => {
    await admin_abebox_init.stop();
    await delay(3000);
    admin_abebox = Abebox(cfg_filename_admin.split(".")[0], "ADMIN ");
    admin_abebox.new_attr(attr_data_4);
    const attr_list = admin_abebox.new_attr(attr_data_5);
    assert.equal(attr_list.length, 5);
    fs.writeFileSync(
      abs_plaintext_file_path,
      "Test file created on " + new Date()
    );
    await delay(3000);
    const file_list = admin_abebox.get_files_list();
    assert.equal(file_list.length, 1);
  }).timeout(55000);

  it("invite user", () => {
    //add the new user to the list
    const user_list = admin_abebox.new_user(new_user_info);
    const user = user_list[0];
    assert.ok(admin_abebox.get_users().length > 0);
    const invited_user = admin_abebox.invite_user(user);
    invited_user_token = invited_user.token;
    assert.equal(invited_user.mail, new_user_info.mail);
    assert.ok(invited_user_token);
  }).timeout(15000);

  it("setup abebox user with token", async () => {
    // init the abebox index for the user
    user_abebox_init = Abebox(cfg_filename_user.split(".")[0], "USER INIT");
    user_conf.token = invited_user_token;
    // loading new configuration
    user_abebox_init.set_config(user_conf);
    user_abebox_init.send_user_rsa_pk(); // send the user RSA pubkey to admin

    // check if the
    const token_hash = file_utils.get_hash(user_conf.token);
    const user_rsa_pk_filename = path.join(
      user_conf.remote,
      "pub_keys",
      token_hash.toString("hex")
    );

    assert.ok(fs.existsSync(user_rsa_pk_filename));
    const user_rsa_file_content = fs.readFileSync(
      user_rsa_pk_filename,
      "utf-8"
    );
    const user_rsa_obj = JSON.parse(user_rsa_file_content);
    assert.ok(user_rsa_obj.hasOwnProperty("rsa_pub_key"));
    assert.ok(user_rsa_obj.hasOwnProperty("sign"));

    await delay(20000);

    // admin received the RSA pub key of the user
    // this is done by retrieve_pub_key called by the watcher
    const user = admin_abebox
      .get_users()
      .find((el) => el.mail == new_user_info.mail);
    // does ADMIN receive the RSA Pub key of the user?
    assert.equal(user.rsa_pub_key, user_rsa_obj.rsa_pub_key);

    // then admin sends the SK to the user

    // user receives the sk and should set his SK
    assert.ok(user_abebox_init.debug_get_conf().keys.hasOwnProperty("abe"));
    assert.ok(user_abebox_init.debug_get_conf().keys.abe.hasOwnProperty("sk"));
    user_keys = user_abebox_init.debug_get_conf().keys;
  }).timeout(50000);
  it("stop and reload user", async () => {
    await user_abebox_init.stop();
    await delay(3000);
    user_abebox = Abebox(cfg_filename_user.split(".")[0], "USER");
    assert.deepEqual(
      user_abebox.debug_get_conf().keys.rsa_pub_key,
      user_keys.rsa_pub_key
    );
    assert.deepEqual(
      user_abebox.debug_get_conf().keys.rsa.pk,
      user_keys.rsa.pk
    );
    assert.deepEqual(
      user_abebox.debug_get_conf().keys.abe.pk,
      user_keys.abe.pk
    );
    assert.deepEqual(
      user_abebox.debug_get_conf().keys.abe.sk,
      user_keys.abe.sk
    );
    assert.deepEqual(
      user_abebox.debug_get_conf().keys.rsa.sk,
      user_keys.rsa.sk
    );

    assert.deepEqual(user_abebox.debug_get_conf().keys, user_keys);
  }).timeout(15000);
  it("admin creates and shares a test file", async () => {
    // create a new file on user local
    const test_content = "Other test file created on " + new Date();
    fs.writeFileSync(abs_plaintext_file_path_2, test_content);

    await delay(4000); // wait 4s for watcher file detection
    const file_list = admin_abebox.get_files_list();

    const my_file = file_list.find(
      (el) => el.file_name == plaintext_filename_2
    );
    assert.ok(my_file);

    const my_policy = {
      file_id: my_file.file_id,
      policy: [[attr_data_3]],
    };
    admin_abebox.set_policy(my_policy);

    admin_abebox.share_files();

    await delay(8000); // wait 4s for watcher file detection

    // user should be able to retrive the content
    const user_test_file_content = fs.readFileSync(
      abs_plaintext_user_file_path_2,
      "utf-8"
    );

    assert.equal(user_test_file_content, test_content);
  }).timeout(200000);

  /*it("add a file in the local repo", async () => {
    fs.writeFileSync(
      abs_plaintext_file_path,
      "Test file created on " + new Date()
    );

    await delay(4000); // wait 4s for watcher file detection
    const file_list = admin_abebox.get_files_list();
    assert(file_list.length > 0);
    const my_file = file_list[0];
    assert.equal(my_file.file_name, plaintext_filename);
    admin_abebox.new_attr(attr_data_3);
    const my_policy = {
      file_id: my_file.file_id,
      policy: [[attr_data_3]],
    };
    admin_abebox.set_policy(my_policy);
    const file_list2 = admin_abebox.get_files_list();
    const my_file2 = file_list2[0];
    assert.deepEqual(my_file2.policy, my_policy.policy);
    admin_abebox.share_files();

    await delay(4000); // wait 4s for watcher file detection

    assert.ok(
      fs.existsSync(
        `${path.join(abs_remote_repo_repo_path, my_file.file_id)}.0`
      )
    );
    assert.ok(
      fs.existsSync(
        `${path.join(abs_remote_repo_repo_path, my_file.file_id)}.abebox`
      )
    );
  }).timeout(15000);

  
  it("stop abebox", () => {
    admin_abebox.stop();
    admin_abebox.reset_config();
  });
  
  it("setup abebox user with token", async () => {
    // init the abebox index for the user
    user_abebox = Abebox(cfg_filename_user.split(".")[0]);

    user_conf.token = invited_user_token;
    // loading new configuration
    user_abebox.set_config(user_conf);

    user_abebox.send_user_rsa_pk(); // send the user RSA pubkey to admin

    // check if the
    const token_hash = file_utils.get_hash(user_conf.token);
    const user_rsa_pk_filename = path.join(
      user_conf.remote,
      "pub_keys",
      token_hash.toString("hex")
    );

    assert.ok(fs.existsSync(user_rsa_pk_filename));
    const user_rsa_file_content = fs.readFileSync(
      user_rsa_pk_filename,
      "utf-8"
    );
    const user_rsa_obj = JSON.parse(user_rsa_file_content);
    assert.ok(user_rsa_obj.hasOwnProperty("rsa_pub_key"));
    assert.ok(user_rsa_obj.hasOwnProperty("sign"));

    await delay(15000);

    // admin received the RSA pub key of the user
    // this is done by retrieve_pub_key called by the watcher
    const user = admin_abebox
      .get_users()
      .find((el) => el.mail == new_user_info.mail);
    assert.equal(user.rsa_pub_key, user_rsa_obj.rsa_pub_key);

    // then admin sends the SK to the user

    // user receives the sk and should set his SK
    assert.ok(user_abebox.debug_get_conf().keys.hasOwnProperty("abe"));
    assert.ok(user_abebox.debug_get_conf().keys.abe.hasOwnProperty("sk"));
  }).timeout(50000);
  it("user retrieves his own attributes", () => {
    const user_attributes = user_abebox.get_attrs();
    assert.deepEqual(user_attributes, new_user_info.attrs);
  });
  it("user should decode the shared test file", () => {
    assert.ok(fs.existsSync(abs_plaintext_user_file_path));
    // file content should be equal
    const user_test_file_content = fs.readFileSync(
      abs_plaintext_user_file_path,
      "utf-8"
    );
    const admin_test_file_content = fs.readFileSync(
      abs_plaintext_file_path,
      "utf-8"
    );

    assert.equal(user_test_file_content, admin_test_file_content);
  });
  it("user modifies a shared test file", async () => {
    const user_test_file_content = fs.readFileSync(
      abs_plaintext_user_file_path,
      "utf-8"
    );
    const new_content = "\nFile edited on " + new Date();
    const updated_content = user_test_file_content + new_content;
    fs.appendFileSync(abs_plaintext_user_file_path, new_content);

    await delay(4000);
    user_abebox.share_files();
    await delay(10000);
    const admin_test_file_content = fs.readFileSync(
      abs_plaintext_file_path,
      "utf-8"
    );

    assert.equal(admin_test_file_content, updated_content);
    const file_list = user_abebox.get_files_list();
    const el_find = file_list.find((el) => el.file_name == plaintext_filename);
    assert.ok(el_find);
    assert.equal(el_find.status, 0); // file_status.sync
  }).timeout(25000);
  
  it("user deletes a file", async () => {
    // delete a file on user
    assert.ok(fs.existsSync(abs_plaintext_file_path_2));
    fs.rmSync(abs_plaintext_user_file_path_2);
    //wait
    await delay(12000);
    // check if also the admin has such file removed
    assert.ok(!fs.existsSync(abs_plaintext_file_path_2));
  }).timeout(20000);*/
});
