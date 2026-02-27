import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'auto'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'auto',
  storageKey = 'clipboard-theme'
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark')
  const [mounted, setMounted] = useState(false)

  // 在组件挂载后从 localStorage 读取主题
  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as Theme | null
    if (stored && ['light', 'dark', 'auto'].includes(stored)) {
      setThemeState(stored)
    }
    setMounted(true)
  }, [storageKey])

  useEffect(() => {
    if (!mounted) return

    const root = window.document.documentElement

    // 移除之前的主题类
    root.classList.remove('light', 'dark')

    // 计算实际主题
    let resolved: 'light' | 'dark' = 'dark'
    if (theme === 'auto') {
      resolved = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    } else {
      resolved = theme
    }

    // 应用主题类
    root.classList.add(resolved)
    setResolvedTheme(resolved)

    // 保存到 localStorage
    localStorage.setItem(storageKey, theme)
  }, [theme, storageKey, mounted])

  // 监听系统主题变化
  useEffect(() => {
    if (!mounted || theme !== 'auto') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
    const handleChange = (e: MediaQueryListEvent) => {
      const resolved = e.matches ? 'light' : 'dark'
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(resolved)
      setResolvedTheme(resolved)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, mounted])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
