"use strict";

const crypto = require("crypto");

/**
 * Generate a unique random UUID to use as file name.
 * @returns unique random file name
 */
const get_random_filename = function() {
  const { v4: uuidv4 } = require("uuid");
  return uuidv4(); // ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
};

const get_random = function(size) {
  return crypto.randomBytes(size);
};

const get_filename = function(full_file_name) {
  return full_file_name.replace(/^.*[\\\/]/, "");
};

const split_file_path = function(file_path, repo_path) {
  const file_name = get_filename(file_path);
  const abs_path = file_path.replace(file_name, "");
  const rel_path = abs_path.replace(repo_path, "").substring(1);
  return {
    filename: file_name,
    abs_dir: abs_path,
    rel_dir: rel_path,
  };
};

const get_hash = function(message) {
  return crypto
    .createHash("sha256")
    .update(message)
    .digest();
};

const get_hmac = function(key, message) {
  return crypto
    .createHmac("sha256", key)
    .update(message)
    .digest();
};

module.exports = {
  get_random_filename,
  get_random,
  get_filename,
  split_file_path,
  get_hash,
  get_hmac,
};
