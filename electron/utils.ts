export function detectContentType(content: string): 'text' | 'html' | 'rtf' | 'image' | 'url' {
  if (content.startsWith('data:image/')) {
    return 'image'
  }
  if (content.includes('<html') || content.includes('<HTML')) {
    return 'html'
  }
  if (content.includes('{\\rtf')) {
    return 'rtf'
  }
  if (content.includes('http://') || content.includes('https://')) {
    return 'url'
  }
  return 'text'
}
