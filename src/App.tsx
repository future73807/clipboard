import { useState, useEffect } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import './App.css'

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
  tags?: string[]
}

function App() {
  const [clipboardHistory, setClipboardHistory] = useState<ClipboardItem[]>([])
  const [currentClipboard, setCurrentClipboard] = useState<string>('')
  const [isMonitoring, setIsMonitoring] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [encryptionStatus, setEncryptionStatus] = useState({ enabled: false, unlocked: false })
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordMode, setPasswordMode] = useState<'enable' | 'unlock' | 'disable'>('unlock')

  useEffect(() => {
    loadClipboardHistory()
    checkEncryptionStatus()
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

  const checkEncryptionStatus = async () => {
    try {
      if ((window as any).electronAPI) {
        const status = await (window as any).electronAPI.getEncryptionStatus()
        setEncryptionStatus(status)
      }
    } catch (error) {
      console.error('获取加密状态失败:', error)
    }
  }

  const handleEncryptionAction = async () => {
    if (!passwordInput) return
    
    try {
      let result
      if ((window as any).electronAPI) {
        if (passwordMode === 'enable') {
          result = await (window as any).electronAPI.enableEncryption(passwordInput)
        } else if (passwordMode === 'unlock') {
          result = await (window as any).electronAPI.unlockEncryption(passwordInput)
        } else if (passwordMode === 'disable') {
          result = await (window as any).electronAPI.disableEncryption(passwordInput)
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

  const handleOCR = async (content: string) => {
    try {
      if ((window as any).electronAPI) {
        const result = await (window as any).electronAPI.ocrImage(content)
        if (result.success && result.text) {
          await (window as any).electronAPI.setClipboardContent(result.text)
          alert('文字已提取并复制到剪贴板:\n' + result.text)
        } else {
          alert('提取文字失败: ' + (result.error || '未知错误'))
        }
      }
    } catch (error) {
      console.error('OCR failed:', error)
      alert('OCR failed')
    }
  }

  const toggleCodeTag = async (item: ClipboardItem) => {
    try {
      if ((window as any).electronAPI) {
        let tags = item.tags || []
        if (tags.includes('code')) {
          tags = tags.filter(t => t !== 'code')
        } else {
          tags.push('code')
        }
        await (window as any).electronAPI.updateClipboardItem(item.id, { tags })
        loadClipboardHistory()
      }
    } catch (error) {
      console.error('更新失败:', error)
    }
  }

  const setupClipboardListener = () => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.onClipboardChanged((item: ClipboardItem) => {
        setCurrentClipboard(item.content)
        loadClipboardHistory()
      })
    }
  }

  const handleCopyToClipboard = async (content: string) => {
    try {
      if ((window as any).electronAPI) {
        await (window as any).electronAPI.setClipboardContent(content)
      }
    } catch (error) {
      console.error('复制到剪贴板失败:', error)
    }
  }

  const handleClearHistory = async () => {
    try {
      if ((window as any).electronAPI) {
        await (window as any).electronAPI.clearClipboardHistory()
        setClipboardHistory([])
      }
    } catch (error) {
      console.error('清空历史记录失败:', error)
    }
  }

  const handleShowFloatingWindow = async () => {
    try {
      if ((window as any).electronAPI) {
        await (window as any).electronAPI.showFloatingWindow()
      }
    } catch (error) {
      console.error('显示浮动窗口失败:', error)
    }
  }

  const formatContent = (content: string, type: string, item?: ClipboardItem) => {
    if (item?.tags?.includes('code')) {
      return (
        <div style={{ maxHeight: '300px', overflow: 'auto', borderRadius: '4px' }}>
          <SyntaxHighlighter language="javascript" style={vscDarkPlus} customStyle={{ margin: 0, fontSize: '12px' }}>
            {content}
          </SyntaxHighlighter>
        </div>
      )
    }
    if (type === 'image') {
      return <img src={content} alt="Clipboard Image" style={{ maxWidth: '100%', maxHeight: '150px' }} />
    }
    if (type === 'html') {
      return <div className="html-content-preview">HTML Content</div>
    }
    if (type === 'rtf') {
      return <div className="rtf-content-preview">RTF Document</div>
    }
    if (content.length > 100) {
      return content.substring(0, 100) + '...'
    }
    return content
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN')
  }

  const filteredHistory = clipboardHistory.filter(item => {
    const matchesSearch = item.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || item.type === filterType
    return matchesSearch && matchesType
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return '🖼️'
      case 'html': return '📝'
      case 'rtf': return '📄'
      case 'url': return '🔗'
      default: return '📋'
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>剪贴板管理器</h1>
        <div className="header-actions">
          <button 
            onClick={() => {
              if (encryptionStatus.enabled) {
                if (encryptionStatus.unlocked) {
                  setPasswordMode('disable')
                } else {
                  setPasswordMode('unlock')
                }
              } else {
                setPasswordMode('enable')
              }
              setShowPasswordModal(true)
            }} 
            className={`btn ${encryptionStatus.enabled ? (encryptionStatus.unlocked ? 'btn-success' : 'btn-warning') : 'btn-secondary'}`}
            style={{ marginRight: '10px' }}
          >
            {encryptionStatus.enabled ? (encryptionStatus.unlocked ? '🔓 已解锁' : '🔒 已锁定') : '🛡️ 启用加密'}
          </button>
          <button onClick={handleShowFloatingWindow} className="btn btn-primary">
            显示浮动窗口
          </button>
          <button onClick={handleClearHistory} className="btn btn-danger">
            清空历史
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="current-clipboard">
          <h3>当前剪贴板内容</h3>
          <div className="clipboard-content">
            {currentClipboard ? formatContent(currentClipboard, 'text') : '暂无内容'}
          </div>
        </div>

        <div className="history-section">
          <div className="history-header">
            <h3>剪贴板历史记录</h3>
            <div className="history-controls">
              <input
                type="text"
                placeholder="搜索剪贴板内容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <div className="filter-tabs">
                <button 
                  className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterType('all')}
                >
                  全部
                </button>
                <button 
                  className={`filter-tab ${filterType === 'text' ? 'active' : ''}`}
                  onClick={() => setFilterType('text')}
                >
                  文本
                </button>
                <button 
                  className={`filter-tab ${filterType === 'image' ? 'active' : ''}`}
                  onClick={() => setFilterType('image')}
                >
                  图片
                </button>
                <button 
                  className={`filter-tab ${filterType === 'html' ? 'active' : ''}`}
                  onClick={() => setFilterType('html')}
                >
                  HTML
                </button>
              </div>
            </div>
          </div>
          
          <div className="history-list">
            {filteredHistory.length === 0 ? (
              <div className="empty-state">
                {searchTerm || filterType !== 'all' ? '没有找到匹配的记录' : '暂无历史记录'}
              </div>
            ) : (
              filteredHistory.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="item-header">
                    <span className="item-type">
                      {getTypeIcon(item.type)} {item.type}
                    </span>
                    <span className="item-timestamp">{formatTimestamp(item.timestamp)}</span>
                    <span className="item-size">{item.size} 字符</span>
                  </div>
                  <div className="item-content">
                    {formatContent(item.content, item.type, item)}
                  </div>
                  <div className="item-actions">
                    {item.type === 'text' && (
                      <button 
                        onClick={() => toggleCodeTag(item)}
                        className={`btn btn-sm ${item.tags?.includes('code') ? 'btn-success' : 'btn-secondary'}`}
                        style={{ marginRight: '8px' }}
                      >
                        {item.tags?.includes('code') ? '取消代码' : '代码'}
                      </button>
                    )}
                    {item.type === 'image' && (
                      <button 
                        onClick={() => handleOCR(item.content)}
                        className="btn btn-sm btn-secondary"
                        style={{ marginRight: '8px' }}
                      >
                        提取文字
                      </button>
                    )}
                    <button 
                      onClick={() => handleCopyToClipboard(item.content)}
                      className="btn btn-sm btn-primary"
                    >
                      复制
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>
              {passwordMode === 'enable' && '设置加密密码'}
              {passwordMode === 'unlock' && '解锁加密内容'}
              {passwordMode === 'disable' && '禁用加密（需要密码）'}
            </h3>
            <div className="modal-content">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="请输入密码"
                className="password-input"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleEncryptionAction()
                  }
                }}
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => {
                setShowPasswordModal(false)
                setPasswordInput('')
              }} className="btn btn-secondary">取消</button>
              <button onClick={handleEncryptionAction} className="btn btn-primary">确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App