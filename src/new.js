const { ipcRenderer } = require("electron");

const addServerSubmit = document.getElementById("addServerSubmit");
const cancelBtn = document.getElementById("cancelAddServer");

addServerSubmit.addEventListener("click", () => {
    const serverName = document.getElementById("serverName").value;
    const serverPath = document.getElementById("serverDirectory").value;
    const serverPort = document.getElementById("serverPort").value;

    if (!serverName || !serverPath || !serverPort) {
        alert('Please fill in all fields');
        return;
    }

    const serverData = {
        name: serverName,
        path: serverPath,
        port: serverPort,
        startCommand: `node ${serverPath}/server.js`,
        stopCommand: `kill -9 $(lsof -t -i:${serverPort})`
    };

    ipcRenderer.send("addServerSubmit", serverData);
});

cancelBtn.addEventListener("click", () => {
    window.close();
});

ipcRenderer.on("server-added", (event, response) => {
    if (response.success) {
        alert("Server added successfully!");
        window.close();
    } else {
        alert("Error adding server: " + response.error);
    }
});