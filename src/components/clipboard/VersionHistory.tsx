import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  History,
  Clock,
  RotateCcw,
  Eye,
  GitCompare,
  Trash2,
  Check,
  FileText,
} from 'lucide-react'

export interface VersionSnapshot {
  id: string
  itemId: string
  content: string
  hash: string
  changes?: string
  createdAt: string
}

interface VersionHistoryProps {
  versions: VersionSnapshot[]
  currentContent: string
  onRestore?: (version: VersionSnapshot) => void
  onView?: (version: VersionSnapshot) => void
  onDelete?: (versionId: string) => void
  className?: string
}

// 差异高亮显示
function DiffViewer({
  oldContent,
  newContent,
}: {
  oldContent: string
  newContent: string
}) {
  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')

  // 简单的行级差异检测
  const maxLines = Math.max(oldLines.length, newLines.length)
  const diffLines: Array<{
    oldLine?: string
    newLine?: string
    type: 'added' | 'removed' | 'unchanged'
  }> = []

  const oldSet = new Set(oldLines)
  const newSet = new Set(newLines)

  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i]
    const newLine = newLines[i]

    if (oldLine === newLine) {
      diffLines.push({ oldLine, newLine, type: 'unchanged' })
    } else {
      if (oldLine && !newSet.has(oldLine)) {
        diffLines.push({ oldLine, type: 'removed' })
      }
      if (newLine && !oldSet.has(newLine)) {
        diffLines.push({ newLine, type: 'added' })
      }
    }
  }

  return (
    <div className="font-mono text-xs space-y-0.5">
      {diffLines.slice(0, 50).map((line, index) => (
        <div
          key={index}
          className={cn(
            'px-2 py-0.5 rounded',
            line.type === 'added' && 'bg-green-500/20 text-green-400',
            line.type === 'removed' && 'bg-red-500/20 text-red-400 line-through',
            line.type === 'unchanged' && 'text-muted-foreground'
          )}
        >
          {line.type === 'added' && <span className="mr-2">+</span>}
          {line.type === 'removed' && <span className="mr-2">-</span>}
          {line.type === 'unchanged' && <span className="mr-2 opacity-50"> </span>}
          {line.oldLine || line.newLine}
        </div>
      ))}
      {diffLines.length > 50 && (
        <div className="text-center text-muted-foreground py-2">
          ... 还有 {diffLines.length - 50} 行
        </div>
      )}
    </div>
  )
}

// 版本比较对话框
function VersionCompareDialog({
  open,
  onOpenChange,
  version,
  currentContent,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  version: VersionSnapshot | null
  currentContent: string
}) {
  if (!version) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>版本对比</DialogTitle>
          <DialogDescription>
            对比历史版本与当前内容
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 max-h-[60vh]">
          <div className="grid grid-cols-2 gap-4 p-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">历史版本</Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(version.createdAt).toLocaleString()}
                </span>
              </div>
              <pre className="p-3 rounded-lg bg-muted text-xs overflow-auto max-h-80">
                {version.content}
              </pre>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">当前版本</Badge>
              </div>
              <pre className="p-3 rounded-lg bg-muted text-xs overflow-auto max-h-80">
                {currentContent}
              </pre>
            </div>
          </div>
          <div className="border-t border-border p-4">
            <h4 className="text-sm font-medium mb-3">差异详情</h4>
            <DiffViewer oldContent={version.content} newContent={currentContent} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// 版本内容预览对话框
function VersionPreviewDialog({
  open,
  onOpenChange,
  version,
  onRestore,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  version: VersionSnapshot | null
  onRestore?: () => void
}) {
  if (!version) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>版本快照</DialogTitle>
          <DialogDescription>
            创建于 {new Date(version.createdAt).toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 max-h-[50vh]">
          <pre className="p-4 rounded-lg bg-muted text-sm whitespace-pre-wrap">
            {version.content}
          </pre>
        </ScrollArea>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          {onRestore && (
            <Button onClick={onRestore}>
              <RotateCcw className="h-4 w-4 mr-2" />
              恢复此版本
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function VersionHistory({
  versions,
  currentContent,
  onRestore,
  onView,
  onDelete,
  className,
}: VersionHistoryProps) {
  const [previewVersion, setPreviewVersion] = React.useState<VersionSnapshot | null>(null)
  const [compareVersion, setCompareVersion] = React.useState<VersionSnapshot | null>(null)

  const handleRestore = (version: VersionSnapshot) => {
    onRestore?.(version)
    setPreviewVersion(null)
  }

  if (versions.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8 text-muted-foreground', className)}>
        <History className="h-10 w-10 mb-3 opacity-50" />
        <p className="text-sm">暂无版本历史</p>
        <p className="text-xs">修改内容时会自动创建版本快照</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">版本历史</span>
          <Badge variant="secondary" className="text-xs">
            {versions.length} 个版本
          </Badge>
        </div>
      </div>

      {/* Version List */}
      <ScrollArea className="max-h-64">
        <div className="space-y-2 pr-4">
          {versions.map((version, index) => (
            <div
              key={version.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border border-border',
                'hover:bg-accent transition-colors'
              )}
            >
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  {index === 0 ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {index === 0 ? '最新版本' : `版本 ${versions.length - index}`}
                  </span>
                  {version.changes && (
                    <Badge variant="outline" className="text-xs">
                      {version.changes}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{new Date(version.createdAt).toLocaleString()}</span>
                  <span>|</span>
                  <span>{version.content.length} 字符</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setPreviewVersion(version)}
                  title="预览"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setCompareVersion(version)}
                  title="对比"
                >
                  <GitCompare className="h-3.5 w-3.5" />
                </Button>
                {index !== 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onRestore?.(version)}
                    title="恢复"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                )}
                {versions.length > 1 && index !== 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => onDelete?.(version.id)}
                    title="删除"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Preview Dialog */}
      <VersionPreviewDialog
        open={!!previewVersion}
        onOpenChange={(open) => !open && setPreviewVersion(null)}
        version={previewVersion}
        onRestore={() => previewVersion && handleRestore(previewVersion)}
      />

      {/* Compare Dialog */}
      <VersionCompareDialog
        open={!!compareVersion}
        onOpenChange={(open) => !open && setCompareVersion(null)}
        version={compareVersion}
        currentContent={currentContent}
      />
    </div>
  )
}

// 版本快照创建函数
export function createVersionSnapshot(
  itemId: string,
  content: string,
  changes?: string
): Omit<VersionSnapshot, 'id' | 'createdAt'> {
  // 使用 Web Crypto API 生成简单的 hash
  const hash = btoa(content.slice(0, 100)) // 简化版本，实际应使用更可靠的哈希算法

  return {
    itemId,
    content,
    hash,
    changes,
  }
}
