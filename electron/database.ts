import Database from 'better-sqlite3'
import { join } from 'node:path'
import { app } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { ClipboardHistoryItem } from './types'

let db: Database.Database | null = null

export function initializeDatabase(): void {
  try {
    const dbPath = join(app.getPath('userData'), 'clipboard.db')
    db = new Database(dbPath)
    
    // 创建剪贴板历史表
    db.exec(`
      CREATE TABLE IF NOT EXISTS clipboard_history (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        type TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        size INTEGER NOT NULL,
        formats TEXT,
        full_content TEXT,
        is_favorite BOOLEAN DEFAULT 0,
        tags TEXT,
        is_encrypted BOOLEAN DEFAULT 0,
        iv TEXT,
        auth_tag TEXT,
        salt TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // 尝试添加新列（如果表已存在）
    try {
      db.exec('ALTER TABLE clipboard_history ADD COLUMN is_encrypted BOOLEAN DEFAULT 0')
      db.exec('ALTER TABLE clipboard_history ADD COLUMN iv TEXT')
      db.exec('ALTER TABLE clipboard_history ADD COLUMN auth_tag TEXT')
      db.exec('ALTER TABLE clipboard_history ADD COLUMN salt TEXT')
    } catch (e) {
      // 忽略列已存在的错误
    }
    
    // 创建索引以提高查询性能
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_timestamp ON clipboard_history(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_type ON clipboard_history(type);
      CREATE INDEX IF NOT EXISTS idx_content ON clipboard_history(content);
    `)
    
    console.log('数据库初始化成功')
  } catch (error) {
    console.error('数据库初始化失败:', error)
    throw error
  }
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('数据库未初始化')
  }
  return db
}

export function addClipboardItem(item: Omit<ClipboardHistoryItem, 'id'>): ClipboardHistoryItem {
  const db = getDatabase()
  const id = uuidv4()
  
  try {
    const stmt = db.prepare(`
      INSERT INTO clipboard_history (
        id, content, type, timestamp, size, formats, full_content,
        is_encrypted, iv, auth_tag, salt, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    stmt.run(
      id,
      item.content,
      item.type,
      item.timestamp,
      item.size,
      item.formats ? JSON.stringify(item.formats) : null,
      item.fullContent ? JSON.stringify(item.fullContent) : null,
      item.isEncrypted ? 1 : 0,
      item.encryptionData?.iv || null,
      item.encryptionData?.authTag || null,
      item.encryptionData?.salt || null,
      item.tags ? JSON.stringify(item.tags) : null
    )
    
    return { ...item, id }
  } catch (error) {
    console.error('添加剪贴板项目失败:', error)
    throw error
  }
}

export function getClipboardHistory(limit: number = 100): ClipboardHistoryItem[] {
  const db = getDatabase()
  
  try {
    const stmt = db.prepare(`
      SELECT * FROM clipboard_history 
      ORDER BY timestamp DESC 
      LIMIT ?
    `)
    
    const rows = stmt.all(limit) as any[]
    
    return rows.map(row => ({
      id: row.id,
      content: row.content,
      type: row.type as 'text' | 'html' | 'rtf' | 'image' | 'url',
      timestamp: row.timestamp,
      size: row.size,
      formats: row.formats ? JSON.parse(row.formats) : undefined,
      fullContent: row.full_content ? JSON.parse(row.full_content) : undefined,
      isEncrypted: !!row.is_encrypted,
      encryptionData: row.is_encrypted ? {
        iv: row.iv,
        authTag: row.auth_tag,
        salt: row.salt
      } : undefined,
      tags: row.tags ? JSON.parse(row.tags) : undefined
    }))
  } catch (error) {
    console.error('获取剪贴板历史失败:', error)
    throw error
  }
}

export function searchClipboardHistory(query: string, limit: number = 50): ClipboardHistoryItem[] {
  const db = getDatabase()
  
  try {
    const stmt = db.prepare(`
      SELECT * FROM clipboard_history 
      WHERE content LIKE ? OR type LIKE ?
      ORDER BY timestamp DESC 
      LIMIT ?
    `)
    
    const searchTerm = `%${query}%`
    const rows = stmt.all(searchTerm, searchTerm, limit) as any[]
    
    return rows.map(row => ({
      id: row.id,
      content: row.content,
      type: row.type as 'text' | 'html' | 'rtf' | 'image' | 'url',
      timestamp: row.timestamp,
      size: row.size,
      formats: row.formats ? JSON.parse(row.formats) : undefined,
      fullContent: row.full_content ? JSON.parse(row.full_content) : undefined,
      isEncrypted: !!row.is_encrypted,
      encryptionData: row.is_encrypted ? {
        iv: row.iv,
        authTag: row.auth_tag,
        salt: row.salt
      } : undefined,
      tags: row.tags ? JSON.parse(row.tags) : undefined
    }))
  } catch (error) {
    console.error('搜索剪贴板历史失败:', error)
    throw error
  }
}

export function deleteClipboardItem(id: string): boolean {
  const db = getDatabase()
  
  try {
    const stmt = db.prepare('DELETE FROM clipboard_history WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  } catch (error) {
    console.error('删除剪贴板项目失败:', error)
    throw error
  }
}

export function clearClipboardHistory(): void {
  const db = getDatabase()
  
  try {
    db.exec('DELETE FROM clipboard_history')
    console.log('剪贴板历史已清空')
  } catch (error) {
    console.error('清空剪贴板历史失败:', error)
    throw error
  }
}

export function updateClipboardItem(id: string, updates: Partial<ClipboardHistoryItem>): boolean {
  const db = getDatabase()
  
  try {
    const fields = []
    const values = []
    
    if (updates.content !== undefined) {
      fields.push('content = ?')
      values.push(updates.content)
    }
    if (updates.type !== undefined) {
      fields.push('type = ?')
      values.push(updates.type)
    }
    if (updates.formats !== undefined) {
      fields.push('formats = ?')
      values.push(JSON.stringify(updates.formats))
    }
    if (updates.fullContent !== undefined) {
      fields.push('full_content = ?')
      values.push(JSON.stringify(updates.fullContent))
    }
    if (updates.tags !== undefined) {
      fields.push('tags = ?')
      values.push(JSON.stringify(updates.tags))
    }
    
    if (fields.length === 0) {
      return false
    }
    
    values.push(id)
    const stmt = db.prepare(`UPDATE clipboard_history SET ${fields.join(', ')} WHERE id = ?`)
    const result = stmt.run(...values)
    
    return result.changes > 0
  } catch (error) {
    console.error('更新剪贴板项目失败:', error)
    throw error
  }
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
    console.log('数据库连接已关闭')
  }
}