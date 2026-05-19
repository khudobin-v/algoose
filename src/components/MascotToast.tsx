'use client'
import { useEffect, useState } from 'react'
import { useTheme } from '@/components/ThemeProvider'

interface Props {
  message: string
  onDone: () => void
  duration?: number
}

export default function MascotToast({ message, onDone, duration = 3500 }: Props) {
  const { theme } = useTheme()
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    // enter
    requestAnimationFrame(() => setVisible(true))
    const t = setTimeout(() => {
      setLeaving(true)
      setTimeout(onDone, 350)
    }, duration)
    return () => clearTimeout(t)
  }, [duration, onDone])

  const gooseSrc = theme === 'light' ? '/goose-black.svg' : '/goose-white.svg'

  return (
    <div
      onClick={() => { setLeaving(true); setTimeout(onDone, 350) }}
      style={{
        position: 'fixed', bottom: 28, right: 24,
        zIndex: 600, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 18px', borderRadius: 14,
        background: 'var(--surface2)', border: '1px solid var(--accent)55',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        transform: visible && !leaving ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
        opacity: visible && !leaving ? 1 : 0,
        transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease',
        maxWidth: 300,
      }}
    >
      {/* Goose with bounce animation */}
      <div style={{ animation: 'gooseBounce 0.6s ease 0.1s both', flexShrink: 0 }}>
        <img src={gooseSrc} width={40} height={40} alt="" />
      </div>
      <div>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
          Algoose
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text2)', lineHeight: 1.5 }}>
          {message}
        </div>
      </div>
    </div>
  )
}
