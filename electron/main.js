const path = require("node:path");
const fs = require("node:fs/promises");
const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const { spawn } = require("node:child_process");
const { scanRootFolders } = require("./scanner");

const SETTINGS_FILE = "settings.json";

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 680,
    minWidth: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

function getSettingsPath() {
  return path.join(app.getPath("userData"), SETTINGS_FILE);
}

async function readSettings() {
  const filePath = getSettingsPath();
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      return {
        rootFolders: [],
        autoScanOnOpen: false,
        largeSizeThresholdMb: 500
      };
    }
    throw error;
  }
}

async function writeSettings(settings) {
  const filePath = getSettingsPath();
  await fs.writeFile(filePath, JSON.stringify(settings, null, 2), "utf8");
  return settings;
}

function getInstallCommand(type) {
  if (type === "js") return { cmd: "npm", args: ["install"] };
  if (type === "php") return { cmd: "composer", args: ["install"] };
  if (type === "flutter") return { cmd: "flutter", args: ["pub", "get"] };
  throw new Error(`Unsupported project type: ${type}`);
}

function streamLines(stream, onLine) {
  let buffer = "";
  stream.on("data", (chunk) => {
    buffer += String(chunk);
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";
    for (const line of lines) {
      onLine(`${line}\n`);
    }
  });
  stream.on("end", () => {
    if (buffer) onLine(`${buffer}\n`);
  });
}

function registerIpcHandlers() {
  ipcMain.handle("scan-folders", async (event, rootPaths) => {
    const sender = event.sender;
    const projects = await scanRootFolders(Array.isArray(rootPaths) ? rootPaths : [], (progress) => {
      sender.send("scan-progress", progress);
    });
    return projects;
  });

  ipcMain.handle("delete-packages", async (_event, packagePaths) => {
    const targets = Array.isArray(packagePaths) ? packagePaths : [];
    const results = [];

    for (const packagePath of targets) {
      try {
        await shell.trashItem(packagePath);
        results.push({ path: packagePath, ok: true });
      } catch (error) {
        results.push({ path: packagePath, ok: false, error: error.message });
      }
    }

    return results;
  });

  ipcMain.handle("reinstall", async (event, projectPath, type) => {
    const { cmd, args } = getInstallCommand(type);

    return new Promise((resolve, reject) => {
      const child = spawn(cmd, args, {
        cwd: projectPath,
        shell: true
      });

      streamLines(child.stdout, (line) => event.sender.send("install-output", line));
      streamLines(child.stderr, (line) => event.sender.send("install-output", line));

      child.on("error", (error) => {
        reject(new Error(`Failed to start process: ${error.message}`));
      });

      child.on("close", (code) => {
        resolve({ code });
      });
    });
  });

  ipcMain.handle("open-folder", async (_event, folderPath) => {
    await shell.openPath(folderPath);
    return true;
  });

  ipcMain.handle("select-folder", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  ipcMain.handle("get-settings", async () => {
    return readSettings();
  });

  ipcMain.handle("save-settings", async (_event, settings) => {
    return writeSettings(settings);
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
