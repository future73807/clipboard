import { app } from 'electron'
import { join } from 'node:path'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

interface FloatingWindowState {
  x?: number
  y?: number
  width: number
  height: number
}

interface Settings {
  enableEncryption: boolean
  maxHistoryItems: number
  theme: 'light' | 'dark' | 'auto'
  passwordHash?: string
  passwordSalt?: string
  floatingWindow?: FloatingWindowState
}

const defaultSettings: Settings = {
  enableEncryption: false,
  maxHistoryItems: 100,
  theme: 'auto',
  floatingWindow: {
    width: 400,
    height: 600
  }
}

const settingsPath = join(app.getPath('userData'), 'settings.json')

export function loadSettings(): Settings {
  try {
    if (existsSync(settingsPath)) {
      const data = readFileSync(settingsPath, 'utf-8')
      return { ...defaultSettings, ...JSON.parse(data) }
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
  return defaultSettings
}

export function saveSettings(settings: Partial<Settings>): void {
  try {
    const current = loadSettings()
    const newSettings = { ...current, ...settings }
    writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2), 'utf-8')
  } catch (error) {
    console.error('保存设置失败:', error)
  }
}
