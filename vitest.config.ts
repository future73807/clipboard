import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['electron/utils.ts', 'electron/crypto.ts'],
      reporter: ['text']
    }
  }
})
