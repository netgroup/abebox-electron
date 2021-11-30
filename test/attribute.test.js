const assert = require("assert");
const fs = require("fs");
const attribute = require("../src/abebox/attribute");

const attr_data_1 = { univ: "UN", attr: "A", vers: "1" };
const attr_data_2 = { univ: "UN", attr: "B", vers: "1" };
const attr_data_3 = { univ: "UN", attr: "C", vers: "1" };

describe("Attribute tests", () => {
  it("set policy", () => {
    const my_policy = [[attr_data_1, attr_data_2], [attr_data_3]];
    let policy_string = attribute.policy_as_string(my_policy);
    assert.equal(policy_string, '("UN:A:v1" OR "UN:B:v1") AND ("UN:C:v1")');
  });
});
