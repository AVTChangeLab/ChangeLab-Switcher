const { app, BrowserWindow, ipcMain } = require("electron");
const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
let servers = [];
const configPath = path.join(app.getPath("userData"), "servers.json");

if (fs.existsSync(configPath)) {
  servers = JSON.parse(fs.readFileSync(configPath, "utf-8"));
} else {
  const defaultConfigPath = path.join(__dirname, "src/servers.json");
  if (fs.existsSync(defaultConfigPath)) {
    fs.copyFileSync(defaultConfigPath, configPath);
    servers = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("src/index.html");
}

ipcMain.handle("get-servers", () => {
  return JSON.stringify(servers);
});

ipcMain.on("save-servers", (event, updatedConfig) => {
  try {
    const parsedConfig = JSON.parse(updatedConfig);
    fs.writeFileSync(configPath, JSON.stringify(parsedConfig, null, 2), "utf-8");
    servers = parsedConfig; 
    event.reply("save-servers-response", "Configuration saved successfully.");
  } catch (error) {
    event.reply("save-servers-response", `Error saving configuration: ${error.message}`);
  }
});

ipcMain.on("edit-config", () => {
  const editorWindow = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  editorWindow.loadFile(path.join(__dirname, "src/editor.html"));
});

// start server
ipcMain.on("start-server", (event, serverName) => {
  const server = servers.find((s) => s.name === serverName);
  if (!server) {
    event.reply("server-output", `Error: Server "${serverName}" not found.`);
    return;
  }

  const env = Object.assign({}, process.env, {
    PATH: "/usr/local/bin:/usr/bin:/bin:/usr/local/bin/node:/usr/local/bin/npm:" + process.env.PATH,
  });

  const serverPath = server.path;

  execFile(server.startCommand, { cwd: serverPath, env, shell: true }, (error, stdout, stderr) => {
    if (error) {
      event.reply("server-output", `Error: ${stderr || error.message}`);
      return;
    }
    event.reply("server-output", stdout || `Server "${serverName}" started successfully.`);
  });
});

// stop server
ipcMain.on("stop-server", (event, serverName) => {
  const server = servers.find((s) => s.name === serverName);
  if (!server) {
    event.reply("server-output", `Error: Server "${serverName}" not found.`);
    return;
  }

  execFile(server.stopCommand, { shell: true }, (error, stdout, stderr) => {
    if (error) {
      event.reply("server-output", `Error: ${stderr || error.message}`);
      return;
    }
    event.reply("server-output", stdout || "Server stopped successfully.");
  });
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
