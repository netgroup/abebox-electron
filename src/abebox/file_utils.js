"use strict";

const crypto = require("crypto");

/**
 * Generate a unique random UUID to use as a file name.
 * @returns unique random file name
 */
const get_random_filename = function() {
  const { v4: uuidv4 } = require("uuid");
  return uuidv4(); // ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
};

/**
 * Generate a random string of "size" bytes.
 * @param {*} size string length in bytes
 * @returns the random string
 */
const get_random = function(size) {
  return crypto.randomBytes(size);
};

/**
 * Extract file name from an absolute / relative file path
 * @param {*} file_path absolute / relative file path
 * @returns file name
 */
const get_filename = function(file_path) {
  return file_path.replace(/^.*[\\\/]/, "");
};

/**
 * Split file path into file name, absolute and relative paths according to the given repository path
 * @param {*} file_path file path
 * @param {*} repo_path repository path
 * @returns file name, absolute and relative paths
 */
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

/**
 * Compute the hash of the given message
 * @param {*} message message to hash
 * @returns digest of the hash function in bytes
 */
const get_hash = function(message) {
  return crypto
    .createHash("sha256")
    .update(message)
    .digest();
};

/**
 * Compute the signature of the given message using HMAC with the given key
 * @param {*} key key to use for the HMAC
 * @param {*} message message to sign
 * @returns the computed signature
 */
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
