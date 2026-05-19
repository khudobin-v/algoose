'use client'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'none', border: 'none',
        color: 'var(--muted)', padding: '6px',
        borderRadius: 8, cursor: 'pointer', flexShrink: 0,
        transition: 'color 0.15s',
      }}
    >
      {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  )
}
