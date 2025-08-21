const { app, BrowserWindow } = require("electron");
const path = require("path");
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    icon: path.join(__dirname, 'public', 'favicon.ico'),
    show: false, // Don't show until ready
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: !isDev,
    },
  });

  // Show window when ready
  win.once('ready-to-show', () => {
    win.show();
    
    // Focus the window
    if (isDev) {
      win.webContents.openDevTools();
    }
  });

  // Load the appropriate content
  if (isDev) {
    win.loadURL('http://localhost:8080');
  } else {
    win.loadFile(path.join(__dirname, "dist", "index.html"));
  }

  // Handle window closed
  win.on('closed', () => {
    // Dereference the window object
  });

  return win;
}

// Handle app events
app.whenReady().then(async () => {
  // Initialize database
  try {
    const { initializeDatabase } = await import('./src/services/localDbService.js');
    await initializeDatabase();
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  // Close database connection
  import('./src/services/localDbService.js').then(({ closeDatabase }) => {
    closeDatabase();
  });
  
  if (process.platform !== "darwin") app.quit();
});

// Handle certificate errors in production
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    // In development, ignore certificate errors
    event.preventDefault();
    callback(true);
  } else {
    // In production, use default behavior
    callback(false);
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});

