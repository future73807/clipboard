import Database from 'better-sqlite3'
import { join } from 'node:path'
import { app } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { ClipboardHistoryItem, ClipboardType } from './types'

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
        title TEXT,
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
        group_id TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 创建分组表
    db.exec(`
      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        parent_id TEXT,
        icon TEXT,
        color TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES groups(id)
      )
    `)

    // 创建标签表
    db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        color TEXT NOT NULL DEFAULT 'cyan',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 创建条目标签关联表
    db.exec(`
      CREATE TABLE IF NOT EXISTS item_tags (
        item_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (item_id, tag_id),
        FOREIGN KEY (item_id) REFERENCES clipboard_history(id),
        FOREIGN KEY (tag_id) REFERENCES tags(id)
      )
    `)

    // 创建版本历史表
    db.exec(`
      CREATE TABLE IF NOT EXISTS versions (
        id TEXT PRIMARY KEY,
        item_id TEXT NOT NULL,
        content TEXT NOT NULL,
        hash TEXT NOT NULL,
        changes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES clipboard_history(id)
      )
    `)

    // 尝试添加新列（如果表已存在）
    try {
      db.exec('ALTER TABLE clipboard_history ADD COLUMN is_encrypted BOOLEAN DEFAULT 0')
    } catch (e) { /* 忽略列已存在的错误 */ }
    try {
      db.exec('ALTER TABLE clipboard_history ADD COLUMN iv TEXT')
    } catch (e) { /* 忽略列已存在的错误 */ }
    try {
      db.exec('ALTER TABLE clipboard_history ADD COLUMN auth_tag TEXT')
    } catch (e) { /* 忽略列已存在的错误 */ }
    try {
      db.exec('ALTER TABLE clipboard_history ADD COLUMN salt TEXT')
    } catch (e) { /* 忽略列已存在的错误 */ }
    try {
      db.exec('ALTER TABLE clipboard_history ADD COLUMN title TEXT')
    } catch (e) { /* 忽略列已存在的错误 */ }
    try {
      db.exec('ALTER TABLE clipboard_history ADD COLUMN group_id TEXT')
    } catch (e) { /* 忽略列已存在的错误 */ }
    try {
      db.exec('ALTER TABLE clipboard_history ADD COLUMN metadata TEXT')
    } catch (e) { /* 忽略列已存在的错误 */ }
    try {
      db.exec('ALTER TABLE clipboard_history ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP')
    } catch (e) { /* 忽略列已存在的错误 */ }

    // 创建索引以提高查询性能
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_timestamp ON clipboard_history(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_type ON clipboard_history(type);
      CREATE INDEX IF NOT EXISTS idx_content ON clipboard_history(content);
      CREATE INDEX IF NOT EXISTS idx_group ON clipboard_history(group_id);
      CREATE INDEX IF NOT EXISTS idx_parent ON groups(parent_id);
      CREATE INDEX IF NOT EXISTS idx_item_versions ON versions(item_id);
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
        id, content, type, title, timestamp, size, formats, full_content,
        is_encrypted, iv, auth_tag, salt, tags, group_id, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      item.content,
      item.type,
      item.title || null,
      item.timestamp,
      item.size,
      item.formats ? JSON.stringify(item.formats) : null,
      item.fullContent ? JSON.stringify(item.fullContent) : null,
      item.isEncrypted ? 1 : 0,
      item.encryptionData?.iv || null,
      item.encryptionData?.authTag || null,
      item.encryptionData?.salt || null,
      item.tags ? JSON.stringify(item.tags) : null,
      item.groupId || null,
      item.metadata ? JSON.stringify(item.metadata) : null
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

    return rows.map(row => mapRowToItem(row))
  } catch (error) {
    console.error('获取剪贴板历史失败:', error)
    throw error
  }
}

export function getClipboardHistoryByType(type: ClipboardType, limit: number = 100): ClipboardHistoryItem[] {
  const db = getDatabase()

  try {
    const stmt = db.prepare(`
      SELECT * FROM clipboard_history
      WHERE type = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `)

    const rows = stmt.all(type, limit) as any[]

    return rows.map(row => mapRowToItem(row))
  } catch (error) {
    console.error('获取剪贴板历史失败:', error)
    throw error
  }
}

export function getFavoriteItems(limit: number = 100): ClipboardHistoryItem[] {
  const db = getDatabase()

  try {
    const stmt = db.prepare(`
      SELECT * FROM clipboard_history
      WHERE is_favorite = 1
      ORDER BY timestamp DESC
      LIMIT ?
    `)

    const rows = stmt.all(limit) as any[]

    return rows.map(row => mapRowToItem(row))
  } catch (error) {
    console.error('获取收藏项目失败:', error)
    throw error
  }
}

export function searchClipboardHistory(query: string, limit: number = 50): ClipboardHistoryItem[] {
  const db = getDatabase()

  try {
    const stmt = db.prepare(`
      SELECT * FROM clipboard_history
      WHERE content LIKE ? OR type LIKE ? OR title LIKE ?
      ORDER BY timestamp DESC
      LIMIT ?
    `)

    const searchTerm = `%${query}%`
    const rows = stmt.all(searchTerm, searchTerm, searchTerm, limit) as any[]

    return rows.map(row => mapRowToItem(row))
  } catch (error) {
    console.error('搜索剪贴板历史失败:', error)
    throw error
  }
}

export function deleteClipboardItem(id: string): boolean {
  const db = getDatabase()

  try {
    // 先删除关联的版本历史
    db.prepare('DELETE FROM versions WHERE item_id = ?').run(id)
    // 删除关联的标签
    db.prepare('DELETE FROM item_tags WHERE item_id = ?').run(id)
    // 删除条目
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
    db.exec('DELETE FROM versions')
    db.exec('DELETE FROM item_tags')
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
    const fields: string[] = []
    const values: any[] = []

    if (updates.content !== undefined) {
      fields.push('content = ?')
      values.push(updates.content)
    }
    if (updates.type !== undefined) {
      fields.push('type = ?')
      values.push(updates.type)
    }
    if (updates.title !== undefined) {
      fields.push('title = ?')
      values.push(updates.title)
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
    if (updates.isFavorite !== undefined) {
      fields.push('is_favorite = ?')
      values.push(updates.isFavorite ? 1 : 0)
    }
    if (updates.groupId !== undefined) {
      fields.push('group_id = ?')
      values.push(updates.groupId)
    }
    if (updates.metadata !== undefined) {
      fields.push('metadata = ?')
      values.push(JSON.stringify(updates.metadata))
    }

    if (fields.length === 0) {
      return false
    }

    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    const stmt = db.prepare(`UPDATE clipboard_history SET ${fields.join(', ')} WHERE id = ?`)
    const result = stmt.run(...values)

    return result.changes > 0
  } catch (error) {
    console.error('更新剪贴板项目失败:', error)
    throw error
  }
}

// 辅助函数：将数据库行映射为 ClipboardHistoryItem
function mapRowToItem(row: any): ClipboardHistoryItem {
  return {
    id: row.id,
    content: row.content,
    type: row.type as ClipboardType,
    title: row.title || undefined,
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
    isFavorite: !!row.is_favorite,
    tags: row.tags ? JSON.parse(row.tags) : undefined,
    groupId: row.group_id || undefined,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined
  }
}

// 分组相关操作
export interface Group {
  id: string
  name: string
  parentId?: string
  icon?: string
  color?: string
  sortOrder: number
  createdAt: string
}

export function createGroup(group: Omit<Group, 'id' | 'createdAt'>): Group {
  const db = getDatabase()
  const id = uuidv4()

  const stmt = db.prepare(`
    INSERT INTO groups (id, name, parent_id, icon, color, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  stmt.run(id, group.name, group.parentId || null, group.icon || null, group.color || null, group.sortOrder)

  return {
    id,
    name: group.name,
    parentId: group.parentId,
    icon: group.icon,
    color: group.color,
    sortOrder: group.sortOrder,
    createdAt: new Date().toISOString()
  }
}

export function getGroups(): Group[] {
  const db = getDatabase()

  const stmt = db.prepare('SELECT * FROM groups ORDER BY sort_order, name')
  const rows = stmt.all() as any[]

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    parentId: row.parent_id || undefined,
    icon: row.icon || undefined,
    color: row.color || undefined,
    sortOrder: row.sort_order,
    createdAt: row.created_at
  }))
}

export function updateGroup(id: string, updates: Partial<Omit<Group, 'id' | 'createdAt'>>): boolean {
  const db = getDatabase()

  const fields: string[] = []
  const values: any[] = []

  if (updates.name !== undefined) {
    fields.push('name = ?')
    values.push(updates.name)
  }
  if (updates.parentId !== undefined) {
    fields.push('parent_id = ?')
    values.push(updates.parentId || null)
  }
  if (updates.icon !== undefined) {
    fields.push('icon = ?')
    values.push(updates.icon || null)
  }
  if (updates.color !== undefined) {
    fields.push('color = ?')
    values.push(updates.color || null)
  }
  if (updates.sortOrder !== undefined) {
    fields.push('sort_order = ?')
    values.push(updates.sortOrder)
  }

  if (fields.length === 0) return false

  values.push(id)
  const stmt = db.prepare(`UPDATE groups SET ${fields.join(', ')} WHERE id = ?`)
  const result = stmt.run(...values)

  return result.changes > 0
}

export function deleteGroup(id: string): boolean {
  const db = getDatabase()

  // 将该分组下的条目移到无分组
  db.prepare('UPDATE clipboard_history SET group_id = NULL WHERE group_id = ?').run(id)

  // 删除分组
  const stmt = db.prepare('DELETE FROM groups WHERE id = ?')
  const result = stmt.run(id)

  return result.changes > 0
}

// 版本历史相关操作
export interface Version {
  id: string
  itemId: string
  content: string
  hash: string
  changes?: string
  createdAt: string
}

export function createVersion(version: Omit<Version, 'id' | 'createdAt'>): Version {
  const db = getDatabase()
  const id = uuidv4()

  const stmt = db.prepare(`
    INSERT INTO versions (id, item_id, content, hash, changes)
    VALUES (?, ?, ?, ?, ?)
  `)

  stmt.run(id, version.itemId, version.content, version.hash, version.changes || null)

  return {
    id,
    itemId: version.itemId,
    content: version.content,
    hash: version.hash,
    changes: version.changes,
    createdAt: new Date().toISOString()
  }
}

export function getVersionsByItem(itemId: string): Version[] {
  const db = getDatabase()

  const stmt = db.prepare('SELECT * FROM versions WHERE item_id = ? ORDER BY created_at DESC')
  const rows = stmt.all(itemId) as any[]

  return rows.map(row => ({
    id: row.id,
    itemId: row.item_id,
    content: row.content,
    hash: row.hash,
    changes: row.changes || undefined,
    createdAt: row.created_at
  }))
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
    console.log('数据库连接已关闭')
  }
}
