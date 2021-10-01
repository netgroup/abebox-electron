import { ipcMain } from "electron";

const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const chokidar = require("chokidar");
//const path = require("path");

// Application main window
let window = undefined;
let started = false;

const fileList = [];

// In futuro vanno nella Config
const sharedRepoPath =
  "/Users/loreti/tmp/electron-abebox/vue-electron-app/repo-shared/";

const localRepoPath =
  "/Users/loreti/tmp/electron-abebox/vue-electron-app/repo-local/";

// TODO mettere gli eventi
const watcher = chokidar
  .watch(localRepoPath, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
  })
  .on("all", (event, path) => {
    console.log(event, path);
    if (event == "add") {
      addLocalFile(path);
    }
  });

/*const fileList = [
  {
    id: 1,
    name: "Applications :",
    children: [
      { id: 2, name: "Calendar : app" },
      { id: 3, name: "Chrome : app" },
      { id: 4, name: "Webstorm : app" },
    ],
  },
  {
    id: 5,
    name: "Documents :",
    children: [
      {
        id: 6,
        name: "vuetify :",
        children: [
          {
            id: 7,
            name: "src :",
            children: [
              { id: 8, name: "index : ts" },
              { id: 9, name: "bootstrap : ts" },
            ],
          },
        ],
      },
      {
        id: 10,
        name: "material2 :",
        children: [
          {
            id: 11,
            name: "src :",
            children: [
              { id: 12, name: "v-btn : ts" },
              { id: 13, name: "v-card : ts" },
              { id: 14, name: "v-window : ts" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 15,
    name: "Downloads :",
    children: [
      { id: 16, name: "October : pdf" },
      { id: 17, name: "November : pdf" },
      { id: 18, name: "Tutorial : html" },
    ],
  },
  {
    id: 19,
    name: "Videos :",
    children: [
      {
        id: 20,
        name: "Tutorials :",
        children: [
          { id: 21, name: "Basic layouts : mp4" },
          { id: 22, name: "Advanced techniques : mp4" },
          { id: 23, name: "All about app : dir" },
        ],
      },
      { id: 24, name: "Intro : mov" },
      { id: 25, name: "Conference introduction : avi" },
    ],
  },
];*/

/*ABEBox API*/
const listFilesAPI = async function(event, data) {
  console.log("Called: list-files");
  return event.reply("list-files-resp", fileList);
};

const setPolicyAPI = async function(event, data) {
  console.log("Called: setPolicyAPI");
};

const addLocalFile = async function(fullPath) {
  // Generate name
  const filename = uuidv4();
  const originalFileName = fullPath.replace(/^.*[\\\/]/, "");
  const onlyPath = fullPath.replace(originalFileName, "");
  const relativePath = onlyPath.replace(localRepoPath.slice(0, -1), "");
  console.log(fullPath, filename, originalFileName);

  // Create metafile
  const fileInfo = {
    path: relativePath,
    fid: filename,
    name: originalFileName,
    policy: undefined,
    version: new Date().getTime(),
    status: "Local",
  };

  fileList.push(fileInfo);
};

/* Utility function*/
const copyFileFromLocaltoTmp = async function(fullPath) {
  // Generate name
  const filename = uuidv4();
  const originalFileName = fullPath.replace(/^.*[\\\/]/, "");
  console.log(fullPath, filename, originalFileName);
  const onlyPath = fullPath.replace(originalFileName, "");
  const relativePath = onlyPath.replace(localRepoPath.slice(0, -1), "");

  // Create metafile
  const metadata = {
    filePath: relativePath,
    fid: filename,
    fileName: originalFileName,
  };
  fs.writeFileSync(tmpRepoPath + filename + ".meta", JSON.stringify(metadata));
  // cp del file
  // File destination.txt will be created or overwritten by default.
  fs.copyFile(fullPath, tmpRepoPath + filename + ".0", (err) => {
    if (err) throw err;
    console.log(" was copied to destination.txt");
  });
};

const getFileList = function() {
  let fid = 1;
  const files = fs.readdirSync(sharedRepoPath);
  files.forEach((file) => {
    console.log(file);
    fileList.push({ id: fid++, name: file });
  });
  console.log("file list", fileList);
};

export default {
  startServices(win) {
    if (started) return; // already started
    console.log("ABEBox Start Services");
    ipcMain.on("list-files", (event, data) => {
      listFilesAPI(event, data);
    });
    ipcMain.on("set-policy", (event, data) => {
      setPolicyAPI(event, data);
    });

    if (win) window = win; // save the reference to the main window
    console.log(fileList);
    started = true;
  },
};

//getFileList();
