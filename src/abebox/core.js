"use strict";

const fs = require("fs");
//const { pipeline } = require("stream/promises");
const jwt = require("jsonwebtoken");

const aes = require("./aes");
const fu = require("./file_utils");
const path = require("path");
const rabe = require("./rabejs/rabejs.node");
const rsa = require("./rsa");

function promisifiedPipe(input, output) {
  let ended = false;
  function end() {
    if (!ended) {
      ended = true;
      output.close && output.close();
      input.close && input.close();
      return true;
    }
  }

  return new Promise((resolve, reject) => {
    input.pipe(output);
    input.on("error", errorEnding);

    function niceEnding() {
      if (end()) resolve();
    }

    function errorEnding(error) {
      if (end()) reject(error);
    }

    output.on("finish", niceEnding);
    output.on("end", niceEnding);
    output.on("error", errorEnding);
  });
}

const AbeboxCore = (log) => {
  const _conf = {
    rsa_init: false,
    abe_init: false,
    abe_admin: false,
    rsa_keys: {},
    abe_keys: {},
    rsa_admin_pk: null,
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

  const set_admin_rsa_pk = function(pk) {
    _conf.rsa_admin_pk = pk;
  };

  const init_abe_keys = function() {
    if (_conf.abe_init) throw Error("ABE Already initialized");
    const [abe_pk, abe_msk] = rabe.setup();
    _conf.abe_keys = { pk: abe_pk, msk: abe_msk, sk: undefined };
    _conf.abe_init = true;
    _conf.abe_admin = true;
    return _conf.abe_keys;
  };

  const set_admin_abe_keys = function(pk, msk, sk) {
    if (_conf.abe_init) throw Error("ABE Already initialized");
    _conf.abe_keys = { pk: pk, msk: msk, sk: sk };
    _conf.abe_init = true;
    _conf.abe_admin = true;
  };

  const set_abe_keys = function(pk, sk) {
    if (_conf.abe_init) {
      if (pk === _conf.abe_keys.pk) {
        _conf.abe_keys.sk = sk;
      } else {
        throw Error("ABE Already initialized");
      }
    } else {
      _conf.abe_keys = { pk: pk, sk: sk };
      _conf.abe_init = true;
    }
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
    tag,
    policy
  ) {
    if (!_conf.abe_init) throw Error("ABE Not initialized");

    // convert input file 

    const input_file_converted = input_file.replace(path.sep,"/");

    // Group parameters to encrypt
    const metadata_to_enc = {
      sym_key: sym_key,
      file_name: input_file_converted, //input_file_name,
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
      tag: tag,
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
    const { enc_metadata, iv, tag } = JSON.parse(raw_metadata);
    const policy = JSON.parse(enc_metadata)._policy[0];
    // Decrypt the encrypted ones
    const dec_metadata = rabe.decrypt_str(_conf.abe_keys.sk, enc_metadata);
    // Extract and return parameters
    const { sym_key, file_name } = JSON.parse(dec_metadata);

    // convert file name
    const file_name_converted = file_name.replace("/",path.sep);

    return {
      file_name: file_name_converted,
      sym_key,
      iv,
      tag,
      policy,
    };
  };

  const create_encrypted_file = async function(input_file, output_file) {
    if (!fs.existsSync(input_file)) throw Error(`${input_file} does not exist`);
    const input_file_stream = fs.createReadStream(input_file);
    const output_file_stream = fs.createWriteStream(output_file);
    // Create symmetric key
    const sym_key = aes.gen_key();
    // Create IV
    const iv = aes.gen_iv();
    // Create symmetric cipher
    const cipher = aes.init_cipher(sym_key, iv);
    // Read data, encrypt it and write the resulting ciphertext
    await promisifiedPipe(input_file_stream.pipe(cipher), output_file_stream);
    //await pipeline(input_file_stream, cipher, output_file_stream);
    return {
      sym_key: sym_key.toString("hex"),
      iv: iv.toString("hex"),
      tag: aes.get_tag(cipher).toString("hex"),
    };
  };

  const retrieve_decrypted_file = async function(
    input_file,
    output_file,
    sym_key,
    iv,
    tag
  ) {
    if (!fs.existsSync(input_file)) throw Error(`${input_file} does not exist`);
    const input_file_stream = fs.createReadStream(input_file);
    const output_file_stream = fs.createWriteStream(output_file);
    // Create symmetric decipher
    const decipher = aes.init_decipher(
      Buffer.from(sym_key, "hex"),
      Buffer.from(iv, "hex"),
      Buffer.from(tag, "hex")
    );
    // Read data, decrypt it and write the resulting plaintext
    //await pipeline(input_file_stream, decipher, output_file_stream)
    return await promisifiedPipe(
      input_file_stream.pipe(decipher),
      output_file_stream
    );
  };

  const generate_jwt = function(data) {
    if (!_conf.rsa_init) throw Error("RSA Not initialized");
    return jwt.sign(data, _conf.rsa_keys.sk, { algorithm: "RS256" });
  };

  const verify_jwt = function(token, pk = null) {
    if (!_conf.rsa_init) throw Error("RSA Not initialized");
    // if pk is not provided, use my rsa pk if I'm an admin, otherwise use the admin rsa pk
    if (!pk) pk = _conf.abe_admin ? _conf.rsa_keys.pk : _conf.rsa_admin_pk;
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
    const metadata_file = `${path.join(
      abs_remote_repo_path,
      ciphertext_file
    )}.abebox`;
    const encrypted_content_file = `${path.join(
      abs_remote_repo_path,
      ciphertext_file
    )}.0`;
    // File content symmetric encryption
    const { sym_key, iv, tag } = await create_encrypted_file(
      abs_plaintext_file,
      encrypted_content_file
    );
    // Metadata file creation
    create_metadata_file(
      rel_plaintext_file,
      metadata_file,
      sym_key,
      iv,
      tag,
      policy
    );
    return metadata_file;
  };

  const file_decrypt = async function(
    abs_ciphertext_file,
    abs_local_repo_path
  ) {
    if (!fs.existsSync(abs_ciphertext_file))
      throw Error(`${abs_ciphertext_file} does not exist`);
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
  };

  const file_reencrypt = async function(encrypted_filename, policy) {
    // re-encrypt the file according to the new policy
    throw Error("Not implemented");
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
    set_admin_abe_keys,
    set_abe_sk,
    get_abe_keys,
    set_admin_rsa_pk,
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
