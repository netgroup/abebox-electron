const assert = require("assert");
const rsa = require("../src/abebox/rsa");

describe("RSA Test", () => {
  it("encrypt and decrypt a test string", () => {
    const keys = rsa.create_keys();
    const enc_data = rsa.encrypt(Buffer.from("dati random"), keys.publicKey);
    const dec_data = rsa.decrypt(enc_data, keys.privateKey);

    assert.equal(dec_data.toString(), "dati random");
  }).timeout(10000);
});
