'use client'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, RefreshCw, Flame, XCircle, AlertCircle } from 'lucide-react'
import { getActivity, calcStreak, getLastDays, isDue } from '@/lib/activity'
import { useNavbarSlot } from '@/components/NavbarSlot'

interface TaskMeta { id: number; name: string; priority: 'red' | 'orange' | 'yellow' }
interface TaskProgress {
  timesShown: number
  attempts: number
  lastVerdict?: 'pass' | 'fail' | 'rework'
  nextReview?: string
  bestTime?: number
}
type Progress = Record<string, TaskProgress>

const P_DOT: Record<string, string> = { red: '#ff4444', orange: '#ff8800', yellow: '#ccaa00' }
const P_LABEL: Record<string, string> = {
  red: 'Подтверждённые собесами',
  orange: 'Встречаются часто',
  yellow: 'Встречаются редко',
}

function getProgress(): Progress {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem('algoprep_progress') || '{}') } catch { return {} }
}

function ActivityCell({ count, date }: { count: number; date: string }) {
  const intensity = count === 0 ? 0 : count === 1 ? 0.35 : count <= 3 ? 0.6 : count <= 5 ? 0.8 : 1
  return (
    <div
      title={`${date}: ${count} попыток`}
      style={{
        width: 11, height: 11, borderRadius: 3, flexShrink: 0,
        background: count === 0 ? 'var(--surface3)' : `rgba(255,153,0,${intensity})`,
      }}
    />
  )
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}:${(s % 60).toString().padStart(2, '0')}` : `${s}с`
}

function StackedBar({ passed, rework, failed, total }: { passed: number; rework: number; failed: number; total: number }) {
  if (total === 0) return null
  const pPct = (passed / total) * 100
  const rPct = (rework / total) * 100
  const fPct = (failed / total) * 100
  return (
    <div style={{ height: 5, background: 'var(--surface3)', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
      <div style={{ width: `${pPct}%`, background: 'var(--green)', transition: 'width 0.5s ease' }} />
      <div style={{ width: `${rPct}%`, background: 'var(--yellow)', transition: 'width 0.5s ease' }} />
      <div style={{ width: `${fPct}%`, background: 'var(--red)', transition: 'width 0.5s ease' }} />
    </div>
  )
}

function VerdictIcon({ verdict, due }: { verdict?: string; due?: boolean }) {
  if (due) return <RefreshCw size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
  if (verdict === 'pass') return <CheckCircle2 size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />
  if (verdict === 'fail') return <XCircle size={13} style={{ color: 'var(--red)', flexShrink: 0 }} />
  if (verdict === 'rework') return <AlertCircle size={13} style={{ color: 'var(--yellow)', flexShrink: 0 }} />
  return <Circle size={11} style={{ color: 'var(--border2)', flexShrink: 0 }} />
}

export default function StatsPage() {
  const [tasks, setTasks] = useState<TaskMeta[]>([])
  const [progress, setProgress] = useState<Progress>({})
  const [activity, setActivity] = useState<Record<string, number>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const { setSlot, clearSlot } = useNavbarSlot()

  useEffect(() => {
    fetch('/api/tasks').then(r => r.json()).then(setTasks)
    queueMicrotask(() => {
      setProgress(getProgress())
      setActivity(getActivity())
    })
    return () => clearSlot()
  }, [clearSlot])

  const streak = useMemo(() => calcStreak(activity), [activity])

  useEffect(() => {
    setSlot(
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)' }}>Прогресс</span>
        {streak > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 7,
            background: 'var(--accent-glow)', border: '1px solid var(--accent)',
          }}>
            <Flame size={12} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)' }}>{streak}</span>
          </div>
        )}
      </div>
    )
  }, [streak, setSlot])

  const days = useMemo(() => getLastDays(activity, 35), [activity])
  const weeks = useMemo(() => {
    const w: { date: string; count: number }[][] = []
    for (let i = 0; i < 5; i++) w.push(days.slice(i * 7, i * 7 + 7))
    return w
  }, [days])

  const s = useMemo(() => {
    const passed = tasks.filter(t => progress[t.id]?.lastVerdict === 'pass').length
    const rework = tasks.filter(t => progress[t.id]?.lastVerdict === 'rework').length
    const failed = tasks.filter(t => progress[t.id]?.lastVerdict === 'fail').length
    const practiced = tasks.filter(t => (progress[t.id]?.attempts ?? 0) > 0).length
    const totalAttempts = tasks.reduce((sum, t) => sum + (progress[t.id]?.attempts ?? 0), 0)
    const passRate = practiced > 0 ? Math.round((passed / practiced) * 100) : null
    const dueCount = tasks.filter(t => isDue(progress[t.id]?.nextReview)).length
    const bestTimes = tasks
      .filter(t => progress[t.id]?.bestTime && typeof progress[t.id].bestTime === 'number')
      .sort((a, b) => (progress[a.id].bestTime ?? Infinity) - (progress[b.id].bestTime ?? Infinity))
      .slice(0, 3)
    return { total: tasks.length, passed, rework, failed, practiced, totalAttempts, passRate, dueCount, bestTimes }
  }, [tasks, progress])

  const grouped = useMemo(() => {
    const g: Record<string, TaskMeta[]> = { red: [], orange: [], yellow: [] }
    for (const t of tasks) g[t.priority].push(t)
    return g
  }, [tasks])

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', minHeight: '100dvh', paddingBottom: 40 }}>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Streak + Activity grid ── */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 4 }}>Стрик</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                <span style={{ fontSize: '2.4rem', fontWeight: 800, color: streak > 0 ? 'var(--accent)' : 'var(--muted)', lineHeight: 1, letterSpacing: '-0.04em' }}>{streak}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{streak === 1 ? 'день' : streak >= 2 && streak <= 4 ? 'дня' : 'дней'}</span>
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>последние 5 недель</div>
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {week.map(day => <ActivityCell key={day.date} count={day.count} date={day.date} />)}
              </div>
            ))}
          </div>
        </div>

        {/* ── Summary ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {/* Passed */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--accent)44', borderRadius: 12, padding: '14px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {s.passed}<span style={{ fontSize: '0.95rem', color: 'var(--muted)', fontWeight: 500 }}> / {s.total}</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Задач решено</div>
            <div style={{ marginTop: 8, height: 3, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${s.total ? (s.passed / s.total) * 100 : 0}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.5s' }} />
            </div>
          </div>

          {/* Attempts + pass rate */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>{s.totalAttempts}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Попыток</div>
            {s.passRate !== null && (
              <div style={{ marginTop: 6, fontSize: '0.75rem', color: s.passRate >= 70 ? 'var(--green)' : s.passRate >= 40 ? 'var(--yellow)' : 'var(--red)', fontWeight: 700 }}>
                {s.passRate}% успех
              </div>
            )}
          </div>

          {/* Needs work / due */}
          <div style={{ background: 'var(--surface)', border: `1px solid ${s.dueCount > 0 ? 'var(--accent)55' : 'var(--border)'}`, borderRadius: 12, padding: '14px' }}>
            {s.dueCount > 0 ? (
              <>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.03em', lineHeight: 1 }}>{s.dueCount}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>На повторение</div>
                <Link href="/?status=due" style={{ display: 'inline-block', marginTop: 6, fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>К списку →</Link>
              </>
            ) : (
              <>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.rework > 0 ? 'var(--yellow)' : 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>{s.rework}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Нужно доработать</div>
              </>
            )}
          </div>
        </div>

        {/* ── Per-group ── */}
        {(['red', 'orange', 'yellow'] as const).map(priority => {
          const group = grouped[priority] ?? []
          const gPassed  = group.filter(t => progress[t.id]?.lastVerdict === 'pass').length
          const gRework  = group.filter(t => progress[t.id]?.lastVerdict === 'rework').length
          const gFailed  = group.filter(t => progress[t.id]?.lastVerdict === 'fail').length
          const isExpanded = expanded[priority]
          const SHOW = 8
          const visible = isExpanded ? group : group.slice(0, SHOW)

          return (
            <div key={priority} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: P_DOT[priority], flexShrink: 0 }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{P_LABEL[priority]}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {gPassed > 0 && <span style={{ fontSize: '0.7rem', color: 'var(--green)', fontWeight: 700 }}>✓ {gPassed}</span>}
                  {gRework > 0 && <span style={{ fontSize: '0.7rem', color: 'var(--yellow)', fontWeight: 700 }}>~ {gRework}</span>}
                  {gFailed > 0 && <span style={{ fontSize: '0.7rem', color: 'var(--red)', fontWeight: 700 }}>✗ {gFailed}</span>}
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{gPassed}/{group.length}</span>
                </div>
              </div>

              <StackedBar passed={gPassed} rework={gRework} failed={gFailed} total={group.length} />

              {/* Task list */}
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {visible.map(t => {
                  const prog = progress[t.id]
                  const due = isDue(prog?.nextReview)
                  return (
                    <Link key={t.id} href={`/task/${t.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '5px 6px', borderRadius: 6,
                        transition: 'background 0.1s',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <VerdictIcon verdict={prog?.lastVerdict} due={due} />
                        <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 700, fontFamily: 'monospace', minWidth: 24, flexShrink: 0 }}>#{t.id}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                        {prog?.bestTime && typeof prog.bestTime === 'number' && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--muted)', fontFamily: 'monospace', flexShrink: 0 }}>{formatTime(prog.bestTime)}</span>
                        )}
                        {due && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>повтор</span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>

              {group.length > SHOW && (
                <button
                  onClick={() => setExpanded(e => ({ ...e, [priority]: !e[priority] }))}
                  style={{ marginTop: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.72rem', padding: '2px 6px' }}
                >
                  {isExpanded ? 'Свернуть ↑' : `Ещё ${group.length - SHOW} задач ↓`}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
