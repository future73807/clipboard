import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tag, Plus, X, Check } from 'lucide-react'

export interface TagItem {
  id: string
  name: string
  color: string
}

// 预设颜色
const TAG_COLORS = [
  { name: 'cyan', value: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { name: 'green', value: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { name: 'orange', value: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { name: 'purple', value: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { name: 'pink', value: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  { name: 'red', value: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { name: 'yellow', value: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { name: 'blue', value: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
]

interface TagSelectorProps {
  availableTags: TagItem[]
  selectedTags: string[]
  onTagsChange?: (tagIds: string[]) => void
  onCreateTag?: (name: string, color: string) => void
  className?: string
  maxVisible?: number
}

export function TagSelector({
  availableTags,
  selectedTags,
  onTagsChange,
  onCreateTag,
  className,
  maxVisible = 3,
}: TagSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [showCreate, setShowCreate] = React.useState(false)
  const [newTagName, setNewTagName] = React.useState('')
  const [newTagColor, setNewTagColor] = React.useState('cyan')

  const filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedTagObjects = availableTags.filter((tag) =>
    selectedTags.includes(tag.id)
  )

  const visibleTags = selectedTagObjects.slice(0, maxVisible)
  const hiddenTagsCount = selectedTagObjects.length - maxVisible

  const handleToggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange?.(selectedTags.filter((id) => id !== tagId))
    } else {
      onTagsChange?.([...selectedTags, tagId])
    }
  }

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      onCreateTag?.(newTagName.trim(), newTagColor)
      setNewTagName('')
      setShowCreate(false)
    }
  }

  const getTagColorClass = (color: string) => {
    const found = TAG_COLORS.find((c) => c.name === color)
    return found?.value || TAG_COLORS[0].value
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {/* 已选标签显示 */}
      {visibleTags.map((tag) => (
        <Badge
          key={tag.id}
          variant="outline"
          className={cn('gap-1 pr-1', getTagColorClass(tag.color))}
        >
          {tag.name}
          <button
            className="h-3 w-3 rounded-full hover:bg-current/20 flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation()
              handleToggleTag(tag.id)
            }}
          >
            <X className="h-2 w-2" />
          </button>
        </Badge>
      ))}

      {/* 隐藏标签数量 */}
      {hiddenTagsCount > 0 && (
        <Badge variant="secondary" className="text-xs">
          +{hiddenTagsCount}
        </Badge>
      )}

      {/* 标签选择器 */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground"
          >
            <Tag className="h-3 w-3 mr-1" />
            标签
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="space-y-2">
            {/* 搜索框 */}
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索标签..."
              className="h-8 text-sm"
            />

            {/* 标签列表 */}
            <div className="max-h-48 overflow-auto space-y-1">
              {filteredTags.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  没有找到标签
                </p>
              ) : (
                filteredTags.map((tag) => (
                  <button
                    key={tag.id}
                    className={cn(
                      'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors',
                      'hover:bg-accent',
                      selectedTags.includes(tag.id) && 'bg-accent'
                    )}
                    onClick={() => handleToggleTag(tag.id)}
                  >
                    <div
                      className={cn(
                        'h-3 w-3 rounded-full',
                        getTagColorClass(tag.color)
                      )}
                    />
                    <span className="flex-1 text-left">{tag.name}</span>
                    {selectedTags.includes(tag.id) && (
                      <Check className="h-3 w-3 text-primary" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* 创建新标签 */}
            {onCreateTag && (
              <div className="border-t border-border pt-2">
                {showCreate ? (
                  <div className="space-y-2">
                    <Input
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="标签名称"
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateTag()
                        if (e.key === 'Escape') setShowCreate(false)
                      }}
                    />
                    <div className="flex flex-wrap gap-1">
                      {TAG_COLORS.map((color) => (
                        <button
                          key={color.name}
                          className={cn(
                            'h-5 w-5 rounded-full border-2',
                            getTagColorClass(color.name),
                            newTagColor === color.name && 'ring-2 ring-ring ring-offset-1'
                          )}
                          onClick={() => setNewTagColor(color.name)}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 h-7"
                        onClick={handleCreateTag}
                      >
                        创建
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 h-7"
                        onClick={() => setShowCreate(false)}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-8"
                    onClick={() => setShowCreate(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    创建新标签
                  </Button>
                )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// 标签云组件
interface TagCloudProps {
  tags: TagItem[]
  onSelectTag?: (tagId: string) => void
  selectedTagId?: string
  className?: string
}

export function TagCloud({
  tags,
  onSelectTag,
  selectedTagId,
  className,
}: TagCloudProps) {
  const getTagColorClass = (color: string) => {
    const found = TAG_COLORS.find((c) => c.name === color)
    return found?.value || TAG_COLORS[0].value
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {tags.map((tag) => (
        <Badge
          key={tag.id}
          variant="outline"
          className={cn(
            'cursor-pointer transition-all duration-200',
            getTagColorClass(tag.color),
            selectedTagId === tag.id && 'ring-2 ring-ring ring-offset-1'
          )}
          onClick={() => onSelectTag?.(tag.id)}
        >
          {tag.name}
        </Badge>
      ))}
    </div>
  )
}
