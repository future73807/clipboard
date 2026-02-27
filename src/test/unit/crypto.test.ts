import { describe, it, expect } from 'vitest'
import { encrypt, decrypt, deriveKey } from '../../../electron/crypto'

describe('Crypto Module', () => {
  describe('deriveKey', () => {
    it('should derive a key from password and salt', () => {
      const password = 'test-password-123'
      const salt = Buffer.from('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', 'hex')

      const key = deriveKey(password, salt)

      expect(key).toBeInstanceOf(Buffer)
      expect(key.length).toBe(32) // 256 bits
    })

    it('should produce different keys for different passwords', () => {
      const salt = Buffer.from('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', 'hex')

      const key1 = deriveKey('password1', salt)
      const key2 = deriveKey('password2', salt)

      expect(key1.equals(key2)).toBe(false)
    })

    it('should produce different keys for different salts', () => {
      const password = 'test-password'
      const salt1 = Buffer.from('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', 'hex')
      const salt2 = Buffer.from('0123456789abcdef0123456789abcdef0', 'hex')

      const key1 = deriveKey(password, salt1)
      const key2 = deriveKey(password, salt2)

      expect(key1.equals(key2)).toBe(false)
    })
  })

  describe('encrypt', () => {
    it('should encrypt text successfully', () => {
      const text = 'Hello, World!'
      const password = 'my-secret-password'

      const encrypted = encrypt(text, password)

      expect(encrypted).toHaveProperty('content')
      expect(encrypted).toHaveProperty('iv')
      expect(encrypted).toHaveProperty('authTag')
      expect(encrypted).toHaveProperty('salt')

      expect(encrypted.content).not.toBe(text)
      expect(typeof encrypted.content).toBe('string')
    })

    it('should produce different encrypted content for same text with different passwords', () => {
      const text = 'Same text'
      const password1 = 'password1'
      const password2 = 'password2'

      const encrypted1 = encrypt(text, password1)
      const encrypted2 = encrypt(text, password2)

      expect(encrypted1.content).not.toBe(encrypted2.content)
    })

    it('should encrypt empty string', () => {
      const text = ''
      const password = 'test-password'

      const encrypted = encrypt(text, password)

      expect(encrypted).toHaveProperty('content')
    })

    it('should encrypt long text', () => {
      const text = 'a'.repeat(10000)
      const password = 'test-password'

      const encrypted = encrypt(text, password)

      expect(encrypted).toHaveProperty('content')
      expect(encrypted.content.length).toBeGreaterThan(0)
    })

    it('should encrypt unicode text', () => {
      const text = '你好世界 日本語 مرحبا'
      const password = 'test-password'

      const encrypted = encrypt(text, password)

      expect(encrypted).toHaveProperty('content')
    })
  })

  describe('decrypt', () => {
    it('should decrypt text successfully', () => {
      const text = 'Hello, World!'
      const password = 'my-secret-password'

      const encrypted = encrypt(text, password)
      const decrypted = decrypt(encrypted, password)

      expect(decrypted).toBe(text)
    })

    it('should fail to decrypt with wrong password', () => {
      const text = 'Hello, World!'
      const password = 'correct-password'
      const wrongPassword = 'wrong-password'

      const encrypted = encrypt(text, password)

      expect(() => decrypt(encrypted, wrongPassword)).toThrow()
    })

    it('should decrypt empty string', () => {
      const text = ''
      const password = 'test-password'

      const encrypted = encrypt(text, password)
      const decrypted = decrypt(encrypted, password)

      expect(decrypted).toBe(text)
    })

    it('should decrypt unicode text', () => {
      const text = '你好世界 日本語 مرحبا'
      const password = 'test-password'

      const encrypted = encrypt(text, password)
      const decrypted = decrypt(encrypted, password)

      expect(decrypted).toBe(text)
    })

    it('should handle multiple encrypt/decrypt cycles', () => {
      const texts = ['First text', 'Second text', 'Third text with special chars: !@#$%^&*()']
      const password = 'test-password'

      texts.forEach(text => {
        const encrypted = encrypt(text, password)
        const decrypted = decrypt(encrypted, password)
        expect(decrypted).toBe(text)
      })
    })
  })
})
