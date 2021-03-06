"use strict";

const fs = require("fs");
const crypto = require("crypto");

/**
 * Generate a new RSA key pair
 * @returns the key pair
 */
const create_keys = function() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
      /*
      cipher: "aes-256-cbc",
      //passphrase: "top secret",
      */
    },
  });
  return {
    publicKey,
    privateKey,
  };
};

/**
 * Get the RSA public key; if it does not exist, a new key pair is generated
 * @returns the public key
 */
const getPubKey = function() {
  return fs.existsSync(rsa_pub_key_path)
    ? fs.readFileSync(rsa_pub_key_path)
    : exports.createAndSaveKeys().publicKey;
};

/**
 * Create RSA public/private key pair and return the private key.
 * @returns private key
 */
/*const getPrivKey = function() {
  return fs.existsSync(rsa_priv_key_path)
    ? fs.readFileSync(rsa_priv_key_path)
    : exports.createAndSaveKeys().privateKey;
};*/

/**
 * Encrypt the given data with RSA using the given public key
 * @param {Buffer} data_buffer data to encrypt
 * @param {} publicKey RSA public key
 * @returns encrypted data
 */
const encrypt = function(data_buffer, publicKey) {
  // Perform encryption
  // 1. Initialise the cipher
  const sym_key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const algorithm = "aes-256-cbc";
  const cipher = crypto.createCipheriv(algorithm, sym_key, iv);
  // 2. Encrypt the data
  const enc_sym_key = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    sym_key
  );
  // 3. Create the ciphertext
  const enc_payload = Buffer.concat([
    cipher.update(data_buffer),
    cipher.final(),
  ]);
  // 4. Return the ciphertext and the cryptographic parameters
  return JSON.stringify({
    enc_sym_key,
    iv,
    enc_payload,
  });
};

/**
 * Decrypt the given encrypted data with RSA using the given private key
 * @param {Buffer} enc_data_buffer encrypted data to decrypt
 * @param {} privateKey RSA private key
 * @returns decrypted data
 */
const decrypt = function(enc_data_buffer, privateKey) {
  // Perform encryption
  // 1. Extract the ciphertext and the cryptographic parameters
  const { enc_sym_key, iv, enc_payload } = JSON.parse(enc_data_buffer);
  //2. Initialise the decipher
  const sym_key = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    Buffer.from(enc_sym_key)
  );
  // 3. decrypt the content
  const algorithm = "aes-256-cbc";
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(sym_key, "hex"),
    Buffer.from(iv, "hex")
  );

  const payload = Buffer.concat([
    decipher.update(Buffer.from(enc_payload, "hex")),
    decipher.final(),
  ]);

  return payload;
};

/*const sign = function(data, privateKey) {
  return crypto.sign("sha256", Buffer.from(data), {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
  });
};

const verify = function(data, signature, publicKey) {
  return crypto.verify(
    "sha256",
    Buffer.from(data),
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    },
    signature
  );
};*/

module.exports = {
  create_keys,
  encrypt,
  decrypt,
  //sign,
  //verify,
};
