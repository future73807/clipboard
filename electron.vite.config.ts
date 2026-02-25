import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@electron': resolve(__dirname, './electron')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@electron': resolve(__dirname, './electron')
      }
    },
    plugins: [react()],
    server: {
      port: 5173
    }
  }
})