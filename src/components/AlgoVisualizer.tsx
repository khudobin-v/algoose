'use client'
import { useState, useEffect, useRef } from 'react'
import { Play, Pause, SkipBack, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'

export interface VisuArray {
  values: (number | string | null)[]
  active?: number[]
  done?: number[]
  pointers?: Record<string, number>
}

export interface VisuStep {
  description: string
  variables?: Record<string, string | number | null | boolean>
  arrays?: Record<string, VisuArray>
  note?: string | null
}

export interface VisuData {
  title: string
  input: string
  steps: VisuStep[]
}

// ── Helpers ───────────────────────────────────────────────────────

function cellPx(len: number): number {
  if (len <= 6)  return 44
  if (len <= 9)  return 36
  if (len <= 13) return 30
  if (len <= 18) return 24
  return 19
}

// ── ArrayRow ──────────────────────────────────────────────────────

function ArrayRow({ name, arr }: { name: string; arr: VisuArray }) {
  const cs = cellPx(arr.values.length)
  const gap = 3

  const ptrByIdx: Record<number, string[]> = {}
  for (const [k, v] of Object.entries(arr.pointers ?? {})) {
    if (v >= 0 && v < arr.values.length) {
      if (!ptrByIdx[v]) ptrByIdx[v] = []
      ptrByIdx[v].push(k)
    }
  }
  const hasPointers = Object.keys(ptrByIdx).length > 0

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontSize: '0.6rem', color: 'var(--muted)', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
        fontFamily: 'monospace',
      }}>
        {name}
      </div>
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 0 }}>
          {/* Cells */}
          <div style={{ display: 'flex', gap }}>
            {arr.values.map((v, i) => {
              const isActive = arr.active?.includes(i)
              const isDone   = arr.done?.includes(i)
              return (
                <div key={i} style={{
                  width: cs, height: cs, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 5,
                  border: `1px solid ${isActive ? 'var(--accent)' : isDone ? 'var(--green)' : 'var(--border)'}`,
                  background: isActive ? 'var(--accent-glow)' : isDone ? '#48b87018' : 'var(--surface3)',
                  color: isActive ? 'var(--accent)' : isDone ? 'var(--green)' : 'var(--text2)',
                  fontWeight: isActive || isDone ? 700 : 400,
                  fontSize: cs >= 36 ? '0.82rem' : cs >= 28 ? '0.72rem' : '0.62rem',
                  fontFamily: 'monospace',
                  transition: 'background 0.22s ease, border-color 0.22s ease, color 0.22s ease',
                  userSelect: 'none',
                }}>
                  {v === null ? '∅' : String(v)}
                </div>
              )
            })}
          </div>

          {/* Index labels */}
          <div style={{ display: 'flex', gap, marginTop: 2 }}>
            {arr.values.map((_, i) => (
              <div key={i} style={{
                width: cs, flexShrink: 0, textAlign: 'center',
                fontSize: '0.52rem', color: 'var(--muted)', fontFamily: 'monospace',
                lineHeight: 1,
              }}>
                {i}
              </div>
            ))}
          </div>

          {/* Pointer arrows */}
          {hasPointers && (
            <div style={{ display: 'flex', gap, marginTop: 3 }}>
              {arr.values.map((_, i) => {
                const labels = ptrByIdx[i]
                return (
                  <div key={i} style={{ width: cs, flexShrink: 0, textAlign: 'center', minHeight: 20 }}>
                    {labels && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <span style={{
                          fontSize: cs >= 28 ? '0.72rem' : '0.6rem',
                          color: 'var(--accent)', lineHeight: 1, fontWeight: 700,
                        }}>▲</span>
                        {labels.map(lbl => (
                          <span key={lbl} style={{
                            fontSize: '0.58rem', color: 'var(--accent)',
                            fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap',
                            fontFamily: 'monospace',
                          }}>
                            {lbl}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Variables ─────────────────────────────────────────────────────

function VariablesRow({ vars }: { vars: Record<string, string | number | null | boolean> }) {
  const entries = Object.entries(vars)
  if (!entries.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 16px', marginBottom: 12 }}>
      {entries.map(([k, v]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--muted)', fontFamily: 'monospace' }}>{k}</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--border2)' }}>=</span>
          <span style={{
            fontSize: '0.75rem', color: 'var(--text)', fontWeight: 700,
            fontFamily: 'monospace',
            transition: 'color 0.2s',
          }}>
            {v === null ? 'null' : String(v)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────

interface Props {
  data: VisuData
  onRerun?: () => void
}

const BTN: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--muted)', padding: '4px 6px', borderRadius: 6,
  display: 'flex', alignItems: 'center', transition: 'color 0.15s',
}

export default function AlgoVisualizer({ data, onRerun }: Props) {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const total = data.steps.length
  const cur = data.steps[Math.min(step, total - 1)]

  useEffect(() => { setStep(0); setPlaying(false) }, [data])

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!playing) return
    timerRef.current = setInterval(() => {
      setStep(s => {
        if (s >= total - 1) { setPlaying(false); return s }
        return s + 1
      })
    }, 850)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [playing, total])

  const prev = () => { setPlaying(false); setStep(s => Math.max(0, s - 1)) }
  const next = () => { setPlaying(false); setStep(s => Math.min(total - 1, s + 1)) }
  const toStart = () => { setPlaying(false); setStep(0) }

  const arrays  = cur.arrays  ? Object.entries(cur.arrays)  : []
  const hasVars = cur.variables && Object.keys(cur.variables).length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>

      {/* Title + input + re-run */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 14, gap: 8,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
            {data.title}
          </div>
          <div style={{
            fontSize: '0.68rem', color: 'var(--muted)',
            fontFamily: 'monospace', wordBreak: 'break-all',
          }}>
            {data.input}
          </div>
        </div>
        {onRerun && (
          <button onClick={onRerun} style={{ ...BTN, flexShrink: 0 }} title="Перезапустить">
            <RotateCcw size={13} />
          </button>
        )}
      </div>

      {/* Arrays */}
      {arrays.map(([name, arr]) => (
        <ArrayRow key={name} name={name} arr={arr} />
      ))}

      {/* Variables */}
      {hasVars && <VariablesRow vars={cur.variables!} />}

      {/* Note callout */}
      {cur.note && (
        <div style={{
          padding: '5px 10px', borderRadius: 7, marginBottom: 10,
          background: 'var(--accent-glow)', border: '1px solid var(--accent)44',
          fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)',
          animation: 'fadeIn 0.2s ease',
        }}>
          {cur.note}
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Step description */}
      <div style={{
        padding: '8px 12px', borderRadius: 8, marginBottom: 10,
        background: 'var(--surface2)', border: '1px solid var(--border)',
        fontSize: '0.78rem', color: 'var(--text2)', lineHeight: 1.55,
        minHeight: 48,
      }}>
        {cur.description}
      </div>

      {/* Progress bar + controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ flex: 1, height: 3, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 2, background: 'var(--accent)',
            width: `${((step + 1) / total) * 100}%`,
            transition: 'width 0.2s ease',
          }} />
        </div>
        <span style={{ fontSize: '0.65rem', color: 'var(--muted)', fontFamily: 'monospace', flexShrink: 0 }}>
          {step + 1}/{total}
        </span>
        <button onClick={toStart} style={BTN} title="В начало"><SkipBack size={12} /></button>
        <button onClick={prev} disabled={step === 0} style={{ ...BTN, opacity: step === 0 ? 0.3 : 1 }}>
          <ChevronLeft size={15} />
        </button>
        <button
          onClick={() => setPlaying(p => !p)}
          style={{ ...BTN, color: 'var(--accent)', padding: '4px 8px' }}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button onClick={next} disabled={step >= total - 1} style={{ ...BTN, opacity: step >= total - 1 ? 0.3 : 1 }}>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}
