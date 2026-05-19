interface Props {
  id: number
  tone?: 'default' | 'muted' | 'compact'
}

export default function TaskNumberBadge({ id, tone = 'default' }: Props) {
  const compact = tone === 'compact'
  const muted = tone === 'muted' || compact
  const label = id.toString().padStart(2, '0')

  return (
    <span
      aria-label={`Задача ${id}`}
      title={`Задача ${id}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? 3 : 5,
        height: compact ? 18 : 22,
        padding: compact ? '0 5px' : '0 7px',
        borderRadius: 5,
        border: `1px solid ${muted ? 'var(--border)' : 'var(--border2)'}`,
        background: muted ? 'var(--surface)' : 'var(--surface2)',
        color: muted ? 'var(--muted)' : 'var(--text2)',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
        fontSize: compact ? '0.58rem' : '0.64rem',
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: 0,
        flexShrink: 0,
      }}
    >
      <span style={{ color: 'var(--border2)', fontWeight: 800 }}>№</span>
      <span>{label}</span>
    </span>
  )
}
