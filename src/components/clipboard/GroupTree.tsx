import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  FolderOpen,
} from 'lucide-react'

export interface Group {
  id: string
  name: string
  parentId?: string
  icon?: string
  color?: string
  sortOrder: number
  children?: Group[]
}

interface GroupTreeProps {
  groups: Group[]
  selectedGroupId?: string
  onSelectGroup?: (groupId: string | undefined) => void
  onAddGroup?: (name: string, parentId?: string) => void
  onUpdateGroup?: (id: string, name: string) => void
  onDeleteGroup?: (id: string) => void
  onMoveGroup?: (id: string, newParentId: string | undefined, newSortOrder: number) => void
  className?: string
  maxLevel?: number
}

interface TreeNodeProps {
  group: Group
  level: number
  selectedGroupId?: string
  onSelectGroup?: (groupId: string | undefined) => void
  onAddChild?: (parentId: string) => void
  onUpdate?: (id: string) => void
  onDelete?: (id: string) => void
  onDragStart?: (e: React.DragEvent, groupId: string) => void
  onDragOver?: (e: React.DragEvent, groupId: string) => void
  onDrop?: (e: React.DragEvent, targetGroupId: string, level: number) => void
  onDragEnd?: () => void
  draggedGroupId?: string | null
  dropTargetId?: string | null
  maxLevel: number
}

function TreeNode({
  group,
  level,
  selectedGroupId,
  onSelectGroup,
  onAddChild,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  draggedGroupId,
  dropTargetId,
  maxLevel,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = React.useState(true)
  const hasChildren = group.children && group.children.length > 0
  const isSelected = selectedGroupId === group.id
  const canAddChild = level < maxLevel - 1
  const isDragging = draggedGroupId === group.id
  const isDropTarget = dropTargetId === group.id

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', group.id)
    onDragStart?.(e, group.id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    onDragOver?.(e, group.id)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    onDrop?.(e, group.id, level)
    onDragEnd?.()
  }

  const handleDragEnd = () => {
    onDragEnd?.()
  }

  return (
    <div className="select-none">
      <div
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        className={cn(
          'flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer transition-colors',
          'hover:bg-accent',
          isSelected && 'bg-primary/10 text-primary',
          isDragging && 'opacity-50',
          isDropTarget && 'ring-2 ring-primary ring-inset'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {/* 展开/折叠按钮 */}
        <button
          className={cn(
            'h-4 w-4 flex items-center justify-center rounded hover:bg-accent-foreground/10',
            !hasChildren && 'invisible'
          )}
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>

        {/* 文件夹图标 */}
        {isExpanded && hasChildren ? (
          <FolderOpen className="h-4 w-4 text-yellow-500" />
        ) : (
          <Folder className="h-4 w-4 text-yellow-500" />
        )}

        {/* 分组名称 */}
        <span
          className="flex-1 text-sm truncate"
          onClick={() => onSelectGroup?.(group.id)}
        >
          {group.name}
        </span>

        {/* 操作菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {canAddChild && (
              <DropdownMenuItem onClick={() => onAddChild?.(group.id)}>
                <FolderPlus className="mr-2 h-4 w-4" />
                添加子分组
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onUpdate?.(group.id)}>
              <Pencil className="mr-2 h-4 w-4" />
              重命名
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(group.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除分组
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 子分组 */}
      {hasChildren && isExpanded && (
        <div className="group">
          {group.children!.map((child) => (
            <TreeNode
              key={child.id}
              group={child}
              level={level + 1}
              selectedGroupId={selectedGroupId}
              onSelectGroup={onSelectGroup}
              onAddChild={onAddChild}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
              draggedGroupId={draggedGroupId}
              dropTargetId={dropTargetId}
              maxLevel={maxLevel}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function GroupTree({
  groups,
  selectedGroupId,
  onSelectGroup,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
  onMoveGroup,
  className,
  maxLevel = 3,
}: GroupTreeProps) {
  const [showAddDialog, setShowAddDialog] = React.useState(false)
  const [showEditDialog, setShowEditDialog] = React.useState(false)
  const [newGroupName, setNewGroupName] = React.useState('')
  const [editingGroup, setEditingGroup] = React.useState<Group | null>(null)
  const [addingToParentId, setAddingToParentId] = React.useState<string | undefined>()

  // 拖拽状态
  const [draggedGroupId, setDraggedGroupId] = React.useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = React.useState<string | null>(null)

  // 构建树形结构
  const buildTree = (items: Group[]): Group[] => {
    const map = new Map<string, Group>()
    const roots: Group[] = []

    // 先创建所有节点的映射
    items.forEach((item) => {
      map.set(item.id, { ...item, children: [] })
    })

    // 构建树形结构
    items.forEach((item) => {
      const node = map.get(item.id)!
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId)!.children!.push(node)
      } else {
        roots.push(node)
      }
    })

    // 排序
    const sortByOrder = (nodes: Group[]) => {
      nodes.sort((a, b) => a.sortOrder - b.sortOrder)
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          sortByOrder(node.children)
        }
      })
    }
    sortByOrder(roots)

    return roots
  }

  const treeData = React.useMemo(() => buildTree(groups), [groups])

  // 拖拽处理
  const handleDragStart = (_e: React.DragEvent, groupId: string) => {
    setDraggedGroupId(groupId)
  }

  const handleDragOver = (e: React.DragEvent, groupId: string) => {
    // 不能拖到自己身上，也不能拖到自己的子节点上
    if (draggedGroupId !== groupId) {
      setDropTargetId(groupId)
    }
  }

  const handleDrop = (e: React.DragEvent, targetGroupId: string, targetLevel: number) => {
    if (!draggedGroupId || draggedGroupId === targetGroupId) return

    // 检查是否试图拖到自己的子节点
    const isDescendant = (parentId: string, childId: string): boolean => {
      const parent = groups.find(g => g.id === parentId)
      if (!parent) return false
      if (parent.parentId === childId) return true
      return isDescendant(parent.parentId || '', childId)
    }

    const draggedGroup = groups.find(g => g.id === draggedGroupId)
    if (draggedGroup && isDescendant(targetGroupId, draggedGroupId)) {
      return // 不能拖到自己的子节点
    }

    // 计算新的父节点
    // 如果目标层级比拖拽节点高或相同，则新父节点为目标节点的父节点
    // 如果目标层级比拖拽节点低，则新父节点为目标节点
    const targetGroup = groups.find(g => g.id === targetGroupId)

    if (targetGroup) {
      // 简单策略：将拖拽节点移动到目标节点同级（作为兄弟节点）
      const newParentId = targetGroup.parentId
      const newSortOrder = targetGroup.sortOrder + 0.5 // 插入到目标节点后面

      onMoveGroup?.(draggedGroupId, newParentId, newSortOrder)
    }

    setDraggedGroupId(null)
    setDropTargetId(null)
  }

  const handleDragEnd = () => {
    setDraggedGroupId(null)
    setDropTargetId(null)
  }

  const handleAddGroup = (parentId?: string) => {
    setAddingToParentId(parentId)
    setNewGroupName('')
    setShowAddDialog(true)
  }

  const handleEditGroup = (id: string) => {
    const group = groups.find((g) => g.id === id)
    if (group) {
      setEditingGroup(group)
      setNewGroupName(group.name)
      setShowEditDialog(true)
    }
  }

  const handleConfirmAdd = () => {
    if (newGroupName.trim()) {
      onAddGroup?.(newGroupName.trim(), addingToParentId)
      setShowAddDialog(false)
      setNewGroupName('')
    }
  }

  const handleConfirmEdit = () => {
    if (editingGroup && newGroupName.trim()) {
      onUpdateGroup?.(editingGroup.id, newGroupName.trim())
      setShowEditDialog(false)
      setEditingGroup(null)
      setNewGroupName('')
    }
  }

  return (
    <div className={cn('space-y-1', className)}>
      {/* 添加根分组按钮 */}
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          分组
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => handleAddGroup()}
        >
          <FolderPlus className="h-3 w-3" />
        </Button>
      </div>

      {/* 全部分组 */}
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors',
          'hover:bg-accent',
          !selectedGroupId && 'bg-primary/10 text-primary'
        )}
        onClick={() => onSelectGroup?.(undefined)}
      >
        <Folder className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">全部</span>
      </div>

      {/* 树形分组 */}
      {treeData.map((group) => (
        <TreeNode
          key={group.id}
          group={group}
          level={0}
          selectedGroupId={selectedGroupId}
          onSelectGroup={onSelectGroup}
          onAddChild={handleAddGroup}
          onUpdate={handleEditGroup}
          onDelete={onDeleteGroup}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          draggedGroupId={draggedGroupId}
          dropTargetId={dropTargetId}
          maxLevel={maxLevel}
        />
      ))}

      {/* 添加分组对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>添加分组</DialogTitle>
            <DialogDescription>
              {addingToParentId ? '在当前分组下创建子分组' : '创建新的根分组'}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="输入分组名称"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirmAdd()
            }}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddDialog(false)}>
              取消
            </Button>
            <Button onClick={handleConfirmAdd}>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑分组对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>重命名分组</DialogTitle>
          </DialogHeader>
          <Input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="输入分组名称"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirmEdit()
            }}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button onClick={handleConfirmEdit}>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
