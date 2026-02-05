const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('historyAPI', {
  request: () => ipcRenderer.send('history-request'),
  onData: (callback) => {
    ipcRenderer.removeAllListeners('history-data');
    ipcRenderer.on('history-data', (_e, data) => callback(data));
  },
  navigate: (url) => ipcRenderer.send('history-navigate', url)
});