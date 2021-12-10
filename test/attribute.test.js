"use strict";
const assert = require("assert");
const fs = require("fs");
const AttributeManager = require("../src/abebox/attribute");

const attr_data_1 = { univ: "UN", attr: "A", vers: "1" };
const attr_data_2 = { univ: "UN", attr: "B", vers: "1" };
const attr_data_3 = { univ: "UN", attr: "C", vers: "1" };

describe("Attribute tests", () => {
  it("serialize and de-serialize policy", () => {
    const attribute = AttributeManager();
    const my_policy = [[attr_data_1, attr_data_2], [attr_data_3]];
    let policy_string = attribute.policy_as_string(my_policy);
    assert.equal(policy_string, '("UN:A:1" OR "UN:B:1") AND ("UN:C:1")');
    const deserialized_policy = attribute.policy_from_string(policy_string);
    console.log("deserialized policy:", deserialized_policy);
    assert.deepEqual(my_policy, deserialized_policy);
  });
});
