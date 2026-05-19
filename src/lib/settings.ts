export type EditorFont = 'JetBrains Mono' | 'Fira Code' | 'IBM Plex Mono' | 'Source Code Pro' | 'Courier New'
export type EditorTheme = 'auto' | 'dark' | 'light' | 'monokai' | 'one-dark'

export interface AppSettings {
  editorFont: EditorFont
  editorTheme: EditorTheme
  hintDebounce: number   // seconds; 0 = off
  ghostDelay: number     // minutes; 0 = off
}

const DEFAULTS: AppSettings = {
  editorFont: 'JetBrains Mono',
  editorTheme: 'auto',
  hintDebounce: 3,
  ghostDelay: 5,
}

const KEY = 'algoose_settings'

export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return { ...DEFAULTS }
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch { return { ...DEFAULTS } }
}

export function saveSettings(patch: Partial<AppSettings>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...getSettings(), ...patch }))
  } catch {}
}
