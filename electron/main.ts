import { app, shell, BrowserWindow, ipcMain, clipboard, globalShortcut, Tray, Menu, nativeImage, screen } from 'electron'
import type { Event } from 'electron'
import { join } from 'node:path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { WindowState, ClipboardContent, ClipboardHistoryItem } from './types'
import { initializeDatabase, addClipboardItem, getClipboardHistory, clearClipboardHistory as dbClearClipboardHistory, searchClipboardHistory, deleteClipboardItem, updateClipboardItem } from './database'
import { loadSettings, saveSettings } from './settings'
import { encrypt, decrypt } from './crypto'
import { scryptSync, randomBytes } from 'node:crypto'
import { recognizeText } from './ocr'
import { detectContentType } from './utils'
import { registerContextMenu, unregisterContextMenu, isContextMenuRegistered, handleContextMenuArgs } from './contextMenu'

// 全局退出标志
let isQuitting = false

// 单实例锁定 - 确保只有一个应用实例运行
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  // 如果获取不到锁，说明已有实例运行，退出
  app.quit()
} else {
  // 当第二个实例启动时，聚焦到已有窗口
  app.on('second-instance', (_, argv) => {
    // 显示主窗口
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
    // 处理从右键菜单启动的参数
    const args = handleContextMenuArgs(argv)
    if (args) {
      if (args.action === 'add-file') {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
          mainWindow.webContents.send('add-file-from-context-menu', args.path)
        }
      }
    }
  })
}

const windowState: WindowState = {
  main: {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600
  },
  floating: {
    width: 400,
    height: 600,
    minWidth: 300,
    minHeight: 400
  }
}

let mainWindow: BrowserWindow | null = null
let floatingWindow: BrowserWindow | null = null
let tray: Tray | null = null
let clipboardHistory: ClipboardHistoryItem[] = []
let lastClipboardContent: string = ''
let clipboardMonitorInterval: NodeJS.Timeout | null = null
let settings = loadSettings()
let sessionPassword: string | null = null

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: windowState.main.width,
    height: windowState.main.height,
    minWidth: windowState.main.minWidth,
    minHeight: windowState.main.minHeight,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // 关闭窗口时隐藏到系统托盘而不是退出
  mainWindow.on('close', (event: Event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  // 最小化时隐藏到系统托盘
  mainWindow.on('minimize', (event: Event) => {
    event.preventDefault()
    mainWindow?.hide()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createFloatingWindow(): void {
  // 从设置中获取保存的窗口状态
  const savedState = settings.floatingWindow || { width: 400, height: 600 }

  floatingWindow = new BrowserWindow({
    width: savedState.width,
    height: savedState.height,
    minWidth: windowState.floating.minWidth,
    minHeight: windowState.floating.minHeight,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 如果有保存的位置，恢复窗口位置
  if (savedState.x !== undefined && savedState.y !== undefined) {
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.workAreaSize

    // 确保窗口位置在屏幕范围内
    const x = Math.max(0, Math.min(savedState.x, width - savedState.width))
    const y = Math.max(0, Math.min(savedState.y, height - savedState.height))
    floatingWindow.setPosition(x, y)
  }

  // 监听窗口大小变化，保存状态
  floatingWindow.on('resize', () => {
    if (floatingWindow) {
      const [width, height] = floatingWindow.getSize()
      const [x, y] = floatingWindow.getPosition()
      saveSettings({
        floatingWindow: { x, y, width, height }
      })
    }
  })

  // 监听窗口移动，保存状态
  floatingWindow.on('move', () => {
    if (floatingWindow) {
      const [width, height] = floatingWindow.getSize()
      const [x, y] = floatingWindow.getPosition()
      saveSettings({
        floatingWindow: { x, y, width, height }
      })
    }
  })

  floatingWindow.on('blur', () => {
    floatingWindow?.hide()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    floatingWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '#/floating')
  } else {
    floatingWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: '#/floating' })
  }
}

function createTray(): void {
  let trayIcon: Electron.NativeImage

  try {
    const iconPath = join(__dirname, '../../resources/icon.png')
    trayIcon = nativeImage.createFromPath(iconPath)

    // 如果图标加载失败，创建一个默认图标
    if (trayIcon.isEmpty()) {
      // 创建一个 16x16 的蓝色方块作为默认图标
      trayIcon = nativeImage.createEmpty()
    }
  } catch (error) {
    console.error('加载托盘图标失败:', error)
    trayIcon = nativeImage.createEmpty()
  }

  // 使用原始图标或调整大小后的图标
  const iconToUse = trayIcon.isEmpty() ? trayIcon : trayIcon.resize({ width: 16, height: 16 })

  try {
    tray = new Tray(iconToUse.isEmpty() ? nativeImage.createEmpty() : iconToUse)
  } catch (error) {
    console.error('创建托盘失败:', error)
    return
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    },
    {
      label: '显示浮动窗口',
      click: () => {
        showFloatingWindow()
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setToolTip('剪贴板管理器')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    }
  })
}

function showFloatingWindow(): void {
  if (!floatingWindow) {
    createFloatingWindow()
  }

  if (floatingWindow) {
    // 使用保存的位置，如果没有则跟随鼠标
    const savedState = settings.floatingWindow
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.workAreaSize

    if (savedState?.x !== undefined && savedState?.y !== undefined) {
      // 使用保存的位置，但确保在屏幕范围内
      const [winWidth, winHeight] = floatingWindow.getSize()
      const x = Math.max(0, Math.min(savedState.x, width - winWidth))
      const y = Math.max(0, Math.min(savedState.y, height - winHeight))
      floatingWindow.setPosition(x, y)
    } else {
      // 没有保存的位置，跟随鼠标显示
      const cursorPoint = screen.getCursorScreenPoint()
      const [winWidth, winHeight] = floatingWindow.getSize()

      let x = cursorPoint.x - winWidth / 2
      let y = cursorPoint.y - winHeight / 2

      if (x < 0) x = 10
      if (y < 0) y = 10
      if (x + winWidth > width) x = width - winWidth - 10
      if (y + winHeight > height) y = height - winHeight - 10

      floatingWindow.setPosition(Math.round(x), Math.round(y))
    }

    floatingWindow.show()
    floatingWindow.focus()
  }
}

function hideFloatingWindow(): void {
  floatingWindow?.hide()
}

function registerGlobalShortcuts(): void {
  globalShortcut.register('CommandOrControl+Shift+V', () => {
    showFloatingWindow()
  })
  
  globalShortcut.register('CommandOrControl+Alt+C', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    }
  })
}

function startClipboardMonitoring(): void {
  clipboardMonitorInterval = setInterval(() => {
    try {
      const { formats, content } = getCurrentClipboardFormats()
      const contentString = JSON.stringify(content)
      
      if (formats.length > 0 && contentString !== lastClipboardContent) {
        lastClipboardContent = contentString
        
        // 如果启用了加密但未解锁，则不保存历史记录
        if (settings.enableEncryption && !sessionPassword) {
          return
        }
        
        const newItem: ClipboardHistoryItem = {
          id: Date.now().toString(),
          content: content.text || contentString,
          type: formats.includes('image') ? 'image' : formats.includes('html') ? 'html' : formats.includes('rtf') ? 'rtf' : 'text',
          timestamp: new Date().toISOString(),
          size: contentString.length,
          formats: formats,
          fullContent: content
        }
        
        // 保存到数据库
        try {
          if (settings.enableEncryption && sessionPassword) {
            const encrypted = encrypt(newItem.content, sessionPassword)
            newItem.content = encrypted.content
            newItem.isEncrypted = true
            newItem.encryptionData = {
              iv: encrypted.iv,
              authTag: encrypted.authTag,
              salt: encrypted.salt
            }
            
            // 加密完整内容
            if (newItem.fullContent) {
               // 这里为了简化，如果加密启用，暂不保存完整内容，或者需要另外加密
               // 简单做法：将 fullContent 序列化后加密存储在 content 字段（如果是文本类型），
               // 或者扩展 DB 支持 full_content_encrypted。
               // MVP 方案：仅加密主要内容。对于图片等大文件，加密可能影响性能。
               // 暂时置空 fullContent 以保护隐私
               delete newItem.fullContent
            }
          }

          addClipboardItem({
            content: newItem.content,
            type: newItem.type,
            timestamp: newItem.timestamp,
            size: newItem.size,
            formats: newItem.formats,
            fullContent: newItem.fullContent,
            isEncrypted: newItem.isEncrypted,
            encryptionData: newItem.encryptionData
          })
        } catch (error) {
          console.error('保存到数据库失败:', error)
        }
        
        clipboardHistory.unshift(newItem)
        
        if (clipboardHistory.length > 100) {
          clipboardHistory = clipboardHistory.slice(0, 100)
        }
        
        mainWindow?.webContents.send('clipboard-changed', newItem)
        floatingWindow?.webContents.send('clipboard-changed', newItem)
      }
    } catch (error) {
      console.error('剪贴板监控错误:', error)
    }
  }, 1000)
}

function stopClipboardMonitoring(): void {
  if (clipboardMonitorInterval) {
    clearInterval(clipboardMonitorInterval)
    clipboardMonitorInterval = null
  }
}

function getCurrentClipboardContent(): string {
  const formats = clipboard.availableFormats()
  
  if (formats.includes('text')) {
    return clipboard.readText()
  }
  
  if (formats.includes('html')) {
    return clipboard.readHTML()
  }
  
  if (formats.includes('rtf')) {
    return clipboard.readRTF()
  }
  
  if (formats.includes('image')) {
    const image = clipboard.readImage()
    return `data:image/png;base64,${image.toPNG().toString('base64')}`
  }
  
  return ''
}

function getCurrentClipboardFormats(): { formats: string[], content: any } {
  const formats = clipboard.availableFormats()
  const content: any = {}
  
  try {
    if (formats.includes('text')) {
      content.text = clipboard.readText()
    }
    
    if (formats.includes('html')) {
      content.html = clipboard.readHTML()
    }
    
    if (formats.includes('rtf')) {
      content.rtf = clipboard.readRTF()
    }
    
    if (formats.includes('image')) {
      const image = clipboard.readImage()
      content.image = `data:image/png;base64,${image.toPNG().toString('base64')}`
      content.imageSize = { width: image.getSize().width, height: image.getSize().height }
    }
  } catch (error) {
    console.error('读取剪贴板格式失败:', error)
  }
  
  return { formats, content }
}

function addToClipboardHistory(content: string): void {
  const newItem: ClipboardHistoryItem = {
    id: Date.now().toString(),
    content,
    type: detectContentType(content),
    timestamp: new Date().toISOString(),
    size: content.length
  }
  
  clipboardHistory.unshift(newItem)
  
  if (clipboardHistory.length > 100) {
    clipboardHistory = clipboardHistory.slice(0, 100)
  }
}


app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 初始化数据库
  try {
    initializeDatabase()
    console.log('数据库初始化完成')
  } catch (error) {
    console.error('数据库初始化失败:', error)
  }

  createMainWindow()
  createFloatingWindow()
  createTray()
  registerGlobalShortcuts()
  startClipboardMonitoring()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

// 不在关闭窗口时退出应用，保持托盘运行
app.on('window-all-closed', () => {
  // 不执行任何操作，保持应用在托盘运行
  // 用户需要通过托盘菜单退出
})

app.on('before-quit', () => {
  isQuitting = true
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  stopClipboardMonitoring()

  // 关闭数据库连接
  try {
    const { closeDatabase } = require('./database')
    closeDatabase()
  } catch (error) {
    console.error('关闭数据库失败:', error)
  }
})

ipcMain.handle('get-clipboard-content', async () => {
  try {
    const formats = clipboard.availableFormats()
    const content: any = {}
    
    if (formats.includes('text')) {
      content.text = clipboard.readText()
    }
    
    if (formats.includes('html')) {
      content.html = clipboard.readHTML()
    }
    
    if (formats.includes('image')) {
      const image = clipboard.readImage()
      content.image = image.toDataURL()
      content.imageSize = { width: image.getSize().width, height: image.getSize().height }
    }
    
    if (formats.includes('rtf')) {
      content.rtf = clipboard.readRTF()
    }

    return {
      formats,
      content,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('读取剪贴板失败:', error)
    return { error: '读取剪贴板失败' }
  }
})

ipcMain.handle('set-clipboard-content', async (_, content: string) => {
  try {
    if (content.startsWith('data:image/')) {
      const image = nativeImage.createFromDataURL(content)
      clipboard.writeImage(image)
    } else {
      clipboard.writeText(content)
    }
    return { success: true }
  } catch (error) {
    console.error('写入剪贴板失败:', error)
    return { error: '写入剪贴板失败' }
  }
})

ipcMain.handle('show-floating-window', async () => {
  showFloatingWindow()
  return { success: true }
})

ipcMain.handle('hide-floating-window', async () => {
  hideFloatingWindow()
  return { success: true }
})

ipcMain.handle('get-app-version', async () => {
  return app.getVersion()
})

ipcMain.handle('get-clipboard-history', async () => {
  try {
    // 从数据库获取历史记录
    const dbHistory = getClipboardHistory(100)
    
    // 如果已解锁，解密内容
    if (sessionPassword) {
      dbHistory.forEach(item => {
        if (item.isEncrypted && item.encryptionData) {
          try {
            item.content = decrypt({
              content: item.content,
              iv: item.encryptionData.iv,
              authTag: item.encryptionData.authTag,
              salt: item.encryptionData.salt
            }, sessionPassword!)
            // 解密成功
          } catch (e) {
            console.error('解密失败:', e)
            item.content = '[解密失败]'
          }
        }
      })
    } else {
      // 未解锁，替换内容为占位符
      dbHistory.forEach(item => {
        if (item.isEncrypted) {
          item.content = '[已加密内容 - 请解锁查看]'
          delete item.fullContent
        }
      })
    }

    // 更新内存缓存
    clipboardHistory = dbHistory
    return dbHistory
  } catch (error) {
    console.error('获取剪贴板历史失败:', error)
    return clipboardHistory
  }
})

ipcMain.handle('clear-clipboard-history', async () => {
  try {
    dbClearClipboardHistory()
    clipboardHistory = []
    return { success: true }
  } catch (error) {
    console.error('清空剪贴板历史失败:', error)
    return { error: '清空失败' }
  }
})

ipcMain.handle('delete-clipboard-item', async (_, id: string) => {
  try {
    const success = deleteClipboardItem(id)
    return { success }
  } catch (error) {
    console.error('删除剪贴板项目失败:', error)
    return { success: false, error: '删除失败' }
  }
})

ipcMain.handle('update-clipboard-item', async (_, id: string, updates: any) => {
  try {
    const success = updateClipboardItem(id, updates)
    return { success }
  } catch (error) {
    console.error('更新剪贴板项目失败:', error)
    return { success: false, error: '更新失败' }
  }
})

ipcMain.handle('paste-from-history', async (_, index: number) => {
  if (index >= 0 && index < clipboardHistory.length) {
    const item = clipboardHistory[index]
    try {
      if (item.type === 'image' || item.content.startsWith('data:image/')) {
        const image = nativeImage.createFromDataURL(item.content)
        clipboard.writeImage(image)
      } else {
        clipboard.writeText(item.content)
      }
      return { success: true }
    } catch (error) {
      console.error('从历史记录粘贴失败:', error)
      return { error: '粘贴失败' }
    }
  }
  return { error: '无效的索引' }
})

ipcMain.handle('enable-encryption', async (_, password: string) => {
  try {
    const salt = randomBytes(16).toString('hex')
    const hash = scryptSync(password, salt, 64).toString('hex')
    
    settings.enableEncryption = true
    settings.passwordHash = hash
    settings.passwordSalt = salt
    saveSettings(settings)
    
    sessionPassword = password
    return { success: true }
  } catch (error) {
    console.error('启用加密失败:', error)
    return { success: false, error: '启用加密失败' }
  }
})

ipcMain.handle('unlock-encryption', async (_, password: string) => {
  if (!settings.passwordHash || !settings.passwordSalt) {
    return { success: false, error: '未设置密码' }
  }
  
  try {
    const hash = scryptSync(password, settings.passwordSalt, 64).toString('hex')
    if (hash === settings.passwordHash) {
      sessionPassword = password
      return { success: true }
    } else {
      return { success: false, error: '密码错误' }
    }
  } catch (error) {
    console.error('解锁失败:', error)
    return { success: false, error: '解锁失败' }
  }
})

ipcMain.handle('disable-encryption', async (_, password: string) => {
  if (!settings.passwordHash || !settings.passwordSalt) {
    return { success: false, error: '未设置密码' }
  }
  
  try {
    const hash = scryptSync(password, settings.passwordSalt, 64).toString('hex')
    if (hash !== settings.passwordHash) {
      return { success: false, error: '密码错误' }
    }
    
    settings.enableEncryption = false
    delete settings.passwordHash
    delete settings.passwordSalt
    saveSettings(settings)
    
    sessionPassword = null
    return { success: true }
  } catch (error) {
    console.error('禁用加密失败:', error)
    return { success: false, error: '禁用加密失败' }
  }
})

ipcMain.handle('get-encryption-status', () => {
  return {
    enabled: settings.enableEncryption,
    unlocked: !!sessionPassword
  }
})

ipcMain.handle('ocr-image', async (_, imageBase64: string) => {
  try {
    const text = await recognizeText(imageBase64)
    return { success: true, text }
  } catch (error) {
    console.error('OCR failed:', error)
    return { success: false, error: 'OCR failed' }
  }
})

// 右键菜单相关
ipcMain.handle('register-context-menu', async () => {
  return await registerContextMenu()
})

ipcMain.handle('unregister-context-menu', async () => {
  return await unregisterContextMenu()
})

ipcMain.handle('get-context-menu-status', async () => {
  const registered = await isContextMenuRegistered()
  return { registered }
})

// 快捷键相关
ipcMain.handle('register-shortcut', async (_, shortcut: string, action: string) => {
  try {
    const success = globalShortcut.register(shortcut, () => {
      switch (action) {
        case 'show-main':
          if (mainWindow) {
            mainWindow.show()
            mainWindow.focus()
          }
          break
        case 'show-floating':
          showFloatingWindow()
          break
        case 'toggle-main':
          if (mainWindow) {
            if (mainWindow.isVisible()) {
              mainWindow.hide()
            } else {
              mainWindow.show()
              mainWindow.focus()
            }
          }
          break
        default:
          console.log('Unknown action:', action)
      }
    })
    return { success }
  } catch (error) {
    console.error('注册快捷键失败:', error)
    return { success: false, error: '注册快捷键失败' }
  }
})

ipcMain.handle('unregister-shortcut', async (_, shortcut: string) => {
  try {
    globalShortcut.unregister(shortcut)
    return { success: true }
  } catch (error) {
    console.error('注销快捷键失败:', error)
    return { success: false, error: '注销快捷键失败' }
  }
})

// 复制监听确认相关
let copyConfirmWindow: BrowserWindow | null = null

function createCopyConfirmWindow(content: string, position: { x: number; y: number }): void {
  if (copyConfirmWindow) {
    copyConfirmWindow.close()
  }

  copyConfirmWindow = new BrowserWindow({
    width: 260,
    height: 100,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    transparent: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 设置窗口位置
  const display = screen.getDisplayNearestPoint(position)
  const { width: screenWidth, height: screenHeight } = display.workAreaSize
  let x = position.x
  let y = position.y + 20

  // 确保窗口在屏幕内
  if (x + 260 > screenWidth) x = screenWidth - 270
  if (y + 100 > screenHeight) y = position.y - 110

  copyConfirmWindow.setPosition(Math.round(x), Math.round(y))

  // 传递内容
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    copyConfirmWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '#/copy-confirm?content=' + encodeURIComponent(content))
  } else {
    copyConfirmWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: '#/copy-confirm?content=' + encodeURIComponent(content)
    })
  }

  // 3秒后自动关闭
  setTimeout(() => {
    copyConfirmWindow?.close()
    copyConfirmWindow = null
  }, 3000)

  copyConfirmWindow.on('closed', () => {
    copyConfirmWindow = null
  })
}

ipcMain.on('clipboard-save', (_, content: string) => {
  // 保存剪贴板内容
  const newItem: ClipboardHistoryItem = {
    id: Date.now().toString(),
    content,
    type: detectContentType(content),
    timestamp: new Date().toISOString(),
    size: content.length
  }

  try {
    addClipboardItem({
      content: newItem.content,
      type: newItem.type,
      timestamp: newItem.timestamp,
      size: newItem.size
    })

    mainWindow?.webContents.send('clipboard-changed', newItem)
    floatingWindow?.webContents.send('clipboard-changed', newItem)
  } catch (error) {
    console.error('保存剪贴板内容失败:', error)
  }
})

ipcMain.on('show-save-options', (_, content: string) => {
  // 显示更多选项对话框
  if (mainWindow) {
    mainWindow.show()
    mainWindow.focus()
    mainWindow.webContents.send('show-save-options-dialog', content)
  }
})
