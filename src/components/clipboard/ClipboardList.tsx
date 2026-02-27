import * as React from 'react'
import { ClipboardCard } from './ClipboardCard'
import type { ClipboardItem } from '@/types'

interface ClipboardListProps {
  items: ClipboardItem[]
  onCopy?: (item: ClipboardItem) => void
  onDelete?: (item: ClipboardItem) => void
  onToggleFavorite?: (item: ClipboardItem) => void
  onToggleCode?: (item: ClipboardItem) => void
  onPreview?: (item: ClipboardItem) => void
  viewMode?: 'grid' | 'list'
  className?: string
}

export function ClipboardList({
  items,
  onCopy,
  onDelete,
  onToggleFavorite,
  onToggleCode,
  onPreview,
  viewMode = 'grid',
  className,
}: ClipboardListProps) {
  return (
    <div
      className={`grid gap-4 ${
        viewMode === 'grid'
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          : 'grid-cols-1'
      } ${className || ''}`}
    >
      {items.map((item) => (
        <ClipboardCard
          key={item.id}
          item={item}
          onCopy={onCopy}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
          onToggleCode={onToggleCode}
          onPreview={onPreview}
        />
      ))}
    </div>
  )
}
