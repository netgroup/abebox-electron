const Store = require("electron-store");
const { v4: uuidv4 } = require("uuid");

const schema = {
  configured: {
    type: "boolean",
    default: false,
  },
  data: {
    type: "object",
  },
};

const files = [];

files.push({
  file_path: "/",
  file_name: "prova.txt",
  fid: uuidv4(),
  policy: "",
  status: 0,
});

files.push({
  file_path: "/",
  file_name: "prova1.txt",
  fid: uuidv4(),
  policy: "",
  status: 0,
});

files.push({
  file_path: "/dir1",
  file_name: "prova2.txt",
  fid: uuidv4(),
  policy: "",
  status: 0,
});

files.push({
  file_path: "/dir1",
  file_name: "prova3.txt",
  fid: uuidv4(),
  policy: "",
  status: 0,
});

name = "dummy";
const local_store = new Store({ name });

const dev_init = function() {
  //local_store.set("name", "PPL");
};

//local_store.clear();
//dev_init();

const start_services = function() {};

const get_files = function() {
  return files;
};
const set_policy = function() {};

const share_files = function() {
  return files;
};

const set_config = function(conf) {
  console.log("Saving data", conf);
  local_store.set("data", conf);
  local_store.set("configured", true);
  return true;
};
const get_config = async function() {
  const conf = await local_store.get();
  console.log(conf);
  return conf;
};

/**************** TEST ATTRIBUTES *****************/
const attrs = [
  {
    id: "1",
    univ: "university",
    attr: "professore",
    vers: "1",
  },
  {
    id: "2",
    univ: "university",
    attr: "studente",
    vers: "1",
  },
  {
    id: "3",
    univ: "university",
    attr: "triennale",
    vers: "1",
  },
];

let next_id = 4;

const get_attrs = async function() {
  return attrs;
};

const new_attr = async function(new_obj) {
  // Check if exist
  const index = attrs.findIndex((item) => item.id == new_obj.id);
  if (index >= 0) {
    throw Error("ID is already present");
  } else {
    new_obj.id = next_id;
    next_id++;
    attrs.push(new_obj);
    console.log("adding:", new_obj, attrs);
    return attrs;
  }
};

const set_attr = async function(new_obj) {
  const index = attrs.findIndex((item) => item.id == new_obj.id);
  if (index < 0) {
    throw Error("ID not present");
  } else {
    const rem = attrs.splice(index, 1);
    console.log("Removing:", rem, attrs);
    attrs.push(new_obj);
    console.log("Adding:", new_obj, attrs);
    return attrs;
  }
};

const del_attr = async function(id) {
  const index = attrs.findIndex((item) => item.id == id);
  if (index < 0) {
    throw Error("ID not present");
  } else {
    const rem = attrs.splice(index, 1);
    console.log("Removing:", rem, attrs);
    return attrs;
  }
};

/**************** TEST USERS *****************/

const users = [
  { mail: "ppl@ppl.it", attrs: ["1", "2", "3"] },
  { mail: "ppl1@ppl.it", attrs: ["2", "3"] },
  { mail: "ppl2@ppl.it", attrs: ["1", "2"] },
  { mail: "ppl3@ppl.it", attrs: ["1"] },
  { mail: "ppl4@ppl.it", attrs: ["2"] },
];

const get_users = async function() {
  return users;
};

const new_user = async function(new_obj) {
  // Check if exist
  const index = users.findIndex((item) => item.mail == new_obj.mail);
  if (index >= 0) {
    throw Error("Mail is already present");
  } else {
    users.push(new_obj);
    console.log("adding:", new_obj, users);
    return users;
  }
};

const set_user = async function(new_obj) {
  const index = users.findIndex((item) => item.mail == new_obj.mail);
  if (index < 0) {
    throw Error("Mail not present");
  } else {
    const rem = users.splice(index, 1);
    console.log("Removing:", rem, users);
    users.push(new_obj);
    console.log("Adding:", new_obj, users);
    return users;
  }
};

const del_user = async function(mail) {
  const index = users.findIndex((item) => item.mail == mail);
  if (index < 0) {
    throw Error("Mail not present");
  } else {
    const rem = users.splice(index, 1);
    console.log("Removing:", rem, users);
    return users;
  }
};

module.exports = {
  start_services,
  get_files,
  set_policy,
  share_files,
  get_config,
  set_config,
  get_attrs,
  new_attr,
  set_attr,
  del_attr,
  get_users,
  set_user,
  new_user,
  del_user,
};
