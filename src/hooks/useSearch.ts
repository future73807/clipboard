import { useState, useMemo, useCallback } from 'react'
import { useDebounce } from './useDebounce'

export interface SearchOptions<T> {
  /** 搜索字段提取函数 */
  getSearchableText?: (item: T) => string
  /** 防抖延迟（毫秒），默认 300ms */
  debounceDelay?: number
  /** 是否区分大小写，默认 false */
  caseSensitive?: boolean
}

/**
 * 搜索 Hook
 * 提供防抖搜索和高效的过滤功能
 */
export function useSearch<T>(
  items: T[],
  options: SearchOptions<T> = {}
): {
  searchTerm: string
  setSearchTerm: (term: string) => void
  filteredItems: T[]
  isSearching: boolean
} {
  const { getSearchableText, debounceDelay = 300, caseSensitive = false } = options

  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // 对搜索词进行防抖
  const debouncedSearchTerm = useDebounce(searchTerm, debounceDelay)

  // 当搜索词变化时更新搜索状态
  useMemo(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true)
    } else {
      setIsSearching(false)
    }
  }, [searchTerm, debouncedSearchTerm])

  // 默认的搜索文本提取函数
  const defaultGetSearchableText = useCallback(
    (item: T): string => {
      if (typeof item === 'string') return item
      if (typeof item === 'object' && item !== null) {
        // 尝试获取常见的可搜索字段
        const obj = item as Record<string, unknown>
        const searchableFields = ['content', 'title', 'name', 'text', 'description']
        for (const field of searchableFields) {
          if (typeof obj[field] === 'string') {
            return obj[field] as string
          }
        }
        // 如果没有找到可搜索字段，尝试序列化整个对象
        try {
          return JSON.stringify(item)
        } catch {
          return ''
        }
      }
      return String(item)
    },
    []
  )

  const getText = getSearchableText || defaultGetSearchableText

  // 过滤项目
  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return items
    }

    const searchLower = caseSensitive
      ? debouncedSearchTerm
      : debouncedSearchTerm.toLowerCase()

    return items.filter((item) => {
      const text = getText(item)
      const textToSearch = caseSensitive ? text : text.toLowerCase()
      return textToSearch.includes(searchLower)
    })
  }, [items, debouncedSearchTerm, getText, caseSensitive])

  return {
    searchTerm,
    setSearchTerm,
    filteredItems,
    isSearching,
  }
}

/**
 * 多字段搜索 Hook
 * 支持在多个字段中搜索
 */
export function useMultiFieldSearch<T>(
  items: T[],
  fields: (keyof T)[],
  options: Omit<SearchOptions<T>, 'getSearchableText'> = {}
): {
  searchTerm: string
  setSearchTerm: (term: string) => void
  filteredItems: T[]
  isSearching: boolean
} {
  const getSearchableText = useCallback(
    (item: T): string => {
      const texts = fields.map((field) => {
        const value = item[field]
        if (typeof value === 'string') return value
        if (value != null) return String(value)
        return ''
      })
      return texts.join(' ')
    },
    [fields]
  )

  return useSearch(items, { ...options, getSearchableText })
}
