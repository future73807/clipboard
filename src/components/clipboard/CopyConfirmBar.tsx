/**
 * 复制监听确认条组件
 * 当用户复制内容时，在鼠标附近弹出微型确认条
 */

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Plus, X, Settings, Check } from 'lucide-react'

export interface CopyConfirmBarProps {
  visible: boolean
  content: string
  position: { x: number; y: number }
  countdown: number
  onConfirm: () => void
  onIgnore: () => void
  onMoreOptions: () => void
  className?: string
}

export function CopyConfirmBar({
  visible,
  content,
  position,
  countdown,
  onConfirm,
  onIgnore,
  onMoreOptions,
  className,
}: CopyConfirmBarProps) {
  // 获取内容预览
  const preview = React.useMemo(() => {
    if (!content) return ''
    if (content.startsWith('data:image/')) {
      return '[图片内容]'
    }
    return content.length > 50 ? content.slice(0, 50) + '...' : content
  }, [content])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className={cn(
            'fixed z-[9999] rounded-lg border border-border bg-card/95 backdrop-blur-sm shadow-lg',
            'p-2 min-w-[200px] max-w-[300px]',
            className
          )}
          style={{
            left: Math.min(position.x, window.innerWidth - 320),
            top: Math.min(position.y + 20, window.innerHeight - 100),
          }}
        >
          {/* 内容预览 */}
          <div className="text-xs text-muted-foreground mb-2 truncate px-1">
            {preview || '已复制内容'}
          </div>

          {/* 按钮组 */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="default"
                className="h-7 px-2 text-xs"
                onClick={onConfirm}
              >
                <Check className="h-3 w-3 mr-1" />
                保存
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={onIgnore}
              >
                <X className="h-3 w-3 mr-1" />
                忽略
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={onMoreOptions}
              >
                <Settings className="h-3 w-3" />
              </Button>

              {/* 倒计时 */}
              <span className="text-xs text-muted-foreground ml-1">
                {countdown}s
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// 复制确认模式
export type CopyConfirmMode = 'always-save' | 'always-ignore' | 'ask-every-time'

// 复制确认设置
export interface CopyConfirmSettings {
  enabled: boolean
  mode: CopyConfirmMode
  countdownSeconds: number
  showForText: boolean
  showForImage: boolean
  showForFiles: boolean
}

const DEFAULT_SETTINGS: CopyConfirmSettings = {
  enabled: true,
  mode: 'ask-every-time',
  countdownSeconds: 3,
  showForText: true,
  showForImage: true,
  showForFiles: true,
}

// 复制确认管理 Hook
export function useCopyConfirmBar(
  settings: CopyConfirmSettings = DEFAULT_SETTINGS
) {
  const [visible, setVisible] = React.useState(false)
  const [content, setContent] = React.useState('')
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const [countdown, setCountdown] = React.useState(settings.countdownSeconds)
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)
  const countdownRef = React.useRef<NodeJS.Timeout | null>(null)

  // 显示确认条
  const show = React.useCallback(
    (newContent: string, mousePosition?: { x: number; y: number }) => {
      if (!settings.enabled) return

      // 根据模式自动处理
      if (settings.mode === 'always-save') {
        // 自动保存
        window.electronAPI?.clipboardSave(newContent)
        return
      }

      if (settings.mode === 'always-ignore') {
        return
      }

      // 显示确认条
      setContent(newContent)
      setPosition(mousePosition || { x: window.innerWidth / 2, y: 100 })
      setCountdown(settings.countdownSeconds)
      setVisible(true)

      // 启动倒计时
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // 倒计时结束，自动忽略
            setVisible(false)
            if (countdownRef.current) {
              clearInterval(countdownRef.current)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    },
    [settings]
  )

  // 隐藏确认条
  const hide = React.useCallback(() => {
    setVisible(false)
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
    }
  }, [])

  // 确认保存
  const confirm = React.useCallback(() => {
    window.electronAPI?.clipboardSave(content)
    hide()
  }, [content, hide])

  // 忽略
  const ignore = React.useCallback(() => {
    hide()
  }, [hide])

  // 更多选项
  const moreOptions = React.useCallback(() => {
    // 打开更多选项对话框
    window.electronAPI?.showSaveOptions(content)
    hide()
  }, [content, hide])

  // 清理定时器
  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
      }
    }
  }, [])

  return {
    visible,
    content,
    position,
    countdown,
    show,
    hide,
    confirm,
    ignore,
    moreOptions,
  }
}

export default CopyConfirmBar
