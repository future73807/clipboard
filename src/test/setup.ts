import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'

// Mock Electron API
const mockElectronAPI = {
  getClipboardHistory: vi.fn(() => Promise.resolve([])),
  setClipboardContent: vi.fn(() => Promise.resolve({ success: true })),
  showFloatingWindow: vi.fn(() => Promise.resolve({ success: true })),
  hideFloatingWindow: vi.fn(() => Promise.resolve({ success: true })),
  getAppVersion: vi.fn(() => Promise.resolve('1.0.0')),
  clearClipboardHistory: vi.fn(() => Promise.resolve({ success: true })),
  deleteClipboardItem: vi.fn(() => Promise.resolve({ success: true })),
  updateClipboardItem: vi.fn(() => Promise.resolve({ success: true })),
  enableEncryption: vi.fn(() => Promise.resolve({ success: true })),
  unlockEncryption: vi.fn(() => Promise.resolve({ success: true })),
  disableEncryption: vi.fn(() => Promise.resolve({ success: true })),
  getEncryptionStatus: vi.fn(() => Promise.resolve({ enabled: false, unlocked: false })),
  ocrImage: vi.fn(() => Promise.resolve({ success: true, text: '' })),
  registerContextMenu: vi.fn(() => Promise.resolve({ success: true })),
  unregisterContextMenu: vi.fn(() => Promise.resolve({ success: true })),
  getContextMenuStatus: vi.fn(() => Promise.resolve({ registered: false })),
  registerShortcut: vi.fn(() => Promise.resolve({ success: true })),
  unregisterShortcut: vi.fn(() => Promise.resolve({ success: true })),
  clipboardSave: vi.fn(),
  showSaveOptions: vi.fn(),
  onShowSaveOptionsDialog: vi.fn(),
  onAddFileFromContextMenu: vi.fn(),
  onClipboardChanged: vi.fn(),
  removeAllListeners: vi.fn(),
}

// @ts-ignore
window.electronAPI = mockElectronAPI

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks()
})
