const {
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
  del_user,
  invite_user,
} = require(".");

//======================================= BOOTSTRAP =======================================//

const test_admin_bootstrap = async function() {
  const conf = await get_config();
  console.log(conf);

  const config_data = {
    name: "er@it.it",
    remote: "/home/serse/Scaricati",
    local: "/home/serse/Pubblici",
    token: "",
    isAdmin: true,
    configured: true,
  };

  const new_conf = set_config(config_data);
  console.log(new_conf);

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

test_admin_bootstrap();
test_add_attr();