import { describe, it, expect } from 'vitest'
import { detectContentType } from '../../../electron/utils'

describe('detectContentType', () => {
  describe('image detection', () => {
    it('should detect PNG images', () => {
      const content = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      expect(detectContentType(content)).toBe('image')
    })

    it('should detect JPEG images', () => {
      const content = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q=='
      expect(detectContentType(content)).toBe('image')
    })

    it('should detect GIF images', () => {
      const content = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
      expect(detectContentType(content)).toBe('image')
    })
  })

  describe('HTML detection', () => {
    it('should detect HTML content with lowercase tag', () => {
      const content = '<html><body>Hello World</body></html>'
      expect(detectContentType(content)).toBe('html')
    })

    it('should detect HTML content with uppercase tag', () => {
      const content = '<HTML><BODY>Hello World</BODY></HTML>'
      expect(detectContentType(content)).toBe('html')
    })

    it('should detect HTML with DOCTYPE', () => {
      const content = '<!DOCTYPE html><html><body>Content</body></html>'
      expect(detectContentType(content)).toBe('html')
    })

    it('should detect partial HTML content', () => {
      const content = 'Some text <html> embedded html'
      expect(detectContentType(content)).toBe('html')
    })
  })

  describe('RTF detection', () => {
    it('should detect RTF content', () => {
      const content = '{\\rtf1\\ansi\\ansicpg1252\\deff0\\deflang1033{\\fonttbl{\\f0\\fnil\\fcharset0 Calibri;}}\\viewkind4\\uc1\\pard\\f0\\fs23 Hello World\\par}'
      expect(detectContentType(content)).toBe('rtf')
    })
  })

  describe('URL detection', () => {
    it('should detect HTTP URLs', () => {
      const content = 'http://example.com'
      expect(detectContentType(content)).toBe('url')
    })

    it('should detect HTTPS URLs', () => {
      const content = 'https://example.com'
      expect(detectContentType(content)).toBe('url')
    })

    it('should detect URL in text', () => {
      const content = 'Check out https://example.com for more info'
      expect(detectContentType(content)).toBe('url')
    })
  })

  describe('text detection', () => {
    it('should return text for plain text', () => {
      const content = 'Hello, World!'
      expect(detectContentType(content)).toBe('text')
    })

    it('should return text for empty string', () => {
      expect(detectContentType('')).toBe('text')
    })

    it('should return text for numbers', () => {
      expect(detectContentType('123456')).toBe('text')
    })

    it('should return text for special characters', () => {
      expect(detectContentType('!@#$%^&*()')).toBe('text')
    })

    it('should return text for multiline content', () => {
      const content = 'Line 1\nLine 2\nLine 3'
      expect(detectContentType(content)).toBe('text')
    })
  })

  describe('priority', () => {
    it('should prioritize image over other types', () => {
      const content = 'data:image/png;base64,http://example.com'
      expect(detectContentType(content)).toBe('image')
    })

    it('should prioritize HTML over URL', () => {
      const content = '<html>https://example.com</html>'
      expect(detectContentType(content)).toBe('html')
    })
  })
})
