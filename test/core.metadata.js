const assert = require("assert");
const core = require("../src/abebox/core");
const fs = require("fs");

let abe, rsa;

describe("Core.js Tests", () => {
  it("Testing metadata creation/retrieving", () => {
    // Initialization
    abe = abe || core.init_abe_keys();
    rsa = rsa || core.init_rsa_keys();
    const attr_list = ["1", "2"];
    const sk = core.create_abe_sk(attr_list);
    const file = "./file";
    const out_meta_file = "./test/tmp/out_meta_file.abebox";
    const sym_key = "sym_key";
    const iv = "iv";
    const policy = '"1"';
    if (fs.existsSync(out_meta_file)) fs.unlinkSync(out_meta_file);
    // Process
    core.create_metadata_file(file, out_meta_file, sym_key, iv, policy);
    const metadata = core.retrieve_metadata(out_meta_file);
    // Test
    assert.equal("./" + metadata.file_name, file);
    assert.equal(metadata.sym_key, sym_key);
    assert.equal(metadata.iv, iv);
    if (fs.existsSync(out_meta_file)) fs.unlinkSync(out_meta_file);
  }).timeout(10000);

  it("Testing file content encryption/decryption", () => {
    // Initialization
    const plaintext_file = "./test/tmp/hello.txt";
    const ciphertext_file = "./test/tmp/enc_hello.0";
    const dec_plaintext_file = "./test/tmp/dec_hello.txt";
    if (fs.existsSync(plaintext_file)) fs.unlinkSync(plaintext_file);
    if (fs.existsSync(ciphertext_file)) fs.unlinkSync(ciphertext_file);
    if (fs.existsSync(dec_plaintext_file)) fs.unlinkSync(dec_plaintext_file);
    fs.writeFileSync(plaintext_file, "Hello, World!");
    // Process
    const { stream, sym_key, iv } = core.create_encrypted_file(
      plaintext_file,
      ciphertext_file
    );
    stream.on("finish", () => {
      const dec_stream = core.retrieve_decrypted_file(
        ciphertext_file,
        dec_plaintext_file,
        sym_key,
        iv
      );
      dec_stream.on("finish", () => {
        // Test
        const plaintext = fs.readFileSync(plaintext_file, "utf-8");
        const dec_plaintext = fs.readFileSync(dec_plaintext_file, "utf-8");
        assert.equal(plaintext, dec_plaintext);
        if (fs.existsSync(plaintext_file)) fs.unlinkSync(plaintext_file);
        if (fs.existsSync(ciphertext_file)) fs.unlinkSync(ciphertext_file);
        if (fs.existsSync(dec_plaintext_file))
          fs.unlinkSync(dec_plaintext_file);
      });
    });
  }).timeout(10000);
  it("Setting and getting keys", () => {
    abe = abe || core.init_abe_keys();
    rsa = rsa || core.init_rsa_keys();
    const attr_list = ["1", "2"];
    const sk = core.create_abe_sk(attr_list);
    core.set_abe_sk(sk);
    assert.equal(sk, core.get_abe_keys().sk);
  });
});
