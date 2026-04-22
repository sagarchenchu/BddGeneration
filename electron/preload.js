const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: ()                              => ipcRenderer.invoke('dialog:openFile'),
  openDirDialog:  ()                              => ipcRenderer.invoke('dialog:openDir'),
  parseHtml:      (filePath)                      => ipcRenderer.invoke('html:parse', filePath),
  generateBdd:    (filePath, apiKey, model)        => ipcRenderer.invoke('html:generateBdd', filePath, apiKey, model),
  saveFile:       (filePath, content)              => ipcRenderer.invoke('file:save', filePath, content),
});
