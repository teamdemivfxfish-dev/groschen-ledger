// The page's window.ledgerApp: version, check for updates, install, restart.
const { contextBridge, ipcRenderer } = require('electron');

let progress = null;
ipcRenderer.on('ledger:progress', (_e, p) => progress && progress(p));
const info = ipcRenderer.sendSync('ledger:info-sync');   // ready before the page's own script runs

contextBridge.exposeInMainWorld('ledgerApp', {
  appVersion: info.appVersion,
  contentVersion: info.contentVersion,
  check: () => ipcRenderer.invoke('ledger:check'),
  install: (onProgress) => { progress = onProgress; return ipcRenderer.invoke('ledger:install'); },
  restart: () => ipcRenderer.invoke('ledger:restart'),
  openReleases: () => ipcRenderer.invoke('ledger:releases'),
});
