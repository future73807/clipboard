import * as React from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
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
  enableVirtualScroll?: boolean
}

// 虚拟滚动列表组件
function VirtualClipboardList({
  items,
  onCopy,
  onDelete,
  onToggleFavorite,
  onToggleCode,
  onPreview,
  viewMode = 'grid',
  className,
}: Omit<ClipboardListProps, 'enableVirtualScroll'>) {
  const parentRef = React.useRef<HTMLDivElement>(null)

  // 计算每个项目的估计高度
  const estimateSize = React.useCallback(() => {
    return viewMode === 'grid' ? 180 : 100
  }, [viewMode])

  // 计算每行显示的列数
  const getColumnCount = React.useCallback(() => {
    if (typeof window === 'undefined') return 1
    const width = parentRef.current?.offsetWidth || 800
    if (width >= 1400) return 4
    if (width >= 1024) return 3
    if (width >= 640) return 2
    return 1
  }, [])

  const [columnCount, setColumnCount] = React.useState(getColumnCount)

  // 监听窗口大小变化
  React.useEffect(() => {
    const handleResize = () => {
      setColumnCount(getColumnCount())
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [getColumnCount])

  // 计算行数
  const rowCount = Math.ceil(items.length / columnCount)

  // 创建虚拟化器
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 5,
  })

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className || ''}`}
      style={{ height: '100%', width: '100%' }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columnCount
          const rowItems = items.slice(startIndex, startIndex + columnCount)

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="flex gap-4 px-1"
            >
              {rowItems.map((item) => (
                <div
                  key={item.id}
                  className="flex-1"
                  style={{ minWidth: 0 }}
                >
                  <ClipboardCard
                    item={item}
                    onCopy={onCopy}
                    onDelete={onDelete}
                    onToggleFavorite={onToggleFavorite}
                    onToggleCode={onToggleCode}
                    onPreview={onPreview}
                  />
                </div>
              ))}
              {/* 填充空白列以保持对齐 */}
              {rowItems.length < columnCount &&
                Array.from({ length: columnCount - rowItems.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="flex-1" />
                ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 普通列表组件
function StaticClipboardList({
  items,
  onCopy,
  onDelete,
  onToggleFavorite,
  onToggleCode,
  onPreview,
  viewMode = 'grid',
  className,
}: Omit<ClipboardListProps, 'enableVirtualScroll'>) {
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

export function ClipboardList({
  items,
  onCopy,
  onDelete,
  onToggleFavorite,
  onToggleCode,
  onPreview,
  viewMode = 'grid',
  className,
  enableVirtualScroll = true,
}: ClipboardListProps) {
  // 当项目数量超过 50 时启用虚拟滚动
  const shouldVirtualize = enableVirtualScroll && items.length > 50

  if (shouldVirtualize) {
    return (
      <VirtualClipboardList
        items={items}
        onCopy={onCopy}
        onDelete={onDelete}
        onToggleFavorite={onToggleFavorite}
        onToggleCode={onToggleCode}
        onPreview={onPreview}
        viewMode={viewMode}
        className={className}
      />
    )
  }

  return (
    <StaticClipboardList
      items={items}
      onCopy={onCopy}
      onDelete={onDelete}
      onToggleFavorite={onToggleFavorite}
      onToggleCode={onToggleCode}
      onPreview={onPreview}
      viewMode={viewMode}
      className={className}
    />
  )
}
