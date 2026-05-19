'use client'
import { useTheme } from '@/components/ThemeProvider'

interface Props {
  label?: string
}

export default function WalkingGoose({ label = 'Анализирую...' }: Props) {
  const { theme } = useTheme()
  const gooseSrc = theme === 'light' ? '/goose-black.svg' : '/goose-white.svg'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 0' }}>
      <div style={{ width: 160, height: 48, position: 'relative' }}>
        <img
          src={gooseSrc}
          alt=""
          width={40}
          height={40}
          style={{
            position: 'absolute',
            bottom: 0,
            animation: 'gooseWalkAnim 2.2s ease-in-out infinite',
            transformOrigin: 'center bottom',
          }}
        />
      </div>
      {label && (
        <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic' }}>
          {label}
        </span>
      )}
    </div>
  )
}
