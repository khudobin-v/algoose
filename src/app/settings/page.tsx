'use client'
import { useState, useEffect, useCallback } from 'react'
import { getSettings, saveSettings, type AppSettings, type EditorFont, type EditorTheme } from '@/lib/settings'
import { resetAllProgress } from '@/lib/activity'
import { useNavbarSlot } from '@/components/NavbarSlot'
import { pushProgress, pullProgress } from '@/lib/syncProgress'

const FONTS: { key: EditorFont; sample: string }[] = [
  { key: 'JetBrains Mono', sample: 'int n = arr.length;' },
  { key: 'Fira Code',       sample: 'int n = arr.length;' },
  { key: 'IBM Plex Mono',   sample: 'int n = arr.length;' },
  { key: 'Source Code Pro', sample: 'int n = arr.length;' },
  { key: 'Courier New',     sample: 'int n = arr.length;' },
]

const THEMES: { key: EditorTheme; label: string; dark: boolean }[] = [
  { key: 'auto',     label: 'Авто',     dark: false },
  { key: 'dark',     label: 'Dark',     dark: true  },
  { key: 'light',    label: 'Light',    dark: false },
  { key: 'monokai',  label: 'Monokai',  dark: true  },
  { key: 'one-dark', label: 'One Dark', dark: true  },
]

const DEBOUNCE_OPTIONS = [
  { v: 0, label: 'Выкл' },
  { v: 2, label: '2 сек' },
  { v: 3, label: '3 сек' },
  { v: 5, label: '5 сек' },
  { v: 10, label: '10 сек' },
]

const GHOST_OPTIONS = [
  { v: 0,  label: 'Выкл'   },
  { v: 3,  label: '3 мин'  },
  { v: 5,  label: '5 мин'  },
  { v: 10, label: '10 мин' },
]

interface BalanceData {
  balance: number
  currency: string
  hoursLeft: number
  hourlyCost: number
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [balanceError, setBalanceError] = useState<string | null>(null)
  const [syncState, setSyncState] = useState<'idle' | 'pushing' | 'pulling' | 'done'>('idle')
  const [exportJson, setExportJson] = useState<string | null>(null)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')
  const [importDone, setImportDone] = useState(false)

  const { setSlot, clearSlot } = useNavbarSlot()

  useEffect(() => {
    setSettings(getSettings())
    setSlot(
      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)' }}>Настройки</span>
    )
    return () => clearSlot()
  }, [setSlot, clearSlot])

  const fetchBalance = useCallback(async () => {
    setBalanceLoading(true)
    setBalanceError(null)
    try {
      const res = await fetch('/api/balance')
      const data = await res.json()
      if (data.error) { setBalanceError(data.error); return }
      setBalance(data as BalanceData)
    } catch {
      setBalanceError('Не удалось загрузить')
    } finally {
      setBalanceLoading(false)
    }
  }, [])

  useEffect(() => { fetchBalance() }, [fetchBalance])

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    if (!settings) return
    const next = { ...settings, [key]: value }
    setSettings(next)
    saveSettings(next)
  }

  if (!settings) return null

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '28px 20px 80px' }}>

      {/* ── AI Balance ── */}
      <Section title="Баланс AI">
        <div style={{
          padding: '14px 16px', borderRadius: 12,
          background: 'var(--surface2)', border: '1px solid var(--border)',
        }}>
          {balanceLoading ? (
            <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Загрузка...</div>
          ) : balanceError ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{balanceError}</span>
              <button
                onClick={fetchBalance}
                style={{
                  padding: '4px 12px', borderRadius: 7, cursor: 'pointer',
                  fontSize: '0.75rem', fontWeight: 600,
                  background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--text2)',
                }}
              >
                Повторить
              </button>
            </div>
          ) : balance ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div>
                <div style={{ fontSize: '0.6rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                  Остаток
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: balance.balance < 50 ? 'var(--red)' : 'var(--text)', lineHeight: 1 }}>
                  {balance.balance.toFixed(2)} ₽
                </div>
              </div>
              <div style={{ width: 1, height: 36, background: 'var(--border)' }} />
              <div>
                <div style={{ fontSize: '0.6rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                  Хватит на
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
                  {balance.hoursLeft} ч
                </div>
              </div>
              <div style={{ width: 1, height: 36, background: 'var(--border)' }} />
              <div>
                <div style={{ fontSize: '0.6rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                  В час
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text2)', lineHeight: 1 }}>
                  {balance.hourlyCost.toFixed(2)} ₽
                </div>
              </div>
              <button
                onClick={fetchBalance}
                style={{
                  marginLeft: 'auto', padding: '5px 12px', borderRadius: 7, cursor: 'pointer',
                  fontSize: '0.72rem', fontWeight: 600, flexShrink: 0,
                  background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--muted)', transition: 'all 0.15s',
                }}
              >
                Обновить
              </button>
            </div>
          ) : null}
        </div>
      </Section>

      {/* ── Font ── */}
      <Section title="Шрифт редактора">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {FONTS.map(f => {
            const active = settings.editorFont === f.key
            return (
              <button
                key={f.key}
                onClick={() => update('editorFont', f.key)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  background: active ? 'var(--accent-glow)' : 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{
                  fontFamily: `'${f.key}', monospace`,
                  fontSize: '0.88rem', fontWeight: 500,
                  color: active ? 'var(--accent)' : 'var(--text)',
                }}>
                  {f.key}
                </span>
                <span style={{
                  fontFamily: `'${f.key}', monospace`,
                  fontSize: '0.75rem', color: 'var(--muted)',
                }}>
                  {f.sample}
                </span>
              </button>
            )
          })}
        </div>
      </Section>

      {/* ── Editor theme ── */}
      <Section title="Тема редактора">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {THEMES.map(t => {
            const active = settings.editorTheme === t.key
            return (
              <button
                key={t.key}
                onClick={() => update('editorTheme', t.key)}
                style={{
                  padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                  fontSize: '0.8rem', fontWeight: 600,
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  background: active ? 'var(--accent-glow)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text)',
                  transition: 'all 0.15s',
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </Section>

      {/* ── AI hints debounce ── */}
      <Section
        title="AI-подсказки при наборе"
        description="Задержка перед запросом подсказки. Подсказки появляются в правой панели, пока вы набираете код."
      >
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {DEBOUNCE_OPTIONS.map(o => {
            const active = settings.hintDebounce === o.v
            return (
              <button
                key={o.v}
                onClick={() => update('hintDebounce', o.v)}
                style={{
                  padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                  fontSize: '0.8rem', fontWeight: 600,
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  background: active ? 'var(--accent-glow)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text)',
                  transition: 'all 0.15s',
                }}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      </Section>

      {/* ── Import / Export ── */}
      <Section title="Перенос данных" description="Чтобы перенести прогресс с другого устройства — экспортируй там JSON и вставь сюда.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Export */}
          <button
            onClick={() => {
              const keys = ['algoprep_progress', 'algoprep_activity']
              const data: Record<string, unknown> = {}
              for (const k of keys) {
                try { const v = localStorage.getItem(k); if (v) data[k] = JSON.parse(v) } catch {}
              }
              setExportJson(JSON.stringify(data, null, 2))
            }}
            style={{
              padding: '8px 18px', borderRadius: 10, cursor: 'pointer', alignSelf: 'flex-start',
              fontSize: '0.82rem', fontWeight: 700,
              background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)',
            }}
          >
            Экспорт → скопировать JSON
          </button>

          {exportJson !== null && (
            <div style={{ position: 'relative' }}>
              <textarea
                readOnly
                value={exportJson}
                rows={5}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 9,
                  border: '1px solid var(--border)', background: 'var(--surface2)',
                  color: 'var(--text2)', fontFamily: 'monospace', fontSize: '0.72rem',
                  resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.select()}
              />
              <button
                onClick={() => { navigator.clipboard.writeText(exportJson); setExportJson(null) }}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                  fontSize: '0.72rem', fontWeight: 700,
                  background: 'var(--accent)', color: '#000', border: 'none',
                }}
              >
                Копировать
              </button>
            </div>
          )}

          {/* Import */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <textarea
              value={importText}
              onChange={e => { setImportText(e.target.value); setImportError(''); setImportDone(false) }}
              placeholder='Вставь сюда JSON с другого устройства...'
              rows={4}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 9,
                border: `1px solid ${importError ? 'var(--red)' : 'var(--border)'}`,
                background: 'var(--surface2)', color: 'var(--text)',
                fontFamily: 'monospace', fontSize: '0.72rem',
                resize: 'vertical', outline: 'none', boxSizing: 'border-box',
              }}
            />
            {importError && <div style={{ fontSize: '0.75rem', color: 'var(--red)', marginTop: 4 }}>{importError}</div>}
            {importDone && <div style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: 4 }}>Импортировано и сохранено в БД ✓</div>}
            <button
              disabled={!importText.trim()}
              onClick={async () => {
                try {
                  const parsed = JSON.parse(importText.trim())
                  const keys = ['algoprep_progress', 'algoprep_activity']
                  for (const k of keys) {
                    if (parsed[k] !== undefined) {
                      localStorage.setItem(k, JSON.stringify(parsed[k]))
                    }
                  }
                  // Immediately push to DB
                  await pushProgress()
                  setImportText('')
                  setImportDone(true)
                  setImportError('')
                } catch {
                  setImportError('Невалидный JSON — проверь что скопировал полностью')
                }
              }}
              style={{
                marginTop: 8, padding: '8px 18px', borderRadius: 10,
                cursor: importText.trim() ? 'pointer' : 'default',
                fontSize: '0.82rem', fontWeight: 700, opacity: importText.trim() ? 1 : 0.4,
                background: 'var(--accent)', color: '#000', border: 'none',
              }}
            >
              Импортировать и сохранить
            </button>
          </div>
        </div>
      </Section>

      {/* ── Sync ── */}
      <Section title="Синхронизация прогресса">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            disabled={syncState !== 'idle'}
            onClick={async () => {
              setSyncState('pushing')
              await pushProgress()
              setSyncState('done')
              setTimeout(() => setSyncState('idle'), 2000)
            }}
            style={{
              padding: '8px 18px', borderRadius: 10, cursor: syncState !== 'idle' ? 'default' : 'pointer',
              fontSize: '0.82rem', fontWeight: 700, opacity: syncState !== 'idle' ? 0.5 : 1,
              background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)',
              transition: 'all 0.15s',
            }}
          >
            {syncState === 'pushing' ? 'Сохраняю...' : syncState === 'done' ? 'Сохранено ✓' : '↑ Сохранить локальное в БД'}
          </button>
          <button
            disabled={syncState !== 'idle'}
            onClick={async () => {
              setSyncState('pulling')
              await pullProgress()
              setSyncState('done')
              setTimeout(() => setSyncState('idle'), 2000)
            }}
            style={{
              padding: '8px 18px', borderRadius: 10, cursor: syncState !== 'idle' ? 'default' : 'pointer',
              fontSize: '0.82rem', fontWeight: 700, opacity: syncState !== 'idle' ? 0.5 : 1,
              background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)',
              transition: 'all 0.15s',
            }}
          >
            {syncState === 'pulling' ? 'Загружаю...' : syncState === 'done' ? 'Готово ✓' : '↓ Загрузить из БД'}
          </button>
        </div>
      </Section>

      {/* ── Data reset ── */}
      <Section
        title="Данные"
        description="Сброс удаляет весь прогресс, историю решений, активность и черновики. Настройки не затрагиваются."
      >
        {resetDone ? (
          <div style={{
            padding: '10px 14px', borderRadius: 10,
            background: 'var(--surface2)', border: '1px solid var(--border)',
            fontSize: '0.82rem', color: 'var(--muted)',
          }}>
            Прогресс сброшен.
          </div>
        ) : resetConfirm ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>Удалить весь прогресс?</span>
            <button
              onClick={() => {
                resetAllProgress()
                setResetConfirm(false)
                setResetDone(true)
              }}
              style={{
                padding: '6px 16px', borderRadius: 8, cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 700,
                background: 'var(--red)', color: '#fff', border: 'none',
              }}
            >
              Да, удалить
            </button>
            <button
              onClick={() => setResetConfirm(false)}
              style={{
                padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 600,
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--muted)',
              }}
            >
              Отмена
            </button>
          </div>
        ) : (
          <button
            onClick={() => setResetConfirm(true)}
            style={{
              padding: '8px 18px', borderRadius: 10, cursor: 'pointer',
              fontSize: '0.82rem', fontWeight: 700,
              background: 'transparent',
              border: '1px solid var(--red)55',
              color: 'var(--red)',
              transition: 'all 0.15s',
            }}
          >
            Сбросить весь прогресс
          </button>
        )}
      </Section>

      {/* ── Ghost code delay ── */}
      <Section
        title="Ghost Code"
        description="При повторном решении задачи (интервальное повторение) — через сколько минут бездействия показать предыдущее решение как полупрозрачную подсказку."
      >
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {GHOST_OPTIONS.map(o => {
            const active = settings.ghostDelay === o.v
            return (
              <button
                key={o.v}
                onClick={() => update('ghostDelay', o.v)}
                style={{
                  padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                  fontSize: '0.8rem', fontWeight: 600,
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  background: active ? 'var(--accent-glow)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text)',
                  transition: 'all 0.15s',
                }}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      </Section>
    </div>
  )
}

function Section({ title, description, children }: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)',
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: description ? 5 : 10,
      }}>
        {title}
      </div>
      {description && (
        <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 10, lineHeight: 1.55 }}>
          {description}
        </div>
      )}
      {children}
    </div>
  )
}
