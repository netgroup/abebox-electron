const assert = require("assert");
const fs = require("fs");

const tmp_dir = "./test/tmp";
const plaintext_file = "./test/tmp/hello.txt";
const ciphertext_file = "./test/tmp/enc_hello.0";
const ciphermeta_file = "./test/tmp/enc_hello.abebox";
const dec_plaintext_file = "./test/tmp/dec_hello.txt";
const out_meta_file = "./test/tmp/test_meta_file.abebox";
const rel_plaintext_file = "hello.txt";
const abs_remote_repo_path = "test/tmp";
const abs_local_repo_path = abs_remote_repo_path;

// remove and create test files
before(() => {
  // Create dirs
  if (!fs.existsSync(tmp_dir)) fs.mkdirSync(tmp_dir);

  // Removing files
  if (fs.existsSync(plaintext_file)) fs.unlinkSync(plaintext_file);
  if (fs.existsSync(ciphertext_file)) fs.unlinkSync(ciphertext_file);
  if (fs.existsSync(dec_plaintext_file)) fs.unlinkSync(dec_plaintext_file);
  if (fs.existsSync(out_meta_file)) fs.unlinkSync(out_meta_file);

  // Write test file
  fs.writeFileSync(plaintext_file, "Hello, World!");
});

// to reload the module as a separate instance
beforeEach(() => {
  delete require.cache[require.resolve("../src/abebox/core")];
});

let abe;
let user_sk;

let admin_core;
let user_core;

const file = "./file"; // TODO non lo capisco è un path o un nome?????
const sym_key = "sym_key";
const iv = "iv";

describe("Core Basic Tests", () => {
  it("admin keys creation", () => {
    admin_core = require("../src/abebox/core");
    const rsa = admin_core.init_rsa_keys(); // Admin RSA Keys
    abe = admin_core.init_abe_keys(); // Admin ABE Keys
    const attr_list = ["1", "2"];
    const sk = admin_core.create_abe_sk(attr_list); // Admin ABE Keys
    const user_attr_list = ["1"];
    user_sk = admin_core.create_abe_sk(user_attr_list); // User ABE SK Key
  }).timeout(10000);

  it("test admin metadata file creation and decoding", () => {
    const policy = '"1"';
    admin_core.create_metadata_file(file, out_meta_file, sym_key, iv, policy);
    const metadata = admin_core.retrieve_metadata(out_meta_file);
    assert.equal(metadata.file_name, file);
    assert.equal(metadata.sym_key, sym_key);
    assert.equal(metadata.iv, iv);
  }).timeout(10000);

  it("test admin metadata file creation and decoding", () => {
    const policy = '"1"';
    admin_core.create_metadata_file(file, out_meta_file, sym_key, iv, policy);
    const metadata = admin_core.retrieve_metadata(out_meta_file);
    assert.equal(metadata.file_name, file);
    assert.equal(metadata.sym_key, sym_key);
    assert.equal(metadata.iv, iv);
  }).timeout(10000);

  it("test admin file creation and decoding", async () => {
    // Process
    const { sym_key, iv } = await admin_core.create_encrypted_file(
      plaintext_file,
      ciphertext_file
    );

    await admin_core.retrieve_decrypted_file(
      ciphertext_file,
      dec_plaintext_file,
      sym_key,
      iv
    );
    const plaintext = fs.readFileSync(plaintext_file, "utf-8");
    const dec_plaintext = fs.readFileSync(dec_plaintext_file, "utf-8");
    assert.equal(plaintext, dec_plaintext);
  }).timeout(10000);

  it("test user keys", () => {
    user_core = require("../src/abebox/core");
    const rsa = user_core.init_rsa_keys(); //Admin RSA Keys
    user_core.set_abe_keys(abe.pk, user_sk); // User ABE Keys
  }).timeout(10000);

  it("test user metadata file reading", () => {
    const metadata = user_core.retrieve_metadata(out_meta_file);
    assert.equal(metadata.file_name, file);
    assert.equal(metadata.sym_key, sym_key);
    assert.equal(metadata.iv, iv);
  }).timeout(10000);
  it("test admin metadata and content files creation (with outfile = '.abebox') and user file decoding", async () => {
    const policy = '"1"';
    const plaintext_file = __dirname + "/tmp/hello.txt";
    const rel_plaintext_file = "hello.txt";
    const cipher_file = "";
    const plaintext = fs.readFileSync(plaintext_file, "utf-8");
    const metadata_file = await admin_core.file_encrypt(
      rel_plaintext_file,
      plaintext_file,
      abs_remote_repo_path,
      ciphertext_file,
      policy
    );
    fs.rmSync(plaintext_file);
    await user_core.file_decrypt(metadata_file, abs_local_repo_path);
    const dec_plaintext = fs.readFileSync(plaintext_file, "utf-8");
    assert.equal(plaintext, dec_plaintext);
  }).timeout(10000);
});
