// 剪贴板条目类型 (包含历史兼容类型)
export type ClipboardType = 'text' | 'html' | 'rtf' | 'image' | 'url' | 'code' | 'file' | 'shortcut' | 'password' | 'office'

// 剪贴板条目
export interface ClipboardItem {
  id: string
  content: string
  type: ClipboardType
  title?: string
  timestamp: string
  size: number
  formats?: string[]
  fullContent?: {
    text?: string
    html?: string
    rtf?: string
    image?: string
    imageSize?: { width: number; height: number }
  }
  isEncrypted?: boolean
  encryptionData?: {
    iv: string
    authTag: string
    salt: string
  }
  isFavorite?: boolean
  groupId?: string
  tags?: string[]
  metadata?: Record<string, unknown>
}

// 分组
export interface Group {
  id: string
  name: string
  parentId?: string
  icon?: string
  color?: string
  sortOrder: number
  createdAt: string
}

// 标签
export interface Tag {
  id: string
  name: string
  color: string
  createdAt: string
}

// 版本历史
export interface Version {
  id: string
  itemId: string
  content: string
  hash: string
  changes?: string
  createdAt: string
}

// 密码条目
export interface PasswordItem {
  id: string
  title: string
  username?: string
  password: string
  url?: string
  notes?: string
  category?: string
  iv: string
  authTag: string
  salt: string
  createdAt: string
  updatedAt: string
  lastUsedAt?: string
}

// 办公文件
export interface OfficeFileItem {
  id: string
  itemId: string
  filePath: string
  fileType: 'word' | 'excel' | 'ppt' | 'pdf'
  fileSize: number
  preview?: string
  createdAt: string
}

// 加密状态
export interface EncryptionStatus {
  enabled: boolean
  unlocked: boolean
}

// 应用设置
export interface AppSettings {
  autoStart: boolean
  showInTray: boolean
  maxHistoryItems: number
  monitorInterval: number
  floatingWindowOpacity: number
  theme: 'light' | 'dark' | 'auto'
  language: string
  enableEncryption: boolean
  passwordHash?: string
  passwordSalt?: string
}

// Electron API
export interface ElectronAPI {
  getClipboardHistory: () => Promise<ClipboardItem[]>
  setClipboardContent: (content: string) => Promise<{ success: boolean }>
  showFloatingWindow: () => Promise<{ success: boolean }>
  hideFloatingWindow: () => Promise<{ success: boolean }>
  clearClipboardHistory: () => Promise<{ success: boolean }>
  deleteClipboardItem: (id: string) => Promise<{ success: boolean }>
  updateClipboardItem: (id: string, updates: Partial<ClipboardItem>) => Promise<{ success: boolean }>
  enableEncryption: (password: string) => Promise<{ success: boolean; error?: string }>
  unlockEncryption: (password: string) => Promise<{ success: boolean; error?: string }>
  disableEncryption: (password: string) => Promise<{ success: boolean; error?: string }>
  getEncryptionStatus: () => Promise<EncryptionStatus>
  ocrImage: (imageBase64: string) => Promise<{ success: boolean; text?: string; error?: string }>
  onClipboardChanged: (callback: (item: ClipboardItem) => void) => void
  removeAllListeners: (channel: string) => void
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

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
