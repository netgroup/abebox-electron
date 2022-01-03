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

const cfg_filename_admin = "admin_config.json";
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

//console.log(path.join(paths.config, cfg_filename_admin));

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
  delete require.cache[require.resolve("../src/abebox/store")];
  delete require.cache[require.resolve("chokidar")];
});

let abe;
let user_sk;

let admin_abebox;
let user_abebox;

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
  name: user_conf.name,
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
  it("admin abebox init create config", async () => {
    admin_abebox = Abebox(cfg_filename_admin.split(".")[0], "ADMIN");
    // loading new configuration
    admin_abebox.set_config(conf);
    const retrieved_conf = admin_abebox.get_config();
    assert.deepEqual(conf, retrieved_conf);
  }).timeout(15000);

  it("set new attribute", () => {
    const attr_list = admin_abebox.new_attr(attr_data_1);

    assert.equal(attr_list.length, 1);
    assert.equal(attr_list[0], attr_data_1);
  });

  it("get attribute list", () => {
    const attr_list_get = admin_abebox.get_attrs();
    assert.equal(attr_list_get.length, 1);
  });

  it("add a second attribute", () => {
    const attr_list = admin_abebox.new_attr(attr_data_2);
    assert.equal(attr_list.length, 2);
    assert.equal(attr_list[1], attr_data_2);
  });

  it("modify an attribute", () => {
    let attr_list_get = admin_abebox.get_attrs();
    let old_obj = attr_list_get[0];
    let new_obj = { univ: "UN", attr: "A", vers: "2" };
    let attr_list = admin_abebox.set_attr(old_obj, new_obj);
    let modified_attr = admin_abebox
      .get_attrs()
      .find(
        (el) =>
          el.univ == new_obj.univ &&
          el.attr == new_obj.attr &&
          el.vers == new_obj.vers
      );

    assert.ok(modified_attr);
    assert.equal(modified_attr.vers, "2");

    assert.ok(old_obj);
    const restored_obj = { univ: "UN", attr: "A", vers: "1" };
    attr_list = admin_abebox.set_attr(modified_attr, restored_obj);
    modified_attr = admin_abebox
      .get_attrs()
      .find(
        (el) =>
          el.univ == restored_obj.univ &&
          el.attr == restored_obj.attr &&
          el.vers == restored_obj.vers
      );
    assert.equal(modified_attr.vers, "1");
  }).timeout(10000);
  it("delete an attribute", () => {
    const attr_list_get_initial = admin_abebox.get_attrs();
    const attr_list_get_final = admin_abebox.del_attr(attr_list_get_initial[1]);
    assert.equal(attr_list_get_initial.length, attr_list_get_final.length + 1);
  });

  it("get, create, set and del new user", () => {
    // get users list
    const user_list = admin_abebox.get_users();

    const new_user = {
      name: "pippo@uniroma2.it",
      attrs: [],
      token: "",
      rsa_pub_key: "",
    };

    //add new user
    const after_add_user_list = admin_abebox.new_user(new_user);
    assert.equal(user_list.length, after_add_user_list.length - 1);

    // change the attribute set of the user
    const new_attributes = ["A", "B", "C"];
    new_user.attrs = new_attributes;
    admin_abebox.set_user(new_user);
    const after_set_user_list = admin_abebox.get_users();

    const index = after_set_user_list.findIndex(
      (item) => item.name == new_user.name
    );
    assert.deepEqual(after_set_user_list[index].attrs, new_attributes);

    // delete the user

    admin_abebox.del_user(new_user.name);
    const after_del_user_list = admin_abebox.get_users();
    assert.equal(after_del_user_list.length + 1, after_add_user_list.length);
  });

  it("attribute set/del, user attributes cascade", () => {
    // get users list
    const pre_add_user_list = admin_abebox.get_users();
    const pre_add_attr_list = admin_abebox.get_attrs();

    // add the attribute
    admin_abebox.new_attr(attr_data_4);
    const post_add_attr_list = admin_abebox.get_attrs();
    assert.equal(pre_add_attr_list.length, post_add_attr_list.length - 1);
    assert.deepEqual(
      post_add_attr_list[post_add_attr_list.length - 1],
      attr_data_4
    );

    // add new user
    const new_user = {
      name: "pippo@uniroma2.it",
      attrs: [attr_data_4],
      token: "",
      rsa_pub_key: "",
    };
    const post_add_user_list = admin_abebox.new_user(new_user);
    assert.equal(pre_add_user_list.length, post_add_user_list.length - 1);
    assert.deepEqual(
      post_add_user_list[post_add_user_list.length - 1],
      new_user
    );

    // change the attribute
    const post_set_attr_list = admin_abebox.set_attr(attr_data_4, attr_data_5);
    assert.equal(post_add_attr_list.length, post_set_attr_list.length);
    assert.deepEqual(
      post_set_attr_list[post_set_attr_list.length - 1],
      attr_data_5
    );
    const post_set_user_list = admin_abebox.get_users();

    const index = post_set_user_list.findIndex(
      (item) => item.name == new_user.name
    );
    assert.deepEqual(post_set_user_list[index].attrs[0], attr_data_5);

    // delete the attribute
    const post_del_attr_list = admin_abebox.del_attr(attr_data_5);
    assert.equal(post_set_attr_list.length, post_del_attr_list.length + 1);

    // delete the user
    const post_del_user_list = admin_abebox.del_user(new_user.name);
    assert.equal(post_del_user_list.length + 1, post_add_user_list.length);
  });

  it("add a file in the local repo", async () => {
    fs.writeFileSync(
      abs_plaintext_file_path,
      "Test file created on " + new Date()
    );

    await delay(4000); // wait 4s for watcher file detection
    const file_list = admin_abebox.get_files_list();
    assert.equal(file_list.length, 1);
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
    admin_abebox.share_file(my_file.file_id);

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
    const file_list3 = admin_abebox.get_files_list();
    assert.equal(file_list3.length, 1);
  }).timeout(15000);
  it("invite user", () => {
    //add the new user to the list
    const user_list = admin_abebox.new_user(new_user_info);
    const user = user_list[0];
    assert.ok(admin_abebox.get_users().length > 0);
    invited_user_token = admin_abebox.invite_user(user);
    //invited_user_token = invited_user.token;
    //assert.equal(invited_user.name, new_user_info.name);
    assert.ok(invited_user_token);

    delay(5000);

    const user_sk_filepath = `${path.join(
      admin_abebox.debug_get_conf().remote,
      "keys",
      file_utils.get_hash(invited_user_token).toString("hex")
    )}.sk`;

    assert.ok(fs.existsSync(user_sk_filepath));
  }).timeout(15000);
  /*
  it("stop abebox", () => {
    admin_abebox.stop();
    admin_abebox.reset_config();
  });
  */
  it("setup abebox user with token", async () => {
    // init the abebox index for the user
    user_abebox = Abebox(cfg_filename_user.split(".")[0], "USER");
    user_conf.token = invited_user_token;
    // loading new configuration
    user_abebox.set_config(user_conf);

    // try to decode the user SK (and the other data) written by the admin on the remote repo
    // wait for watchers
    await delay(15000);

    const user_index_conf = user_abebox.debug_get_conf();

    assert.equal(user_index_conf.token, invited_user_token);

    // read manually the file with all the user information
    const token_hash = file_utils.get_hash(user_conf.token);

    assert.equal(
      token_hash.toString("hex"),
      file_utils.get_hash(invited_user_token).toString("hex")
    );

    // check user secret key file (we check here only the format)
    const user_sk_filepath = `${path.join(
      user_index_conf.remote,
      "keys",
      token_hash.toString("hex")
    )}.sk`;

    assert.ok(fs.existsSync(user_sk_filepath));

    const user_sk_file_content = fs.readFileSync(user_sk_filepath, "utf-8");
    const user_sk_file_obj = JSON.parse(user_sk_file_content);

    assert.ok(user_sk_file_obj.hasOwnProperty("data"));
    assert.ok(user_sk_file_obj.hasOwnProperty("iv"));
    assert.ok(user_sk_file_obj.hasOwnProperty("tag"));

    // check on the user RSA PK: admin should take it from the repo
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

    // file are now ok
    // let's see the content!

    const user = admin_abebox
      .get_users()
      .find((el) => el.name == user_index_conf.name);

    assert.ok(user); // should find the user

    // does the user get the admin rsa/abe pk and abe sk?
    assert.equal(
      user_index_conf.keys.rsa_admin_pk,
      admin_abebox.debug_get_conf().keys.rsa.pk
    );

    assert.equal(
      user_index_conf.keys.abe.pk,
      admin_abebox.debug_get_conf().keys.abe.pk
    );
    assert.ok(user_index_conf.keys.abe.sk);

    // admin acquired the user rsa PK?

    assert.equal(user_index_conf.keys.rsa.pk, user.rsa_pub_key);
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
    const file_list = user_abebox.get_files_list();
    const initial_file_list_length = file_list.length;
    let el_find = file_list.find((el) => el.file_name == plaintext_filename);
    const initial_digest = el_find.digest;

    const user_test_file_content = fs.readFileSync(
      abs_plaintext_user_file_path,
      "utf-8"
    );
    const new_content = "\nFile edited on " + new Date();
    const updated_content = user_test_file_content + new_content;
    fs.appendFileSync(abs_plaintext_user_file_path, new_content);

    //await delay(4000);
    //user_abebox.share_file();
    await delay(14000);
    const admin_test_file_content = fs.readFileSync(
      abs_plaintext_file_path,
      "utf-8"
    );

    assert.equal(admin_test_file_content, updated_content);
    const file_list2 = user_abebox.get_files_list();
    const final_file_list_length = file_list2.length;
    el_find = file_list2.find((el) => el.file_name == plaintext_filename);
    const final_digest = el_find.digest;
    assert.ok(el_find);
    assert.equal(el_find.status, 0); // file_status.sync
    assert.equal(final_file_list_length, initial_file_list_length);
    assert.notEqual(final_digest, initial_digest);
  }).timeout(25000);
  it("user creates and shares a test file", async () => {
    const file_list_len = user_abebox.get_files_list().length;
    // create a new file on user local
    const test_content = "Other test file created on " + new Date();
    fs.writeFileSync(abs_plaintext_user_file_path_2, test_content);

    await delay(4000); // wait 4s for watcher file detection

    const file_list2 = user_abebox.get_files_list();
    const file_list2_len = file_list2.length;

    //console.log(file_list2_len);

    const my_file = file_list2.find(
      (el) => el.file_name == plaintext_filename_2
    );
    assert.ok(my_file);
    assert.equal(file_list2_len, file_list_len + 1);

    // assign a policy and share with the admin
    const admin_attributes = admin_abebox.get_attrs();

    const my_policy = {
      file_id: my_file.file_id,
      policy: [[attr_data_3]],
    };
    user_abebox.set_policy(my_policy);

    user_abebox.share_file(my_file.file_id);

    await delay(8000); // wait 4s for watcher file detection

    const file_list3_len = user_abebox.get_files_list().length;
    assert.equal(file_list3_len, file_list2_len);

    // admin should be able to retrive the content
    const admin_test_file_content = fs.readFileSync(
      abs_plaintext_file_path_2,
      "utf-8"
    );

    assert.equal(admin_test_file_content, test_content);
  }).timeout(20000);
  it("user deletes a file", async () => {
    const file_list_len = user_abebox.get_files_list().length;
    // delete a file on user
    assert.ok(fs.existsSync(abs_plaintext_file_path_2));
    fs.rmSync(abs_plaintext_user_file_path_2);
    //wait
    await delay(12000);

    const file_list2_len = user_abebox.get_files_list().length;
    assert.equal(file_list2_len, file_list_len - 1);

    // check if also the admin has such file removed
    assert.ok(!fs.existsSync(abs_plaintext_file_path_2));
  }).timeout(20000);
});
