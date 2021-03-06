var path = require("path");
const { v4: uuidv4 } = require("uuid");

function get_next_slug(tree_path, file_dir) {
  const relative_path = file_dir.replace(tree_path, "");
  const slugs = relative_path.split("/");
  return slugs[0];
}

function generate_list_entry(file) {
  const new_item = Object.assign(file, {
    id: file.file_id,
    name: file.file_name,
  });

  if (file.policy.length == 0) {
    new_item["color"] = "red";
  } else {
    new_item["color"] = "green";
  }
  return new_item;
}

function add_file(tree_root, tree_path, file) {
  if (file.file_dir === tree_path) {
    // loa ggiungo alla direcory corrente
    tree_root.push(generate_list_entry(file));
  } else {
    // è in una sotto cartella vedo se esiste se no la creo
    const dir_name = get_next_slug(tree_path, file.file_dir);
    const new_tree_path = tree_path + dir_name + "/";
    let sub_tree_root = tree_root.find((el) => el.name == dir_name);
    //console.log(new_tree_path);
    if (!sub_tree_root) {
      // create folder
      //console.log("Creating folder: " + dir_name);
      sub_tree_root = {
        id: uuidv4(),
        name: dir_name,
        children: [],
        color: "black",
      };
      tree_root.push(sub_tree_root);
    }
    add_file(sub_tree_root.children, new_tree_path, file);
  }
}

const sort_tree = async function(folder) {
  await Promise.all(
    folder.sort(function compareFn(el1, el2) {
      if (el1.hasOwnProperty("children") & !el2.hasOwnProperty("children")) {
        return -1;
      }

      if (!el1.hasOwnProperty("children") & el2.hasOwnProperty("children")) {
        return 1;
      }

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

module.exports.get_tree = async function(files) {
  const tree = [];

  for (file of files) {
    add_file(tree, "", file);
  }

  await sort_tree(tree);

  return tree;
};
