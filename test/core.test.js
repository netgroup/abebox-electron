const assert = require("assert");
const core = require("../src/abebox/core");

describe("RSA Test", () => {
  
  it("test core admin mode", () => {
    const rsa = core.init_rsa_keys();
    const abe = core.init_abe_keys();
    console.log("RSA:", rsa, "\nABE:", abe);
  }).timeout(10000);

});
