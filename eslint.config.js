const js = require('@eslint/js')
const globals = require('globals')

module.exports = [
  {
    ignores: ['dist', 'out', 'node_modules', 'eslint.config.js'],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        window: 'readonly',
        document: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
]
