import { describe, it, expect } from 'vitest'
import { checkPasswordStrength, generatePassword } from '../../components/clipboard/PasswordManager'

describe('Password Manager', () => {
  describe('checkPasswordStrength', () => {
    it('should return weak for short passwords', () => {
      const result = checkPasswordStrength('abc')
      expect(result.label).toBe('弱')
      expect(result.score).toBeLessThanOrEqual(2)
    })

    it('should return weak for password without complexity', () => {
      const result = checkPasswordStrength('abcdefgh')
      expect(result.label).toBe('弱')
      expect(result.score).toBeLessThanOrEqual(2)
    })

    it('should return medium for moderately complex passwords', () => {
      const result = checkPasswordStrength('Abcdefgh1')
      expect(result.label).toBe('中')
      expect(result.score).toBeGreaterThan(2)
      expect(result.score).toBeLessThanOrEqual(4)
    })

    it('should return strong for complex passwords', () => {
      const result = checkPasswordStrength('Abcdefgh123!@#')
      expect(result.label).toBe('强')
      expect(result.score).toBeGreaterThan(4)
    })

    it('should return correct color codes', () => {
      const weak = checkPasswordStrength('a')
      expect(weak.color).toBe('text-red-400')

      const medium = checkPasswordStrength('Abcdefgh1')
      expect(medium.color).toBe('text-yellow-400')

      const strong = checkPasswordStrength('Abcdefgh123!@#')
      expect(strong.color).toBe('text-green-400')
    })

    it('should handle empty password', () => {
      const result = checkPasswordStrength('')
      expect(result.label).toBe('弱')
      expect(result.score).toBe(0)
    })

    it('should check all criteria correctly', () => {
      // Length >= 8: +1
      // Length >= 12: +1
      // lowercase: +1
      // uppercase: +1
      // numbers: +1
      // symbols: +1
      const result = checkPasswordStrength('Abcdefgh12345!@#')
      expect(result.score).toBe(6)
      expect(result.label).toBe('强')
    })
  })

  describe('generatePassword', () => {
    it('should generate password of specified length', () => {
      const password = generatePassword(16)
      expect(password.length).toBe(16)
    })

    it('should generate different passwords each time', () => {
      const password1 = generatePassword(16)
      const password2 = generatePassword(16)
      // While there's a tiny chance they could be the same, it's very unlikely
      expect(password1).not.toBe(password2)
    })

    it('should generate password with lowercase only', () => {
      const password = generatePassword(16, { lowercase: true, uppercase: false, numbers: false, symbols: false })
      expect(password).toMatch(/^[a-z]+$/)
    })

    it('should generate password with uppercase only', () => {
      const password = generatePassword(16, { lowercase: false, uppercase: true, numbers: false, symbols: false })
      expect(password).toMatch(/^[A-Z]+$/)
    })

    it('should generate password with numbers only', () => {
      const password = generatePassword(16, { lowercase: false, uppercase: false, numbers: true, symbols: false })
      expect(password).toMatch(/^[0-9]+$/)
    })

    it('should generate password with symbols only', () => {
      const password = generatePassword(16, { lowercase: false, uppercase: false, numbers: false, symbols: true })
      expect(password).toMatch(/^[!@#$%^&*()_+\-=\\[\]{}|;:,.<>?]+$/)
    })

    it('should generate password with mixed characters', () => {
      const password = generatePassword(20, { lowercase: true, uppercase: true, numbers: true, symbols: true })
      expect(password.length).toBe(20)
      // Check it contains at least some characters
      expect(password.length).toBeGreaterThan(0)
    })

    it('should default to lowercase when no options provided', () => {
      const password = generatePassword(16, { lowercase: false, uppercase: false, numbers: false, symbols: false })
      expect(password).toMatch(/^[a-z]+$/)
    })

    it('should handle custom lengths', () => {
      expect(generatePassword(8).length).toBe(8)
      expect(generatePassword(32).length).toBe(32)
      expect(generatePassword(64).length).toBe(64)
    })
  })
})
