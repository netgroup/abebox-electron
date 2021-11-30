const fs = require("fs");
const core = require("./core");

const attributes_file = "attributes_list.json";

const _attributes = {};

const _get_attr_id = function(attr) {
  return `${attr.univ}:${attr.attr}:v${attr.vers}`;
};

const _save = function() {
  const attrs_obj = {
    attributes: _attributes.list,
  };
  const attrs_jwt = core.generate_jwt(attrs_obj);
  fs.writeFileSync(_attributes.file, attrs_jwt);
};

const init = function(attribute_file_path) {
  _attributes.file = attribute_file_path + "/" + attributes_file;
  _attributes.list = get_all();
};

const get_all = function() {
  if (!fs.existsSync(_attributes.file)) {
    return [];
  } else {
    const attrs_obj = core.verify_jwt(
      fs.readFileSync(_attributes.file, "utf-8").toString()
    );
    _attributes.list = attrs_obj.attributes;
    return _attributes.list;
  }
};

const add = function(new_attr) {
  // Check if already exists
  const index = _attributes.list.findIndex(
    (item) => _get_attr_id(item) == _get_attr_id(new_attr)
  );
  if (index >= 0) {
    throw Error("Attribute already exists");
  } else {
    // Add new
    _attributes.list.push(new_attr);
    _save();
  }
  return _attributes.list;
};

const set = function(old_attr, new_attr) {
  // Check if already exists
  const index = _attributes.list.findIndex(
    (item) => _get_attr_id(item) == _get_attr_id(old_attr)
  );
  if (index < 0) {
    throw Error("Attribute not present");
  } else {
    // Replace
    _attributes.list[index] = new_attr;
    _save();
  }
  return _attributes.list;
};

const del = function(attr) {
  // Check if already exists
  const index = _attributes.list.findIndex(
    (item) => _get_attr_id(item) == _get_attr_id(attr)
  );
  if (index < 0) {
    throw Error("Attribute not present");
  } else {
    // Remove
    const rem = _attributes.list.splice(index, 1);
    _save();
  }
  return _attributes.list;
};

const compress_list = function() {
  return _attributes.list.map((el) => _get_attr_id(el));
};

module.exports = {
  init,
  get_all,
  add,
  set,
  del,
  compress_list,
};