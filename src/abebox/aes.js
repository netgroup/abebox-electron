"use strict";

const crypto = require("crypto");

const _default_algorithm = "aes-256-gcm";
const _default_key_bytes_size = 32;
const _default_iv_bytes_size = 16;

const gen_key = function(bytes_size = _default_key_bytes_size) {
  return crypto.randomBytes(bytes_size);
};

const gen_iv = function(bytes_size = _default_iv_bytes_size) {
  return crypto.randomBytes(bytes_size);
};

const init_cipher = function(key, iv, algo = _default_algorithm) {
  if (!key) throw Error("AES Cipher: invalid key!");
  if (!iv) throw Error("AES Cipher: invalid IV!");
  return crypto.createCipheriv(algo, key, iv);
};

const init_decipher = function(key, iv, algo = _default_algorithm) {
  if (!key) throw Error("AES Decipher: invalid key!");
  if (!iv) throw Error("AES Decipher: invalid IV!");
  return crypto.createDecipheriv(algo, key, iv);
};

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

const decrypt = function(decipher, ciphertext, tag) {
  if (!decipher) throw Error("AES Decrypt: invalid decipher!");
  if (!ciphertext) throw Error("AES Decrypt: invalid ciphertext!");
  if (!tag) throw Error("AES Decrypt: invalid tag!");
  decipher.setAuthTag(Buffer.from(tag, "hex"));
  try {
    let dec_data = decipher.update(ciphertext, "hex", "utf8");
    dec_data += decipher.final("utf8");
    return dec_data;
  } catch (err) {
    throw Error(`AES Decrypt - ${err}`);
  }
};

const get_tag = function(cipher) {
  if (!cipher) throw Error("AES Tag: invalid cipher!");
  return cipher.getAuthTag().toString("hex");
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
