export interface WindowState {
  main: {
    width: number
    height: number
    minWidth: number
    minHeight: number
  }
  floating: {
    width: number
    height: number
    minWidth: number
    minHeight: number
  }
}

export interface ClipboardContent {
  formats: string[]
  content: {
    text?: string
    html?: string
    rtf?: string
    image?: string
    imageSize?: { width: number; height: number }
  }
  timestamp: string
}

export interface ClipboardHistoryItem {
  id: string
  content: string
  type: 'text' | 'html' | 'rtf' | 'image' | 'url'
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
  tags?: string[]
}

export interface AppSettings {
  autoStart: boolean
  showInTray: boolean
  maxHistoryItems: number
  monitorInterval: number
  floatingWindowOpacity: number
  theme: 'light' | 'dark' | 'auto'
  language: string
  enableEncryption: boolean
  encryptionKey?: string
}

export interface ClipboardItem {
  id: string
  content: string
  type: string
  timestamp: Date
  size: number
  tags?: string[]
  isFavorite?: boolean
  isEncrypted?: boolean
}

export interface SearchOptions {
  query: string
  type?: string[]
  dateFrom?: Date
  dateTo?: Date
  tags?: string[]
  favoritesOnly?: boolean
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'txt'
  includeImages: boolean
  dateFrom?: Date
  dateTo?: Date
  selectedItems?: string[]
}