'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { pushProgress, collectLocalProgress } from '@/lib/syncProgress'

export default function SyncPage() {
  const { status } = useSession()
  const [state, setState] = useState<'waiting' | 'syncing' | 'done' | 'empty'>('waiting')

  useEffect(() => {
    if (status !== 'authenticated') return
    const data = collectLocalProgress()
    if (Object.keys(data).length === 0) {
      setState('empty')
      return
    }
    setState('syncing')
    pushProgress().then(() => setState('done'))
  }, [status])

  const centerStyle: React.CSSProperties = {
    minHeight: '100dvh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 12,
    padding: 24, textAlign: 'center',
  }

  if (status === 'loading' || state === 'waiting') return (
    <div style={centerStyle}>
      <div style={{ fontSize: '2rem' }}>⏳</div>
      <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Проверяю сессию...</div>
    </div>
  )

  if (state === 'syncing') return (
    <div style={centerStyle}>
      <div style={{ fontSize: '2rem' }}>🔄</div>
      <div style={{ color: 'var(--text)', fontSize: '0.9rem', fontWeight: 600 }}>Сохраняю прогресс в базу...</div>
    </div>
  )

  if (state === 'empty') return (
    <div style={centerStyle}>
      <div style={{ fontSize: '2rem' }}>📭</div>
      <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>На этом устройстве нет данных для переноса.</div>
    </div>
  )

  return (
    <div style={centerStyle}>
      <div style={{ fontSize: '2.5rem' }}>✅</div>
      <div style={{ color: 'var(--green)', fontSize: '1rem', fontWeight: 700 }}>Прогресс сохранён</div>
      <div style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
        Теперь он доступен на всех устройствах после входа.
      </div>
    </div>
  )
}
