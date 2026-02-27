import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  FileText,
  Image,
  Code,
  File,
  Link2,
  Lock,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  Star,
  Clock,
  FolderTree,
} from 'lucide-react'
import type { ClipboardType } from '@/types'

interface SidebarProps {
  className?: string
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  activeType: ClipboardType | 'all' | 'favorites'
  onActiveTypeChange: (type: ClipboardType | 'all' | 'favorites') => void
}

const typeIcons: Record<ClipboardType | 'all' | 'favorites', React.ReactNode> = {
  all: <Clock className="h-4 w-4" />,
  favorites: <Star className="h-4 w-4" />,
  text: <FileText className="h-4 w-4" />,
  html: <FileText className="h-4 w-4" />,
  rtf: <FileText className="h-4 w-4" />,
  image: <Image className="h-4 w-4" />,
  url: <Link2 className="h-4 w-4" />,
  code: <Code className="h-4 w-4" />,
  file: <File className="h-4 w-4" />,
  shortcut: <Link2 className="h-4 w-4" />,
  password: <Lock className="h-4 w-4" />,
  office: <FileSpreadsheet className="h-4 w-4" />,
}

const typeLabels: Record<ClipboardType | 'all' | 'favorites', string> = {
  all: '全部',
  favorites: '收藏',
  text: '文本',
  html: 'HTML',
  rtf: 'RTF',
  image: '图片',
  url: '链接',
  code: '代码',
  file: '文件',
  shortcut: '快捷方式',
  password: '密码',
  office: '办公文件',
}

const typeColors: Record<ClipboardType | 'all' | 'favorites', string> = {
  all: 'text-muted-foreground',
  favorites: 'text-yellow-500',
  text: 'text-blue-400',
  html: 'text-orange-400',
  rtf: 'text-orange-400',
  image: 'text-green-400',
  url: 'text-cyan-400',
  code: 'text-purple-400',
  file: 'text-orange-400',
  shortcut: 'text-cyan-400',
  password: 'text-red-400',
  office: 'text-indigo-400',
}

export function Sidebar({
  className,
  collapsed,
  onCollapsedChange,
  activeType,
  onActiveTypeChange,
}: SidebarProps) {
  const types: (ClipboardType | 'all' | 'favorites')[] = [
    'all',
    'favorites',
    'text',
    'image',
    'code',
    'file',
    'shortcut',
    'password',
    'office',
  ]

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          'flex h-full flex-col border-r border-border bg-card transition-all duration-300',
          collapsed ? 'w-16' : 'w-60',
          className
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-foreground">剪贴板</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapsedChange(!collapsed)}
            className="h-8 w-8"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="space-y-1 px-2">
            {types.map((type) => {
              const isActive = activeType === type
              const content = (
                <button
                  key={type}
                  onClick={() => onActiveTypeChange(type)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <span className={cn(isActive ? 'text-primary' : typeColors[type])}>
                    {typeIcons[type]}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{typeLabels[type]}</span>
                      {isActive && (
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </>
                  )}
                </button>
              )

              if (collapsed) {
                return (
                  <Tooltip key={type}>
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                    <TooltipContent side="right">
                      {typeLabels[type]}
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return content
            })}
          </nav>
        </ScrollArea>

        {/* Groups Section */}
        {!collapsed && (
          <>
            <Separator />
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  分组
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <FolderTree className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                暂无分组
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="border-t border-border p-2">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">设置</TooltipContent>
            </Tooltip>
          ) : (
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Settings className="h-4 w-4" />
              设置
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
