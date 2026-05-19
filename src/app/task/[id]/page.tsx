'use client'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Code2, RotateCcw, Sparkles, ChevronRight } from 'lucide-react'
import TaskNumberBadge from '@/components/TaskNumberBadge'
import { useNavbarSlot } from '@/components/NavbarSlot'
import CopyButton from '@/components/CopyButton'

interface TaskDetail {
  id: number
  name: string
  priority: 'red' | 'orange' | 'yellow'
  description: string
  hints: string
  complexity: string
}

const P_DOT: Record<string, string> = { red: '#ff4444', orange: '#ff8800', yellow: '#ccaa00' }
const P_LABEL: Record<string, string> = {
  red: 'Подтверждён на собесах',
  orange: 'Встречается часто',
  yellow: 'Встречается редко',
}

function recordShown(id: number) {
  if (typeof window === 'undefined') return
  try {
    const prog = JSON.parse(localStorage.getItem('algoprep_progress') || '{}')
    if (!prog[id]) prog[id] = { timesShown: 0, bestAccuracy: null, attempts: 0 }
    prog[id].timesShown = (prog[id].timesShown || 0) + 1
    localStorage.setItem('algoprep_progress', JSON.stringify(prog))
  } catch {}
}

export default function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [side, setSide] = useState<'front' | 'back'>('front')
  const [fading, setFading] = useState(false)
  const [aiText, setAiText] = useState('')
  const [aiError, setAiError] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiVisible, setAiVisible] = useState(false)

  const { setSlot, clearSlot } = useNavbarSlot()

  useEffect(() => {
    fetch(`/api/tasks/${id}`)
      .then(r => r.json())
      .then((data: TaskDetail) => {
        setTask(data)
        recordShown(data.id)
      })
  }, [id])

  useEffect(() => {
    if (!task) return
    setSlot(
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: P_DOT[task.priority], flexShrink: 0 }} />
          <TaskNumberBadge id={task.id} tone="compact" />
          <span style={{
            fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {task.name}
          </span>
        </div>
        <Link href={`/task/${id}/practice`} style={{
          display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
          background: 'var(--text)', color: 'var(--bg)',
          padding: '5px 11px', borderRadius: 8,
          fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none',
        }}>
          <Code2 size={12} /> Практика
        </Link>
      </div>
    )
    return () => clearSlot()
  }, [task, id, setSlot, clearSlot])

  function flip() {
    setFading(true)
    setTimeout(() => { setSide(s => s === 'front' ? 'back' : 'front'); setFading(false) }, 140)
  }

  async function loadAI() {
    if (!task) return
    setAiVisible(true)
    if (aiText || aiLoading) return
    setAiError('')
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai-review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'explain', taskName: task.name, description: task.description, hints: task.hints }),
      })
      const data = await res.json()
      if (data.error) {
        const msg = data.error as string
        setAiError(msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('aborted')
          ? 'Превысило время ожидания — попробуй снова'
          : 'Не удалось получить объяснение — попробуй снова')
      } else {
        setAiText(data.result || 'Ошибка')
      }
    } catch {
      setAiError('Ошибка сети — попробуй снова')
    } finally {
      setAiLoading(false)
    }
  }

  function retryAI() {
    setAiText('')
    setAiError('')
    loadAI()
  }

  if (!task) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', color: 'var(--muted)', fontSize: '0.85rem' }}>
      Загрузка...
    </div>
  )

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

      <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>

        {/* ── Description / Hints ── */}
        <div
          style={{
            opacity: fading ? 0 : 1, transition: 'opacity 0.14s ease',
            paddingBottom: 16, borderBottom: '1px solid var(--border)',
          }}
        >
          {side === 'front' ? (
            <div className="markdown">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  pre: ({ children }) => (
                    <div style={{
                      fontSize: '0.875rem', lineHeight: 1.65, color: 'var(--text2)',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: '0.6rem 0',
                    }}>
                      {children}
                    </div>
                  ),
                  code: ({ className, children }) =>
                    className
                      ? <code className={className}>{children}</code>
                      : <span style={{ fontFamily: 'inherit' }}>{children}</span>,
                }}
              >{task.description}</ReactMarkdown>
            </div>
          ) : (
            <div>
              <div className="markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{task.hints}</ReactMarkdown>
              </div>
              {task.complexity && (
                <div style={{
                  marginTop: 12, padding: '7px 12px',
                  background: 'var(--surface2)', borderRadius: 8,
                  border: '1px solid var(--border)',
                  fontSize: '0.78rem', color: 'var(--muted)',
                  display: 'flex', alignItems: 'flex-start', gap: 6,
                }}>
                  <span style={{ color: 'var(--text2)', fontWeight: 600, flexShrink: 0 }}>Сложность:</span>
                  <span>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: ({ children }) => <>{children}</> }}>{task.complexity}</ReactMarkdown>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Actions row ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={flip}
          style={{
            alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 5,
            background: 'none', border: '1px solid var(--border)', borderRadius: 8,
            padding: '5px 12px', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.78rem',
            transition: 'border-color 0.15s, color 0.15s',
          }}
        >
          <RotateCcw size={12} />
          {side === 'front' ? 'Показать алгоритм' : 'Показать задачу'}
        </button>
        <CopyButton text={side === 'front' ? task.description : task.hints} size={14} />
        </div>

        {/* ── AI explain ── */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <button onClick={loadAI} style={{
            width: '100%', padding: '13px 16px', background: 'transparent',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            color: 'var(--text2)', fontSize: '0.85rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Sparkles size={15} style={{ color: 'var(--muted)' }} />
              <span>AI объяснение</span>
            </div>
            <ChevronRight size={14} style={{ color: 'var(--border2)', transform: aiVisible ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {aiVisible && (
            <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)' }}>
              {aiLoading ? (
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem', paddingTop: 12, fontStyle: 'italic' }}>
                  Думаю...
                </div>
              ) : aiError ? (
                <div style={{ paddingTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{aiError}</span>
                  <button onClick={retryAI} style={{
                    background: 'none', border: '1px solid var(--border)', borderRadius: 7,
                    padding: '3px 10px', cursor: 'pointer', color: 'var(--text2)',
                    fontSize: '0.78rem', whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    Повторить
                  </button>
                </div>
              ) : (
                <div className="markdown" style={{ paddingTop: 12, fontSize: '0.875rem' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiText}</ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Go to practice ── */}
        <Link href={`/task/${id}/practice`} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          padding: '14px', background: 'var(--text)', color: 'var(--bg)',
          borderRadius: 12, fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none',
        }}>
          <Code2 size={16} /> Написать решение
        </Link>
      </div>
    </div>
  )
}
