import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ZoomIn, ZoomOut, RotateCw, Download, Maximize2 } from 'lucide-react'

interface ImagePreviewProps {
  src: string
  alt?: string
  className?: string
  maxHeight?: number
}

export function ImagePreview({
  src,
  alt = 'Image',
  className,
  maxHeight = 200,
}: ImagePreviewProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [zoom, setZoom] = React.useState(1)
  const [rotation, setRotation] = React.useState(0)

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.25))
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360)
  const handleReset = () => {
    setZoom(1)
    setRotation(0)
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = src
    link.download = alt || 'image.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      {/* 缩略图 */}
      <div
        className={cn(
          'relative overflow-hidden rounded-md bg-slate-900/50 cursor-pointer group',
          className
        )}
        style={{ maxHeight }}
        onClick={() => setIsOpen(true)}
      >
        <img
          src={src}
          alt={alt}
          className="max-h-full w-auto object-contain transition-transform duration-200 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
          <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
      </div>

      {/* 放大预览对话框 */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle className="flex items-center justify-between">
              <span>{alt}</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button variant="ghost" size="icon" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleRotate}>
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleReset}>
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-slate-950 flex items-center justify-center p-4">
            <img
              src={src}
              alt={alt}
              className="transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                maxHeight: 'calc(90vh - 120px)',
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
