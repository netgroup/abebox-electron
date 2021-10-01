const listaFilePath = [];

listaFilePath.push({ path: "/", name: "file1.txt" });
listaFilePath.push({ path: "/", name: "file2.txt" });
listaFilePath.push({ path: "/dir1/", name: "file3.txt" });
listaFilePath.push({ path: "/dir1/", name: "file4.txt" });
listaFilePath.push({ path: "/dir1/dir2/", name: "file5.txt" });
listaFilePath.push({ path: "/dir3/dir2/", name: "file6.txt" });

let id = 1;

const repo = [{ name: "@Local Repo", children: [], fid: 0 }];

res = listaFilePath.reduce((prev, curr) => {
  const pathList = curr.path.split("/").filter((s) => s);
  //console.log(curr.path, pathList, pathList.length);
  const newFile = { name: curr.name, fid: id++ };
  if (pathList.length == 0) {
    //root path differente dalle cartelle
    prev.push(newFile);
  } else {
    // almeno una cartella va fattaß
    let arrList = prev;
    for (el of pathList) {
      const result = arrList.find(({ name }) => name === el);
      if (result) {
        // la cartella esiste
        arrList = result.children;
      } else {
        let newFolder = { name: el, children: [], fid: id++ };
        arrList.push(newFolder);
        arrList = newFolder.children;
      }
    }
    arrList.push(newFile);
  }
  return prev;
}, repo[0].children);

console.log(JSON.stringify(repo));
