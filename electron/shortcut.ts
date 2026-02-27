/**
 * 快捷方式解析模块
 * 用于解析 Windows .lnk 文件
 */

import { shell } from 'electron'
import { readFileSync, existsSync } from 'node:fs'
import { extname, basename } from 'node:path'

export interface ShortcutInfo {
  name: string
  targetPath: string
  arguments: string
  workingDirectory: string
  description: string
  iconPath: string
  iconIndex: number
  exists: boolean
}

/**
 * 解析 .lnk 文件的元数据
 * 注意：这是一个简化版本，完整解析需要使用 Windows API 或第三方库
 */
export function parseShortcut(lnkPath: string): ShortcutInfo | null {
  try {
    if (!lnkPath.endsWith('.lnk')) {
      return null
    }

    const filename = basename(lnkPath, '.lnk')
    const exists = existsSync(lnkPath)

    // 基础信息
    const info: ShortcutInfo = {
      name: filename,
      targetPath: '',
      arguments: '',
      workingDirectory: '',
      description: '',
      iconPath: '',
      iconIndex: 0,
      exists
    }

    // 注意：完整的 .lnk 文件解析需要使用 Windows Shell API
    // 这里提供一个简化的实现，实际使用时可能需要安装额外的依赖
    // 例如：windows-shortcuts 或通过 PowerShell 解析

    // 尝试读取文件的基本信息
    if (exists) {
      try {
        const buffer = readFileSync(lnkPath)
        // .lnk 文件格式复杂，这里只做基本检测
        if (buffer.length > 4 && buffer.readUInt32LE(0) === 0x4C000000) {
          // 这是一个有效的 .lnk 文件
          info.description = `快捷方式: ${filename}`
        }
      } catch {
        // 读取失败，使用默认值
      }
    }

    return info
  } catch (error) {
    console.error('解析快捷方式失败:', error)
    return null
  }
}

/**
 * 启动快捷方式指向的应用
 */
export async function launchShortcut(lnkPath: string): Promise<boolean> {
  try {
    // 使用 Electron 的 shell.openPath 来打开 .lnk 文件
    // 这会自动启动快捷方式指向的应用
    await shell.openPath(lnkPath)
    return true
  } catch (error) {
    console.error('启动快捷方式失败:', error)
    return false
  }
}

/**
 * 打开快捷方式属性对话框
 */
export async function showShortcutProperties(lnkPath: string): Promise<void> {
  // 在 Windows 上显示文件属性
  await shell.openPath(lnkPath)
}

/**
 * 判断文件是否为快捷方式
 */
export function isShortcut(filePath: string): boolean {
  return extname(filePath).toLowerCase() === '.lnk'
}

/**
 * 从快捷方式路径中提取目标路径
 * 这需要 Windows API 支持，这里提供简化版本
 */
export function getShortcutTarget(lnkPath: string): string | null {
  const info = parseShortcut(lnkPath)
  return info?.targetPath || null
}

/**
 * 获取快捷方式图标
 */
export function getShortcutIcon(lnkPath: string): { path: string; index: number } | null {
  const info = parseShortcut(lnkPath)
  if (info && info.iconPath) {
    return { path: info.iconPath, index: info.iconIndex }
  }
  return null
}
