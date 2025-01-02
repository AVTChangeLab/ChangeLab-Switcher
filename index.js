const { app, BrowserWindow, ipcMain } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const { ipcRenderer } = require('electron')
let servers = [];
const configPath = path.join(app.getPath("userData"), "servers.json");
let isServerRunning = false;

if (process.env.NODE_ENV !== 'production') {
  try {
    require('electron-reloader')(module, {
      debug: true,
      watchRenderer: true
    });
  } catch (_) { console.log('Error'); }
}

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
    width: 500,
    height: 700,
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
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  editorWindow.loadFile(path.join(__dirname, "src/editor.html"));
});

ipcMain.on("add-server", () => {
  const newWindow = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  newWindow.loadFile(path.join(__dirname, "src/new.html"));
});

ipcMain.on("addServerSubmit", async (event, serverData) => {
    try {
        // Read existing servers from the correct path
        if (fs.existsSync(configPath)) {
            servers = JSON.parse(fs.readFileSync(configPath, "utf8"));
        }

        // Add new server
        servers.push(serverData);

        // Write to the config file
        fs.writeFileSync(configPath, JSON.stringify(servers, null, 2), "utf8");

        event.reply('server-added', { success: true });
    } catch (error) {
        event.reply('server-added', { success: false, error: error.message });
    }
});

let activeProcess = null;


ipcMain.on("addServerSubmit", (event, serverName, serverPath, serverPort) => {
  servers.push({ name: serverName, path: serverPath, port: serverPort, startCommand: `node ${serverPath}/server.js`, stopCommand: `kill -9 $(lsof -t -i:${serverPort})` });
  fs.writeFileSync(configPath, JSON.stringify(servers, null, 2), "utf-8");
  event.reply("addServerSubmit-response", "Server added successfully.");
  
  
});

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
  const [command, ...args] = server.startCommand.split(" ");
  
  activeProcess = spawn(command, args, { 
    cwd: serverPath, 
    env, 
    shell: true 
  });

  isServerRunning = true;
  event.reply("server-state-changed", isServerRunning);

  activeProcess.stdout.on('data', (data) => {
    event.reply("server-output", data.toString());
  });

  activeProcess.stderr.on('data', (data) => {
    event.reply("server-output", data.toString());
  });

  activeProcess.on('error', (error) => {
    event.reply("server-output", `Error: ${error.message}`);
  });

  activeProcess.on('close', (code) => {
    event.reply("server-output", `Process exited with code ${code}`);
    activeProcess = null;
    isServerRunning = false;
    event.reply("server-state-changed", isServerRunning);
  });
});

ipcMain.on("stop-server", (event, serverName) => {
  if (activeProcess) {
    activeProcess.kill();
    activeProcess = null;
    isServerRunning = false;
    event.reply("server-state-changed", isServerRunning);
  }
  
  const server = servers.find((s) => s.name === serverName);
  if (!server) {
    event.reply("server-output", `Error: Server "${serverName}" not found.`);
    return;
  }

  const [command, ...args] = server.stopCommand.split(" ");
  const stopProcess = spawn(command, args, { shell: true });

  stopProcess.on('close', (code) => {
    event.reply("server-output", `Server stopped with code ${code}`);
  });
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
