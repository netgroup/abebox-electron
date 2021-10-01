import { ipcMain } from "electron";

import {
  get_files_list,
  set_policy,
  startServices as abeboxServices,
} from "../abebox-core/new_index";

// Application main window
let window = undefined;
let started = false;

/*ABEBox API*/
const listFilesAPI = async function (event, data) {
  console.log("Called: list-files");
  return event.reply("list-files-resp", get_files_list());
};

const setPolicyAPI = async function (event, data) {
  console.log("Called: setPolicyAPI");
};

export default {
  startServices(win) {
    if (started) return; // already started
    abeboxServices();
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
