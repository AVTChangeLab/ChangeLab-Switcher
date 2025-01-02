const { ipcRenderer } = require("electron");

const serverSelect = document.getElementById("serverSelect");
const startServerBtn = document.getElementById("startServer");
const stopServerBtn = document.getElementById("stopServer");
const editConfigButton = document.getElementById("editConfig");
const output = document.getElementById("output");
const serverStatus = document.getElementById("serverStatus");
const clearLogButton = document.getElementById("clearLog");
const addServerButton = document.getElementById("addServer");

window.addEventListener("DOMContentLoaded", loadServerConfigurations);
window.addEventListener("focus", loadServerConfigurations);

startServerBtn.addEventListener("click", () => {
  if (!startServerBtn.disabled) {
    const serverName = serverSelect.value;
    output.textContent += `Starting ${serverName}...\n`;
    ipcRenderer.send("start-server", serverName);
    serverStatus.textContent = "Server is online";
  }
});

stopServerBtn.addEventListener("click", () => {
  if (!stopServerBtn.disabled) {
    const serverName = serverSelect.value;
    output.textContent += `Stopping ${serverName}...\n`;
    ipcRenderer.send("stop-server", serverName);
    serverStatus.textContent = "Server is offline";
  }
});

clearLogButton.addEventListener("click", () => {
  output.textContent = "";
});

ipcRenderer.on("server-output", (event, message) => {
  output.textContent += message;
  output.scrollTop = output.scrollHeight; 
});

editConfigButton.addEventListener("click", () => {
  ipcRenderer.send("edit-config");
});

addServerButton.addEventListener("click", () => {
  ipcRenderer.send("add-server");
});

ipcRenderer.on("server-added", (event, response) => {
  if (response.success) {
    alert("Server added successfully!");
    window.close();
  } else {
    alert("Error adding server: " + response.error);
  }
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

function updateButtonStates(isRunning) {
  if (isRunning) {
    startServerBtn.disabled = true;
    startServerBtn.classList.add('opacity-50', 'cursor-not-allowed');
    stopServerBtn.disabled = false;
    stopServerBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    serverStatus.textContent = "Server is online";
  } else {
    startServerBtn.disabled = false;
    startServerBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    stopServerBtn.disabled = true;
    stopServerBtn.classList.add('opacity-50', 'cursor-not-allowed');
    serverStatus.textContent = "Server is offline";
  }
}

ipcRenderer.on("server-state-changed", (event, isRunning) => {
  updateButtonStates(isRunning);
});

updateButtonStates(false);
