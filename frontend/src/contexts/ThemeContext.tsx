import { createContext, useContext, useState, useEffect } from 'react'

export type Theme =
  | 'dark' | 'dark-green' | 'dark-red' | 'dark-purple' | 'dark-amber'
  | 'light' | 'light-green' | 'light-red' | 'light-purple' | 'light-amber'

export const THEMES: { id: Theme; label: string; accent: string; bg: string }[] = [
  { id: 'dark',         label: 'Navy',      accent: '#5e81f4', bg: '#0f1629' },
  { id: 'dark-green',   label: 'Terminal',  accent: '#22c55e', bg: '#0d1610' },
  { id: 'dark-red',     label: 'Crimson',   accent: '#f43f5e', bg: '#170d10' },
  { id: 'dark-purple',  label: 'Midnight',  accent: '#a855f7', bg: '#100e1c' },
  { id: 'dark-amber',   label: 'Ember',     accent: '#f59e0b', bg: '#17130a' },
  { id: 'light',        label: 'Cloud',     accent: '#4a70ee', bg: '#eef1fb' },
  { id: 'light-green',  label: 'Forest',    accent: '#16a34a', bg: '#f0faf2' },
  { id: 'light-red',    label: 'Rose',      accent: '#e11d48', bg: '#fdf2f4' },
  { id: 'light-purple', label: 'Lavender',  accent: '#9333ea', bg: '#f5f0fc' },
  { id: 'light-amber',  label: 'Sand',      accent: '#d97706', bg: '#fdf8f0' },
]

export function isDarkTheme(theme: Theme) {
  return theme.startsWith('dark')
}

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'dark', setTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try { return (localStorage.getItem('tc_theme') as Theme) || 'dark' } catch { return 'dark' }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('tc_theme', theme) } catch {}
  }, [theme])

  function setTheme(t: Theme) {
    setThemeState(t)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() { return useContext(ThemeContext) }
