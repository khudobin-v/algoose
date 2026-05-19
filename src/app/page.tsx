'use client'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, ChevronRight, Eye, CheckCircle2, Circle, RefreshCw } from 'lucide-react'
import { isDue } from '@/lib/activity'
import EmptyAnim from '@/components/EmptyAnim'

interface TaskMeta {
  id: number
  name: string
  priority: 'red' | 'orange' | 'yellow'
}

interface TaskProgress {
  timesShown: number
  bestAccuracy: number | null
  attempts: number
  lastVerdict?: string
  nextReview?: string
}
type Progress = Record<string, TaskProgress>

const P_LABEL: Record<string, string> = { red: 'Собесы', orange: 'Часто', yellow: 'Редко' }
const P_ORDER: Record<string, number> = { red: 0, orange: 1, yellow: 2 }

const VERDICT_COLOR: Record<string, string> = {
  pass: 'var(--green)', rework: 'var(--yellow)', fail: 'var(--red)',
}

function getProgress(): Progress {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem('algoprep_progress') || '{}') } catch { return {} }
}

type StatusFilter = 'all' | 'unsolved' | 'pass' | 'rework' | 'fail' | 'due'

export default function Home() {
  const [tasks, setTasks] = useState<TaskMeta[]>([])
  const [progress, setProgress] = useState<Progress>({})
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'red' | 'orange' | 'yellow'>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/tasks').then(r => r.json()).then(setTasks)
    setProgress(getProgress())
    const onStorage = () => setProgress(getProgress())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const filtered = useMemo(() => tasks
    .filter(t => priorityFilter === 'all' || t.priority === priorityFilter)
    .filter(t => {
      const p = progress[t.id]
      if (statusFilter === 'all') return true
      if (statusFilter === 'unsolved') return !p || (p.attempts ?? 0) === 0
      if (statusFilter === 'due') return isDue(p?.nextReview)
      return p?.lastVerdict === statusFilter
    })
    .filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || String(t.id).includes(search))
    .sort((a, b) => P_ORDER[a.priority] - P_ORDER[b.priority] || a.id - b.id),
  [tasks, progress, priorityFilter, statusFilter, search])

  const stats = useMemo(() => {
    const seen = Object.values(progress).filter(p => p.timesShown > 0).length
    const practiced = Object.values(progress).filter(p => p.attempts > 0).length
    const passes = Object.values(progress).filter(p => p.lastVerdict === 'pass').length
    const due = Object.values(progress).filter(p => isDue(p.nextReview)).length
    return { total: tasks.length, seen, practiced, passes, due }
  }, [tasks, progress])

  const PRIORITY_FILTERS = [
    { key: 'all',    label: 'Все' },
    { key: 'red',    label: 'Собесы' },
    { key: 'orange', label: 'Часто' },
    { key: 'yellow', label: 'Редко' },
  ] as const

  const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
    { key: 'all',      label: 'Все статусы' },
    { key: 'unsolved', label: 'Не решено' },
    { key: 'pass',     label: 'Зачёт' },
    { key: 'rework',   label: 'Доработать' },
    { key: 'fail',     label: 'Незачёт' },
    { key: 'due',      label: `Повторить${stats.due ? ` (${stats.due})` : ''}` },
  ]

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', paddingBottom: 60 }}>

      {/* ── Sticky sub-header: stats + filters ── */}
      <div style={{
        position: 'sticky', top: 'var(--navbar-h)', zIndex: 10,
        background: 'var(--bg)', borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ padding: '10px 20px 0' }}>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: 1, marginBottom: 14 }}>
            {[
              { v: stats.total,     l: 'задач' },
              { v: stats.seen,      l: 'просмотрено' },
              { v: stats.practiced, l: 'попыток' },
              { v: stats.passes,    l: 'зачётов' },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, textAlign: 'center', padding: '8px 4px',
                borderRight: i < 3 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: '0.62rem', color: 'var(--muted)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding: '0 20px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {/* Priority filter */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {PRIORITY_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setPriorityFilter(f.key)}
                className={f.key !== 'all' ? `priority-tag ${f.key}` : undefined}
                style={{
                  height: 28, padding: '0 10px', boxSizing: 'border-box',
                  borderRadius: 6, display: 'inline-flex', alignItems: 'center',
                  border: f.key === 'all' ? '1px solid var(--border)' : undefined,
                  background: f.key === 'all' ? (priorityFilter === 'all' ? 'var(--accent)' : 'transparent') : undefined,
                  color: f.key === 'all' ? (priorityFilter === 'all' ? 'var(--accent-text)' : 'var(--muted)') : undefined,
                  fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                  opacity: priorityFilter !== 'all' && priorityFilter !== f.key ? 0.4 : 1,
                  outline: priorityFilter === f.key && f.key !== 'all' ? '2px solid var(--accent)' : 'none',
                  outlineOffset: 1, transition: 'opacity 0.15s', lineHeight: 1,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map(f => {
              const isActive = statusFilter === f.key
              const isDueFilter = f.key === 'due'
              return (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  style={{
                    height: 28, padding: '0 10px', boxSizing: 'border-box',
                    display: 'inline-flex', alignItems: 'center', lineHeight: 1,
                    borderRadius: 6, cursor: 'pointer',
                    fontSize: '0.72rem', fontWeight: 600,
                    border: `1px solid ${isActive ? (isDueFilter ? 'var(--accent)' : 'var(--border2)') : 'var(--border)'}`,
                    background: isActive ? (isDueFilter ? 'var(--accent-glow)' : 'var(--surface2)') : 'transparent',
                    color: isActive
                      ? (isDueFilter ? 'var(--accent)' : 'var(--text)')
                      : (isDueFilter && stats.due > 0 ? 'var(--accent)' : 'var(--muted)'),
                    transition: 'all 0.15s',
                  }}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Поиск задачи..."
              style={{
                width: '100%', padding: '8px 10px 8px 30px',
                borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--surface)', color: 'var(--text)',
                fontSize: '0.85rem', outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Task list ── */}
      <div>
        {filtered.map((task, idx) => {
          const prog = progress[task.id]
          const attempted = (prog?.attempts ?? 0) > 0
          const seen = (prog?.timesShown ?? 0) > 0
          const verdict = prog?.lastVerdict
          const due = isDue(prog?.nextReview)
          const isLast = idx === filtered.length - 1

          return (
            <Link key={task.id} href={`/task/${task.id}`} style={{ textDecoration: 'none', display: 'block' }}>
              <div className="task-row" style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 20px',
                borderBottom: isLast ? 'none' : '1px solid var(--border)',
              }}>
                {/* Status icon */}
                <div style={{ flexShrink: 0, width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {due
                    ? <RefreshCw size={14} style={{ color: 'var(--accent)' }} />
                    : attempted
                    ? <CheckCircle2 size={16} style={{ color: verdict ? VERDICT_COLOR[verdict] ?? 'var(--green)' : 'var(--green)' }} />
                    : seen
                    ? <Eye size={14} style={{ color: 'var(--muted)' }} />
                    : <Circle size={14} style={{ color: 'var(--border2)' }} />
                  }
                </div>

                {/* Task info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span style={{ color: 'var(--muted)', fontWeight: 400 }}>#{task.id} </span>{task.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className={`priority-tag ${task.priority}`}>{P_LABEL[task.priority]}</span>
                    {due && <span style={{ color: 'var(--accent)', fontWeight: 600 }}>повторить</span>}
                    {!due && attempted && prog && (
                      <span style={{ color: verdict ? VERDICT_COLOR[verdict] ?? 'var(--muted)' : 'var(--muted)' }}>
                        {prog.attempts} {prog.attempts === 1 ? 'попытка' : 'попыток'}
                        {verdict ? ` · ${verdict === 'pass' ? 'зачёт' : verdict === 'rework' ? 'доработать' : 'незачёт'}` : ''}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight size={15} style={{ color: 'var(--border2)', flexShrink: 0 }} />
              </div>
            </Link>
          )
        })}

        {filtered.length === 0 && tasks.length > 0 && (
          <EmptyAnim label="Ничего не найдено" />
        )}
      </div>
    </div>
  )
}
