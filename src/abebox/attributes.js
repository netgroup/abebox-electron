const fs = require("fs");

//const attrs_file_rel_path = "attributes/attributes_list.json";

const _attributes_conf = {};

const init = function(attribute_file) {
  attributes_conf.file = attribute_file;
};

const get_attrs = function() {
  const attr_list_file = _conf.remote + attrs_file_rel_path;
  if (!fs.existsSync(attr_list_file)) {
    return [];
  } else {
    const attrs_obj = core.verify_jwt(
      fs.readFileSync(attr_list_file).toString()
    );
    return attrs_obj.attributes;
  }
};

const _compress_list = function(attr_list) {
  return attr_list.map((el) => el.id.toString());
};

const new_attr = function(new_obj) {
  if (!_conf.configured) throw Error("ABEBox not configured");
  if (!_conf.isAdmin) throw Error("To Add an Attribute need to be admin");

  const attrs = get_attrs();

  // Check if already exists
  const index = attrs.findIndex((item) => item.id == new_obj.id);
  if (index >= 0) {
    throw Error("ID is already present");
  } else {
    // Add new
    new_obj.id = attrs.length + 1;
    attrs.push(new_obj);
    const attrs_obj = {
      attributes: attrs,
    };
    const attrs_jwt = core.generate_jwt(attrs_obj);
    fs.writeFileSync(_conf.remote + "/" + attrs_file_rel_path, attrs_jwt);
    const attrs_comp = _compress_list(attrs);
    _conf.keys.abe.sk == core.create_abe_sk(attrs_comp);
  }
  return attrs;
};

const set_attr = async function(new_obj) {
  if (!_conf.configured) throw Error("ABEBox not configured");
  if (!_conf.isAdmin) throw Error("To Modify an Attribute need to be admin");

  console.log(`SET_ATTR ${new_obj.toString()}`);

  const attrs = await get_attrs();
  // Check if already exists
  const index = attrs.findIndex((item) => item.id == new_obj.id);
  if (index < 0) {
    throw Error("ID not present");
  } else {
    // Replace
    const rem = attrs.splice(index, 1);
    console.log("Removing:", rem, attrs);
    attrs.push(new_obj);
    const attrs_obj = {
      attributes: attrs,
    };
    const attrs_jwt = core.generate_jwt(attrs_obj);
    fs.writeFileSync(
      _conf.remote + "/" + attrs_file_rel_path,
      attrs_jwt //JSON.stringify(attrs)
    );
    console.log("Adding:", new_obj, attrs);
  }
  return attrs;
};

const del_attr = async function(id) {
  console.log(`DEL_ATTR ${id.toString()}`);

  const attrs = await get_attrs();
  // Check if already exists
  const index = attrs.findIndex((item) => item.id == id);
  if (index < 0) {
    throw Error("ID not present");
  } else {
    // Remove
    const rem = attrs.splice(index, 1);
    const attrs_obj = {
      attributes: attrs,
    };
    const attrs_jwt = core.generate_jwt(attrs_obj);
    fs.writeFileSync(
      _conf.remote + "/" + attrs_file_rel_path,
      attrs_jwt //JSON.stringify(attrs)
    );
    console.log("Removing:", rem, attrs);
    _conf.keys.abe.sk == core.create_abe_sk(attrs);
  }
  return attrs;
};
