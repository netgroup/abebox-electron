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
  console.log("INIT() CONF", conf);

  create_dirs();
  if (
    local_store.get("keys", {}).rsa_pub_key === undefined ||
    local_store.get("keys", {}).rsa_priv_key === undefined
  ) {
    create_rsa_keys(local_store);
    create_abe_keys(local_store);
  }
  conf.rsa_pub_key = local_store.get("keys").rsa_pub_key; //rsa.getPubKey();
  conf.rsa_priv_key = local_store.get("keys").rsa_priv_key; //rsa.getPrivKey();

  if (
    !fs.existsSync(conf.abe_pub_path_remote) ||
    local_store.get("keys", {}).abe_msk_key === undefined
  ) {
    create_abe_keys(local_store);
  }
  conf.abe_pub_key = JSON.stringify(
    verify_jwt(
      fs.readFileSync(conf.abe_pub_path_remote).toString(),
      conf.rsa_pub_key
    )
  );
  console.log("ABE PK = ", conf.abe_pub_key);
  /*if (!fs.existsSync(conf.abe_sec_path_remote)) {
    const msk = local_store.get("keys", {}).abe_msk_key;
    console.log("ABE MSK = ", msk);
    create_abe_secret_key(
      conf.abe_pub_key,
      msk,
      ["A", "B", "C"],
      abe_provider_name
    );
  }
  const jwt_enc_payload = JSON.stringify(
    verify_jwt(
      fs.readFileSync(conf.abe_sec_path_remote).toString(),
      conf.rsa_pub_key
    )
  );
  conf.abe_secret_key = rsa
    .decrypt(jwt_enc_payload, conf.rsa_priv_key)
    .toString();*/
};

const create_dirs = function() {
  //dirs = ["settings", "repo-local", "repo-shared/keys", "repo-shared/repo"];
  dirs = ["attributes", "keys", "repo", "pub_keys"];
  console.log("CREATING DIRS", dirs);
  dirs.forEach((dir) => {
    absolute_dir = conf.remote_repo_path + "/" + dir;
    console.log("Checking dir", absolute_dir);
    if (!fs.existsSync(absolute_dir)) {
      fs.mkdirSync(absolute_dir, { recursive: true });
    }
  });
};

const create_rsa_keys = function(local_store) {
  console.log("CREATING RSA KEYS...");
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
  console.log("ABE PAIR = ", pk, msk);
  const keys = local_store.get("keys", {});
  keys.abe_msk_key = msk;
  local_store.set("keys", keys);
  //const sk = rabe.keygen(pk, msk, JSON.stringify(["A", "B", "C"]));
  const abe_pk_jwt = generate_jwt(pk, keys.rsa_priv_key);
  fs.writeFileSync(conf.abe_pub_path_remote, abe_pk_jwt);
  /*fs.writeFileSync(
    conf.abe_sec_path_remote,
    rsa.encrypt(Buffer.from(sk), conf.rsa_pub_key)
  );*/
};

const create_abe_secret_key = function(pk, msk, attr_list, file_name) {
  console.log("CREATING NEW ABE SK...");
  const sk = rabe.keygen(pk, msk, JSON.stringify(attr_list));
  const abe_enc_sk_jwt = generate_jwt(
    rsa.encrypt(Buffer.from(sk), conf.rsa_pub_key),
    conf.rsa_priv_key
  );
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

  // Create metadata
  const metadata = create_metadata(
    input_file_path,
    sym_key,
    iv,
    conf.abe_pub_key,
    policy
  );

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
    !fs.existsSync(conf.abe_sec_path_remote) ||
    conf.abe_secret_key === undefined
  )
    return false;
    
  // Read raw metadata
  const raw_metadata = fs.readFileSync(
    conf.remote_repo_path + "/repo/" + encrypted_filename + ".abebox"
  );

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
    conf.local_repo_path + "/" + file_path
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
  conf,
  init,
  create_abe_secret_key,
  file_encrypt,
  file_decrypt,
  file_reencrypt,
};
