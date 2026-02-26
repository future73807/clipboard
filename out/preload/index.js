"use strict";
const electron = require("electron");
const electronAPI = {
  getClipboardContent: () => electron.ipcRenderer.invoke("get-clipboard-content"),
  setClipboardContent: (content) => electron.ipcRenderer.invoke("set-clipboard-content", content),
  showFloatingWindow: () => electron.ipcRenderer.invoke("show-floating-window"),
  hideFloatingWindow: () => electron.ipcRenderer.invoke("hide-floating-window"),
  getAppVersion: () => electron.ipcRenderer.invoke("get-app-version"),
  getClipboardHistory: () => electron.ipcRenderer.invoke("get-clipboard-history"),
  clearClipboardHistory: () => electron.ipcRenderer.invoke("clear-clipboard-history"),
  deleteClipboardItem: (id) => electron.ipcRenderer.invoke("delete-clipboard-item", id),
  updateClipboardItem: (id, updates) => electron.ipcRenderer.invoke("update-clipboard-item", id, updates),
  pasteFromHistory: (index) => electron.ipcRenderer.invoke("paste-from-history", index),
  onClipboardChanged: (callback) => {
    electron.ipcRenderer.on("clipboard-changed", (_, content) => callback(content));
  },
  onPasteFromHistory: (callback) => {
    electron.ipcRenderer.on("paste-from-history", (_, index) => callback(index));
  },
  removeAllListeners: (channel) => {
    electron.ipcRenderer.removeAllListeners(channel);
  },
  enableEncryption: (password) => electron.ipcRenderer.invoke("enable-encryption", password),
  unlockEncryption: (password) => electron.ipcRenderer.invoke("unlock-encryption", password),
  disableEncryption: (password) => electron.ipcRenderer.invoke("disable-encryption", password),
  getEncryptionStatus: () => electron.ipcRenderer.invoke("get-encryption-status"),
  ocrImage: (imageBase64) => electron.ipcRenderer.invoke("ocr-image", imageBase64)
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electronAPI", electronAPI);
  } catch (error) {
    console.error("Failed to expose electronAPI:", error);
  }
} else {
  window.electronAPI = electronAPI;
}
