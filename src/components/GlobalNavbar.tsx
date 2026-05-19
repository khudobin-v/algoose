'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, BarChart2, Settings } from 'lucide-react'
import AlgooseLogo from './AlgooseLogo'
import ThemeToggle from './ThemeToggle'
import { NavbarSlotRenderer } from './NavbarSlot'

function getBackPath(path: string): string | null {
  if (path === '/' || path === '') return null
  if (path === '/stats') return '/'
  if (/^\/task\/[^/]+\/practice/.test(path)) return path.replace(/\/practice.*$/, '')
  if (/^\/task\/[^/]+/.test(path)) return '/'
  return '/'
}

export default function GlobalNavbar() {
  const path = usePathname()
  const isHome = path === '/'
  const backPath = getBackPath(path)

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: 'var(--navbar-h)',
      zIndex: 200,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      background: 'var(--navbar-bg)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 18px', gap: 8,
    }}>
      {backPath && (
        <Link href={backPath} style={{
          color: 'var(--muted)', display: 'flex', alignItems: 'center',
          padding: '6px', borderRadius: 8, flexShrink: 0,
          transition: 'color 0.15s',
        }}>
          <ArrowLeft size={18} />
        </Link>
      )}

      <Link href="/" style={{
        display: 'flex', alignItems: 'center', gap: 7,
        textDecoration: 'none', color: 'var(--text)', flexShrink: 0,
      }}>
        <AlgooseLogo size={30} />
        {isHome && (
          <span style={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Algoose
          </span>
        )}
      </Link>

      <NavbarSlotRenderer />

      <ThemeToggle />

      <Link href="/settings" style={{
        display: 'flex', alignItems: 'center',
        color: 'var(--muted)', padding: '6px',
        borderRadius: 8, transition: 'color 0.15s',
      }}>
        <Settings size={16} />
      </Link>

      <Link href="/stats" style={{
        display: 'flex', alignItems: 'center',
        color: path === '/stats' ? 'var(--accent)' : 'var(--muted)',
        padding: '6px', borderRadius: 8, transition: 'color 0.15s',
      }}>
        <BarChart2 size={16} />
      </Link>
    </nav>
  )
}
