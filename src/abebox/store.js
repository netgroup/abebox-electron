"use strict";

const Store = require("electron-store");
const AbeboxCore = require("./core");

// Store schema
const schema = {
  configured: {
    type: "boolean",
    default: false,
  },
  conf: {
    type: "object",
    default: {},
  },
  keys: {
    type: "object",
    default: {},
  },
  users: {
    type: "array",
    default: [],
  },
  files: {
    type: "array",
    default: [],
  },
};

const AbeboxStore = (name = "config") => {
  const local_store = new Store({ schema: schema, name: name });

  /**
   * Check if the system is configured
   * @returns True if configured; false, otherwise
   */
  const is_configured = function() {
    return local_store.get("configured");
  };

  /**
   * Load the system configuration from the store
   * @returns the system configuration
   */
  const get_conf = function() {
    return local_store.get("conf", {});
  };

  /**
   * Save the system configuration on the store
   * @param {*} conf configuration to save
   */
  const set_conf = function(conf) {
    local_store.set("conf", conf);
    local_store.set("configured", true);
  };

  /**
   * Save the keys on the store
   * @param {*} keys keys to save
   */
  const set_keys = function(keys) {
    local_store.set("keys", keys);
  };

  /**
   * Load the keys from the store
   * @returns the keys
   */
  const get_keys = function() {
    return local_store.get("keys", {});
  };

  /**
   * Load the users from the store
   * @returns the users
   */
  const get_users = function() {
    return local_store.get("users");
  };

  /**
   * Save the users on the store
   * @param {*} users the users to save
   */
  const set_users = function(users) {
    local_store.set("users", users);
  };

  /**
   * Load the file list from the store
   * @returns the file list
   */
  const get_files = function() {
    return local_store.get("files");
  };

  /**
   * Save the file list on the store
   * @param {*} files the file list
   */
  const set_files = function(files) {
    local_store.set("files", files);
  };

  /**
   * Reset the store by clearing its content
   */
  const reset = function() {
    local_store.clear();
  };

  return {
    is_configured,
    get_conf,
    set_conf,
    set_keys,
    get_keys,
    get_users,
    set_users,
    get_files,
    set_files,
    reset,
  };
};
module.exports = AbeboxStore;
