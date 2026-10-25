import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export const ACCENT_COLORS = {
  emerald: {
    name: 'Emerald Green',
    class: 'emerald',
    primary: '#10b981',
    light: '#34d399',
    dark: '#059669',
    ring: 'focus:ring-emerald-500',
    border: 'border-emerald-500',
    bg: 'bg-emerald-500',
    text: 'text-emerald-500',
  },
  sapphire: {
    name: 'Sapphire Blue',
    class: 'blue',
    primary: '#3b82f6',
    light: '#60a5fa',
    dark: '#2563eb',
    ring: 'focus:ring-blue-500',
    border: 'border-blue-500',
    bg: 'bg-blue-500',
    text: 'text-blue-500',
  },
  violet: {
    name: 'Cyber Violet',
    class: 'purple',
    primary: '#8b5cf6',
    light: '#a78bfa',
    dark: '#7c3aed',
    ring: 'focus:ring-purple-500',
    border: 'border-purple-500',
    bg: 'bg-purple-500',
    text: 'text-purple-500',
  },
  amber: {
    name: 'Sunset Amber',
    class: 'amber',
    primary: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
    ring: 'focus:ring-amber-500',
    border: 'border-amber-500',
    bg: 'bg-amber-500',
    text: 'text-amber-500',
  },
  rose: {
    name: 'Ruby Rose',
    class: 'rose',
    primary: '#f43f5e',
    light: '#fb7185',
    dark: '#e11d48',
    ring: 'focus:ring-rose-500',
    border: 'border-rose-500',
    bg: 'bg-rose-500',
    text: 'text-rose-500',
  },
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('pa_theme') || 'dark'
  })

  const [accent, setAccent] = useState(() => {
    return localStorage.getItem('pa_accent') || 'emerald'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.remove('dark')
      root.classList.add('light')
    }
    localStorage.setItem('pa_theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('pa_accent', accent)
  }, [accent])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  const setAccentColor = (colorKey) => {
    if (ACCENT_COLORS[colorKey]) {
      setAccent(colorKey)
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        toggleTheme,
        setTheme,
        accent,
        accentConfig: ACCENT_COLORS[accent] || ACCENT_COLORS.emerald,
        setAccentColor,
        ACCENT_COLORS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
