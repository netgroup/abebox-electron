const assert = require("assert");
const rsa = require("../src/abebox/rsa");
const rabe = require("../src/abebox/rabejs/rabejs.node");
const file_utils = require("../src/abebox/file_utils");

const fs = require("fs");
const tmp_path = __dirname + "/tmp/";

describe("RSA Test", () => {
  /*it("direct encrypt and decrypt a metadata file", () => {
    const filePath1 = tmp_path + "test1.abebox";
    //fs.unlinkSync(filePath);

    const [pk, msk] = rabe.setup();
    attr_list = ["1"];
    const sk = rabe.keygen(pk, msk, JSON.stringify(attr_list));

    // direct OK
    const metadata_to_enc = {
      sym_key: "sym_key 11".toString("hex"),
      file_path: "file_path 222",
    };
    let enc_metadata = rabe.encrypt_str(
      pk,
      '"1"',
      JSON.stringify(metadata_to_enc)
    );
    console.log("O1", typeof enc_metadata, "\n\n");
    // Write metadata on file
    fs.writeFileSync(filePath1, enc_metadata);
    const raw_metadata = fs.readFileSync(filePath1, "utf-8");
    console.log("O2", typeof raw_metadata, raw_metadata == enc_metadata);
    let dec_metadata = rabe.decrypt_str(sk, raw_metadata);
    console.log("OK ", dec_metadata);
    // Create metadata file
  });*/
  it("file_util encrypt and decrypt a metadata file", () => {
    const filePath = tmp_path + "test.abebox";

    const [pk, msk] = rabe.setup();
    attr_list = ["1"];
    const sk = rabe.keygen(pk, msk, JSON.stringify(attr_list));

    const all_data = {
      file_path: "input_file_path",
      sym_key: "sym_key",
      iv: "iv",
    };

    const metadata = file_utils.create_metadata(all_data, pk, '"1"');

    // Group parameters to encrypt
    fs.writeFileSync(filePath, JSON.stringify(metadata));
    const raw_metadata_2 = fs.readFileSync(filePath, "utf-8");

    dec_metadata = file_utils.parse_metadata(raw_metadata_2, sk);

    assert.equal(JSON.stringify(all_data), JSON.stringify(dec_metadata));
  }).timeout(10000);
});
