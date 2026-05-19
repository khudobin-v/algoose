'use client'
import { useEffect, useRef, useState, use, useCallback } from 'react'
import { Send, Sparkles, Ghost, Activity } from 'lucide-react'
import AlgoVisualizer, { type VisuData } from '@/components/AlgoVisualizer'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import DartEditor from '@/components/DartEditor'
import TaskNumberBadge from '@/components/TaskNumberBadge'
import VerdictAnim from '@/components/VerdictAnim'
import MascotToast from '@/components/MascotToast'
import WalkingGoose from '@/components/WalkingGoose'
import {
  recordActivity, scheduleReview, isDue,
  saveSolutionCode, getSolutionCode, saveSolveTime,
  getTaskProgress, resetTaskProgress,
} from '@/lib/activity'
import { getSettings, type AppSettings } from '@/lib/settings'
import { useNavbarSlot } from '@/components/NavbarSlot'
import { pushProgress } from '@/lib/syncProgress'
import CopyButton from '@/components/CopyButton'
import InlineAskModal from '@/components/InlineAskModal'

interface TaskDetail {
  id: number
  name: string
  description: string
  dartCode: string
}

type Verdict = 'pass' | 'fail' | 'rework'

interface AiReview {
  verdict: Verdict
  summary: string
  issues: string[]
  nextStep: string
  timeComplexity?: string
  timeReason?: string
  timeCorrect?: boolean | null
  spaceComplexity?: string
  spaceReason?: string
  spaceCorrect?: boolean | null
}

const DRAFT_PREFIX = 'algoprep_solution_draft:'
const REVIEW_PREFIX = 'algoprep_review:'
function draftKey(id: number) { return `${DRAFT_PREFIX}${id}` }
function reviewKey(id: number) { return `${REVIEW_PREFIX}${id}` }

function loadDraft(id: number): string {
  if (typeof window === 'undefined') return ''
  try { return localStorage.getItem(draftKey(id)) || '' } catch { return '' }
}
function saveDraft(id: number, code: string) {
  if (typeof window === 'undefined') return
  try {
    if (code) localStorage.setItem(draftKey(id), code)
    else localStorage.removeItem(draftKey(id))
  } catch {}
}
function loadReview(id: number): AiReview | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(reviewKey(id))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
function saveReview(id: number, review: AiReview | null) {
  if (typeof window === 'undefined') return
  try {
    if (review) localStorage.setItem(reviewKey(id), JSON.stringify(review))
    else localStorage.removeItem(reviewKey(id))
  } catch {}
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  return `${m}:${(s % 60).toString().padStart(2, '0')}`
}

const VERDICT_LABEL: Record<Verdict, string> = { pass: 'Зачёт', fail: 'Незачёт', rework: 'Доработать' }
const VERDICT_COLOR: Record<Verdict, string> = {
  pass: 'var(--green)', fail: 'var(--red)', rework: 'var(--yellow)',
}

function saveSubmission(id: number, verdict: Verdict) {
  if (typeof window === 'undefined') return
  try {
    const prog = JSON.parse(localStorage.getItem('algoprep_progress') || '{}')
    if (!prog[id]) prog[id] = { timesShown: 0, bestAccuracy: null, attempts: 0 }
    prog[id].attempts = (prog[id].attempts || 0) + 1
    prog[id].lastVerdict = verdict
    localStorage.setItem('algoprep_progress', JSON.stringify(prog))
  } catch {}
}

export default function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  // Core
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [code, setCode] = useState('')
  const [draftReady, setDraftReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [aiReview, setAiReview] = useState<AiReview | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [userTimeComplexity, setUserTimeComplexity] = useState('')
  const [userSpaceComplexity, setUserSpaceComplexity] = useState('')
  const codeRef = useRef('')
  const taskIdRef = useRef<number | null>(null)
  const draftReadyRef = useRef(false)


  // Settings
  const [settings, setSettings] = useState<AppSettings | null>(null)

  // Timer (due tasks)
  const [isDueTask, setIsDueTask] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const bestTimeRef = useRef<number | null>(null)

  // Ghost code
  const [showGhost, setShowGhost] = useState(false)
  const [ghostCode, setGhostCode] = useState('')
  const lastActivityRef = useRef(Date.now())

  // AI hints
  const [hint, setHint] = useState<string | null>(null)
  const [hintLoading, setHintLoading] = useState(false)
  const [hintStreaming, setHintStreaming] = useState(false)
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Inline Ask (Cmd+I)
  const [inlineAskAnchor, setInlineAskAnchor] = useState<{ x: number; y: number; cursorLine: string } | null>(null)

  // Post-solve
  const [selfSolve, setSelfSolve] = useState<'yes' | 'no' | null>(null)
  const [explainLoading, setExplainLoading] = useState(false)

  // Task stats
  const [taskStats, setTaskStats] = useState<{ attempts: number; lastVerdict: string | null; bestTime: number | null; nextReview: string | null } | null>(null)
  const [resetConfirm, setResetConfirm] = useState(false)

  // Visualization
  const [visuData, setVisuData] = useState<VisuData | null>(null)
  const [visuLoading, setVisuLoading] = useState(false)
  const [activePanel, setActivePanel] = useState<'ai' | 'visu'>('ai')

  // Animations
  const [showVerdictAnim, setShowVerdictAnim] = useState(false)
  const [mascotMsg, setMascotMsg] = useState<string | null>(null)

  // Resize
  const [leftPct, setLeftPct] = useState(33)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef(false)

  const { setSlot, clearSlot } = useNavbarSlot()

  // Sync task title + timer + verdict into the navbar
  useEffect(() => {
    if (!task) return
    setSlot(
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
        <TaskNumberBadge id={task.id} />
        <span style={{
          fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          maxWidth: 320,
        }}>
          {task.name}
        </span>
        {!aiReview && (
          <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 600, flexShrink: 0 }}>
            {formatTime(elapsed)}
          </span>
        )}
        {aiReview && bestTimeRef.current !== null && (
          <span style={{ fontSize: '0.72rem', color: 'var(--muted)', flexShrink: 0 }}>
            best {formatTime(Math.floor(bestTimeRef.current / 1000))}
          </span>
        )}
        {aiReview && (
          <span style={{
            color: VERDICT_COLOR[aiReview.verdict],
            border: `1px solid ${VERDICT_COLOR[aiReview.verdict]}55`,
            background: `${VERDICT_COLOR[aiReview.verdict]}14`,
            borderRadius: 6, padding: '3px 8px',
            fontSize: '0.72rem', fontWeight: 800, flexShrink: 0,
          }}>
            {VERDICT_LABEL[aiReview.verdict]}
          </span>
        )}
      </div>
    )
    return () => clearSlot()
  }, [task, isDueTask, elapsed, aiReview, setSlot, clearSlot])

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = true
    const handleEl = e.currentTarget as HTMLElement
    handleEl.classList.add('dragging')

    function onMove(ev: MouseEvent) {
      if (!dragRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((ev.clientX - rect.left) / rect.width) * 100
      setLeftPct(Math.min(60, Math.max(20, pct)))
    }
    function onUp() {
      dragRef.current = false
      handleEl.classList.remove('dragging')
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  // ── Load task + draft ──────────────────────────────────────────
  useEffect(() => {
    if (taskIdRef.current !== null && draftReadyRef.current) {
      saveDraft(taskIdRef.current, codeRef.current)
    }
    let cancelled = false
    draftReadyRef.current = false
    taskIdRef.current = null
    fetch(`/api/tasks/${id}`).then(r => r.json()).then((data: TaskDetail) => {
      if (cancelled) return
      const draft = loadDraft(data.id)
      const savedReview = loadReview(data.id)
      setTask(data)
      setCode(draft)
      setDraftReady(true)
      setAiReview(savedReview)
      setSelfSolve(null)
      setHint(null)
      setVisuData(null)
      setActivePanel('ai')
      codeRef.current = draft
      taskIdRef.current = data.id
      draftReadyRef.current = true
    })
    return () => { cancelled = true }
  }, [id])

  // ── Init settings + due check ──────────────────────────────────
  useEffect(() => {
    if (!task) return
    const s = getSettings()
    setSettings(s)
    setTaskStats(getTaskProgress(task.id))
    setResetConfirm(false)
    startTimeRef.current = Date.now()
    setElapsed(0)
    try {
      const prog = JSON.parse(localStorage.getItem('algoprep_progress') || '{}')
      const tp = prog[task.id]
      // Migrate corrupt entries (e.g. object values from old data formats)
      if (tp && typeof tp === 'object') {
        let dirty = false
        for (const k of ['attempts', 'bestTime', 'lastTime', 'timesShown', 'reviewCount'] as const) {
          if (k in tp && typeof (tp as Record<string, unknown>)[k] !== 'number') {
            (tp as Record<string, unknown>)[k] = 0; dirty = true
          }
        }
        for (const k of ['lastVerdict', 'nextReview'] as const) {
          if (k in tp && typeof (tp as Record<string, unknown>)[k] !== 'string') {
            (tp as Record<string, unknown>)[k] = null; dirty = true
          }
        }
        if (dirty) { prog[task.id] = tp; localStorage.setItem('algoprep_progress', JSON.stringify(prog)) }
      }
      bestTimeRef.current = typeof tp?.bestTime === 'number' ? tp.bestTime : null
      if (isDue(typeof tp?.nextReview === 'string' ? tp.nextReview : undefined)) {
        setIsDueTask(true)
        const saved = getSolutionCode(task.id)
        if (saved) setGhostCode(saved)
      }
    } catch {}
  }, [task])

  // ── Timer (always running) ─────────────────────────────────────
  useEffect(() => {
    if (!task) return
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - (startTimeRef.current ?? Date.now())) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [task])

  // ── Ghost inactivity ───────────────────────────────────────────
  useEffect(() => {
    if (!isDueTask || !ghostCode || !settings || settings.ghostDelay === 0) return
    const delayMs = settings.ghostDelay * 60 * 1000
    const check = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= delayMs) setShowGhost(true)
    }, 15_000)
    return () => clearInterval(check)
  }, [isDueTask, ghostCode, settings])

  // ── Sync code ─────────────────────────────────────────────────
  useEffect(() => {
    codeRef.current = code
    if (task && draftReady) saveDraft(task.id, code)
  }, [code, draftReady, task])

  // ── Persist on hide ───────────────────────────────────────────
  useEffect(() => {
    function persist() {
      if (taskIdRef.current !== null && draftReadyRef.current) {
        saveDraft(taskIdRef.current, codeRef.current)
      }
    }
    function onVis() { if (document.visibilityState === 'hidden') persist() }
    window.addEventListener('pagehide', persist)
    window.addEventListener('beforeunload', persist)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      persist()
      window.removeEventListener('pagehide', persist)
      window.removeEventListener('beforeunload', persist)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  // ── Code change ───────────────────────────────────────────────
  const handleCodeChange = useCallback((v: string) => {
    setCode(v)
    lastActivityRef.current = Date.now()
    if (showGhost) setShowGhost(false)

    if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
  }, [task, settings, showGhost])

  // ── Immediate hint (Cmd+I) ────────────────────────────────────
  const fetchHint = useCallback(async () => {
    if (!task || hintLoading || hintStreaming) return
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
    setHint('')
    setHintLoading(true)
    setActivePanel('ai')
    try {
      const res = await fetch('/api/hint-stream', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ taskName: task.name, description: task.description, code }),
      })
      setHintLoading(false)
      setHintStreaming(true)
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      outer: while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6)
          if (payload === '[DONE]') break outer
          try { setHint(prev => (prev ?? '') + JSON.parse(payload)) } catch {}
        }
      }
    } catch {
      setHintLoading(false)
      setHint('Не удалось получить подсказку.')
    } finally {
      setHintStreaming(false)
    }
  }, [task, code, hintLoading, hintStreaming])

  // ── Inline Ask ────────────────────────────────────────────────
  const submitInlineAsk = useCallback(async (question: string, cursorLine: string) => {
    if (!task || hintLoading || hintStreaming) return
    setInlineAskAnchor(null)
    setHint('')
    setHintLoading(true)
    setActivePanel('ai')
    try {
      const res = await fetch('/api/inline-ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ taskName: task.name, code, cursorLine, question }),
      })
      setHintLoading(false)
      setHintStreaming(true)
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      outer: while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6)
          if (payload === '[DONE]') break outer
          try { setHint(prev => (prev ?? '') + JSON.parse(payload)) } catch {}
        }
      }
    } catch {
      setHintLoading(false)
      setHint('Не удалось получить ответ.')
    } finally {
      setHintStreaming(false)
    }
  }, [task, code, hintLoading, hintStreaming])

  // ── Explain code for "didn't solve myself" ────────────────────
  async function fetchExplainedCode() {
    if (!task) return
    setExplainLoading(true)
    try {
      const res = await fetch('/api/ai-review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'explain-code', taskId: task.id, taskName: task.name, code }),
      })
      const data = await res.json()
      if (data.code) setCode(data.code.trim())
    } catch {}
    finally { setExplainLoading(false) }
  }

  // ── Visualize ─────────────────────────────────────────────────
  async function runVisualize() {
    if (!task || visuLoading) return
    setVisuLoading(true)
    setActivePanel('visu')
    try {
      const res = await fetch('/api/ai-review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'visualize',
          taskName: task.name,
          description: task.description,
          code: code.trim() || '',
        }),
      })
      const data = await res.json()
      if (data.data) setVisuData(data.data as VisuData)
    } catch {}
    finally { setVisuLoading(false) }
  }

  // ── Submit ────────────────────────────────────────────────────
  async function submit() {
    if (!code.trim() || !task || submitting) return
    setSubmitting(true)
    setAiReview(null)
    setSelfSolve(null)
    setHint(null)
    setShowVerdictAnim(false)
    setActivePanel('ai')
    setAiLoading(true)
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current)

    try {
      const res = await fetch('/api/ai-review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'review',
          taskId: task.id,
          taskName: task.name,
          description: task.description,
          code,
          userTimeComplexity,
          userSpaceComplexity,
        }),
      })

      const data = await res.json()
      const review: AiReview = {
        verdict: ['pass', 'fail', 'rework'].includes(data.verdict) ? data.verdict : 'rework',
        summary: data.summary || data.error || 'Ошибка AI',
        issues: Array.isArray(data.issues) ? data.issues : [],
        nextStep: data.nextStep || '',
        timeComplexity: data.timeComplexity || '',
        timeReason: data.timeReason || '',
        timeCorrect: data.timeCorrect ?? null,
        spaceComplexity: data.spaceComplexity || '',
        spaceReason: data.spaceReason || '',
        spaceCorrect: data.spaceCorrect ?? null,
      }
      setAiReview(review)
      saveReview(task.id, review)

      const progRaw = JSON.parse(localStorage.getItem('algoprep_progress') || '{}')
      const wasFirst = (progRaw[task.id]?.attempts ?? 0) === 0

      saveSubmission(task.id, review.verdict)
      recordActivity()
      if (review.verdict === 'pass') {
        scheduleReview(task.id)
        saveSolutionCode(task.id, code)
        if (wasFirst) setMascotMsg('Первый зачёт. Неплохо.')
      }
      if (startTimeRef.current) {
        saveSolveTime(task.id, elapsed * 1000)
        bestTimeRef.current = Math.min(elapsed * 1000, bestTimeRef.current ?? Infinity) || elapsed * 1000
      }
      setShowVerdictAnim(true)
      setTaskStats(getTaskProgress(task.id))
      pushProgress()
    } finally {
      setAiLoading(false)
      setSubmitting(false)
    }
  }

  if (!task) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', color: 'var(--muted)', fontSize: '0.85rem' }}>
      Загрузка...
    </div>
  )

  return (
    <div className="practice-root">
      {showVerdictAnim && aiReview && (
        <VerdictAnim verdict={aiReview.verdict} onDone={() => setShowVerdictAnim(false)} />
      )}
      {mascotMsg && (
        <MascotToast message={mascotMsg} onDone={() => setMascotMsg(null)} />
      )}

      {/* ── Body ── */}
      <div
        ref={containerRef}
        className="practice-body"
        style={{ gridTemplateColumns: `${leftPct}% 5px 1fr` }}
      >

        {/* ── Left panel: Условие (top) + AI-Ревью (bottom) ── */}
        <div className="practice-col-left">

          {/* Top: task description */}
          <div className="practice-panel">
            <div className="practice-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--muted)', fontWeight: 500 }}>#{task.id}</span>
                <span style={{ color: 'var(--border2)', fontSize: '0.7rem' }}>·</span>
                <span>{task.name}</span>
              </span>
              <CopyButton text={task.description} size={12} />
            </div>
            <div className="practice-panel-body">
              <div className="markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{task.description}</ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Bottom: AI review / Visualizer */}
          <div className="practice-panel">
            {/* Tab bar */}
            <div style={{
              display: 'flex', flexShrink: 0,
              borderBottom: '1px solid var(--border)',
            }}>
              <button
                onClick={() => setActivePanel('ai')}
                style={{
                  flex: 1, padding: '9px 14px', background: 'none', border: 'none',
                  borderBottom: `2px solid ${activePanel === 'ai' ? 'var(--accent)' : 'transparent'}`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                  color: activePanel === 'ai' ? 'var(--text)' : 'var(--muted)',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
              >
                <Sparkles size={10} /> Анализ ИИ
                {aiReview && (
                  <span style={{ color: VERDICT_COLOR[aiReview.verdict], marginLeft: 2 }}>
                    · {VERDICT_LABEL[aiReview.verdict]}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setActivePanel('visu'); if (!visuData && !visuLoading) runVisualize() }}
                style={{
                  flex: 1, padding: '9px 14px', background: 'none', border: 'none',
                  borderBottom: `2px solid ${activePanel === 'visu' ? 'var(--accent)' : 'transparent'}`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                  color: activePanel === 'visu' ? 'var(--text)' : 'var(--muted)',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
              >
                <Activity size={10} /> Визуализация
              </button>
            </div>

            <div className="practice-panel-body" style={{ display: activePanel === 'ai' ? undefined : 'none' }}>
              {aiLoading ? (
                <WalkingGoose label="Анализирую код..." />
              ) : hintLoading ? (
                <WalkingGoose label="Думаю над подсказкой..." />
              ) : aiReview ? (
                <div>
                  <div className="markdown" style={{ fontSize: '0.875rem' }}>
                    <p>{aiReview.summary}</p>

                    {(aiReview.timeComplexity || aiReview.spaceComplexity) && (
                      <div style={{
                        margin: '12px 0', padding: '10px 12px',
                        background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)',
                        display: 'flex', flexDirection: 'column', gap: 10,
                      }}>
                        {aiReview.timeComplexity && (
                          <ComplexityRow
                            label="время"
                            actual={aiReview.timeComplexity}
                            reason={aiReview.timeReason}
                            userGuess={userTimeComplexity}
                            correct={aiReview.timeCorrect}
                          />
                        )}
                        {aiReview.spaceComplexity && (
                          <ComplexityRow
                            label="память"
                            actual={aiReview.spaceComplexity}
                            reason={aiReview.spaceReason}
                            userGuess={userSpaceComplexity}
                            correct={aiReview.spaceCorrect}
                          />
                        )}
                      </div>
                    )}

                    {aiReview.issues.length > 0 && (
                      <>
                        <h3>Что поправить</h3>
                        <ul>{aiReview.issues.map((x, i) => <li key={i}>{x}</li>)}</ul>
                      </>
                    )}
                    {aiReview.nextStep && (
                      <>
                        <h3>Следующий шаг</h3>
                        <p>{aiReview.nextStep}</p>
                      </>
                    )}
                  </div>

                  {(hint !== null && hint !== '') && (
                    <HintBlock hint={hint} streaming={hintStreaming} />
                  )}

                  {/* Self-solve */}
                  {selfSolve === null ? (
                    <div style={{
                      marginTop: 16, padding: '12px 14px', borderRadius: 10,
                      border: '1px solid var(--border)', background: 'var(--surface2)',
                    }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: 10 }}>Решил сам?</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setSelfSolve('yes')} className="btn-accent"
                          style={{ flex: 1, padding: '7px', fontSize: '0.8rem', borderRadius: 8 }}>
                          Да
                        </button>
                        <button onClick={() => { setSelfSolve('no'); fetchExplainedCode() }} style={{
                          flex: 1, padding: '7px', fontSize: '0.8rem', borderRadius: 8,
                          border: '1px solid var(--border)', background: 'transparent',
                          color: 'var(--text2)', cursor: 'pointer',
                        }}>
                          Нет
                        </button>
                      </div>
                    </div>
                  ) : selfSolve === 'yes' ? (
                    <div style={{
                      marginTop: 16, padding: '10px 14px', borderRadius: 10,
                      background: 'var(--accent-glow)', border: '1px solid var(--accent)44',
                      fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.6,
                    }}>
                      Самостоятельное решение — единственный способ по-настоящему запомнить алгоритм. Именно это и строит долгосрочную память.
                    </div>
                  ) : explainLoading ? (
                    <div style={{ marginTop: 16 }}>
                      <WalkingGoose label="Готовлю построчное объяснение..." />
                    </div>
                  ) : (
                    <div style={{
                      marginTop: 16, padding: '10px 14px', borderRadius: 10,
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      fontSize: '0.8rem', color: 'var(--text2)', lineHeight: 1.6,
                    }}>
                      Разобранное решение с комментариями — в редакторе. Прочитай, закрой и попробуй воспроизвести самостоятельно.
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(hint !== null && hint !== '') && (
                    <HintBlock hint={hint} streaming={hintStreaming} />
                  )}
                  <div style={{ color: 'var(--border2)', fontSize: '0.82rem', lineHeight: 1.6 }}>
                    Напишите решение и отправьте — получите разбор от AI.
                  </div>
                </div>
              )}
            </div>

            {/* Visualizer panel body */}
            <div
              className="practice-panel-body"
              style={{
                display: activePanel === 'visu' ? 'flex' : 'none',
                flexDirection: 'column',
                overflow: visuData ? 'hidden' : 'auto',
              }}
            >
              {visuLoading ? (
                <WalkingGoose label="Строю визуализацию..." />
              ) : visuData ? (
                <AlgoVisualizer data={visuData} onRerun={runVisualize} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 12, padding: '20px 0' }}>
                  <Activity size={28} style={{ color: 'var(--border2)' }} />
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textAlign: 'center', lineHeight: 1.6 }}>
                    Визуализация пошагового выполнения алгоритма
                  </div>
                  <button
                    onClick={runVisualize}
                    className="btn-accent"
                    style={{ padding: '9px 20px', fontSize: '0.82rem', borderRadius: 10 }}
                  >
                    Запустить
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom: task stats + reset */}
          {taskStats && (
            <div style={{
              flexShrink: 0, borderTop: '1px solid var(--border)',
              padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--bg)',
            }}>
              <div style={{ flex: 1, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <StatChip label="попыток" value={String(taskStats.attempts || 0)} />
                {taskStats.lastVerdict && (
                  <StatChip label="последнее" value={
                    taskStats.lastVerdict === 'pass' ? 'Зачёт' :
                    taskStats.lastVerdict === 'fail' ? 'Незачёт' : 'Доработать'
                  } color={VERDICT_COLOR[taskStats.lastVerdict as Verdict]} />
                )}
                {taskStats.bestTime && (
                  <StatChip label="рекорд" value={formatTime(Math.floor(taskStats.bestTime / 1000))} />
                )}
                {taskStats.nextReview && (
                  <StatChip label="повторение" value={taskStats.nextReview} />
                )}
              </div>
              {resetConfirm ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Точно?</span>
                  <button
                    onClick={() => {
                      if (!task) return
                      resetTaskProgress(task.id)
                      saveReview(task.id, null)
                      setTaskStats(getTaskProgress(task.id))
                      setResetConfirm(false)
                      setAiReview(null)
                      setSelfSolve(null)
                      setCode('')
                    }}
                    style={{
                      padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                      fontSize: '0.72rem', fontWeight: 700,
                      background: 'var(--red)', color: '#fff', border: 'none',
                    }}
                  >
                    Да
                  </button>
                  <button
                    onClick={() => setResetConfirm(false)}
                    style={{
                      padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                      fontSize: '0.72rem', fontWeight: 600,
                      background: 'transparent', border: '1px solid var(--border)',
                      color: 'var(--muted)',
                    }}
                  >
                    Нет
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setResetConfirm(true)}
                  style={{
                    padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                    fontSize: '0.72rem', fontWeight: 600, flexShrink: 0,
                    background: 'transparent', border: '1px solid var(--border)',
                    color: 'var(--muted)', transition: 'all 0.15s',
                  }}
                >
                  Сбросить
                </button>
              )}
            </div>
          )}

        </div>

        {/* ── Resize handle ── */}
        <div className="practice-resize-handle" onMouseDown={onDragStart} />

        {/* ── Right: editor ── */}
        <div className="practice-col-editor">
          <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {code.trim() && (
              <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
                <CopyButton text={code} size={13} />
              </div>
            )}
            <DartEditor
              value={code}
              onChange={handleCodeChange}
              onSubmit={submit}
              onHint={fetchHint}
              onInlineAsk={(coords, cursorLine) => setInlineAskAnchor({ ...coords, cursorLine })}
              minHeight="100%"
            />
            {inlineAskAnchor && (
              <InlineAskModal
                x={inlineAskAnchor.x}
                y={inlineAskAnchor.y}
                onClose={() => setInlineAskAnchor(null)}
                onSubmit={q => submitInlineAsk(q, inlineAskAnchor.cursorLine)}
              />
            )}

            {/* Ghost overlay */}
            {showGhost && ghostCode && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'var(--surface)', opacity: 0.93,
                zIndex: 5, borderRadius: 12, overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                border: '1px solid var(--border2)',
              }}>
                <div style={{
                  padding: '8px 14px', borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--surface2)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Ghost size={13} style={{ color: 'var(--muted)' }} />
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Предыдущее решение
                    </span>
                  </div>
                  <button
                    onClick={() => { setShowGhost(false); lastActivityRef.current = Date.now() }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.75rem', padding: '2px 6px' }}
                  >
                    Скрыть
                  </button>
                </div>
                <pre style={{
                  flex: 1, margin: 0, padding: '14px 16px', overflow: 'auto',
                  fontFamily: `'${settings?.editorFont ?? 'JetBrains Mono'}', monospace`,
                  fontSize: '12px', color: 'var(--text2)', lineHeight: 1.65, opacity: 0.55,
                }}>
                  {ghostCode}
                </pre>
              </div>
            )}
          </div>

          {/* Complexity inputs */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <ComplexityInput
              label="Время"
              value={userTimeComplexity}
              onChange={setUserTimeComplexity}
              disabled={submitting}
            />
            <ComplexityInput
              label="Память"
              value={userSpaceComplexity}
              onChange={setUserSpaceComplexity}
              disabled={submitting}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {aiReview && (
              <button
                onClick={() => {
                  setCode('')
                  setAiReview(null)
                  if (task) saveReview(task.id, null)
                  setSelfSolve(null)
                  setHint(null)
                  startTimeRef.current = Date.now()
                  setElapsed(0)
                }}
                style={{
                  padding: '14px 18px', borderRadius: 10, cursor: 'pointer',
                  fontSize: '0.9rem', fontWeight: 700, flexShrink: 0,
                  background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--text2)', transition: 'border-color 0.15s',
                }}
              >
                Заново
              </button>
            )}
            <button
              onClick={submit}
              disabled={submitting || !code.trim()}
              className="btn-accent"
              style={{ flex: 1, padding: '14px', fontSize: '0.9rem', borderRadius: 10 }}
            >
              <Send size={15} />
              {submitting ? 'Анализирую...' : 'Отправить на AI-ревью'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function HintBlock({ hint, streaming }: { hint: string; streaming: boolean }) {
  return (
    <div style={{
      padding: '10px 12px', borderRadius: 8,
      background: 'var(--surface2)', border: '1px solid var(--border)',
      fontSize: '0.8rem', color: 'var(--text2)', lineHeight: 1.6,
    }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
        Подсказка
      </div>
      {hint}
      {streaming && (
        <span style={{
          display: 'inline-block', width: 2, height: '0.85em',
          background: 'var(--text2)', marginLeft: 2, verticalAlign: 'middle',
          animation: 'hint-cursor-blink 0.9s steps(1) infinite',
        }} />
      )}
    </div>
  )
}

function ComplexityInput({ label, value, onChange, disabled }: {
  label: string; value: string; onChange: (v: string) => void; disabled: boolean
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: '0.6rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        placeholder="O(?)"
        style={{
          width: '100%', padding: '8px 10px', borderRadius: 8,
          border: '1px solid var(--border)', background: 'var(--surface2)',
          color: 'var(--text)', fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.82rem', outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
        onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
      />
    </div>
  )
}

function ComplexityRow({ label, actual, reason, userGuess, correct }: {
  label: string; actual: string; reason?: string; userGuess: string; correct?: boolean | null
}) {
  const hasGuess = userGuess.trim() !== ''
  const isCorrect = correct === true
  const isWrong = correct === false
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent)' }}>
          {actual}
        </span>
        <span style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </span>
        {hasGuess && (
          <span style={{
            fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600,
            color: isCorrect ? 'var(--green)' : isWrong ? 'var(--red)' : 'var(--muted)',
            background: isCorrect ? '#48b87014' : isWrong ? '#e0555514' : 'transparent',
            border: `1px solid ${isCorrect ? '#48b87033' : isWrong ? '#e0555533' : 'var(--border)'}`,
            borderRadius: 5, padding: '1px 7px',
          }}>
            {isCorrect ? '✓' : isWrong ? '✗' : ''} {userGuess}
          </span>
        )}
      </div>
      {reason && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text2)', marginTop: 3, lineHeight: 1.5 }}>{reason}</div>
      )}
    </div>
  )
}

function StatChip({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span style={{ fontSize: '0.6rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
        {label}
      </span>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: color ?? 'var(--text2)' }}>
        {value}
      </span>
    </div>
  )
}
