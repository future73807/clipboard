import * as React from 'react'
import {
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  FilePieChart,
  FileType,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// 文件类型定义
export type FileCategory =
  | 'document'    // 文档
  | 'image'       // 图片
  | 'video'       // 视频
  | 'audio'       // 音频
  | 'archive'     // 压缩包
  | 'code'        // 代码
  | 'spreadsheet' // 表格
  | 'presentation'// 演示文稿
  | 'pdf'         // PDF
  | 'other'       // 其他

// 文件扩展名到类型的映射
const EXTENSION_MAP: Record<string, FileCategory> = {
  // 文档
  doc: 'document',
  docx: 'document',
  txt: 'document',
  rtf: 'document',
  odt: 'document',
  // 图片
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  bmp: 'image',
  svg: 'image',
  webp: 'image',
  ico: 'image',
  // 视频
  mp4: 'video',
  avi: 'video',
  mkv: 'video',
  mov: 'video',
  wmv: 'video',
  flv: 'video',
  webm: 'video',
  // 音频
  mp3: 'audio',
  wav: 'audio',
  flac: 'audio',
  aac: 'audio',
  ogg: 'audio',
  wma: 'audio',
  m4a: 'audio',
  // 压缩包
  zip: 'archive',
  rar: 'archive',
  '7z': 'archive',
  tar: 'archive',
  gz: 'archive',
  bz2: 'archive',
  // 代码
  js: 'code',
  jsx: 'code',
  ts: 'code',
  tsx: 'code',
  py: 'code',
  java: 'code',
  c: 'code',
  cpp: 'code',
  cs: 'code',
  go: 'code',
  rs: 'code',
  rb: 'code',
  php: 'code',
  swift: 'code',
  kt: 'code',
  vue: 'code',
  svelte: 'code',
  html: 'code',
  css: 'code',
  scss: 'code',
  less: 'code',
  json: 'code',
  xml: 'code',
  yaml: 'code',
  yml: 'code',
  md: 'code',
  sql: 'code',
  sh: 'code',
  bash: 'code',
  // 表格
  xls: 'spreadsheet',
  xlsx: 'spreadsheet',
  csv: 'spreadsheet',
  ods: 'spreadsheet',
  // 演示文稿
  ppt: 'presentation',
  pptx: 'presentation',
  odp: 'presentation',
  // PDF
  pdf: 'pdf',
}

// 类型到图标的映射
const CATEGORY_ICONS: Record<FileCategory, React.ReactNode> = {
  document: <FileText className="h-4 w-4 text-blue-400" />,
  image: <FileImage className="h-4 w-4 text-green-400" />,
  video: <FileVideo className="h-4 w-4 text-red-400" />,
  audio: <FileAudio className="h-4 w-4 text-purple-400" />,
  archive: <FileArchive className="h-4 w-4 text-yellow-400" />,
  code: <FileCode className="h-4 w-4 text-cyan-400" />,
  spreadsheet: <FileSpreadsheet className="h-4 w-4 text-green-500" />,
  presentation: <FilePieChart className="h-4 w-4 text-orange-400" />,
  pdf: <FileType className="h-4 w-4 text-red-500" />,
  other: <File className="h-4 w-4 text-muted-foreground" />,
}

// 类型到颜色的映射
const CATEGORY_COLORS: Record<FileCategory, string> = {
  document: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  image: 'text-green-400 bg-green-500/10 border-green-500/30',
  video: 'text-red-400 bg-red-500/10 border-red-500/30',
  audio: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  archive: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  code: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  spreadsheet: 'text-green-500 bg-green-600/10 border-green-600/30',
  presentation: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  pdf: 'text-red-500 bg-red-600/10 border-red-600/30',
  other: 'text-muted-foreground bg-muted/10 border-border',
}

// 类型标签
const CATEGORY_LABELS: Record<FileCategory, string> = {
  document: '文档',
  image: '图片',
  video: '视频',
  audio: '音频',
  archive: '压缩包',
  code: '代码',
  spreadsheet: '表格',
  presentation: '演示',
  pdf: 'PDF',
  other: '文件',
}

interface FileIconProps {
  filename: string
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

/**
 * 根据文件名获取文件类型
 */
export function getFileCategory(filename: string): FileCategory {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return EXTENSION_MAP[ext] || 'other'
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

/**
 * 文件图标组件
 */
export function FileIcon({
  filename,
  className,
  showLabel = false,
  size = 'md',
}: FileIconProps) {
  const category = getFileCategory(filename)
  const extension = getFileExtension(filename)
  const icon = CATEGORY_ICONS[category]
  const label = CATEGORY_LABELS[category]

  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  // 克隆图标并应用尺寸
  const sizedIcon = React.cloneElement(icon as React.ReactElement, {
    className: cn(sizeClasses[size], (icon as React.ReactElement).props?.className),
  })

  if (showLabel) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        {sizedIcon}
        <span className="text-xs text-muted-foreground">{extension.toUpperCase()}</span>
      </div>
    )
  }

  return (
    <div className={className}>
      {sizedIcon}
    </div>
  )
}

/**
 * 文件类型徽章
 */
export function FileTypeBadge({
  filename,
  className,
}: {
  filename: string
  className?: string
}) {
  const category = getFileCategory(filename)
  const extension = getFileExtension(filename)
  const colorClass = CATEGORY_COLORS[category]
  const icon = CATEGORY_ICONS[category]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs',
        colorClass,
        className
      )}
    >
      {React.cloneElement(icon as React.ReactElement, { className: 'h-3 w-3' })}
      <span>{extension.toUpperCase()}</span>
    </div>
  )
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`
}

/**
 * 文件信息展示组件
 */
export function FileInfo({
  filename,
  filePath,
  fileSize,
  className,
}: {
  filename: string
  filePath?: string
  fileSize?: number
  className?: string
}) {
  const category = getFileCategory(filename)
  const icon = CATEGORY_ICONS[category]
  const label = CATEGORY_LABELS[category]

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <div className="flex-shrink-0 p-2 rounded-lg bg-muted/50">
        {React.cloneElement(icon as React.ReactElement, { className: 'h-6 w-6' })}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{filename}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span>{label}</span>
          {fileSize !== undefined && (
            <>
              <span>|</span>
              <span>{formatFileSize(fileSize)}</span>
            </>
          )}
        </div>
        {filePath && (
          <p className="text-xs text-muted-foreground truncate mt-1" title={filePath}>
            {filePath}
          </p>
        )}
      </div>
    </div>
  )
}

export {
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
}
