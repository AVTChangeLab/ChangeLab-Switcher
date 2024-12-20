const { ipcRenderer } = require("electron");

window.addEventListener("DOMContentLoaded", async () => {
  const response = await ipcRenderer.invoke("get-servers");
  const servers = JSON.parse(response);
  document.getElementById("jsonEditor").value = JSON.stringify(servers, null, 2);
});

document.getElementById("saveConfig").addEventListener("click", () => {
  const updatedConfig = document.getElementById("jsonEditor").value;
  ipcRenderer.send("save-servers", updatedConfig);
});

ipcRenderer.on("save-servers-response", (event, message) => {
  alert(message); 
});

document.getElementById("cancelEdit").addEventListener("click", () => {
  ipcRenderer.send("cancel-edit");
});