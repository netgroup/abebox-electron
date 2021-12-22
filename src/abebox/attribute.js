"use strict";

const { assert } = require("console");
const fs = require("fs");

const attributes_file = "attributes_list.json";

const AttributeManager = (core) => {
  let attributes_file_path;

  /**
   * Convert the given attribute into an ID
   * @param {*} attr attribute object
   * @returns the related ID
   */
  const _get_attr_id = function(attr) {
    return `${attr.univ}:${attr.attr}:${attr.vers}`;
  };

  /**
   * Convert the ID back to the attribute
   * @param {*} attr_id attribute ID
   * @returns the related attribute object
   */
  const _get_attr_values = function(attr_id) {
    const [univ, attr, vers] = attr_id.split(":");
    return {
      univ: univ,
      attr: attr,
      vers: vers,
    };
  };

  /**
   * Save the attribute list on the file
   * @param {*} attrs_list attribute list
   */
  const _save = function(attrs_list) {
    const attrs_obj = {
      attributes: attrs_list,
    };
    const attrs_jwt = core.generate_jwt(attrs_obj);
    fs.writeFileSync(attributes_file_path, attrs_jwt);
  };

  /**
   * Initialise the attribute object
   * @param {*} attribute_file_path path where the attribute file is located
   */
  const init = function(attribute_file_path) {
    attributes_file_path = attribute_file_path + "/" + attributes_file;
  };

  /**
   * Load the attribute list from the file
   * @returns the attribute list if the file exists; an empty list otherwise
   */
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

  /**
   * Add the new attribute to the list
   * @param {*} new_attr new attribute
   * @returns the attribute list
   */
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

  /**
   * Replace the old attribute with the new one
   * @param {*} old_attr old attribute
   * @param {*} new_attr new attribute
   * @returns the attribute list
   */
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

  /**
   * Delete the given attribute from the list
   * @param {*} attr attribute to delete
   * @returns the attribute list
   */
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

  /**
   * Compress the attribute list from objects to IDs
   * @param {*} attrs_list attribute list
   * @returns the compressed list
   */
  const compress_list = function(attrs_list) {
    return attrs_list.map((el) => _get_attr_id(el));
  };

  /**
   * Wrapper to convert the attribute object to the ID
   * @param {*} attr attribute to convert
   * @returns attribute as an ID
   */
  const get_attr_id = function(attr) {
    return _get_attr_id(attr);
  };

  /**
   * Serialise the given policy (array of array of attribute objects) transforming it into a string
   * @param {*} policy_array array of array of attribute objects
   * @returns the policy string
   */
  const policy_as_string = function(policy_array) {
    if (!Array.isArray(policy_array))
      throw Error("Policy must be an array of array of error");
    policy_array.forEach((el) => {
      if (!Array.isArray(el))
        throw Error("Policy must be an array of array of error");
    });
    const attribute_map = function(attrs_list) {
      return attrs_list.map((el) => `"${_get_attr_id(el)}"`);
    };
    return policy_array
      .map((subarray) => {
        return "(" + attribute_map(subarray).join(" OR ") + ")";
      })
      .join(" AND ");
  };

  /**
   * Deserialise the given policy string transforming it into an array of array of attribute objects
   * @param {*} policy_string the policy string
   * @returns the array of array of attribute objects
   */
  const policy_from_string = function(policy_string) {
    const attribute_unmap = function(attrs_strings) {
      return attrs_strings.map((el) => {
        return _get_attr_values(el.substr(1, el.length - 2));
      });
    };
    return policy_string.split(" AND ").map((substring) => {
      return attribute_unmap(
        substring.substr(1, substring.length - 2).split(" OR ")
      );
    });
  };

  return {
    init,
    get_all,
    add,
    set,
    del,
    compress_list,
    get_attr_id,
    policy_as_string,
    policy_from_string,
  };
};

module.exports = AttributeManager;
