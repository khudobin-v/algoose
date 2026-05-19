'use client'
import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') router.replace('/')
  }, [status, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', {
      login,
      password,
      redirect: false,
    })
    setLoading(false)
    if (res?.error) {
      setError('Неверный логин или пароль')
    } else {
      router.replace('/')
    }
  }

  if (status === 'loading' || session) return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }} />
  )

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', paddingTop: 0,
    }}>
      <form onSubmit={handleSubmit} style={{
        width: 340, padding: '36px 32px', borderRadius: 16,
        background: 'var(--surface)', border: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)' }}>Algoose</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 3 }}>Войдите, чтобы продолжить</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Логин или e-mail
          </label>
          <input
            type="text"
            value={login}
            onChange={e => setLogin(e.target.value)}
            autoComplete="username"
            required
            style={{
              padding: '10px 12px', borderRadius: 9, fontSize: '0.9rem',
              border: '1px solid var(--border)', background: 'var(--surface2)',
              color: 'var(--text)', outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Пароль
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            style={{
              padding: '10px 12px', borderRadius: 9, fontSize: '0.9rem',
              border: '1px solid var(--border)', background: 'var(--surface2)',
              color: 'var(--text)', outline: 'none',
            }}
          />
        </div>

        {error && (
          <div style={{ fontSize: '0.8rem', color: 'var(--red)', textAlign: 'center' }}>{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-accent"
          style={{ padding: '12px', fontSize: '0.9rem', borderRadius: 10, marginTop: 4 }}
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
