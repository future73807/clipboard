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
    },
    build: {
      lib: {
        entry: resolve(__dirname, './electron/main.ts')
      },
      outDir: 'out/main'
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: resolve(__dirname, './electron/preload/index.ts')
      },
      outDir: 'out/preload'
    }
  },
  renderer: {
    root: __dirname,
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@electron': resolve(__dirname, './electron')
      }
    },
    plugins: [react()],
    server: {
      port: 5173,
      allowedHosts: ['.monkeycode-ai.online']
    },
    build: {
      outDir: 'out/renderer',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'index.html')
        },
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      }
    }
  }
})
