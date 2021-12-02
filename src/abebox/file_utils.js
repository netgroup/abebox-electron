const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { Stream } = require("stream");
const rabe = require("./rabejs/rabejs.node");

/**
 * Generate a unique random UUID to use as file name.
 * @returns unique random file name
 */
const get_random_filename = function() {
  const { v4: uuidv4 } = require("uuid");
  return uuidv4(); // ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
};

const get_random = function(size) {
  return crypto.randomBytes(size);
};

/**
 * Read data from the input stream, encrypt it using AES with randomly-generated symmetric key and IV, and write the resulting ciphertext on the output stream.
 * @param {Stream} input_stream Stream where data will be read
 * @param {Stream} output_stream Stream where data will be written
 * @returns Used symmetric key and IV
 */
const encrypt_content = function(
  input_stream,
  output_stream,
  sym_key = null,
  iv = null
) {
  if (sym_key == null) {
    // Create symmetric key
    sym_key = crypto.randomBytes(32);
  }

  if (iv == null) {
    // Create IV
    iv = crypto.randomBytes(16);
  }

  // Create symmetric cipher
  const algorithm = "aes-256-cbc";
  const cipher = crypto.createCipheriv(algorithm, sym_key, iv);

  // Read data, encrypt it and write the resulting ciphertext
  input_stream.pipe(cipher).pipe(output_stream);
  return {
    sym_key: sym_key,
    iv: iv,
  };
};

/**
 * Create metadata where the symmetric key and file path are encrypted using CP-ABE with the specified public key and policy, and the other parameters are in clear form.
 * @param {String} file_path File path
 * @param {Buffer} sym_key Symmetric key
 * @param {Buffer} iv Initialisation vector
 * @param {Object} abe_pub_key ABE public key
 * @param {String} policy ABE policy
 * @returns Created metadata
 */
const create_metadata = function(all_data, abe_pub_key, policy) {
  const { file_path, sym_key, iv } = all_data;
  // Group parameters to encrypt
  const metadata_to_enc = {
    sym_key: sym_key.toString("hex"),
    file_path: file_path,
  };

  console.log("CM POL:", typeof policy, policy);
  // Encrypt parameters using CP-ABE
  let enc_metadata = rabe.encrypt_str(
    abe_pub_key,
    policy,
    JSON.stringify(metadata_to_enc)
  );

  // Add parameters in clear form to the encrypted ones and return the metadata
  return {
    enc_metadata: enc_metadata,
    iv: iv.toString("hex"),
  };
};

/**
 * Read data from the input stream, decrypt it using AES with the specified symmetric key and IV, and write the resulting plaintext on the output stream.
 * @param {Stream} input_stream Stream where data will be read
 * @param {Stream} output_stream Stream where data will be writted
 * @param {String} sym_key Symmetric key
 * @param {String} iv Initialisation vector
 */
const decrypt_content = function(input_stream, output_stream, sym_key, iv) {
  // Create symmetric decipher
  const algorithm = "aes-256-cbc";
  const decipher = crypto.createDecipheriv(algorithm, sym_key, iv);

  // Read data, decrypt it and write the resulting plaintext
  input_stream.pipe(decipher).pipe(output_stream);
};

/**
 * Parse specified metadata and extract parameters by decrypting the ones encrypted with CP-ABE using the specified ABE secret key.
 * @param {String} raw_metadata Raw metadata
 * @param {Object} abe_secret_key ABE secret key
 * @returns Extracted parameters
 */
const parse_metadata = function(raw_metadata, abe_secret_key) {
  // Read metadata
  const metadata = JSON.parse(raw_metadata);
  const { enc_metadata, iv } = metadata;

  console.log("PM SK: ", abe_secret_key);
  try {
    // Decrypt the encrypted ones
    let dec_metadata = rabe.decrypt_str(abe_secret_key, enc_metadata);

    // Extract and return parameters
    const { sym_key, file_path } = JSON.parse(dec_metadata);
    return {
      file_path: file_path,
      sym_key: sym_key,
      iv: iv,
    };
  } catch (error) {
    // TODO Gestire errori di rabe
    return {
      file_path: null,
      sym_key: null,
      iv: null,
    };
  }
};

const get_file_name = function(full_file_name) {
  return full_file_name.replace(/^.*[\\\/]/, "");
};

const split_file_path = function(file_path, repo_path) {
  const file_name = get_file_name(file_path);
  const abs_path = file_path.replace(file_name, "");
  const rel_path = abs_path.replace(repo_path, "").substring(1);
  return {
    filename: file_name,
    abs_dir: abs_path,
    rel_dir: rel_path,
  };
};

/*exports.split_path = function(file_path, dst_dir_path) { // TODO ----> FUNZIONA SOLO CON PROFONDITA = 1; VERIFICARE PER ALTRI ALBERI
  const split_file_path = file_path.split("/");
  const first_file_path_dir = split_file_path[0];
  if (dst_dir_path.includes(first_file_path_dir)) {
    //const dir_pos = dst_dir_path.lastIndexOf(first_file_path_dir);
    split_file_path.shift();
    if (split_file_path[0] == "repo")
      split_file_path.shift();
    return split_file_path.join("/"); //dst_dir_path.substr(dir_pos + first_file_path_dir.length + 1, dst_dir_path.length) + split_file_path.join("/");
  } else {
    return null;
  }
}*/

const get_hash = function(message) {
  return crypto
    .createHash("sha256")
    .update(message)
    .digest();
};

const get_hmac = function(key, message) {
  return crypto
    .createHmac("sha256", key)
    .update(message)
    .digest();
};

const generate_jwt = function(data, priv_key) {
  return jwt.sign(data, priv_key, { algorithm: "RS256" });
};

const verify_jwt = function(token, pub_key) {
  return jwt.verify(token, pub_key);
};

module.exports = {
  get_random_filename,
  get_random,
  encrypt_content,
  create_metadata,
  decrypt_content,
  parse_metadata,
  get_file_name,
  split_file_path,
  get_hash,
  get_hmac,
  generate_jwt,
  verify_jwt,
};
