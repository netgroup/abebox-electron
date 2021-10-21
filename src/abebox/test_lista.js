const { get_tree } = require("./utils");

const listaFilePath = [];

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

console.log(JSON.stringify(get_tree(files)));
