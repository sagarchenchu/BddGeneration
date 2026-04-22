const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { parseHtml } = require('../src/htmlParser');
const { generateBdd } = require('../src/bddGenerator');

function createWindow() {
  const win = new BrowserWindow({
    width: 920,
    height: 760,
    minWidth: 700,
    minHeight: 560,
    title: 'BDD Generation',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, 'renderer.html'));
  win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── IPC: open HTML file dialog ────────────────────────────────────────────────
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select HTML File',
    filters: [{ name: 'HTML Files', extensions: ['html', 'htm'] }],
    properties: ['openFile'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// ── IPC: open output directory dialog ────────────────────────────────────────
ipcMain.handle('dialog:openDir', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select Output Folder',
    properties: ['openDirectory', 'createDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// ── IPC: parse HTML → structured JSON ────────────────────────────────────────
ipcMain.handle('html:parse', async (_event, filePath) => {
  const html = fs.readFileSync(filePath, 'utf-8');
  return parseHtml(html);
});

// ── IPC: parse HTML + generate BDD ───────────────────────────────────────────
ipcMain.handle('html:generateBdd', async (_event, filePath, apiKey, model) => {
  if (typeof apiKey !== 'string' || !/^[A-Za-z0-9\-_]{10,}$/.test(apiKey.trim())) {
    throw new Error('Invalid API key format.');
  }
  const html = fs.readFileSync(filePath, 'utf-8');
  const pageJson = parseHtml(html);
  const bdd = await generateBdd(pageJson, apiKey.trim(), model || 'gpt-4o-mini');
  return { json: pageJson, bdd };
});

// ── IPC: save text to file ────────────────────────────────────────────────────
ipcMain.handle('file:save', async (_event, filePath, content) => {
  fs.writeFileSync(filePath, content, 'utf-8');
  return true;
});
