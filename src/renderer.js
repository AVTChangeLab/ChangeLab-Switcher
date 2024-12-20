const { ipcRenderer } = require("electron");

const serverSelect = document.getElementById("serverSelect");
const startServerButton = document.getElementById("startServer");
const stopServerButton = document.getElementById("stopServer");
const editConfigButton = document.getElementById("editConfig");
const output = document.getElementById("output");
const serverStatus = document.getElementById("serverStatus");
const clearLogButton = document.getElementById("clearLog");
let started = false;

window.addEventListener("DOMContentLoaded", loadServerConfigurations);

window.addEventListener("focus", loadServerConfigurations);


window.addEventListener("DOMContentLoaded", async () => {
  const response = await ipcRenderer.invoke("get-servers");
  const servers = JSON.parse(response);

  servers.forEach((server) => {
    const option = document.createElement("option");
    option.value = server.name;
    option.textContent = server.name;
    serverSelect.appendChild(option);
  });
});

startServerButton.addEventListener("click", () => {
  const serverName = serverSelect.value;
  output.textContent += `Starting ${serverName}...\n`;
  ipcRenderer.send("start-server", serverName);
  setTimeout(updateServerStatus, 1000); 
  started = true;
  updateServerStatus();
});

stopServerButton.addEventListener("click", () => {
  const serverName = serverSelect.value;
  output.textContent += `Stopping ${serverName}...\n`;
  ipcRenderer.send("stop-server", serverName);
  setTimeout(updateServerStatus, 1000); 
  started = false;  
  updateServerStatus();
});

clearLogButton.addEventListener("click", () => {
  output.textContent = "";
});

ipcRenderer.on("server-output", (event, message) => {
  output.textContent += message + "\n";
});

editConfigButton.addEventListener("click", () => {
  ipcRenderer.send("edit-config");
});

async function loadServerConfigurations() {
  const response = await ipcRenderer.invoke("get-servers");
  const servers = JSON.parse(response);

  serverSelect.innerHTML = "";

  servers.forEach((server) => {
    const option = document.createElement("option");
    option.value = server.name;
    option.textContent = server.name;
    serverSelect.appendChild(option);
  });
}

async function updateServerStatus() {
  if (started) {
    startServerButton.disabled = true;
    stopServerButton.disabled = false;
    serverStatus.textContent = "Server is online";
  } else {
    startServerButton.disabled = false;
    stopServerButton.disabled = true;
    serverStatus.textContent = "Server is offline";
    output.textContent = "";
  }
}
