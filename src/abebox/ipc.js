import { ipcMain } from "electron";

import { get_files_list, set_config, get_config, start_services } from ".";

const select_folder = async function() {
  const { dialog } = require("electron");
  const res = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  console.log();
  return res;
};

// Application main window
let window = undefined;
let started = false;

/*ABEBox IPC API*/
const listFilesAPI = async function(event, data) {
  console.log("Called: list-files");
  return event.reply("list-files-resp", get_files_list());
};

/*ABEBox IPC API*/
const setPolicyAPI = async function(event, data) {
  console.log("Called: setPolicyAPI");
};

export default {
  async startIpcServices() {
    if (started) return; // already started
    //start_services();
    console.log("ABEBox Start Services");
    ipcMain.on("list-files", (event, data) => {
      listFilesAPI(event, data);
    });
    ipcMain.on("set-policy", async (event, data) => {
      await setPolicyAPI(event, data);
      if (window) {
        window.webContents.send("update-list", "Prova");
      }
    });

    ipcMain.handle("set-conf", async (event, new_conf) => {
      const result = set_config(new_conf);
      return result;
    });

    ipcMain.handle("get-conf", async (event, someArgument) => {
      const result = get_config();
      //Object.assign(result, { name: "GB", avatar: "./assets/gb.jpg" });
      return result;
    });

    ipcMain.handle("select-folder", async (event, someArgument) => {
      const result = select_folder();
      return result;
    });

    //console.log(fileList);
    started = true;
  },
  setWindow(win) {
    if (win) {
      window = win; // save the reference to the main window
      console.log("Saved window");
    }
  },
};

//getFileList();
