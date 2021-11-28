const assert = require("assert");
const fs = require("fs");
const envPaths = require("env-paths");
const paths = envPaths("electron-store");

const tmp_dir = "tmp";
const repo_local_dir = "tmp/repo-local";
const repo_shared_dir = "tmp/repo-shared";
const attrs_file_rel_path = "attributes/attributes_list.json";

const cfg_file = "config.json";

const test_file_1 = "tmp/repo-local/hello1.txt";

// remove and create test files
before(() => {
  // Rename cfg file
  if (fs.existsSync(paths.config + "/" + cfg_file))
    fs.renameSync(
      paths.config + "/" + cfg_file,
      paths.config + "/" + Date.now() + "_" + cfg_file
    );

  // Removing all files in dirs
  //RM Attribute repo
  if (fs.existsSync(__dirname + "/" + repo_local_dir))
    fs.rmSync(__dirname + "/" + repo_local_dir, {
      recursive: true,
      force: true,
    });
  if (fs.existsSync(__dirname + "/" + repo_shared_dir))
    fs.rmSync(__dirname + "/" + repo_shared_dir, {
      recursive: true,
      force: true,
    });

  // Create dirs
  if (!fs.existsSync(__dirname + "/" + tmp_dir)) fs.mkdirSync(tmp_dir);
  if (!fs.existsSync(__dirname + "/" + repo_local_dir))
    fs.mkdirSync(__dirname + "/" + repo_local_dir);
  if (!fs.existsSync(__dirname + "/" + repo_shared_dir))
    fs.mkdirSync(__dirname + "/" + repo_shared_dir);

  // Write test file
  //fs.writeFileSync(plaintext_file, "Hello, World!");
});

after(() => {
  // stop abebox!!
});

// to reload the module as a separate instance
beforeEach(() => {
  delete require.cache[require.resolve("../src/abebox/core")];
  delete require.cache[require.resolve("../src/abebox/index")];
});

let abe;
let user_sk;

let admin_abebox;
let user_abebox;

const file = "./file"; // TODO non lo capisco è un path o un nome?????
const sym_key = "sym_key";
const iv = "iv";

const conf = {
  configured: true,
  isAdmin: true,
  local: __dirname + "/" + repo_local_dir,
  name: "pp@pp.it",
  remote: __dirname + "/" + repo_shared_dir,
  token: "",
};

let admin_abebox_init;

describe("Abebox Tests", () => {
  it("admin abebox init create config", async () => {
    // setup
    admin_abebox_init = require("../src/abebox");

    // loading new configuration
    admin_abebox_init.set_config(conf);
  });

  it("admin abebox new attribute", async () => {
    const attr_data = { univ: "UN", attr: "A", vers: "1" };
    const attr_list = await admin_abebox_init.new_attr(attr_data);

    assert.equal(attr_list.length, 1);
    assert.equal(attr_list[0], attr_data);
  });
});
