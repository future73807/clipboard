import { useState, useEffect, useCallback, useMemo } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Sidebar } from '@/components/layout/Sidebar'
import { ClipboardCard } from '@/components/clipboard/ClipboardCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDebounce } from '@/hooks'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  Trash2,
  LayoutGrid,
  List,
  Lock,
  Unlock,
  Shield,
  Plus,
  MoreHorizontal,
  Sparkles,
  Eye,
  EyeOff,
  X,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ClipboardItem, ClipboardType, EncryptionStatus } from '@/types'

function App() {
  const [clipboardHistory, setClipboardHistory] = useState<ClipboardItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeType, setActiveType] = useState<ClipboardType | 'all' | 'favorites'>('all')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [encryptionStatus, setEncryptionStatus] = useState<EncryptionStatus>({
    enabled: false,
    unlocked: false,
  })
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordMode, setPasswordMode] = useState<'enable' | 'unlock' | 'disable'>('unlock')
  const [showPassword, setShowPassword] = useState(false)

  // 对搜索词进行防抖优化
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  useEffect(() => {
    loadClipboardHistory()
    checkEncryptionStatus()
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

  const checkEncryptionStatus = async () => {
    try {
      if (window.electronAPI) {
        const status = await window.electronAPI.getEncryptionStatus()
        setEncryptionStatus(status)
      }
    } catch (error) {
      console.error('获取加密状态失败:', error)
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
      }
    } catch (error) {
      console.error('复制到剪贴板失败:', error)
    }
  }, [])

  const handleDeleteItem = useCallback(async (item: ClipboardItem) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.deleteClipboardItem(item.id)
        loadClipboardHistory()
      }
    } catch (error) {
      console.error('删除剪贴板项目失败:', error)
    }
  }, [])

  const handleToggleFavorite = useCallback(async (item: ClipboardItem) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.updateClipboardItem(item.id, {
          isFavorite: !item.isFavorite,
        })
        loadClipboardHistory()
      }
    } catch (error) {
      console.error('更新收藏状态失败:', error)
    }
  }, [])

  const handleToggleCode = useCallback(async (item: ClipboardItem) => {
    try {
      if (window.electronAPI) {
        const tags = item.tags || []
        const newTags = tags.includes('code')
          ? tags.filter((t) => t !== 'code')
          : [...tags, 'code']
        await window.electronAPI.updateClipboardItem(item.id, { tags: newTags })
        loadClipboardHistory()
      }
    } catch (error) {
      console.error('更新代码标记失败:', error)
    }
  }, [])

  const handleClearHistory = async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.clearClipboardHistory()
        setClipboardHistory([])
      }
    } catch (error) {
      console.error('清空历史记录失败:', error)
    }
  }

  const handleShowFloatingWindow = async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.showFloatingWindow()
      }
    } catch (error) {
      console.error('显示浮动窗口失败:', error)
    }
  }

  const handleEncryptionAction = async () => {
    if (!passwordInput) return

    try {
      let result
      if (window.electronAPI) {
        if (passwordMode === 'enable') {
          result = await window.electronAPI.enableEncryption(passwordInput)
        } else if (passwordMode === 'unlock') {
          result = await window.electronAPI.unlockEncryption(passwordInput)
        } else if (passwordMode === 'disable') {
          result = await window.electronAPI.disableEncryption(passwordInput)
        }

        if (result && result.success) {
          setShowPasswordModal(false)
          setPasswordInput('')
          checkEncryptionStatus()
          loadClipboardHistory()
        } else {
          alert(result?.error || '操作失败')
        }
      }
    } catch (error) {
      console.error('加密操作失败:', error)
      alert('操作失败')
    }
  }

  const openEncryptionModal = (mode: 'enable' | 'unlock' | 'disable') => {
    setPasswordMode(mode)
    setShowPasswordModal(true)
    setPasswordInput('')
  }

  // 使用 useMemo 优化过滤性能，配合防抖搜索词
  const filteredHistory = useMemo(() => {
    const searchLower = debouncedSearchTerm.toLowerCase()
    return clipboardHistory.filter((item) => {
      const matchesSearch =
        !debouncedSearchTerm || item.content.toLowerCase().includes(searchLower)
      const matchesType =
        activeType === 'all' ||
        (activeType === 'favorites' ? item.isFavorite : item.type === activeType)
      return matchesSearch && matchesType
    })
  }, [clipboardHistory, debouncedSearchTerm, activeType])

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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        activeType={activeType}
        onActiveTypeChange={setActiveType}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card/50 px-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-foreground">
              {typeLabels[activeType]}
            </h1>
            <Badge variant="secondary" className="text-xs">
              {filteredHistory.length} 条记录
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="搜索剪贴板内容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-9"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-border bg-background p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Encryption Button */}
            <Button
              variant={encryptionStatus.enabled ? (encryptionStatus.unlocked ? 'outline' : 'destructive') : 'outline'}
              onClick={() => {
                if (encryptionStatus.enabled) {
                  if (encryptionStatus.unlocked) {
                    openEncryptionModal('disable')
                  } else {
                    openEncryptionModal('unlock')
                  }
                } else {
                  openEncryptionModal('enable')
                }
              }}
              className="gap-2"
            >
              {encryptionStatus.enabled ? (
                encryptionStatus.unlocked ? (
                  <>
                    <Unlock className="h-4 w-4" />
                    已解锁
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    已锁定
                  </>
                )
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  启用加密
                </>
              )}
            </Button>

            {/* Floating Window */}
            <Button variant="gradient" onClick={handleShowFloatingWindow} className="gap-2">
              <Sparkles className="h-4 w-4" />
              悬浮窗
            </Button>

            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleClearHistory} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  清空历史
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          {filteredHistory.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <FileText className="mb-4 h-16 w-16 opacity-50" />
              <p className="text-lg font-medium">暂无记录</p>
              <p className="text-sm">
                {searchTerm || activeType !== 'all'
                  ? '没有找到匹配的内容'
                  : '复制内容后将自动保存到这里'}
              </p>
            </div>
          ) : (
            <div
              className={cn(
                'grid gap-4',
                viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  : 'grid-cols-1'
              )}
            >
              {filteredHistory.map((item) => (
                <ClipboardCard
                  key={item.id}
                  item={item}
                  onCopy={handleCopyToClipboard}
                  onDelete={handleDeleteItem}
                  onToggleFavorite={handleToggleFavorite}
                  onToggleCode={handleToggleCode}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Password Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {passwordMode === 'enable' && '设置加密密码'}
              {passwordMode === 'unlock' && '解锁加密内容'}
              {passwordMode === 'disable' && '禁用加密'}
            </DialogTitle>
            <DialogDescription>
              {passwordMode === 'enable' && '设置密码后将启用 AES-256 加密保护您的剪贴板数据'}
              {passwordMode === 'unlock' && '请输入密码解锁加密内容'}
              {passwordMode === 'disable' && '禁用加密需要验证当前密码'}
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="请输入密码"
              className="pr-10"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleEncryptionAction()
                }
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => {
                setShowPasswordModal(false)
                setPasswordInput('')
              }}
            >
              取消
            </Button>
            <Button variant="gradient" onClick={handleEncryptionAction}>
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App
