import * as React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface MarkdownPreviewProps {
  content: string
  className?: string
  maxHeight?: number
}

export function MarkdownPreview({
  content,
  className,
  maxHeight = 200,
}: MarkdownPreviewProps) {
  return (
    <div
      className={cn(
        'prose prose-sm prose-invert max-w-none',
        'prose-headings:text-foreground prose-p:text-muted-foreground',
        'prose-a:text-primary prose-code:text-primary',
        'prose-pre:bg-slate-900 prose-pre:border prose-pre:border-border',
        className
      )}
      style={{ maxHeight, overflow: 'auto' }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 自定义代码块渲染
          code({ className: codeClassName, children, ...props }) {
            const match = /language-(\w+)/.exec(codeClassName || '')
            const isInline = !match

            if (isInline) {
              return (
                <code
                  className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-primary"
                  {...props}
                >
                  {children}
                </code>
              )
            }

            return (
              <code className={codeClassName} {...props}>
                {children}
              </code>
            )
          },
          // 自定义链接渲染
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                {children}
              </a>
            )
          },
          // 自定义标题渲染
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-foreground mb-3">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold text-foreground mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-foreground mb-2">{children}</h3>
          ),
          // 自定义列表渲染
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              {children}
            </ol>
          ),
          // 自定义引用渲染
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/50 pl-4 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          // 自定义表格渲染
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-border text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border bg-muted px-3 py-2 text-left font-medium text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-2 text-muted-foreground">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

// 检测内容是否为 Markdown
export function isMarkdown(content: string): boolean {
  const markdownPatterns = [
    /^#{1,6}\s+/m,           // 标题
    /\*\*.*?\*\*/,           // 粗体
    /\*.*?\*/,               // 斜体
    /^\s*[-*+]\s+/m,         // 无序列表
    /^\s*\d+\.\s+/m,         // 有序列表
    /\[.*?\]\(.*?\)/,        // 链接
    /`[^`]+`/,               // 行内代码
    /^```/m,                 // 代码块
    /^>\s+/m,                // 引用
    /\|.+\|/,                // 表格
  ]

  return markdownPatterns.some((pattern) => pattern.test(content))
}
