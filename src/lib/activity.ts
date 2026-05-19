function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function recordActivity() {
  if (typeof window === 'undefined') return
  try {
    const data: Record<string, number> = JSON.parse(localStorage.getItem('algoose_activity') || '{}')
    const d = today()
    data[d] = (data[d] || 0) + 1
    localStorage.setItem('algoose_activity', JSON.stringify(data))
  } catch {}
}

export function getActivity(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem('algoose_activity') || '{}') } catch { return {} }
}

export function calcStreak(activity: Record<string, number>): number {
  let streak = 0
  const d = new Date()
  // Allow counting today even if not yet recorded today
  for (let i = 0; i < 365; i++) {
    const s = d.toISOString().slice(0, 10)
    if (activity[s]) {
      streak++
      d.setDate(d.getDate() - 1)
    } else if (i === 0) {
      // Today not active yet — still check yesterday
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

/** Returns last `n` days as [{date, count}] oldest→newest */
export function getLastDays(activity: Record<string, number>, n = 35): { date: string; count: number }[] {
  const result = []
  const d = new Date()
  d.setDate(d.getDate() - (n - 1))
  for (let i = 0; i < n; i++) {
    const s = d.toISOString().slice(0, 10)
    result.push({ date: s, count: activity[s] || 0 })
    d.setDate(d.getDate() + 1)
  }
  return result
}

/** Set next review date after a pass verdict (spaced repetition) */
export function scheduleReview(id: number) {
  if (typeof window === 'undefined') return
  try {
    const prog = JSON.parse(localStorage.getItem('algoprep_progress') || '{}')
    if (!prog[id]) return
    const reviewCount = (prog[id].reviewCount || 0) + 1
    prog[id].reviewCount = reviewCount
    const days = reviewCount === 1 ? 7 : reviewCount === 2 ? 14 : 30
    const next = new Date()
    next.setDate(next.getDate() + days)
    prog[id].nextReview = next.toISOString().slice(0, 10)
    localStorage.setItem('algoprep_progress', JSON.stringify(prog))
  } catch {}
}

export function isDue(nextReview?: string): boolean {
  if (!nextReview) return false
  return nextReview <= today()
}

export function saveSolutionCode(id: number, code: string): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(`algoprep_solution:${id}`, code) } catch {}
}

export function getSolutionCode(id: number): string {
  if (typeof window === 'undefined') return ''
  try { return localStorage.getItem(`algoprep_solution:${id}`) || '' } catch { return '' }
}

export function saveSolveTime(id: number, ms: number): void {
  if (typeof window === 'undefined') return
  try {
    const prog = JSON.parse(localStorage.getItem('algoprep_progress') || '{}')
    if (!prog[id]) prog[id] = { timesShown: 0, bestAccuracy: null, attempts: 0 }
    prog[id].lastTime = ms
    if (!prog[id].bestTime || ms < prog[id].bestTime) prog[id].bestTime = ms
    localStorage.setItem('algoprep_progress', JSON.stringify(prog))
  } catch {}
}

export function getBestTime(id: number): number | null {
  if (typeof window === 'undefined') return null
  try {
    const prog = JSON.parse(localStorage.getItem('algoprep_progress') || '{}')
    return prog[id]?.bestTime ?? null
  } catch { return null }
}

export function getTaskProgress(id: number): {
  attempts: number
  lastVerdict: string | null
  bestTime: number | null
  nextReview: string | null
} {
  if (typeof window === 'undefined') return { attempts: 0, lastVerdict: null, bestTime: null, nextReview: null }
  try {
    const prog = JSON.parse(localStorage.getItem('algoprep_progress') || '{}')
    const p = prog[id]
    if (!p) return { attempts: 0, lastVerdict: null, bestTime: null, nextReview: null }
    return {
      attempts: typeof p.attempts === 'number' ? p.attempts : 0,
      lastVerdict: typeof p.lastVerdict === 'string' ? p.lastVerdict : null,
      bestTime: typeof p.bestTime === 'number' ? p.bestTime : null,
      nextReview: typeof p.nextReview === 'string' ? p.nextReview : null,
    }
  } catch { return { attempts: 0, lastVerdict: null, bestTime: null, nextReview: null } }
}

export function resetTaskProgress(id: number): void {
  if (typeof window === 'undefined') return
  try {
    const prog = JSON.parse(localStorage.getItem('algoprep_progress') || '{}')
    delete prog[id]
    localStorage.setItem('algoprep_progress', JSON.stringify(prog))
    localStorage.removeItem(`algoprep_solution:${id}`)
    localStorage.removeItem(`algoprep_solution_draft:${id}`)
  } catch {}
}

export function resetAllProgress(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('algoprep_progress')
    localStorage.removeItem('algoose_activity')
    const toRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && (k.startsWith('algoprep_solution:') || k.startsWith('algoprep_solution_draft:'))) {
        toRemove.push(k)
      }
    }
    toRemove.forEach(k => localStorage.removeItem(k))
  } catch {}
}
