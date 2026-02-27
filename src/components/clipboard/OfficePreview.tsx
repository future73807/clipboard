import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  FileType,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'

// PDF.js 配置
// Note: pdfjs-dist 需要设置 workerSrc
// import * as pdfjsLib from 'pdfjs-dist'
// pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

export type OfficeFileType = 'word' | 'excel' | 'ppt' | 'pdf'

interface OfficePreviewProps {
  fileData: string | ArrayBuffer
  fileType: OfficeFileType
  fileName?: string
  className?: string
  maxHeight?: number
}

interface PDFPreviewProps {
  data: ArrayBuffer
  maxHeight?: number
}

interface ExcelPreviewProps {
  data: ArrayBuffer
  maxHeight?: number
}

interface WordPreviewProps {
  data: ArrayBuffer
  maxHeight?: number
}

// PDF 预览组件
function PDFPreview({ data, maxHeight = 400 }: PDFPreviewProps) {
  const [pages, setPages] = React.useState<string[]>([])
  const [currentPage, setCurrentPage] = React.useState(0)
  const [zoom, setZoom] = React.useState(1)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true)
        // 动态导入 pdfjs-dist
        const pdfjsLib = await import('pdfjs-dist')

        // 设置 worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

        const loadingTask = pdfjsLib.getDocument({ data })
        const pdf = await loadingTask.promise

        const renderedPages: string[] = []

        for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
          const page = await pdf.getPage(i)
          const scale = 1.5
          const viewport = page.getViewport({ scale })

          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          canvas.height = viewport.height
          canvas.width = viewport.width

          await page.render({
            canvasContext: context!,
            viewport,
            canvas,
          } as any).promise

          renderedPages.push(canvas.toDataURL())
        }

        setPages(renderedPages)
        setLoading(false)
      } catch (err) {
        console.error('PDF 加载失败:', err)
        setError('PDF 加载失败')
        setLoading(false)
      }
    }

    if (data) {
      loadPDF()
    }
  }, [data])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <FileType className="h-12 w-12 mb-2" />
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            {currentPage + 1} / {pages.length}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
            disabled={currentPage === pages.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="icon" onClick={() => setZoom(Math.min(2, zoom + 0.25))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Page */}
      <div className="overflow-auto bg-slate-950 rounded-lg p-4" style={{ maxHeight }}>
        {pages[currentPage] && (
          <img
            src={pages[currentPage]}
            alt={`Page ${currentPage + 1}`}
            className="mx-auto transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
          />
        )}
      </div>
    </div>
  )
}

// Excel 预览组件
function ExcelPreview({ data, maxHeight = 400 }: ExcelPreviewProps) {
  const [sheets, setSheets] = React.useState<{ name: string; data: string[][] }[]>([])
  const [currentSheet, setCurrentSheet] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const loadExcel = async () => {
      try {
        setLoading(true)
        const XLSX = await import('xlsx')

        const workbook = XLSX.read(data, { type: 'array' })

        const sheetsData = workbook.SheetNames.map(name => {
          const worksheet = workbook.Sheets[name]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]
          return { name, data: jsonData }
        })

        setSheets(sheetsData)
        setLoading(false)
      } catch (err) {
        console.error('Excel 加载失败:', err)
        setError('Excel 加载失败')
        setLoading(false)
      }
    }

    if (data) {
      loadExcel()
    }
  }, [data])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <FileSpreadsheet className="h-12 w-12 mb-2" />
        <p>{error}</p>
      </div>
    )
  }

  const currentSheetData = sheets[currentSheet]?.data || []

  return (
    <div className="space-y-4">
      {/* Sheet Tabs */}
      {sheets.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {sheets.map((sheet, index) => (
            <Button
              key={sheet.name}
              variant={currentSheet === index ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentSheet(index)}
            >
              {sheet.name}
            </Button>
          ))}
        </div>
      )}

      {/* Table */}
      <ScrollArea className="border border-border rounded-lg" style={{ maxHeight }}>
        <table className="w-full text-sm">
          <tbody>
            {currentSheetData.slice(0, 100).map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex === 0 ? 'bg-muted/50 font-medium' : ''}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={cn(
                      'border border-border px-3 py-2 whitespace-nowrap',
                      rowIndex === 0 && 'sticky top-0 bg-muted'
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  )
}

// Word 预览组件
function WordPreview({ data, maxHeight = 400 }: WordPreviewProps) {
  const [html, setHtml] = React.useState<string>('')
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const loadWord = async () => {
      try {
        setLoading(true)
        const mammoth = await import('mammoth')

        const result = await mammoth.extractRawText({ arrayBuffer: data })
        // 简单的文本格式化
        const formattedHtml = result.value
          .split('\n')
          .map(line => `<p class="mb-2">${line || '&nbsp;'}</p>`)
          .join('')

        setHtml(formattedHtml)
        setLoading(false)
      } catch (err) {
        console.error('Word 加载失败:', err)
        setError('Word 加载失败')
        setLoading(false)
      }
    }

    if (data) {
      loadWord()
    }
  }, [data])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <FileText className="h-12 w-12 mb-2" />
        <p>{error}</p>
      </div>
    )
  }

  return (
    <ScrollArea className="border border-border rounded-lg p-4 bg-white text-black" style={{ maxHeight }}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </ScrollArea>
  )
}

// 主预览组件
export function OfficePreview({
  fileData,
  fileType,
  fileName,
  className,
  maxHeight = 400,
}: OfficePreviewProps) {
  const [showFullscreen, setShowFullscreen] = React.useState(false)

  // 将 Base64 字符串转换为 ArrayBuffer
  const getArrayBuffer = (): ArrayBuffer => {
    if (fileData instanceof ArrayBuffer) {
      return fileData
    }
    // 假设是 Base64 字符串
    const binaryString = atob(fileData.split(',')[1] || fileData)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }

  const data = getArrayBuffer()

  const renderPreview = () => {
    switch (fileType) {
      case 'pdf':
        return <PDFPreview data={data} maxHeight={maxHeight} />
      case 'excel':
        return <ExcelPreview data={data} maxHeight={maxHeight} />
      case 'word':
        return <WordPreview data={data} maxHeight={maxHeight} />
      case 'ppt':
        return (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Presentation className="h-12 w-12 mb-2" />
            <p>PPT 预览暂不支持</p>
            <p className="text-xs mt-1">建议使用专业工具打开</p>
          </div>
        )
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <FileType className="h-12 w-12 mb-2" />
            <p>不支持的文件类型</p>
          </div>
        )
    }
  }

  const getFileIcon = () => {
    switch (fileType) {
      case 'pdf':
        return <FileType className="h-4 w-4 text-red-500" />
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4 text-green-500" />
      case 'word':
        return <FileText className="h-4 w-4 text-blue-500" />
      case 'ppt':
        return <Presentation className="h-4 w-4 text-orange-500" />
      default:
        return <FileType className="h-4 w-4" />
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getFileIcon()}
          <span className="text-sm font-medium">{fileName || '预览'}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowFullscreen(true)}>
          全屏查看
        </Button>
      </div>

      {/* Preview */}
      {renderPreview()}

      {/* Fullscreen Dialog */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getFileIcon()}
              {fileName || '文档预览'}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh]">
            {renderPreview()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 文件类型检测
export function detectOfficeFileType(filename: string): OfficeFileType | null {
  const ext = filename.split('.').pop()?.toLowerCase()

  switch (ext) {
    case 'pdf':
      return 'pdf'
    case 'xlsx':
    case 'xls':
    case 'csv':
      return 'excel'
    case 'docx':
    case 'doc':
      return 'word'
    case 'pptx':
    case 'ppt':
      return 'ppt'
    default:
      return null
  }
}
