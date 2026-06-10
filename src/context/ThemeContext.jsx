import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const THEME_STORAGE_KEY = 'workhub_theme'

/** Temas gratuitos: no requieren compra. */
export const FREE_THEMES = ['dark', 'light']
/** Temas premium: deben comprarse en el Mercado antes de equiparse. */
export const PREMIUM_THEMES = ['dracula', 'neon', 'abyssal', 'amethyst']
export const ALL_THEMES = [...FREE_THEMES, ...PREMIUM_THEMES]

const ThemeContext = createContext(null)

function getInitialTheme() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (ALL_THEMES.includes(stored)) return stored
  return 'dark'
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      isDark: theme !== 'light',
      isPremium: PREMIUM_THEMES.includes(theme),
      /** Alterna entre dark y light (solo temas gratuitos). */
      toggleTheme: () =>
        setThemeState((prev) => {
          if (prev === 'dark') return 'light'
          if (prev === 'light') return 'dark'
          // Si hay tema premium activo, no cambia el tema premium pero vuelve al toggle normal
          return 'dark'
        }),
      /** Establece cualquier tema válido (libre o premium). */
      setTheme: (id) => {
        if (!ALL_THEMES.includes(id)) return
        setThemeState(id)
      },
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider')
  }
  return context
}
