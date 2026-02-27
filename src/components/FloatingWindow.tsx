import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  Copy,
  X,
  FileText,
  Image as ImageIcon,
  Code,
  File,
  Link2,
  Lock,
  FileSpreadsheet,
  Clock,
} from 'lucide-react'
import { cn, formatDate, truncate } from '@/lib/utils'
import type { ClipboardItem, ClipboardType } from '@/types'

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

const typeLabels: Record<ClipboardType | 'all', string> = {
  all: '全部',
  text: '文本',
  html: 'HTML',
  rtf: 'RTF',
  image: '图片',
  url: '链接',
  code: '代码',
  file: '文件',
  shortcut: '快捷',
  password: '密码',
  office: '办公',
}

function FloatingWindow() {
  const [clipboardHistory, setClipboardHistory] = useState<ClipboardItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeType, setActiveType] = useState<ClipboardType | 'all'>('all')

  useEffect(() => {
    loadClipboardHistory()
    setupClipboardListener()

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('clipboard-changed')
      }
    }
  }, [])

  const loadClipboardHistory = async () => {
    try {
      if (window.electronAPI) {
        const history = await window.electronAPI.getClipboardHistory()
        setClipboardHistory(history)
      }
    } catch (error) {
      console.error('加载剪贴板历史失败:', error)
    }
  }

  const setupClipboardListener = () => {
    if (window.electronAPI) {
      window.electronAPI.onClipboardChanged(() => {
        loadClipboardHistory()
      })
    }
  }

  const handleCopyToClipboard = useCallback(async (item: ClipboardItem) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.setClipboardContent(item.content)
        await window.electronAPI.hideFloatingWindow()
      }
    } catch (error) {
      console.error('复制到剪贴板失败:', error)
    }
  }, [])

  const handleHideWindow = async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.hideFloatingWindow()
      }
    } catch (error) {
      console.error('隐藏窗口失败:', error)
    }
  }

  const filteredHistory = clipboardHistory.filter((item) => {
    const matchesSearch = item.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = activeType === 'all' || item.type === activeType
    return matchesSearch && matchesType
  })

  const types: (ClipboardType | 'all')[] = [
    'all',
    'text',
    'image',
    'code',
    'file',
    'shortcut',
    'password',
    'office',
  ]

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded gradient-primary flex items-center justify-center">
            <FileText className="h-3 w-3 text-white" />
          </div>
          <span className="text-sm font-medium">剪贴板历史</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleHideWindow}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="搜索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
      </div>

      {/* Type Tabs */}
      <div className="border-b border-border px-3 py-2">
        <div className="flex gap-1 overflow-x-auto">
          {types.map((type) => (
            <Button
              key={type}
              variant={activeType === type ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 min-w-fit px-2 text-xs"
              onClick={() => setActiveType(type)}
            >
              {type !== 'all' && (
                <span className="mr-1">{typeIcons[type]}</span>
              )}
              {typeLabels[type]}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredHistory.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
              <FileText className="mb-2 h-8 w-8 opacity-50" />
              <p className="text-xs">
                {searchTerm || activeType !== 'all'
                  ? '没有找到匹配的内容'
                  : '暂无历史记录'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-lg border border-border bg-card p-3 transition-all duration-200 hover:border-primary/30 hover:bg-accent/50"
                >
                  {/* Header */}
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="gap-1 text-[10px] px-1.5 py-0"
                      >
                        {typeIcons[item.type]}
                        <span>{item.type}</span>
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => handleCopyToClipboard(item)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Content */}
                  <div className="text-xs text-muted-foreground line-clamp-2 break-all">
                    {item.type === 'image' ? (
                      <div className="flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        <span>[图片内容]</span>
                      </div>
                    ) : (
                      truncate(item.content, 100)
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export default FloatingWindow
