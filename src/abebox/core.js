const crypto = require("crypto");
const fs = require("fs");
const { pipeline } = require("stream/promises");
const jwt = require("jsonwebtoken");

const fu = require("./file_utils");
const rabe = require("./rabejs/rabejs.node");
const rsa = require("./rsa");

const conf = {
  /* abe_pub_path_remote: "./repo-shared/keys/abe.pub",
  abe_sec_path_remote: "./repo-shared/keys/abe.sk",
  abe_msk_path: "./settings/abe.msk",
  abe_pub_path: "./settings/abe.pub", */
};

//const conf = {};

const create_dirs = function(dirs, repo_path) {
  dirs.forEach((dir) => {
    absolute_dir = repo_path + "/" + dir;
    if (!fs.existsSync(absolute_dir)) {
      fs.mkdirSync(absolute_dir, { recursive: true });
    }
  });
};

const init_repo_shared = function(name, repo_path) {
  create_dirs(["attributes", "keys", "repo", "pub_keys"], repo_path);
  // devo fare altro???
};

const init_keys = function(name, repo_path) {
  const { publicKey: rsa_pk, privateKey: rsa_sk } = rsa.create_keys();
  const [abe_pk, abe_msk] = rabe.setup();
  return { rsa_pk, rsa_sk, abe_pk, abe_msk };
};

const save_rsa_pk = function(key, repo_path) {};

const save_abe_pk = function(key, repo_path) {};

const save_keys = function(keys, repo_path) {};

//TODO CAPIRE CHE FA!!!
const init = function(lp, rp, local_store) {
  const abe_provider_name = get_hash(local_store.get("data").name).toString(
    "hex"
  );
  conf.local_repo_path = lp;
  conf.remote_repo_path = rp;
  conf.abe_pub_path_remote =
    conf.remote_repo_path + "/keys/" + abe_provider_name + ".pub";
  conf.abe_sec_path_remote =
    conf.remote_repo_path + "/keys/" + abe_provider_name + ".sk";
  //console.log("INIT() CONF", conf);

  create_dirs(["attributes", "keys", "repo", "pub_keys"], rp);
  if (
    local_store.get("keys", {}).rsa_pub_key === undefined ||
    local_store.get("keys", {}).rsa_priv_key === undefined
  ) {
    create_rsa_keys(local_store);
    create_abe_keys(local_store);
  }
  conf.rsa_pub_key = local_store.get("keys").rsa_pub_key;
  conf.rsa_priv_key = local_store.get("keys").rsa_priv_key;

  if (
    !fs.existsSync(conf.abe_pub_path_remote) ||
    local_store.get("keys", {}).abe_msk_key === undefined
  ) {
    create_abe_keys(local_store);
  }
  /*conf.abe_pub_key = JSON.stringify(
    verify_jwt(
      fs.readFileSync(conf.abe_pub_path_remote).toString(),
      conf.rsa_pub_key
    )
  );*/
  conf.abe_pub_key = JSON.stringify(
    fs.readFileSync(conf.abe_pub_path_remote).toString()
  );
};

const create_rsa_keys = function(local_store) {
  //console.log("CREATING RSA KEYS...");
  const { publicKey, privateKey } = rsa.create_keys();
  // const [msk] = rabe.setup();
  keys = {};
  keys.rsa_pub_key = publicKey;
  keys.rsa_priv_key = privateKey;
  // keys.abe_pub_key = pk;
  // keys.abe_msk_key = msk;
  local_store.set("keys", keys);
};

const create_abe_keys = function(local_store) {
  console.log("CREATING NEW ABE PK AND MSK...");
  const [pk, msk] = rabe.setup();
  //console.log("ABE PAIR = ", pk, msk);
  const keys = local_store.get("keys", {});
  keys.abe_msk_key = msk;
  local_store.set("keys", keys);
  //const sk = rabe.keygen(pk, msk, JSON.stringify(["A", "B", "C"]));
  //TODO const abe_pk_jwt = generate_jwt(pk, keys.rsa_priv_key);
  const abe_pk_jwt = pk;
  fs.writeFileSync(conf.abe_pub_path_remote, abe_pk_jwt);
};

const create_abe_secret_key = function(pk, msk, attr_list, file_name) {
  console.log(`CREATING NEW ABE SK...`);
  console.log("ATTR LIST =", JSON.stringify(attr_list));
  const sk = rabe.keygen(pk, msk, JSON.stringify(attr_list));
  const enc_sk = rsa.encrypt(Buffer.from(sk), conf.rsa_pub_key);
  const abe_enc_sk_jwt = generate_jwt(enc_sk, conf.rsa_priv_key);
  fs.writeFileSync(
    conf.remote_repo_path + "/keys/" + file_name + ".sk",
    abe_enc_sk_jwt
  );
  return sk;
};

_conf = {
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

const create_abe_sk = function(attr_list) {
  if (!_conf.abe_init) throw Error("ABE Not initialized");
  if (!_conf.abe_admin) throw Error("ABE Not in admin mode");
  _conf.abe_keys.sk = rabe.keygen(
    _conf.abe_keys.pk,
    _conf.abe_keys.msk,
    JSON.stringify(attr_list)
  );
  return _conf.abe_keys.sk;
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
  const input_file_name = fu.get_file_name(input_file);
  // Group parameters to encrypt
  const metadata_to_enc = {
    sym_key: sym_key,
    file_name: input_file_name,
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
  try {
    // Decrypt the encrypted ones
    const dec_metadata = rabe.decrypt_str(_conf.abe_keys.sk, enc_metadata);
    // Extract and return parameters
    const { sym_key, file_name } = JSON.parse(dec_metadata);
    return {
      file_name,
      sym_key,
      iv,
    };
  } catch (error) {
    // TODO Gestire errori di rabe
    throw Error("ABE Decryption failed - " + error);
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

const verify_jwt = function(token) {
  if (!_conf.rsa_init) throw Error("RSA Not initialized");
  return jwt.verify(token, _conf.rsa_keys.pk);
};

const get_metadata_file_name = function(file) {
  const last_dot_position = file.lastIndexOf(".");
  return file.substring(0, last_dot_position) + ".abebox";
};

const get_encrypted_content_file_name = function(file) {
  const last_dot_position = file.lastIndexOf(".");
  return file.substring(0, last_dot_position) + ".0";
};

const file_encrypt = async function(plaintext_file, ciphertext_file, policy) {
  if (!fs.existsSync(plaintext_file))
    throw Error(`${plaintext_file} does not exist`);
  try {
    const encrypted_content_file = get_encrypted_content_file_name(
      ciphertext_file
    );
    // File content symmetric encryption
    const { sym_key, iv } = await create_encrypted_file(
      plaintext_file,
      encrypted_content_file
    );
    // Metadata file creation
    const metadata_file = get_metadata_file_name(ciphertext_file);
    create_metadata_file(plaintext_file, metadata_file, sym_key, iv, policy);
  } catch (error) {
    throw Error(
      `Encryption of ${plaintext_file} with policy ${policy} failed with error ${error}`
    );
  }
};

const file_decrypt = async function(ciphertext_file) {
  if (!fs.existsSync(ciphertext_file))
    throw Error(`${ciphertext_file} does not exist`);
  try {
    // Metadata retrieving
    const metadata_file = get_metadata_file_name(ciphertext_file);
    const { sym_key, iv, file_name } = retrieve_metadata(metadata_file);
    if (file_name === null) {
      throw Error(`File name not defined`);
    }
    // File content symmetric decryption
    const encrypted_content_file = get_encrypted_content_file_name(
      ciphertext_file
    );
    await retrieve_decrypted_file(
      encrypted_content_file,
      file_name,
      sym_key,
      iv
    );
  } catch (error) {
    throw Error(`Decryption of ${ciphertext_file} failed with error ${error}`);
  }
};

const file_reencrypt = async function(encrypted_filename, policy) {
  // re-encrypt the file according to the new policy
  console.log("Encrypt function");
};

module.exports = {
  init_rsa_keys,
  set_rsa_keys,
  get_rsa_keys,
  init_abe_keys, // used by abe admin
  create_abe_sk, //used in abe admin mode
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
};
