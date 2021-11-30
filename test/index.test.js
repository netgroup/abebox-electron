const assert = require("assert");
const fs = require("fs");

const file_utils = require("../src/abebox/file_utils");

const envPaths = require("env-paths");
const paths = envPaths("electron-store");

// paths
const tmp_dir = `${__dirname}/tmp`;
const abs_local_repo_path = `${tmp_dir}/repo-local`;
const abs_remote_repo_path = `${tmp_dir}/repo-shared`;
const abs_remote_repo_repo_path = `${abs_remote_repo_path}/repo`;

const abs_user_local_repo_path = `${tmp_dir}/repo-user-local`;

const cfg_filename = "config.json";

// plaintext files
const local_dir = "mytestfolder";
const plaintext_filename = "hello_index.txt"; // we are creating /mytestfolder/hello.txt file in the local repo
const rel_plaintext_file_path = `${local_dir}/${plaintext_filename}`;
const abs_plaintext_file_path = `${abs_local_repo_path}/${rel_plaintext_file_path}`;
const abs_dec_plaintext_file_path = `${abs_plaintext_file_path}.decripted.txt`;

// remove and create test files
before(() => {
  // Rename cfg file
  if (fs.existsSync(paths.config + "/" + cfg_filename))
    fs.rmSync(paths.config + "/" + cfg_filename);

  // Removing all files in dirs
  if (fs.existsSync(tmp_dir))
    fs.rmSync(tmp_dir, {
      recursive: true,
      force: true,
    });

  fs.mkdirSync(`${abs_local_repo_path}/${local_dir}`, { recursive: true });
  fs.mkdirSync(`${abs_user_local_repo_path}`, { recursive: true });
  fs.mkdirSync(abs_remote_repo_repo_path, { recursive: true });
});

after(() => {
  // stop abebox!!
});

// to reload the module as a separate instance
beforeEach(() => {
  delete require.cache[require.resolve("../src/abebox/core")];
  delete require.cache[require.resolve("../src/abebox/index")];
});

let abe;
let user_sk;

let admin_abebox;
let user_abebox;

const sym_key = "sym_key";
const iv = "iv";
let invited_user_token = "";

const conf = {
  configured: true,
  isAdmin: true,
  local: abs_local_repo_path,
  name: "pp@pp.it",
  remote: abs_remote_repo_path,
  token: "",
};

const user_conf = {
  configured: true,
  isAdmin: false,
  local: abs_user_local_repo_path,
  name: "pp@pp.it",
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
  it("admin abebox init create config", async () => {
    // setup
    admin_abebox = require("../src/abebox/index");

    // loading new configuration
    admin_abebox.set_config(conf);
    const retrieved_conf = admin_abebox.get_config();
    assert.deepEqual(conf, retrieved_conf);
  }).timeout(10000);

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
    const attr_list_get = admin_abebox.get_attrs();
    const old_obj = attr_list_get[0];
    const new_obj = { univ: "UN", attr: "A", vers: "2" };
    const attr_list = admin_abebox.set_attr(old_obj, new_obj);
    assert.equal(attr_list[0].vers, "2");
  });
  it("delete an attribute", () => {
    const attr_list_get_initial = admin_abebox.get_attrs();
    const attr_list_get_final = admin_abebox.del_attr(attr_list_get_initial[1]);
    assert.equal(attr_list_get_initial.length, attr_list_get_final.length + 1);
  });

  it("get, create, set and del new user", () => {
    // get users list
    const user_list = admin_abebox.get_users();

    const new_user = {
      mail: "pippo@uniroma2.it",
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
      (item) => item.mail == new_user.mail
    );
    assert.deepEqual(after_set_user_list[index].attrs, new_attributes);

    // delete the user

    admin_abebox.del_user(new_user.mail);
    const after_del_user_list = admin_abebox.get_users();
    assert.equal(after_del_user_list.length + 1, after_add_user_list.length);
  });

  it("add a file in the local repo", async () => {
    fs.writeFileSync(abs_plaintext_file_path, "ciao");

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
      fs.existsSync(`${abs_remote_repo_repo_path}/${my_file.file_id}.0`)
    );
    assert.ok(
      fs.existsSync(`${abs_remote_repo_repo_path}/${my_file.file_id}.abebox`)
    );
  }).timeout(15000);
  it("invite user", () => {
    const new_user = {
      mail: "pippo2@uniroma2.it",
      attrs: [],
      token: "",
      rsa_pub_key: "",
    };
    //add the new user to the list
    const user_list = admin_abebox.new_user(new_user);
    const user = user_list[0];
    console.log("user: ", user);
    const invited_user = admin_abebox.invite_user(user);
    invited_user_token = invited_user.token;
    assert.equal(invited_user.mail, new_user.mail);
    assert.ok(invited_user_token);
  });
  it("stop abebox", () => {
    admin_abebox.stop();
    admin_abebox.reset_config();
  });
  it("setup abebox user with token", () => {
    user_abebox = require("../src/abebox/index");

    user_conf.token = invited_user_token;
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

    // admin deve chiamare retrieve_pub_key (tramite watcher)
    // che crea user sk

    // user imposta la sua chiave sk (tramite watcher e retrieve_abe_secret_key)
    // NOTA: controllare che il watcher forse ora ignora i path delle chiavi

    // non sono necessarie chiamate a funzioni (fa tutto il watcher)
  }).timeout(10000);
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
