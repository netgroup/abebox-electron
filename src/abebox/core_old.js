const fs = require("fs");
const {
  encrypt_content,
  create_metadata,
  decrypt_content,
  parse_metadata,
  get_hash,
  generate_jwt,
  verify_jwt,
} = require("./file_utils");
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

const file_encrypt = function(input_file_path, policy, output_file_path) {
  console.log(
    `[Encryption] Encrypting ${input_file_path} with policy ${policy}`
  );

  // Get random file ID
  //const encrypted_filename = get_random_filename();

  // Encrypt file content with sym key
  const input_file = fs.createReadStream(
    conf.local_repo_path + input_file_path
  );
  const output_file = fs.createWriteStream(
    conf.remote_repo_path + "/repo/" + output_file_path + ".0"
  );

  // Perform symmetric encryption
  const { sym_key, iv } = encrypt_content(input_file, output_file);

  const all_data = { file_path: input_file_path, sym_key: sym_key, iv: iv };

  // Create metadata
  const metadata = create_metadata(all_data, conf.abe_pub_key, policy);

  // Write metadata on file
  fs.writeFileSync(
    conf.remote_repo_path + "/repo/" + output_file_path + ".abebox",
    JSON.stringify(metadata)
  );

  return true;
};

const file_decrypt = function(encrypted_filename) {
  console.log("[Decryption] Decrypting file " + encrypted_filename);

  if (
    //!fs.existsSync(conf.abe_sec_path_remote) ||
    conf.abe_secret_key === undefined
  )
    return false;

  // Read raw metadata
  const raw_metadata = fs.readFileSync(
    conf.remote_repo_path + "/repo/" + encrypted_filename + ".abebox",
    "utf-8"
  );

  console.log("CR SK:", conf.abe_secret_key);

  // Parse metadata
  const { sym_key, iv, file_path } = parse_metadata(
    raw_metadata,
    conf.abe_secret_key
  );

  if (file_path === null) {
    // DECRYPTION ERROR
    return false;
  }

  // Decrypt the encrypted content with sym key
  const input_file = fs.createReadStream(
    conf.remote_repo_path + "/repo/" + encrypted_filename + ".0"
  );

  const output_file = fs.createWriteStream(
    conf.local_repo_path + "/enc_" + file_path
  );

  // Perform symmetric decryption
  decrypt_content(input_file, output_file, sym_key, iv);

  return true;
};

const file_reencrypt = function(encrypted_filename, policy) {
  // re-encrypt the file according to the new policy
  console.log("Encrypt function");
};

module.exports = {
  init,
  conf,
  init_repo_shared,
  init_keys,
  create_abe_secret_key,
  file_encrypt,
  file_decrypt,
  file_reencrypt,
};
