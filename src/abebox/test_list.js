var path = require("path");
const { v4: uuidv4 } = require("uuid");

files = [
  {
    file_path: "/",
    file_name: "prova.txt",
    fid: "3c9d87e1-f815-4679-89a8-56031f417839",
    policy: "",
    status: 0,
  },
  {
    file_path: "/",
    file_name: "prova1.txt",
    fid: "7fbd0b2b-2455-43be-9cc9-91f5078db434",
    policy: "",
    status: 0,
  },
  {
    file_path: "/dir1/",
    file_name: "prova2.txt",
    fid: "4aafb9db-351a-494a-9c1c-00aed2d29e23",
    policy: "",
    status: 0,
  },
  {
    file_path: "/dir1/",
    file_name: "prova3.txt",
    fid: "e26e0d9e-1737-49dd-b53f-48d4b5c284bc",
    policy: "",
    status: 0,
  },
  {
    file_path: "/dir2/",
    file_name: "prova5.txt",
    fid: "e26e0d9e-1737-49dd-b53f-48d4b5c284bc",
    policy: "",
    status: 0,
  },
  {
    file_path: "/dir2/",
    file_name: "prova6.txt",
    fid: "e26e0d9e-1737-49dd-b53f-48d4b5c284bc",
    policy: "",
    status: 0,
  },
  {
    file_path: "/dir1/dir3/",
    file_name: "prova9.txt",
    fid: "e26e0d9e-1737-49dd-b53f-48d4b5c284bc",
    policy: "",
    status: 0,
  },
];

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

function get_tree(files) {
  const tree = [];

  for (file of files) {
    add_file(tree, "/", file);
  }
  return tree;
}

console.log(JSON.stringify(get_tree(files)));
