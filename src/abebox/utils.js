var path = require("path");
const { v4: uuidv4 } = require("uuid");

function get_next_slug(tree_path, file_path) {
  const relative_path = file_path.replace(tree_path, "");
  const slugs = relative_path.split("/");
  return slugs[0];
}

function add_file(tree_root, tree_path, file) {
  //console.log("add_file", tree_path, file.file_name, file.file_path);
  if (file.file_path === tree_path) {
    // loa ggiungo alla direcory corrente
    //console.log(`File ${file.file_name} added to ${tree_path}`);
    tree_root.push(Object.assign(file, { id: file.fid, name: file.file_name }));
  } else {
    // è in una sotto cartella vedo se esiste se no la creo
    const dir_name = get_next_slug(tree_path, file.file_path);
    const new_tree_path = tree_path + dir_name + "/";
    let sub_tree_root = tree_root.find((el) => el.name == dir_name);
    //console.log(new_tree_path);
    if (!sub_tree_root) {
      // create folder
      //console.log("Creating folder: " + dir_name);
      sub_tree_root = { id: uuidv4(), name: dir_name, children: [] };
      tree_root.push(sub_tree_root);
    }
    add_file(sub_tree_root.children, new_tree_path, file);
  }
}

const sort_tree = async function(folder) {
  await Promise.all(
    folder.sort(function compareFn(el1, el2) {
      if (el1.name < el2.name) {
        return -1;
      }
      if (el1.name > el2.name) {
        return 1;
      }
      return 0;
    })
  );
  for (el of folder) {
    if (el.children) sort_tree(el.children);
  }
};

module.exports.get_tree = function(files) {
  const tree = [];

  for (file of files) {
    add_file(tree, "/", file);
  }

  console.log("PRE:", JSON.stringify(tree));
  sort_tree(tree);
  console.log("POST:", JSON.stringify(tree));

  return tree;
};

//console.log(JSON.stringify(get_tree(files)));
