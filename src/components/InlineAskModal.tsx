'use client'
import { useEffect, useRef, useState } from 'react'
import { Sparkles, X } from 'lucide-react'

interface Props {
  x: number
  y: number
  onSubmit: (question: string) => void
  onClose: () => void
}

export default function InlineAskModal({ x, y, onSubmit, onClose }: Props) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Clamp to viewport
  useEffect(() => {
    const el = modalRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.right > window.innerWidth - 12) {
      el.style.left = `${window.innerWidth - rect.width - 12}px`
    }
    if (rect.bottom > window.innerHeight - 12) {
      el.style.top = `${y - rect.height - 10}px`
    }
  })

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { e.stopPropagation(); onClose() }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim()) onSubmit(value.trim())
    }
  }

  return (
    <div
      ref={modalRef}
      style={{
        position: 'fixed',
        top: y + 6,
        left: x,
        zIndex: 1000,
        width: 300,
        background: 'var(--surface)',
        border: '1px solid var(--border2)',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
        overflow: 'hidden',
      }}
      onMouseDown={e => e.stopPropagation()}
    >
      <div style={{
        padding: '8px 10px 0 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Sparkles size={12} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Спросить AI
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '2px 4px', borderRadius: 4 }}
        >
          <X size={13} />
        </button>
      </div>
      <div style={{ padding: '6px 10px 10px' }}>
        <textarea
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Вопрос по коду... (Enter — отправить)"
          rows={2}
          style={{
            width: '100%', padding: '8px 10px', borderRadius: 8, resize: 'none',
            border: '1px solid var(--border)', background: 'var(--surface2)',
            color: 'var(--text)', fontSize: '0.82rem', lineHeight: 1.5,
            outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <button
            onClick={() => value.trim() && onSubmit(value.trim())}
            disabled={!value.trim()}
            style={{
              padding: '5px 14px', borderRadius: 7, cursor: value.trim() ? 'pointer' : 'default',
              fontSize: '0.75rem', fontWeight: 700, opacity: value.trim() ? 1 : 0.4,
              background: 'var(--accent)', color: 'var(--accent-text)', border: 'none',
              transition: 'opacity 0.15s',
            }}
          >
            Спросить
          </button>
        </div>
      </div>
    </div>
  )
}
