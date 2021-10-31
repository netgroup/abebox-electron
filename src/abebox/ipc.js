import { ipcMain } from "electron";

import { get_files_list, set_config, get_config } from ".";

import {
  get_attrs,
  new_attr,
  set_attr,
  del_attr,
  get_users,
  new_user,
  set_user,
  del_user,
} from "./dummy";

/* HELPER FUNCTIONS */

const select_folder = async function() {
  const { dialog } = require("electron");
  const res = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  console.log();
  return res;
};

// Application main window
let window = undefined; // Abebox window
let started = false; // Abebox alredy started

/* FILE INTERFACE */

const listFilesAPI = async function(event, data) {
  //TODO fare con handle
  console.log("Called: list-files");
  return event.reply("list-files-resp", get_files_list());
};

const setPolicyAPI = async function(event, data) {
  // TODO implementare
  console.log("Called: setPolicyAPI");
  set_policy(data);
};

export default {
  async startIpcServices() {
    if (started) return; // already started

    console.log("ABEBox Starting IPC API");
    /*  FILE API */
    ipcMain.on("list-files", (event, data) => {
      listFilesAPI(event, data);
    });

    ipcMain.on("set-policy", async (event, data) => {
      await setPolicyAPI(event, data);
      if (window) {
        window.webContents.send("update-list", "Prova");
      }
    });

    /* CONF API */
    ipcMain.handle("get-conf", async (event) => {
      return get_config(); // TODO await
    });

    ipcMain.handle("set-conf", async (event, conf) => {
      const result = set_config(conf);
      return result;
    });

    /*  ATTRIBUTES API */
    ipcMain.handle("list-attrs", async (event) => {
      return await get_attrs();
    });
    ipcMain.handle("new-attr", async (event, n_attr) => {
      return await new_attr(n_attr);
    });
    ipcMain.handle("set-attr", async (event, ed_attr) => {
      return await set_attr(ed_attr);
    });
    ipcMain.handle("del-attr", async (event, id_attr) => {
      return await del_attr(id_attr);
    });

    /*  USER API */
    ipcMain.handle("list-users", async (event) => {
      return await get_users();
    });
    ipcMain.handle("new-user", async (event, n_user) => {
      return await new_user(n_user);
    });
    ipcMain.handle("set-user", async (event, ed_user) => {
      return await set_user(ed_user);
    });
    ipcMain.handle("del-user", async (event, id_user) => {
      return await del_user(id_user);
    });

    /* UTILITY API */
    ipcMain.handle("select-folder", async (event, someArgument) => {
      const result = select_folder();
      return result;
    });

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
