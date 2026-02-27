/**
 * 右键菜单集成模块
 * 用于在 Windows 资源管理器右键菜单中添加"添加到超级剪贴板"选项
 */

import { app, shell, ipcMain } from 'electron'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { join } from 'node:path'
import { existsSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs'

const execAsync = promisify(exec)

// 注册表项路径
const REGISTRY_KEY = 'HKCR\\*\\shell\\AddToClipboard'
const REGISTRY_KEY_DIRECTORY = 'HKCR\\Directory\\shell\\AddToClipboard'
const REGISTRY_KEY_BACKGROUND = 'HKCR\\Directory\\Background\\shell\\AddToClipboard'

export interface ContextMenuOptions {
  enabled: boolean
  showForFiles: boolean
  showForDirectories: boolean
}

/**
 * 检查是否在 Windows 平台
 */
function isWindows(): boolean {
  return process.platform === 'win32'
}

/**
 * 检查是否以管理员权限运行
 */
async function isAdmin(): Promise<boolean> {
  if (!isWindows()) return false

  try {
    // 尝试执行需要管理员权限的操作
    await execAsync('net session 2>&1')
    return true
  } catch {
    return false
  }
}

/**
 * 获取应用程序可执行文件路径
 */
function getExePath(): string {
  const exePath = app.getPath('exe')
  return exePath
}

/**
 * 注册右键菜单
 */
export async function registerContextMenu(): Promise<{ success: boolean; error?: string }> {
  if (!isWindows()) {
    return { success: false, error: '右键菜单仅支持 Windows 系统' }
  }

  const admin = await isAdmin()
  if (!admin) {
    return { success: false, error: '需要管理员权限才能注册右键菜单' }
  }

  try {
    const exePath = getExePath()

    // 注册文件右键菜单
    await execAsync(
      `reg add "${REGISTRY_KEY}" /ve /d "添加到超级剪贴板" /f`
    )
    await execAsync(
      `reg add "${REGISTRY_KEY}\\command" /ve /d "${exePath} add-file \\"%1\\"" /f`
    )

    // 注册目录右键菜单
    await execAsync(
      `reg add "${REGISTRY_KEY_DIRECTORY}" /ve /d "添加到超级剪贴板" /f`
    )
    await execAsync(
      `reg add "${REGISTRY_KEY_DIRECTORY}\\command" /ve /d "${exePath} add-file \\"%1\\"" /f`
    )

    // 注册目录背景右键菜单
    await execAsync(
      `reg add "${REGISTRY_KEY_BACKGROUND}" /ve /d "添加到超级剪贴板" /f`
    )
    await execAsync(
      `reg add "${REGISTRY_KEY_BACKGROUND}\\command" /ve /d "${exePath} add-file \\"%V\\"" /f`
    )

    return { success: true }
  } catch (error) {
    console.error('注册右键菜单失败:', error)
    return { success: false, error: '注册失败，请检查管理员权限' }
  }
}

/**
 * 注销右键菜单
 */
export async function unregisterContextMenu(): Promise<{ success: boolean; error?: string }> {
  if (!isWindows()) {
    return { success: false, error: '右键菜单仅支持 Windows 系统' }
  }

  const admin = await isAdmin()
  if (!admin) {
    return { success: false, error: '需要管理员权限才能注销右键菜单' }
  }

  try {
    // 删除文件右键菜单
    try {
      await execAsync(`reg delete "${REGISTRY_KEY}" /f`)
    } catch {
      // 忽略不存在的键
    }

    // 删除目录右键菜单
    try {
      await execAsync(`reg delete "${REGISTRY_KEY_DIRECTORY}" /f`)
    } catch {
      // 忽略不存在的键
    }

    // 删除目录背景右键菜单
    try {
      await execAsync(`reg delete "${REGISTRY_KEY_BACKGROUND}" /f`)
    } catch {
      // 忽略不存在的键
    }

    return { success: true }
  } catch (error) {
    console.error('注销右键菜单失败:', error)
    return { success: false, error: '注销失败' }
  }
}

/**
 * 检查右键菜单是否已注册
 */
export async function isContextMenuRegistered(): Promise<boolean> {
  if (!isWindows()) return false

  try {
    const { stdout } = await execAsync(
      `reg query "${REGISTRY_KEY}" /ve 2>&1`
    )
    return stdout.includes('添加到超级剪贴板')
  } catch {
    return false
  }
}

/**
 * 获取右键菜单状态
 */
export async function getContextMenuStatus(): Promise<ContextMenuOptions> {
  const registered = await isContextMenuRegistered()
  return {
    enabled: registered,
    showForFiles: registered,
    showForDirectories: registered
  }
}

/**
 * 处理命令行参数（从右键菜单启动时）
 */
export function handleContextMenuArgs(argv: string[]): { action: string; path: string } | null {
  // 检查是否有 add-file 参数
  const addFileIndex = argv.indexOf('add-file')
  if (addFileIndex !== -1 && argv[addFileIndex + 1]) {
    return {
      action: 'add-file',
      path: argv[addFileIndex + 1].replace(/^"|"$/g, '') // 移除引号
    }
  }
  return null
}
