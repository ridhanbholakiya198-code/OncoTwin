import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'oncotwin-theme'

function getSystemPreference() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function applyTheme(theme) {
  const root = document.documentElement
  if (theme === 'light') {
    root.classList.add('light')
  } else {
    root.classList.remove('light')
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    return saved || getSystemPreference()
  })

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // If the user has never manually chosen a theme, keep following the
  // system/OS setting live (e.g. phone auto dark-mode at night).
  useEffect(() => {
    const hasManualPreference = localStorage.getItem(STORAGE_KEY)
    if (hasManualPreference) return

    const mql = window.matchMedia('(prefers-color-scheme: light)')
    const handler = (e) => setTheme(e.matches ? 'light' : 'dark')
    mql.addEventListener?.('change', handler)
    return () => mql.removeEventListener?.('change', handler)
  }, [])

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }

  function resetToSystem() {
    localStorage.removeItem(STORAGE_KEY)
    setTheme(getSystemPreference())
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, resetToSystem }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
