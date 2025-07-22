const { app, BrowserWindow } = require("electron");
const path = require("path");
const { initializeDatabase } = require("./src/services/localDbService.cjs");

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      contextIsolation: false, // Disable contextIsolation for easier nodeIntegration
      nodeIntegration: true, // Enable nodeIntegration for local database access
    },
  });

  // Load the Vite production build
  win.loadFile(path.join(__dirname, "dist", "index.html"));

  // Open the DevTools.
  // win.webContents.openDevTools();
}

app.whenReady().then(async () => {
  await initializeDatabase(); // Initialize the database
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});


