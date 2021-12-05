"use strict";

const assert = require("assert");
const fs = require("fs");

// paths
const tmp_dir = `${__dirname}/tmp`;
const abs_local_repo_path = `${tmp_dir}/repo-local`;
const abs_remote_repo_path = `${tmp_dir}/repo-shared`;
const abs_remote_repo_repo_path = `${abs_remote_repo_path}/repo`;

// plaintext files
const local_dir = "mytestfolder";
const plaintext_filename = "hello.txt"; // we are creating /mytestfolder/hello.txt file in the local repo
const rel_plaintext_file_path = `${local_dir}/${plaintext_filename}`;
const abs_plaintext_file_path = `${abs_local_repo_path}/${rel_plaintext_file_path}`;
const abs_dec_plaintext_file_path = `${abs_plaintext_file_path}.decripted.txt`;

// ciphertext files
const file_id = "enc_hello";
const metadata_filename = `${file_id}.abebox`;
const encrypted_filename = `${file_id}.0`;
const abs_metadata_file_path = `${abs_remote_repo_repo_path}/${metadata_filename}`;
const abs_encrypted_file_path = `${abs_remote_repo_repo_path}/${encrypted_filename}`;

const sym_key = "sym_key";
const iv = "iv";

// remove and create test files
before(() => {
  // clean /tmp directory
  if (fs.existsSync(tmp_dir))
    fs.rmSync(tmp_dir, {
      recursive: true,
      force: true,
    });

  fs.mkdirSync(`${abs_local_repo_path}/${local_dir}`, { recursive: true });
  fs.mkdirSync(abs_remote_repo_repo_path, { recursive: true });

  // Write test file
  fs.writeFileSync(abs_plaintext_file_path, "Hello, World!");
});

// to reload the module as a separate instance
/*beforeEach(() => {
  delete require.cache[require.resolve("../src/abebox/core")];
});*/

let abe;
let user_sk;

let admin_core;
let user_core;

describe("Core Basic Tests", () => {
  it("admin keys creation", () => {
    const AbeboxCore = require("../src/abebox/core");
    admin_core = AbeboxCore();
    const rsa = admin_core.init_rsa_keys(); // Admin RSA Keys
    abe = admin_core.init_abe_keys(); // Admin ABE Keys
    const attr_list = ["1", "2"];
    const sk = admin_core.create_abe_sk(attr_list); // Admin ABE Keys
    const user_attr_list = ["1"]; // Define attribute for a user
    user_sk = admin_core.create_abe_sk(user_attr_list); // User ABE SK Key
  }).timeout(10000);

  it("admin metadata file creation and decoding", () => {
    const policy = '"1"';

    admin_core.create_metadata_file(
      rel_plaintext_file_path,
      abs_metadata_file_path,
      sym_key,
      iv,
      policy
    );
    const metadata = admin_core.retrieve_metadata(abs_metadata_file_path);
    assert.equal(metadata.file_name, rel_plaintext_file_path);
    assert.equal(metadata.sym_key, sym_key);
    assert.equal(metadata.iv, iv);
    assert.equal(metadata.policy, policy);
  }).timeout(10000);

  it("admin file creation and decoding", async () => {
    // Process
    const { sym_key, iv } = await admin_core.create_encrypted_file(
      abs_plaintext_file_path,
      abs_encrypted_file_path
    );

    await admin_core.retrieve_decrypted_file(
      abs_encrypted_file_path,
      abs_dec_plaintext_file_path,
      sym_key,
      iv
    );
    const plaintext = fs.readFileSync(abs_plaintext_file_path, "utf-8");
    const dec_plaintext = fs.readFileSync(abs_dec_plaintext_file_path, "utf-8");
    assert.equal(plaintext, dec_plaintext);
  }).timeout(10000);

  it("user keys", () => {
    const AbeboxCore = require("../src/abebox/core");
    user_core = AbeboxCore();
    const rsa = user_core.init_rsa_keys(); //Admin RSA Keys
    user_core.set_abe_keys(abe.pk, user_sk); // User ABE Keys
  }).timeout(10000);

  it("user metadata file reading", () => {
    const metadata = user_core.retrieve_metadata(abs_metadata_file_path);
    assert.equal(metadata.file_name, rel_plaintext_file_path);
    assert.equal(metadata.sym_key, sym_key);
    assert.equal(metadata.iv, iv);
  }).timeout(10000);

  it("admin create file and user try to decode", async () => {
    const policy = '"1"';
    const plaintext = fs.readFileSync(abs_plaintext_file_path, "utf-8");

    const metadata_file = await admin_core.file_encrypt(
      rel_plaintext_file_path,
      abs_plaintext_file_path,
      abs_remote_repo_repo_path,
      file_id,
      policy
    );
    fs.rmSync(abs_plaintext_file_path);
    await user_core.file_decrypt(metadata_file, abs_local_repo_path);
    const dec_plaintext = fs.readFileSync(abs_plaintext_file_path, "utf-8");
    assert.equal(plaintext, dec_plaintext);
  }).timeout(10000);
});
