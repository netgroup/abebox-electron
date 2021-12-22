"use strict";

const crypto = require("crypto");

// AES default values
const _default_algorithm = "aes-256-gcm";
const _default_key_bytes_size = 32;
const _default_iv_bytes_size = 16;

/**
 * Create a symmetric key of "bytes_size" bytes
 * @param {*} bytes_size length of the key in bytes
 * @returns the symmetric key
 */
const gen_key = function(bytes_size = _default_key_bytes_size) {
  return crypto.randomBytes(bytes_size);
};

/**
 * Create an initialisation vector of "bytes_size" bytes
 * @param {*} bytes_size length of the initialisation vector in bytes
 * @returns the initialisation vector 
 */
const gen_iv = function(bytes_size = _default_iv_bytes_size) {
  return crypto.randomBytes(bytes_size);
};

/**
 * Create and initialise the cipher
 * @param {*} key symmetric key
 * @param {*} iv initialisation vector
 * @param {*} algo symmetric scheme
 * @returns the initialised cipher
 */
const init_cipher = function(key, iv, algo = _default_algorithm) {
  if (!key) throw Error("AES Cipher: invalid key!");
  if (!iv) throw Error("AES Cipher: invalid IV!");
  return crypto.createCipheriv(algo, key, iv);
};

/**
 * Create and initialise the decipher
 * @param {*} key symmetric key
 * @param {*} iv initialisation vector
 * @param {*} tag authentication tag [For schemes as GCM]
 * @param {*} algo symmetric scheme
 * @returns the initialised decipher
 */
const init_decipher = function(key, iv, tag, algo = _default_algorithm) {
  if (!key) throw Error("AES Decipher: invalid key!");
  if (!iv) throw Error("AES Decipher: invalid IV!");
  if (!tag) throw Error("AES Decipher: invalid tag!");
  const decipher = crypto.createDecipheriv(algo, key, iv);
  decipher.setAuthTag(tag);
  return decipher;
};

/**
 * Encrypt the given plaintext using the given cipher
 * @param {*} cipher symmetric cipher
 * @param {*} plaintext message to encrypt
 * @returns the ciphertext
 */
const encrypt = function(cipher, plaintext) {
  if (!cipher) throw Error("AES Encrypt: invalid cipher!");
  if (!plaintext) throw Error("AES Encrypt: invalid plaintext!");
  try {
    let enc_data = cipher.update(plaintext, "utf8", "hex");
    enc_data += cipher.final("hex");
    return {
      ciphertext: enc_data,
      tag: cipher.getAuthTag().toString("hex"),
    };
  } catch (err) {
    throw Error(`AES Encrypt - ${err}`);
  }
};

/**
 * Decrypt the given ciphertext using the given decipher
 * @param {*} cipher symmetric decipher
 * @param {*} plaintext message to decrypt
 * @returns the decrypted plaintext
 */
const decrypt = function(decipher, ciphertext) {
  if (!decipher) throw Error("AES Decrypt: invalid decipher!");
  if (!ciphertext) throw Error("AES Decrypt: invalid ciphertext!");
  try {
    let dec_data = decipher.update(ciphertext, "hex", "utf8");
    dec_data += decipher.final("utf8");
    return dec_data;
  } catch (err) {
    throw Error(`AES Decrypt - ${err}`);
  }
};

/**
 * Get the authentication tag
 * @param {*} cipher symmetric cipher
 * @returns the tag
 */
const get_tag = function(cipher) {
  if (!cipher) throw Error("AES Tag: invalid cipher!");
  return cipher.getAuthTag();
};

module.exports = {
  gen_key,
  gen_iv,
  init_cipher,
  init_decipher,
  encrypt,
  decrypt,
  get_tag,
};
