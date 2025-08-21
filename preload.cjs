const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations can be handled through the main process if needed
  // For now, we'll keep the database operations in the renderer process
  
  // App information
  getAppVersion: () => process.env.npm_package_version,
  getPlatform: () => process.platform,
  
  // Window controls
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  
  // Notifications
  showNotification: (title, body) => {
    new Notification(title, { body });
  }
});

// Security: Remove access to Node.js APIs in renderer
delete window.require;
delete window.exports;
delete window.module;