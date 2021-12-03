const assert = require("assert");
const { get_tree } = require("../src/abebox/utils");

file_list = [
  {
    file_dir: "",
    file_name: "ppp.txt",
    file_id: "dfa16db2-4dfb-4524-b579-428cd0cd65a7",
    policy: [],
    status: 1,
  },
  {
    file_dir: "dir2/",
    file_name: "ppp2.txt",
    file_id: "c97eef78-a68b-47c7-9930-22f03db7de17",
    policy: [],
    status: 1,
  },
  {
    file_dir: "dir2/dir3/",
    file_name: "ppp3.txt",
    file_id: "02e85c49-479d-4174-b4c2-459caa73ca14",
    policy: [],
    status: 1,
  },
  {
    file_dir: "dir1/",
    file_name: "ppp.txt",
    file_id: "384ade79-9b08-4b1f-8edf-5fb302aae583",
    policy: [],
    status: 1,
  },
  {
    file_dir: "dir1/",
    file_name: "ppp1.txt",
    file_id: "fd64e1dc-9e9e-4995-9d96-3a3bc0787115",
    policy: [],
    status: 1,
  },
];

describe("RSA Test", () => {
  it("test file list conversion", () => {
    console.log(get_tree(file_list));
  }).timeout(10000);
});
