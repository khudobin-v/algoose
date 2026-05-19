'use client'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface Props {
  text: string
  size?: number
}

export default function CopyButton({ text, size = 13 }: Props) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  return (
    <button
      onClick={copy}
      title="Копировать"
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '4px', borderRadius: 6, display: 'flex', alignItems: 'center',
        color: copied ? 'var(--green)' : 'var(--muted)',
        transition: 'color 0.15s',
        flexShrink: 0,
      }}
    >
      {copied ? <Check size={size} /> : <Copy size={size} />}
    </button>
  )
}
