const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  scanFolders: (rootPaths) => ipcRenderer.invoke("scan-folders", rootPaths),
  deletePackages: (paths) => ipcRenderer.invoke("delete-packages", paths),
  reinstallPackages: (projectPath, type) =>
    ipcRenderer.invoke("reinstall", projectPath, type),
  openFolder: (targetPath) => ipcRenderer.invoke("open-folder", targetPath),
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings),
  onInstallOutput: (callback) => {
    const wrapped = (_event, payload) => callback(payload);
    ipcRenderer.on("install-output", wrapped);
    return () => ipcRenderer.removeListener("install-output", wrapped);
  },
  onScanProgress: (callback) => {
    const wrapped = (_event, payload) => callback(payload);
    ipcRenderer.on("scan-progress", wrapped);
    return () => ipcRenderer.removeListener("scan-progress", wrapped);
  }
});
