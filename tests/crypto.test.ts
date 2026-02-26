import { test, expect } from 'vitest'
import { encrypt, decrypt } from '../electron/crypto'

test('AES-256-GCM encrypt/decrypt returns original text', () => {
  const plaintext = 'Hello, 世界! 123456 !@#$%^&*()'
  const password = 'StrongPassword123!'
  const enc = encrypt(plaintext, password)
  expect(enc.content).not.toEqual(plaintext)
  expect(enc.iv).toBeTruthy()
  expect(enc.authTag).toBeTruthy()
  expect(enc.salt).toBeTruthy()
  const dec = decrypt(enc, password)
  expect(dec).toEqual(plaintext)
})
