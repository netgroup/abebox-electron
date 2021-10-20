const fs = require("fs");
const {
  get_random_filename,
  encrypt_content,
  create_metadata,
  decrypt_content,
  parse_metadata,
} = require("./file_utils");
const rabe = require("./rabejs/rabejs.node");
const rsa = require("./rsa");

const conf = {
  abe_pub_path_remote: "./repo-shared/keys/abe.pub",
  abe_sec_path_remote: "./repo-shared/keys/abe.sk",
  abe_msk_path: "./settings/abe.msk",
  abe_pub_path: "./settings/abe.pub",
};

//const conf = {};

const init = function(lp, rp) {
  conf.local_repo_path = lp;
  conf.remote_repo_path = rp;
  conf.rsa_pub_key = rsa.getPubKey();
  conf.rsa_priv_key = rsa.getPrivKey();
  if (! fs.existsSync(conf.abe_pub_path_remote)) {
    create_abe_keys();
  };
  conf.abe_pub_key = fs.readFileSync(conf.abe_pub_path_remote).toString();
  conf.abe_secret_key = rsa
    .decryptRSA(fs.readFileSync(conf.abe_sec_path_remote), conf.rsa_priv_key)
    .toString();
};

const create_abe_keys = function() {
  const [pk, msk] = rabe.setup();
  fs.writeFileSync(conf.abe_pub_path, pk);
  fs.writeFileSync(conf.abe_msk_path, msk);
  const sk = rabe.keygen(pk, msk, JSON.stringify(["A", "B", "C"]));
  fs.writeFileSync(conf.abe_pub_path_remote, pk);
  fs.writeFileSync(
    conf.abe_sec_path_remote,
    rsa.encryptRSA(Buffer.from(sk), conf.rsa_pub_key)
  );
};

const file_encrypt = function(input_file_path, policy) {
  console.log(
    `[Encryption] Encrypting ${input_file_path} with policy ${policy}`
  );

  // Get random file ID
  const encrypted_filename = get_random_filename();

  // Encrypt file content with sym key
  const input_file = fs.createReadStream(
    conf.local_repo_path + "/" + input_file_path
  );
  const output_file = fs.createWriteStream(
    conf.remote_repo_path + "/repo/" + encrypted_filename + ".0"
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
    conf.remote_repo_path + "/repo/" + encrypted_filename + ".abebox",
    JSON.stringify(metadata)
  );

  // Return the random file ID
  return encrypted_filename;
};

const file_decrypt = function(encrypted_filename) {
  console.log("[Decryption] Decrypting file " + encrypted_filename);

  // Read raw metadata
  const raw_metadata = fs.readFileSync(
    conf.remote_repo_path + "/repo/" + encrypted_filename + ".abebox"
  );

  // Parse metadata
  const { sym_key, iv, file_path } = parse_metadata(
    raw_metadata,
    conf.abe_secret_key
  );

  // Decrypt the encrypted content with sym key
  const input_file = fs.createReadStream(
    conf.remote_repo_path + "/repo/" + encrypted_filename + ".0"
  );

  const output_file = fs.createWriteStream(
    conf.local_repo_path + "/" + file_path
  );

  // Perform symmetric decryption
  decrypt_content(input_file, output_file, sym_key, iv);
};

const file_reencrypt = function(encrypted_filename, policy) {
  // re-encrypt the file according to the new policy
  console.log("Encrypt function");
};

module.exports = {
  conf,
  init,
  file_encrypt,
  file_decrypt,
  file_reencrypt
};
