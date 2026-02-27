import * as React from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Copy,
  Download,
  Star,
  Clock,
  FileText,
  Image as ImageIcon,
  Code,
  File,
  Link2,
  Lock,
  FileSpreadsheet,
} from 'lucide-react'
import { ImagePreview } from './ImagePreview'
import { MarkdownPreview, isMarkdown } from './MarkdownPreview'
import type { ClipboardItem, ClipboardType } from '@/types'

interface ContentPreviewProps {
  item: ClipboardItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCopy?: (item: ClipboardItem) => void
  onToggleFavorite?: (item: ClipboardItem) => void
}

const typeIcons: Record<ClipboardType, React.ReactNode> = {
  text: <FileText className="h-4 w-4" />,
  html: <FileText className="h-4 w-4" />,
  rtf: <FileText className="h-4 w-4" />,
  image: <ImageIcon className="h-4 w-4" />,
  url: <Link2 className="h-4 w-4" />,
  code: <Code className="h-4 w-4" />,
  file: <File className="h-4 w-4" />,
  shortcut: <Link2 className="h-4 w-4" />,
  password: <Lock className="h-4 w-4" />,
  office: <FileSpreadsheet className="h-4 w-4" />,
}

const typeBadgeVariants: Record<ClipboardType, string> = {
  text: 'cyan',
  html: 'orange',
  rtf: 'orange',
  image: 'green',
  url: 'pink',
  code: 'purple',
  file: 'orange',
  shortcut: 'pink',
  password: 'default',
  office: 'cyan',
}

export function ContentPreview({
  item,
  open,
  onOpenChange,
  onCopy,
  onToggleFavorite,
}: ContentPreviewProps) {
  const [showPassword, setShowPassword] = React.useState(false)

  if (!item) return null

  const isCode = item.tags?.includes('code') || item.type === 'code'
  const shouldRenderMarkdown = item.type === 'text' && isMarkdown(item.content)

  const handleDownload = () => {
    const blob = new Blob([item.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `clipboard-${item.id.slice(0, 8)}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const renderContent = () => {
    // 图片类型
    if (item.type === 'image') {
      return (
        <div className="flex items-center justify-center bg-slate-950 rounded-lg p-4">
          <ImagePreview src={item.content} alt="Clipboard image" maxHeight={400} />
        </div>
      )
    }

    // 代码类型
    if (isCode) {
      return (
        <ScrollArea className="max-h-[60vh]">
          <SyntaxHighlighter
            language="typescript"
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              borderRadius: '0.5rem',
              fontSize: '13px',
            }}
            showLineNumbers
          >
            {item.content}
          </SyntaxHighlighter>
        </ScrollArea>
      )
    }

    // Markdown 类型
    if (shouldRenderMarkdown) {
      return (
        <ScrollArea className="max-h-[60vh] p-4 border border-border rounded-lg">
          <MarkdownPreview content={item.content} maxHeight={400} />
        </ScrollArea>
      )
    }

    // 密码类型
    if (item.type === 'password') {
      return (
        <div className="flex items-center gap-3 p-4 border border-border rounded-lg bg-muted/50">
          <Lock className="h-5 w-5 text-red-400" />
          <code className="font-mono text-lg flex-1">
            {showPassword ? item.content : '*'.repeat(Math.min(item.content.length, 30))}
          </code>
          <Button variant="outline" size="sm" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? '隐藏' : '显示'}
          </Button>
        </div>
      )
    }

    // 默认文本显示
    return (
      <ScrollArea className="max-h-[60vh]">
        <pre className="p-4 border border-border rounded-lg bg-muted/50 whitespace-pre-wrap break-all text-sm">
          {item.content}
        </pre>
      </ScrollArea>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1.5">
                {typeIcons[item.type]}
                <span>{item.type}</span>
              </Badge>
              {item.isFavorite && (
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleFavorite?.(item)}
              >
                <Star
                  className={cn(
                    'h-4 w-4 mr-1',
                    item.isFavorite && 'fill-yellow-500 text-yellow-500'
                  )}
                />
                {item.isFavorite ? '取消收藏' : '收藏'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                导出
              </Button>
              <Button size="sm" onClick={() => onCopy?.(item)}>
                <Copy className="h-4 w-4 mr-1" />
                复制
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden">{renderContent()}</div>

        {/* 底部信息 */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{new Date(item.timestamp).toLocaleString()}</span>
            </div>
            <span>{item.size} 字符</span>
          </div>

          {/* 标签 */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex items-center gap-1">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
