"use strict";
import { ipcMain } from "electron";
const { dialog } = require("electron");

const fs = require("fs");

//import { get_files_list, set_config, get_config, set_policy } from ".";

/*import {
  get_files_list,
  set_policy,
  share_files,
  get_config,
  set_config,
  reset_config,
  get_attrs,
  new_attr,
  set_attr,
  del_attr,
  get_users,
  new_user,
  set_user,
  del_user,
  invite_user,
} from "."; //"./dummy";*/

const abebox = require(".")();

/* HELPER FUNCTIONS */

const isEmptyFolder = async function(path) {
  const data = fs.readdirSync(path);
  const filert_data = await Promise.all(
    data.filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
  );
  if (filert_data.length == 0) {
    return true;
  } else {
    return false;
  }
};

const select_local_folder = async function() {
  const res = await dialog.showOpenDialog({
    properties: ["openDirectory", "createDirectory", "promptToCreate"],
  });

  if (!res.canceled) {
    res.isEmpty = await isEmptyFolder(res.filePaths[0]);
  }

  return res;
};

const select_admin_remote_folder = async function() {
  const res = await dialog.showOpenDialog({
    properties: ["openDirectory", "createDirectory", "promptToCreate"],
  });

  if (!res.canceled) {
    res.isEmpty = await isEmptyFolder(res.filePaths[0]);
  }

  return res;
};

const select_user_remote_folder = async function() {
  const res = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (!res.canceled) {
    res.isRepo = abebox.is_repository(res.filePaths[0]);
  }

  return res;
};

// Application main window
let window = undefined; // Abebox window
let started = false; // Abebox alredy started

export default {
  async startIpcServices() {
    if (started) return; // already started

    console.log("ABEBox Starting IPC API");
    /*  FILE API */
    ipcMain.handle("list-files", async (event, data) => {
      return await abebox.get_files_list(); // return file list
    });

    ipcMain.handle("get-user-info", async (event, data) => {
      return await abebox.get_user_info(); // return user info
    });

    ipcMain.handle("get-admin-info", async (event, data) => {
      return await abebox.get_admin_info(); // return admin info
    });

    ipcMain.handle("set-policy", async (event, data) => {
      return await abebox.set_policy(data); // return file list
    });

    ipcMain.handle("share-files", async (event, data) => {
      return await abebox.share_files(data); // return file list
    });
    ipcMain.handle("share-single", async (event, file_id) => {
      return await abebox.share_single_file(file_id); // return file list
    });

    /* CONF API */
    ipcMain.handle("get-conf", async (event) => {
      return await abebox.get_config();
    });

    ipcMain.handle("reset-conf", async (event) => {
      return await abebox.reset_conf();
    });

    ipcMain.handle("set-conf", async (event, conf) => {
      return await abebox.set_config(conf);
    });

    /*  ATTRIBUTES API */
    ipcMain.handle("list-attrs", async (event) => {
      try {
        return await abebox.get_attrs();
      } catch (err) {
        return {
          status: "error",
          message: err.message,
        };
      }
    });
    ipcMain.handle("new-attr", async (event, n_attr) => {
      return await abebox.new_attr(n_attr);
    });
    ipcMain.handle("set-attr", async (event, old_attr, ed_attr) => {
      return await abebox.set_attr(old_attr, ed_attr);
    });
    ipcMain.handle("del-attr", async (event, d_attr) => {
      return await abebox.del_attr(d_attr);
    });

    /*  USER API */
    ipcMain.handle("list-users", async (event) => {
      return await abebox.get_users();
    });
    ipcMain.handle("new-user", async (event, n_user) => {
      return await abebox.new_user(n_user);
    });
    ipcMain.handle("set-user", async (event, ed_user) => {
      return await abebox.set_user(ed_user);
    });
    ipcMain.handle("del-user", async (event, id_user) => {
      return await abebox.del_user(id_user);
    });
    ipcMain.handle("invite-user", async (event, user_mail) => {
      return await abebox.invite_user(user_mail);
    });

    /* UTILITY API */
    ipcMain.handle("select-local-folder", async (event) => {
      const result = select_local_folder();
      return result;
    });

    ipcMain.handle("select-remote-folder", async (event, isUser = false) => {
      if (isUser) {
        return select_user_remote_folder();
      } else {
        return select_admin_remote_folder();
      }
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
