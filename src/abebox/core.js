const crypto = require("crypto");
const fs = require("fs");
const { pipeline } = require("stream/promises");
const jwt = require("jsonwebtoken");

const fu = require("./file_utils");
const path = require("path");
const rabe = require("./rabejs/rabejs.node");
const rsa = require("./rsa");

const AbeboxCore = () => {
  const _conf = {
    rsa_init: false,
    abe_init: false,
    abe_admin: false,
    rsa_keys: {},
    abe_keys: {},
  };

  const init_rsa_keys = function() {
    if (_conf.rsa_init) throw Error("RSA Already initialized");

    const { publicKey: pk, privateKey: sk } = rsa.create_keys();
    _conf.rsa_keys = { pk, sk };
    _conf.rsa_init = true;
    return _conf.rsa_keys;
  };

  const set_rsa_keys = function(pk, sk) {
    if (_conf.rsa_init) throw Error("RSA Already initialized");
    _conf.rsa_keys = { pk, sk };
    _conf.rsa_init = true;
  };

  const get_rsa_keys = function() {
    if (!_conf.rsa_init) throw Error("RSA Not initialized");
    return _conf.rsa_keys;
  };

  const init_abe_keys = function() {
    if (_conf.abe_init) throw Error("ABE Already initialized");
    const [abe_pk, abe_msk] = rabe.setup();
    _conf.abe_keys = { pk: abe_pk, msk: abe_msk, sk: undefined };
    _conf.abe_init = true;
    _conf.abe_admin = true;
    return _conf.abe_keys;
  };

  const set_abe_keys = function(pk, sk) {
    if (_conf.abe_init) throw Error("ABE Already initialized");
    _conf.abe_keys = { pk: pk, sk: sk };
    _conf.abe_init = true;
  };

  const set_abe_sk = function(sk) {
    if (!_conf.abe_init) throw Error("ABE Not initialized");
    _conf.abe_keys.sk = sk;
    return _conf.abe_keys;
  };

  const create_abe_sk = function(attr_list, store_key = true) {
    if (!_conf.abe_init) throw Error("ABE Not initialized");
    if (!_conf.abe_admin) throw Error("ABE Not in admin mode");

    const sk = rabe.keygen(
      _conf.abe_keys.pk,
      _conf.abe_keys.msk,
      JSON.stringify(attr_list)
    );

    if (store_key) _conf.abe_keys.sk = sk;
    return sk;
  };

  const create_user_abe_sk = function(attr_list) {
    if (!_conf.abe_init) throw Error("ABE Not initialized");
    if (!_conf.abe_admin) throw Error("ABE Not in admin mode");

    const sk = rabe.keygen(
      _conf.abe_keys.pk,
      _conf.abe_keys.msk,
      JSON.stringify(attr_list)
    );
    return sk;
  };

  const get_abe_keys = function() {
    if (!_conf.abe_init) throw Error("ABE Not initialized");
    return _conf.abe_keys;
  };

  const create_metadata_file = function(
    input_file,
    output_file,
    sym_key,
    iv,
    policy
  ) {
    if (!_conf.abe_init) throw Error("ABE Not initialized");
    // Group parameters to encrypt
    const metadata_to_enc = {
      sym_key: sym_key,
      file_name: input_file, //input_file_name,
    };
    // Encrypt parameters using CP-ABE
    const enc_metadata = rabe.encrypt_str(
      _conf.abe_keys.pk,
      policy,
      JSON.stringify(metadata_to_enc)
    );
    // Add parameters in clear form to the encrypted ones and return the metadata
    const metadata = {
      enc_metadata: enc_metadata,
      iv: iv,
    };
    // Write metadata on file
    fs.writeFileSync(output_file, JSON.stringify(metadata));
  };

  const retrieve_metadata = function(input_metadata_file) {
    if (!_conf.abe_init) throw Error("ABE Not initialized");
    if (_conf.abe_keys.sk === undefined) throw Error("ABE SK not initialized");
    // Read raw metadata
    const raw_metadata = fs.readFileSync(input_metadata_file, "utf-8");
    // Read metadata
    const { enc_metadata, iv } = JSON.parse(raw_metadata);
    const policy = JSON.parse(enc_metadata)._policy[0];
    try {
      // Decrypt the encrypted ones
      const dec_metadata = rabe.decrypt_str(_conf.abe_keys.sk, enc_metadata);
      // Extract and return parameters
      const { sym_key, file_name } = JSON.parse(dec_metadata);
      return {
        file_name,
        sym_key,
        iv,
        policy,
      };
    } catch (error) {
      // TODO Gestire errori di rabe
      throw Error(`ABE Decryption failed - ${error}`);
    }
  };

  const create_encrypted_file = async function(input_file, output_file) {
    if (!fs.existsSync(input_file)) throw Error(`${input_file} does not exist`);
    const input_file_stream = fs.createReadStream(input_file);
    const output_file_stream = fs.createWriteStream(output_file);
    // Create symmetric key
    sym_key = crypto.randomBytes(32);
    // Create IV
    iv = crypto.randomBytes(16);
    // Create symmetric cipher
    const algorithm = "aes-256-cbc";
    const cipher = crypto.createCipheriv(algorithm, sym_key, iv);
    // Read data, encrypt it and write the resulting ciphertext
    await pipeline(input_file_stream, cipher, output_file_stream);
    return {
      sym_key: sym_key.toString("hex"),
      iv: iv.toString("hex"),
    };
  };

  const retrieve_decrypted_file = async function(
    input_file,
    output_file,
    sym_key,
    iv
  ) {
    if (!fs.existsSync(input_file)) throw Error(`${input_file} does not exist`);
    const input_file_stream = fs.createReadStream(input_file);
    const output_file_stream = fs.createWriteStream(output_file);
    // Create symmetric decipher
    const algorithm = "aes-256-cbc";
    const decipher = crypto.createDecipheriv(
      algorithm,
      Buffer.from(sym_key, "hex"),
      Buffer.from(iv, "hex")
    );
    // Read data, decrypt it and write the resulting plaintext
    return await pipeline(input_file_stream, decipher, output_file_stream);
  };

  const generate_jwt = function(data) {
    if (!_conf.rsa_init) throw Error("RSA Not initialized");
    return jwt.sign(data, _conf.rsa_keys.sk, { algorithm: "RS256" });
  };

  const verify_jwt = function(token, pk = _conf.rsa_keys.pk) {
    if (!_conf.rsa_init) throw Error("RSA Not initialized");
    return jwt.verify(token, pk);
  };

  const _get_metadata_file_name = function(file) {
    const last_dot_position = file.lastIndexOf(".");
    if (last_dot_position >= file.length) return `${file}.abebox"`;
    return `${file.substring(0, last_dot_position)}.abebox`;
  };

  const get_encrypted_content_file_name = function(file) {
    const last_dot_position = file.lastIndexOf(".");
    if (last_dot_position >= file.length) return `${file}.0`;
    return `${file.substring(0, last_dot_position)}.0`;
  };

  const file_encrypt = async function(
    rel_plaintext_file,
    abs_plaintext_file,
    abs_remote_repo_path,
    ciphertext_file,
    policy
  ) {
    if (!fs.existsSync(abs_plaintext_file))
      throw Error(`${abs_plaintext_file} does not exist`);
    try {
      const metadata_file = `${path.join(
        abs_remote_repo_path,
        ciphertext_file
      )}.abebox`;
      const encrypted_content_file = `${path.join(
        abs_remote_repo_path,
        ciphertext_file
      )}.0`;
      // File content symmetric encryption
      const { sym_key, iv } = await create_encrypted_file(
        abs_plaintext_file,
        encrypted_content_file
      );
      // Metadata file creation
      create_metadata_file(
        rel_plaintext_file,
        metadata_file,
        sym_key,
        iv,
        policy
      );
      return metadata_file;
    } catch (error) {
      throw Error(
        `Encryption of ${abs_plaintext_file} with policy ${policy} failed with error ${error}`
      );
    }
  };

  const file_decrypt = async function(
    abs_ciphertext_file,
    abs_local_repo_path
  ) {
    if (!fs.existsSync(abs_ciphertext_file))
      throw Error(`${abs_ciphertext_file} does not exist`);
    try {
      // Metadata retrieving
      const metadata_file = _get_metadata_file_name(abs_ciphertext_file);
      const { sym_key, iv, file_name } = retrieve_metadata(metadata_file);
      if (file_name === null) {
        throw Error(`File name not defined`);
      }
      // File content symmetric decryption
      const encrypted_content_file = get_encrypted_content_file_name(
        abs_ciphertext_file
      );
      await retrieve_decrypted_file(
        encrypted_content_file,
        path.join(abs_local_repo_path, file_name),
        sym_key,
        iv
      );
    } catch (error) {
      throw Error(
        `Decryption of ${abs_ciphertext_file} failed with error ${error}`
      );
    }
  };

  const file_reencrypt = async function(encrypted_filename, policy) {
    // re-encrypt the file according to the new policy
    console.log("Re-encrypt function");
  };

  const is_abe_configured = function() {
    return _conf.abe_init;
  };
  return {
    is_abe_configured,
    init_rsa_keys,
    set_rsa_keys,
    get_rsa_keys,
    init_abe_keys, // used by abe admin
    create_abe_sk, //used in abe admin mode
    create_user_abe_sk,
    set_abe_keys, // used by normal users
    set_abe_sk,
    get_abe_keys,
    create_metadata_file,
    create_encrypted_file,
    retrieve_metadata,
    retrieve_decrypted_file,
    generate_jwt,
    verify_jwt,
    file_encrypt,
    file_decrypt,
    file_reencrypt,
    get_encrypted_content_file_name,
  };
};

module.exports = AbeboxCore;
