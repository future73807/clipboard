import { useState, useEffect } from 'react'
import './FloatingWindow.css'

interface ClipboardItem {
  id: string
  content: string
  type: string
  timestamp: string
  size: number
  formats?: string[]
  fullContent?: {
    text?: string
    html?: string
    rtf?: string
    image?: string
    imageSize?: { width: number; height: number }
  }
  isEncrypted?: boolean
}

function FloatingWindow() {
  const [clipboardHistory, setClipboardHistory] = useState<ClipboardItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    loadClipboardHistory()
    setupClipboardListener()
    
    return () => {
      if ((window as any).electronAPI) {
        (window as any).electronAPI.removeAllListeners('clipboard-changed')
      }
    }
  }, [])

  const loadClipboardHistory = async () => {
    try {
      if ((window as any).electronAPI) {
        const history = await (window as any).electronAPI.getClipboardHistory()
        setClipboardHistory(history)
      }
    } catch (error) {
      console.error('加载剪贴板历史失败:', error)
    }
  }

  const setupClipboardListener = () => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.onClipboardChanged((item: ClipboardItem) => {
        loadClipboardHistory()
      })
    }
  }

  const handleCopyToClipboard = async (content: string) => {
    try {
      if ((window as any).electronAPI) {
        await (window as any).electronAPI.setClipboardContent(content)
        if ((window as any).electronAPI) {
          await (window as any).electronAPI.hideFloatingWindow()
        }
      }
    } catch (error) {
      console.error('复制到剪贴板失败:', error)
    }
  }

  const handleHideWindow = async () => {
    try {
      if ((window as any).electronAPI) {
        await (window as any).electronAPI.hideFloatingWindow()
      }
    } catch (error) {
      console.error('隐藏窗口失败:', error)
    }
  }

  const filteredHistory = clipboardHistory.filter(item => {
    const matchesSearch = item.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || item.type === filterType
    return matchesSearch && matchesType
  })

  const formatContent = (content: string, type: string) => {
    if (type === 'image') {
      return <img src={content} alt="Clipboard" style={{ maxWidth: '100%', maxHeight: '100px' }} />
    }
    if (type === 'html') {
      return <div className="html-preview">HTML</div>
    }
    if (type === 'rtf') {
      return <div className="rtf-preview">RTF</div>
    }
    if (content.length > 50) {
      return content.substring(0, 50) + '...'
    }
    return content
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) {
      return '刚刚'
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)} 分钟前`
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)} 小时前`
    } else {
      return date.toLocaleDateString('zh-CN')
    }
  }

  return (
    <div className="floating-window">
      <div className="floating-header">
        <h3>剪贴板历史</h3>
        <button onClick={handleHideWindow} className="close-btn">
          ✕
        </button>
      </div>
      
      <div className="floating-controls">
        <input
          type="text"
          placeholder="搜索剪贴板内容..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="filter-select"
        >
          <option value="all">所有类型</option>
          <option value="text">文本</option>
          <option value="html">HTML</option>
          <option value="image">图片</option>
          <option value="url">链接</option>
        </select>
      </div>

      <div className="floating-content">
        {filteredHistory.length === 0 ? (
          <div className="empty-state">
            {searchTerm || filterType !== 'all' ? '没有找到匹配的内容' : '暂无历史记录'}
          </div>
        ) : (
          <div className="history-list">
            {filteredHistory.map((item) => (
              <div key={item.id} className="history-item">
                <div className="item-header">
                  <span className="item-type">{item.type}</span>
                  <span className="item-timestamp">{formatTimestamp(item.timestamp)}</span>
                </div>
                <div className="item-content">
                  {formatContent(item.content, item.type)}
                </div>
                <div className="item-actions">
                  <button 
                    onClick={() => handleCopyToClipboard(item.content)}
                    className="btn-copy"
                  >
                    复制
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FloatingWindow