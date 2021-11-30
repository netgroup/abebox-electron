const fs = require("fs");
const core = require("./core");

const attributes_file = "attributes_list.json";
let attributes_file_path;

const _get_attr_id = function(attr) {
  return `${attr.univ}:${attr.attr}:v${attr.vers}`;
};

const _save = function(attrs_list) {
  const attrs_obj = {
    attributes: attrs_list,
  };
  const attrs_jwt = core.generate_jwt(attrs_obj);
  fs.writeFileSync(attributes_file_path, attrs_jwt);
};

const init = function(attribute_file_path) {
  attributes_file_path = attribute_file_path + "/" + attributes_file;
};

const get_all = function() {
  if (!fs.existsSync(attributes_file_path)) {
    return [];
  } else {
    const attr_obj = core.verify_jwt(
      fs.readFileSync(attributes_file_path, "utf-8").toString()
    );
    return attr_obj.attributes;
  }
};

const add = function(new_attr) {
  const attrs_list = get_all();
  // Check if already exists
  const index = attrs_list.findIndex(
    (item) => _get_attr_id(item) == _get_attr_id(new_attr)
  );
  if (index >= 0) {
    throw Error("Attribute already exists");
  } else {
    // Add new
    attrs_list.push(new_attr);
    _save(attrs_list);
  }
  return attrs_list;
};

const set = function(old_attr, new_attr) {
  // Check if already exists
  const attrs_list = get_all();
  const index = attrs_list.findIndex(
    (item) => _get_attr_id(item) == _get_attr_id(old_attr)
  );
  if (index < 0) {
    throw Error("Attribute not present");
  } else {
    // Replace
    attrs_list[index] = new_attr;
    _save(attrs_list);
  }
  return attrs_list;
};

const del = function(attr) {
  // Check if already exists
  const attrs_list = get_all();
  const index = attrs_list.findIndex(
    (item) => _get_attr_id(item) == _get_attr_id(attr)
  );
  if (index < 0) {
    throw Error("Attribute not present");
  } else {
    // Remove
    const rem = attrs_list.splice(index, 1);
    _save(attrs_list);
  }
  return attrs_list;
};

const compress_list = function(attrs_list) {
  return attrs_list.map((el) => _get_attr_id(el));
};
const get_attr_id = function(attr) {
  return _get_attr_id(attr);
};

const policy_as_string = function(policy_array) {
  let policy_string = "";
  policy_array.forEach(function(outer_el, outer_el_index, outer_array) {
    if (outer_el.length === 1) {
      policy_string = policy_string + '"' + outer_el[0] + '"';
    } else {
      policy_string = policy_string + "(";
      outer_el.forEach(function(inner_el, inner_el_index, inner_array) {
        policy_string = policy_string + '"' + inner_el + '"';
        if (inner_el_index != inner_array.length - 1) {
          policy_string = policy_string + " OR ";
        }
      });
      policy_string = policy_string + ")";
    }
    if (outer_el_index != outer_array.length - 1) {
      policy_string = policy_string + " AND ";
    }
  });
  console.log("POLICY AS STRING = ", policy_string);
  return policy_string;
};

module.exports = {
  init,
  get_all,
  add,
  set,
  del,
  compress_list,
  get_attr_id,
};
