// Keys synced to the database
const SYNC_KEYS = ['algoprep_progress', 'algoprep_activity']

export function collectLocalProgress(): Record<string, unknown> {
  if (typeof window === 'undefined') return {}
  const result: Record<string, unknown> = {}
  for (const key of SYNC_KEYS) {
    try {
      const raw = localStorage.getItem(key)
      if (raw) result[key] = JSON.parse(raw)
    } catch {}
  }
  return result
}

export function applyRemoteProgress(remote: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  for (const key of SYNC_KEYS) {
    if (remote[key] !== undefined) {
      try { localStorage.setItem(key, JSON.stringify(remote[key])) } catch {}
    }
  }
}

export async function pushProgress(): Promise<void> {
  try {
    const data = collectLocalProgress()
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ data }),
    })
  } catch {}
}

export async function pullProgress(): Promise<void> {
  try {
    const res = await fetch('/api/progress')
    if (!res.ok) return
    const { data } = await res.json()

    const dbHasData = data && typeof data === 'object' && Object.keys(data).length > 0
    const localHasData = SYNC_KEYS.some(k => {
      try { return !!localStorage.getItem(k) } catch { return false }
    })

    if (dbHasData) {
      applyRemoteProgress(data as Record<string, unknown>)
    } else if (localHasData) {
      // DB пустая, но есть локальные данные — первичный push
      await pushProgress()
    }
  } catch {}
}
