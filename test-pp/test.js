const Store = require("electron-store");
const local_store = new Store();
local_store.clear();

const local_repo_path = __dirname + "/repo-local";
const shared_repo_path = __dirname + "/repo-shared";

const fs = require("fs");
fs.rmSync(local_repo_path, { recursive: true, force: true });
fs.rmSync(shared_repo_path, { recursive: true, force: true });
fs.mkdirSync(local_repo_path);
fs.mkdirSync(shared_repo_path);

const abebox = require("../src/abebox/index");

//const abebox_core = require("../src/abebox/core");
//const fu = require("../src/abebox/file_utils");
//const rabe = require("../src/abebox/rabejs/rabejs.node");

//======================================= BOOTSTRAP =======================================//

const test_admin_bootstrap = async function() {
  const conf = await get_config();
  //console.log(conf);

  const config_data = {
    name: "er@it.it",
    remote: "/home/serse/Scaricati",
    local: "/home/serse/Pubblici",
    token: "",
    isAdmin: true,
    configured: true,
  };

  const new_conf = set_config(config_data);
  //console.log(new_conf);

  const attrs = await get_attrs();
  console.log(attrs);

  const files_list = get_files_list();
  console.log(files_list);
};

//========================================= USER ==========================================//

const test_add_user = async function() {
  const users = await get_users();
  console.log(users);

  const attrs = await get_attrs();
  console.log(attrs);

  const user_data = { mail: "pp@it.it", attrs: [] };
  const new_users = await new_user(user_data);
  console.log(new_users);
};

const test_set_user = async function() {
  const user_data = { mail: "pp@it.it", attrs: [] };
  const users = await set_user(user_data);
  console.log(users);
};

const test_del_user = async function() {
  const mail = "pp@it.it";
  const users = await del_user(mail);
  console.log(users);
};

const test_invite_user = async function() {
  const invite_data = { mail: "pp@it.it" };
  const user = await invite_user(invite_data);
  console.log(user);
};

//======================================= ATTRIBUTES ======================================//

const test_add_attr = async function() {
  const attrs = await get_attrs();
  console.log(attrs);

  const attr_data = { univ: "a", attr: "b", vers: "1" };
  const new_attrs = await new_attr(attr_data);
  console.log(new_attrs);
};

//test_admin_bootstrap();
//test_add_attr();

const conf = {
  configured: true,
  isAdmin: true,
  local: local_repo_path,
  name: "pp@pp.it",
  remote: shared_repo_path,
  token: "",
};
const attr_data = { univ: "a", attr: "b", vers: "1" };
async function test1() {
  await abebox.set_config(conf);
  fs.writeFileSync(local_repo_path + "/test.txt", "ciao a tutti");
  await abebox.new_attr(attr_data);
}

async function test2() {
  let file_list = abebox.get_files_list();
  console.log("FILE LIST:", file_list);
  await abebox.set_policy({ file_id: file_list[0].file_id, policy: [[1]] });
  file_list = abebox.get_files_list();
  console.log("FILE LIST:", JSON.stringify(file_list));
  await abebox.share_files();
  file_list = abebox.get_files_list();
  console.log("FILE LIST:", JSON.stringify(file_list));
}

test1();

setTimeout(test2, 1000);

/*let file_list;
;*/

/*
const [pk, msk] = rabe.setup();
const policy_array = [["1"]];
const po = policy_array[0];
console.log(po);
console.log("POLICY STRINGIFY =", typeof policy_array);
abebox_core.conf.local_repo_path = "./repo-local";
abebox_core.conf.remote_repo_path = "./repo-shared/";
abebox_core.conf.abe_secret_key = abebox_core.create_abe_secret_key(
  pk,
  msk,
  policy_array[0],
  "abe"
);
console.log(
  "ENC =",
  abebox_core.file_encrypt(
    "test.txt",
    fu.policy_as_string(policy_array),
    "enc_test"
  )
);

console.log("DEC =", abebox_core.file_decrypt("enc_test"));
*/
