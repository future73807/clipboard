import * as React from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { cn, formatDate, truncate, detectCodeLanguage } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Copy,
  Star,
  Trash2,
  MoreHorizontal,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Code,
  File,
  Link2,
  Lock,
  FileSpreadsheet,
  Clock,
} from 'lucide-react'
import type { ClipboardItem, ClipboardType } from '@/types'

interface ClipboardCardProps {
  item: ClipboardItem
  onCopy?: (item: ClipboardItem) => void
  onDelete?: (item: ClipboardItem) => void
  onToggleFavorite?: (item: ClipboardItem) => void
  onToggleCode?: (item: ClipboardItem) => void
  className?: string
}

const typeIcons: Record<ClipboardType, React.ReactNode> = {
  text: <FileText className="h-3.5 w-3.5" />,
  html: <FileText className="h-3.5 w-3.5" />,
  rtf: <FileText className="h-3.5 w-3.5" />,
  image: <ImageIcon className="h-3.5 w-3.5" />,
  url: <Link2 className="h-3.5 w-3.5" />,
  code: <Code className="h-3.5 w-3.5" />,
  file: <File className="h-3.5 w-3.5" />,
  shortcut: <Link2 className="h-3.5 w-3.5" />,
  password: <Lock className="h-3.5 w-3.5" />,
  office: <FileSpreadsheet className="h-3.5 w-3.5" />,
}

const typeBadgeVariants: Record<ClipboardType, 'cyan' | 'green' | 'purple' | 'orange' | 'pink' | 'default' | 'secondary' | 'destructive' | 'outline'> = {
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

export function ClipboardCard({
  item,
  onCopy,
  onDelete,
  onToggleFavorite,
  onToggleCode,
  className,
}: ClipboardCardProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  const isCode = item.tags?.includes('code') || item.type === 'code'
  const language = isCode ? detectCodeLanguage(item.content) : 'text'

  const renderContent = () => {
    if (item.type === 'image') {
      return (
        <div className="relative overflow-hidden rounded-md bg-slate-900/50">
          <img
            src={item.content}
            alt="Clipboard image"
            className="max-h-48 w-auto object-contain"
          />
        </div>
      )
    }

    if (isCode) {
      return (
        <div className="overflow-hidden rounded-md">
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              fontSize: '12px',
              maxHeight: '200px',
              overflow: 'auto',
            }}
          >
            {truncate(item.content, 500)}
          </SyntaxHighlighter>
        </div>
      )
    }

    if (item.type === 'password') {
      return (
        <div className="flex items-center gap-2 font-mono text-sm">
          {showPassword ? (
            <span className="text-foreground">{item.content}</span>
          ) : (
            <span className="text-muted-foreground">{'*'.repeat(Math.min(item.content.length, 20))}</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-3 w-3" />
            ) : (
              <Eye className="h-3 w-3" />
            )}
          </Button>
        </div>
      )
    }

    return (
      <p className="text-sm text-muted-foreground line-clamp-3 break-all">
        {truncate(item.content, 200)}
      </p>
    )
  }

  return (
    <div
      className={cn(
        'group relative rounded-xl border border-border bg-card p-4 transition-all duration-200',
        'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
        'hover:-translate-y-0.5',
        className
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={typeBadgeVariants[item.type] || 'default'} className="gap-1">
            {typeIcons[item.type]}
            <span className="text-xs">{item.type}</span>
          </Badge>
          {item.isFavorite && (
            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
          )}
          {item.isEncrypted && (
            <Lock className="h-3.5 w-3.5 text-red-400" />
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onToggleFavorite?.(item)}
          >
            <Star
              className={cn(
                'h-3.5 w-3.5',
                item.isFavorite && 'fill-yellow-500 text-yellow-500'
              )}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onCopy?.(item)}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onCopy?.(item)}>
                <Copy className="mr-2 h-4 w-4" />
                复制内容
              </DropdownMenuItem>
              {item.type === 'text' && (
                <DropdownMenuItem onClick={() => onToggleCode?.(item)}>
                  <Code className="mr-2 h-4 w-4" />
                  {isCode ? '取消代码标记' : '标记为代码'}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onToggleFavorite?.(item)}>
                <Star className="mr-2 h-4 w-4" />
                {item.isFavorite ? '取消收藏' : '收藏'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(item)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="mb-3">{renderContent()}</div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{formatDate(item.timestamp)}</span>
        </div>
        <span>{item.size} 字符</span>
      </div>

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {item.tags.filter(t => t !== 'code').map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
