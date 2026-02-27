import { contextBridge, ipcRenderer } from 'electron'

export interface ElectronAPI {
  getClipboardContent: () => Promise<any>
  setClipboardContent: (content: string) => Promise<any>
  showFloatingWindow: () => Promise<any>
  hideFloatingWindow: () => Promise<any>
  getAppVersion: () => Promise<string>
  getClipboardHistory: () => Promise<any[]>
  clearClipboardHistory: () => Promise<any>
  deleteClipboardItem: (id: string) => Promise<{ success: boolean; error?: string }>
  updateClipboardItem: (id: string, updates: any) => Promise<{ success: boolean; error?: string }>
  pasteFromHistory: (index: number) => Promise<any>
  onClipboardChanged: (callback: (content: any) => void) => void
  onPasteFromHistory: (callback: (index: number) => void) => void
  removeAllListeners: (channel: string) => void

  // Encryption
  enableEncryption: (password: string) => Promise<{ success: boolean; error?: string }>
  unlockEncryption: (password: string) => Promise<{ success: boolean; error?: string }>
  disableEncryption: (password: string) => Promise<{ success: boolean; error?: string }>
  getEncryptionStatus: () => Promise<{ enabled: boolean; unlocked: boolean }>

  // OCR
  ocrImage: (imageBase64: string) => Promise<{ success: boolean; text?: string; error?: string }>

  // Context Menu
  registerContextMenu: () => Promise<{ success: boolean; error?: string }>
  unregisterContextMenu: () => Promise<{ success: boolean; error?: string }>
  getContextMenuStatus: () => Promise<{ registered: boolean }>

  // Shortcuts
  registerShortcut: (shortcut: string, action: string) => Promise<{ success: boolean; error?: string }>
  unregisterShortcut: (shortcut: string) => Promise<{ success: boolean; error?: string }>

  // Copy Confirm
  clipboardSave: (content: string) => void
  showSaveOptions: (content: string) => void
  onShowSaveOptionsDialog: (callback: (content: string) => void) => void
  onAddFileFromContextMenu: (callback: (path: string) => void) => void
}

const electronAPI: ElectronAPI = {
  getClipboardContent: () => ipcRenderer.invoke('get-clipboard-content'),
  setClipboardContent: (content: string) => ipcRenderer.invoke('set-clipboard-content', content),
  showFloatingWindow: () => ipcRenderer.invoke('show-floating-window'),
  hideFloatingWindow: () => ipcRenderer.invoke('hide-floating-window'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getClipboardHistory: () => ipcRenderer.invoke('get-clipboard-history'),
  clearClipboardHistory: () => ipcRenderer.invoke('clear-clipboard-history'),
  deleteClipboardItem: (id: string) => ipcRenderer.invoke('delete-clipboard-item', id),
  updateClipboardItem: (id: string, updates: any) => ipcRenderer.invoke('update-clipboard-item', id, updates),
  pasteFromHistory: (index: number) => ipcRenderer.invoke('paste-from-history', index),
  
  onClipboardChanged: (callback: (content: any) => void) => {
    ipcRenderer.on('clipboard-changed', (_, content) => callback(content))
  },
  
  onPasteFromHistory: (callback: (index: number) => void) => {
    ipcRenderer.on('paste-from-history', (_, index) => callback(index))
  },
  
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  },

  enableEncryption: (password: string) => ipcRenderer.invoke('enable-encryption', password),
  unlockEncryption: (password: string) => ipcRenderer.invoke('unlock-encryption', password),
  disableEncryption: (password: string) => ipcRenderer.invoke('disable-encryption', password),
  getEncryptionStatus: () => ipcRenderer.invoke('get-encryption-status'),

  ocrImage: (imageBase64: string) => ipcRenderer.invoke('ocr-image', imageBase64),

  // Context Menu
  registerContextMenu: () => ipcRenderer.invoke('register-context-menu'),
  unregisterContextMenu: () => ipcRenderer.invoke('unregister-context-menu'),
  getContextMenuStatus: () => ipcRenderer.invoke('get-context-menu-status'),

  // Shortcuts
  registerShortcut: (shortcut: string, action: string) => ipcRenderer.invoke('register-shortcut', shortcut, action),
  unregisterShortcut: (shortcut: string) => ipcRenderer.invoke('unregister-shortcut', shortcut),

  // Copy Confirm
  clipboardSave: (content: string) => ipcRenderer.send('clipboard-save', content),
  showSaveOptions: (content: string) => ipcRenderer.send('show-save-options', content),
  onShowSaveOptionsDialog: (callback: (content: string) => void) => {
    ipcRenderer.on('show-save-options-dialog', (_, content) => callback(content))
  },
  onAddFileFromContextMenu: (callback: (path: string) => void) => {
    ipcRenderer.on('add-file-from-context-menu', (_, path) => callback(path))
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', electronAPI)
  } catch (error) {
    console.error('Failed to expose electronAPI:', error)
  }
} else {
  // @ts-ignore
  window.electronAPI = electronAPI
}

export type ElectronAPIType = ElectronAPI