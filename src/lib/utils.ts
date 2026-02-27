import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()

  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} 分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)} 小时前`
  } else if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)} 天前`
  } else {
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function detectCodeLanguage(code: string): string {
  // Simple language detection based on patterns
  const patterns: Record<string, RegExp> = {
    typescript: /^\s*(import|export|interface|type|const|let|var)\s+/m,
    javascript: /^\s*(function|const|let|var|import|export)\s+/m,
    python: /^\s*(def|class|import|from)\s+/m,
    rust: /^\s*(fn|let|mut|pub|use)\s+/m,
    go: /^\s*(package|func|import|var|type)\s+/m,
    java: /^\s*(package|import|public|private|class)\s+/m,
    html: /^\s*<!DOCTYPE|<html|<head|<body/i,
    css: /^\s*(\.|#|@media|body|html)\s*[\{]/m,
    json: /^\s*[\{\[]/,
    yaml: /^\s*[\w-]+:\s/m,
    markdown: /^#{1,6}\s|^\*{1,2}|^>{1,3}/m,
    sql: /^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/im,
    shell: /^\s*#!\/bin\/bash|^\s*(echo|cd|ls|grep|sudo)\s/m,
  }

  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(code)) {
      return lang
    }
  }

  return 'text'
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
