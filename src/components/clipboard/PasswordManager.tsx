import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Lock,
  Eye,
  EyeOff,
  Copy,
  Plus,
  Trash2,
  Edit,
  Globe,
  User,
  Key,
  FileText,
  Shield,
  ExternalLink,
} from 'lucide-react'

export interface PasswordEntry {
  id: string
  title: string
  username?: string
  password: string
  url?: string
  notes?: string
  category?: string
  createdAt: string
  updatedAt: string
  lastUsedAt?: string
}

interface PasswordManagerProps {
  passwords: PasswordEntry[]
  onAdd?: (password: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  onUpdate?: (id: string, updates: Partial<PasswordEntry>) => void
  onDelete?: (id: string) => void
  onCopy?: (password: string) => void
  className?: string
}

// 密码强度检测
function checkPasswordStrength(password: string): {
  score: number
  label: string
  color: string
} {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 2) return { score, label: '弱', color: 'text-red-400' }
  if (score <= 4) return { score, label: '中', color: 'text-yellow-400' }
  return { score, label: '强', color: 'text-green-400' }
}

// 密码生成器
function generatePassword(length: number = 16, options: {
  lowercase?: boolean
  uppercase?: boolean
  numbers?: boolean
  symbols?: boolean
} = {}): string {
  const {
    lowercase = true,
    uppercase = true,
    numbers = true,
    symbols = true,
  } = options

  let chars = ''
  if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz'
  if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (numbers) chars += '0123456789'
  if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'

  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz'

  let password = ''
  const array = new Uint32Array(length)
  crypto.getRandomValues(array)
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length]
  }
  return password
}

// 密码条目卡片
function PasswordCard({
  entry,
  onCopy,
  onEdit,
  onDelete,
}: {
  entry: PasswordEntry
  onCopy?: (password: string) => void
  onEdit?: () => void
  onDelete?: () => void
}) {
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <div className="group relative rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-lg">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
            <Lock className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">{entry.title}</h3>
            {entry.url && (
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                <Globe className="h-3 w-3" />
                {new URL(entry.url).hostname}
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        {entry.username && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">用户名:</span>
            <span className="text-foreground">{entry.username}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => navigator.clipboard.writeText(entry.username || '')}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <Key className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">密码:</span>
          <code className="flex-1 text-foreground">
            {showPassword ? entry.password : '*'.repeat(Math.min(entry.password.length, 16))}
          </code>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => onCopy?.(entry.password)}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>

        {entry.category && (
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
              {entry.category}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// 密码编辑对话框
function PasswordDialog({
  open,
  onOpenChange,
  entry,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry?: PasswordEntry
  onSave: (data: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
}) {
  const [title, setTitle] = React.useState(entry?.title || '')
  const [username, setUsername] = React.useState(entry?.username || '')
  const [password, setPassword] = React.useState(entry?.password || '')
  const [url, setUrl] = React.useState(entry?.url || '')
  const [notes, setNotes] = React.useState(entry?.notes || '')
  const [category, setCategory] = React.useState(entry?.category || '')
  const [showPassword, setShowPassword] = React.useState(false)
  const [generateLength, setGenerateLength] = React.useState(16)

  const strength = checkPasswordStrength(password)

  React.useEffect(() => {
    if (open) {
      setTitle(entry?.title || '')
      setUsername(entry?.username || '')
      setPassword(entry?.password || '')
      setUrl(entry?.url || '')
      setNotes(entry?.notes || '')
      setCategory(entry?.category || '')
    }
  }, [open, entry])

  const handleGenerate = () => {
    setPassword(generatePassword(generateLength))
  }

  const handleSave = () => {
    if (!title || !password) return
    onSave({ title, username, password, url, notes, category: category || undefined })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{entry ? '编辑密码' : '添加密码'}</DialogTitle>
          <DialogDescription>
            密码将使用 AES-256 加密存储
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">标题 *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如: Google 账户"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">用户名</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="用户名或邮箱"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">密码 *</label>
              <div className="flex items-center gap-2">
                <select
                  value={generateLength}
                  onChange={(e) => setGenerateLength(Number(e.target.value))}
                  className="h-7 rounded border border-border bg-background px-2 text-xs"
                >
                  <option value={12}>12位</option>
                  <option value={16}>16位</option>
                  <option value={20}>20位</option>
                  <option value={24}>24位</option>
                </select>
                <Button size="sm" variant="outline" onClick={handleGenerate}>
                  生成
                </Button>
              </div>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                <span className={cn('text-xs', strength.color)}>{strength.label}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">网址</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">分类</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="">无分类</option>
              <option value="社交">社交</option>
              <option value="工作">工作</option>
              <option value="金融">金融</option>
              <option value="购物">购物</option>
              <option value="娱乐">娱乐</option>
              <option value="其他">其他</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">备注</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="备注信息"
              className="w-full h-20 rounded-md border border-border bg-background px-3 py-2 text-sm resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!title || !password}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function PasswordManager({
  passwords,
  onAdd,
  onUpdate,
  onDelete,
  onCopy,
  className,
}: PasswordManagerProps) {
  const [showDialog, setShowDialog] = React.useState(false)
  const [editingEntry, setEditingEntry] = React.useState<PasswordEntry | undefined>()
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState<string>('')

  const categories = [...new Set(passwords.map((p) => p.category).filter(Boolean))]

  const filteredPasswords = passwords.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.url?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleSave = (data: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingEntry) {
      onUpdate?.(editingEntry.id, data)
    } else {
      onAdd?.(data)
    }
    setEditingEntry(undefined)
  }

  const handleEdit = (entry: PasswordEntry) => {
    setEditingEntry(entry)
    setShowDialog(true)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-red-400" />
          <h2 className="text-lg font-semibold">密码管理</h2>
          <span className="text-sm text-muted-foreground">({passwords.length} 条)</span>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditingEntry(undefined)
            setShowDialog(true)
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          添加
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索密码..."
            className="w-full"
          />
        </div>
        {categories.length > 0 && (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="">全部分类</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Password List */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPasswords.map((entry) => (
          <PasswordCard
            key={entry.id}
            entry={entry}
            onCopy={onCopy}
            onEdit={() => handleEdit(entry)}
            onDelete={() => onDelete?.(entry.id)}
          />
        ))}
      </div>

      {filteredPasswords.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Lock className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-sm">
            {searchTerm || selectedCategory ? '没有找到匹配的密码' : '暂无密码条目'}
          </p>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <PasswordDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        entry={editingEntry}
        onSave={handleSave}
      />
    </div>
  )
}

export { generatePassword, checkPasswordStrength }
