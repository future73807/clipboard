import { describe, test, expect } from 'vitest'
import { detectContentType } from '../electron/utils'

describe('detectContentType', () => {
  test('detects image data url', () => {
    expect(detectContentType('data:image/png;base64,abc')).toBe('image')
  })
  test('detects html', () => {
    expect(detectContentType('<html><body></body></html>')).toBe('html')
  })
  test('detects rtf', () => {
    expect(detectContentType('{\\rtf1\\ansi}')).toBe('rtf')
  })
  test('detects url', () => {
    expect(detectContentType('https://example.com')).toBe('url')
  })
  test('defaults to text', () => {
    expect(detectContentType('plain text')).toBe('text')
  })
})
