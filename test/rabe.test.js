const assert = require("assert");
const rabe = require("../src/abebox/rabejs/rabejs.node");

describe("Rabe Test", () => {
  it("should encrypt and decrypt a test string", () => {
    const [pk, msk] = rabe.setup();
    const ciphertext = rabe.encrypt_str(
      pk,
      '"A" and "B" and "C"',
      "hello world"
    );
    const sk = rabe.keygen(pk, msk, JSON.stringify(["A", "B", "C"]));
    const res = rabe.decrypt_str(sk, ciphertext);
    assert.equal(res, "hello world");
  });
});
