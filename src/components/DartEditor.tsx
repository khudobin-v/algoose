'use client'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { java } from '@codemirror/lang-java'
import { indentLess, indentMore } from '@codemirror/commands'
import { indentUnit } from '@codemirror/language'
import { EditorSelection, EditorState, Prec, type StateCommand } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { createTheme } from '@uiw/codemirror-themes'
import { oneDark } from '@codemirror/theme-one-dark'
import { tags } from '@lezer/highlight'
import { useTheme } from '@/components/ThemeProvider'
import { getSettings, type EditorTheme, type EditorFont } from '@/lib/settings'

const INDENT = '  '

const smartEnter: StateCommand = (target) => {
  const { state } = target
  const changes = state.changeByRange(range => {
    const line = state.doc.lineAt(range.from)
    const indent = line.text.match(/^(\s*)/)?.[1] ?? ''
    const trimmed = line.text.trimEnd()
    const extra = trimmed.endsWith('{') || trimmed.endsWith('(') || trimmed.endsWith('[') ? INDENT : ''
    // If cursor is right before closing bracket, split into two lines with correct indentation
    const afterCursor = state.doc.sliceString(range.from, Math.min(range.from + 1, state.doc.length))
    const closing = afterCursor === '}' || afterCursor === ')' || afterCursor === ']'
    if (closing && extra) {
      const insert = '\n' + indent + extra + '\n' + indent
      return {
        changes: { from: range.from, to: range.to, insert },
        range: EditorSelection.cursor(range.from + indent.length + extra.length + 1),
      }
    }
    const insert = '\n' + indent + extra
    return {
      changes: { from: range.from, to: range.to, insert },
      range: EditorSelection.cursor(range.from + insert.length),
    }
  })
  target.dispatch(state.update(changes, { scrollIntoView: true, userEvent: 'input' }))
  return true
}

const insertFormatterIndent: StateCommand = (target) => {
  if (target.state.selection.ranges.some(r => !r.empty)) return indentMore(target)
  target.dispatch(target.state.update(
    target.state.replaceSelection(INDENT),
    { scrollIntoView: true, userEvent: 'input' },
  ))
  return true
}

// ── Dark theme ────────────────────────────────────────────────────
const darkTheme = createTheme({
  theme: 'dark',
  settings: {
    background: '#111111', foreground: '#d4d4d4', caret: '#ffffff',
    selection: '#2a2a2a', selectionMatch: '#222222', lineHighlight: '#161616',
    gutterBackground: '#111111', gutterForeground: '#404040', gutterActiveForeground: '#888888',
  },
  styles: [
    { tag: tags.keyword,                          color: '#e0e0e0', fontWeight: '600' },
    { tag: tags.operator,                         color: '#aaaaaa' },
    { tag: tags.punctuation,                      color: '#888888' },
    { tag: tags.string,                           color: '#a8c8a0' },
    { tag: tags.number,                           color: '#b8b8e8' },
    { tag: tags.bool,                             color: '#e0c090' },
    { tag: tags.null,                             color: '#e0c090' },
    { tag: tags.comment,                          color: '#555555', fontStyle: 'italic' },
    { tag: tags.typeName,                         color: '#c8c8ff' },
    { tag: tags.className,                        color: '#c8c8ff' },
    { tag: tags.definition(tags.variableName),    color: '#f0f0f0' },
    { tag: tags.function(tags.variableName),      color: '#d8d8b8' },
    { tag: tags.function(tags.propertyName),      color: '#d8d8b8' },
    { tag: tags.propertyName,                     color: '#d0d0d0' },
    { tag: tags.variableName,                     color: '#d4d4d4' },
    { tag: tags.meta,                             color: '#888888' },
  ],
})

// ── Light theme ───────────────────────────────────────────────────
const lightTheme = createTheme({
  theme: 'light',
  settings: {
    background: '#fafafa', foreground: '#1a1a1a', caret: '#000000',
    selection: '#b8d4ff', selectionMatch: '#d0e4ff', lineHighlight: '#f0f0f0',
    gutterBackground: '#f4f4f5', gutterForeground: '#aaaaaa', gutterActiveForeground: '#555555',
  },
  styles: [
    { tag: tags.keyword,                          color: '#0000cc', fontWeight: '600' },
    { tag: tags.operator,                         color: '#555555' },
    { tag: tags.punctuation,                      color: '#666666' },
    { tag: tags.string,                           color: '#007700' },
    { tag: tags.number,                           color: '#116688' },
    { tag: tags.bool,                             color: '#aa6600' },
    { tag: tags.null,                             color: '#aa6600' },
    { tag: tags.comment,                          color: '#999999', fontStyle: 'italic' },
    { tag: tags.typeName,                         color: '#0055cc' },
    { tag: tags.className,                        color: '#0055cc' },
    { tag: tags.definition(tags.variableName),    color: '#111111' },
    { tag: tags.function(tags.variableName),      color: '#6600aa' },
    { tag: tags.function(tags.propertyName),      color: '#6600aa' },
    { tag: tags.propertyName,                     color: '#333333' },
    { tag: tags.variableName,                     color: '#222222' },
    { tag: tags.meta,                             color: '#888888' },
  ],
})

// ── Monokai theme ─────────────────────────────────────────────────
const monokaiTheme = createTheme({
  theme: 'dark',
  settings: {
    background: '#272822', foreground: '#f8f8f2', caret: '#f8f8f0',
    selection: '#49483e', selectionMatch: '#3e3d32', lineHighlight: '#3e3d32',
    gutterBackground: '#272822', gutterForeground: '#75715e', gutterActiveForeground: '#f8f8f2',
  },
  styles: [
    { tag: tags.keyword,                          color: '#f92672', fontWeight: '600' },
    { tag: tags.operator,                         color: '#f92672' },
    { tag: tags.punctuation,                      color: '#f8f8f2' },
    { tag: tags.string,                           color: '#e6db74' },
    { tag: tags.number,                           color: '#ae81ff' },
    { tag: tags.bool,                             color: '#ae81ff' },
    { tag: tags.null,                             color: '#ae81ff' },
    { tag: tags.comment,                          color: '#75715e', fontStyle: 'italic' },
    { tag: tags.typeName,                         color: '#66d9e8' },
    { tag: tags.className,                        color: '#66d9e8' },
    { tag: tags.definition(tags.variableName),    color: '#f8f8f2' },
    { tag: tags.function(tags.variableName),      color: '#a6e22e' },
    { tag: tags.function(tags.propertyName),      color: '#a6e22e' },
    { tag: tags.propertyName,                     color: '#f8f8f2' },
    { tag: tags.variableName,                     color: '#f8f8f2' },
    { tag: tags.meta,                             color: '#75715e' },
  ],
})

function resolveTheme(editorTheme: EditorTheme, appTheme: 'dark' | 'light') {
  if (editorTheme === 'auto') return appTheme === 'light' ? lightTheme : darkTheme
  if (editorTheme === 'light') return lightTheme
  if (editorTheme === 'dark') return darkTheme
  if (editorTheme === 'monokai') return monokaiTheme
  if (editorTheme === 'one-dark') return oneDark
  return darkTheme
}

function isLightTheme(editorTheme: EditorTheme, appTheme: 'dark' | 'light'): boolean {
  if (editorTheme === 'auto') return appTheme === 'light'
  return editorTheme === 'light'
}

// ── Dart formatter ────────────────────────────────────────────────
function formatDartLine(line: string): string {
  // Extract string literals so their contents are never touched
  const strs: string[] = []
  const masked = line.replace(/"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, m => {
    strs.push(m)
    return `\x01S${strs.length - 1}\x01`
  })

  const out = masked
    .replace(/\s*\+\+\s*/g, '__INC__')
    .replace(/\s*--\s*/g, '__DEC__')
    .replace(/\s*(=>|==|!=|>=|<=|\+=|-=|\*=|\/=|%=|&&|\|\||=|\+|-|\*|\/|%)\s*/g, ' $1 ')
    .replace(/__INC__/g, '++')
    .replace(/__DEC__/g, '--')
    .replace(/!\s+(?!=)/g, '!')
    .replace(/~\s+/g, '~')
    .replace(/,\s*/g, ', ')
    .replace(/;\s*/g, '; ')
    .replace(/\b(if|for|while|switch|catch)\s*\(/g, '$1 (')
    .replace(/\s*\{\s*$/g, ' {')
    .replace(/^}\s*(else|catch|finally)\b/, '} $1')
    .replace(/\b(else|try|finally)\s*\{/g, '$1 {')
    .replace(/\s+/g, ' ')
    .trimEnd()

  return out.replace(/\x01S(\d+)\x01/g, (_, i) => strs[+i])
}

function formatDart(code: string): string {
  const lines = code.split('\n')
  const result: string[] = []
  let indent = 0

  for (const raw of lines) {
    let line = raw.trim()
    if (!line) { result.push(''); continue }

    const leading = (line.match(/^}+/)?.[0].length ?? 0)
    if (leading > 0) indent = Math.max(0, indent - leading)

    line = formatDartLine(line)
    result.push(INDENT.repeat(indent) + line)

    const opens  = (line.match(/{/g) ?? []).length
    const closes = (line.match(/}/g) ?? []).length
    indent = Math.max(0, indent + opens - Math.max(0, closes - leading))
  }

  return result.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()
}

// ── Component ─────────────────────────────────────────────────────
interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit?: () => void
  onHint?: () => void
  minHeight?: number | string
  editorFont?: EditorFont
  editorTheme?: EditorTheme
}

export default function DartEditor({ value, onChange, onSubmit, onHint, minHeight = 280, editorFont, editorTheme }: Props) {
  const ref = useRef<ReactCodeMirrorRef>(null)
  const { theme: appTheme } = useTheme()

  const settings = getSettings()
  const font: EditorFont = editorFont ?? settings.editorFont
  const themeName: EditorTheme = editorTheme ?? settings.editorTheme
  const resolvedTheme = resolveTheme(themeName, appTheme as 'dark' | 'light')
  const isLight = isLightTheme(themeName, appTheme as 'dark' | 'light')

  // Stable refs so the keymap closure never goes stale
  const onSubmitRef = useRef(onSubmit)
  const onHintRef = useRef(onHint)
  useEffect(() => { onSubmitRef.current = onSubmit }, [onSubmit])
  useEffect(() => { onHintRef.current = onHint }, [onHint])

  const stableKeymap = useMemo(() => Prec.highest(keymap.of([
    { key: 'Tab', run: insertFormatterIndent },
    { key: 'Shift-Tab', run: indentLess },
    { key: 'Enter', run: smartEnter },
    { key: 'Mod-Enter', run: () => { onSubmitRef.current?.(); return true } },
    { key: 'Mod-i', run: () => { onHintRef.current?.(); return true } },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ])), [])

  const extensions = [
    java(),
    indentUnit.of(INDENT),
    EditorState.tabSize.of(INDENT.length),
    stableKeymap,
    EditorView.lineWrapping,
    EditorView.theme({
      '&': { fontSize: '13px', height: '100%' },
      '.cm-scroller': { fontFamily: `'${font}', 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace`, lineHeight: '1.65' },
      '.cm-content': { padding: '14px 0' },
      '.cm-line': { padding: '0 14px' },
      '.cm-gutters': { borderRight: `1px solid ${isLight ? '#e4e4e7' : '#2a2a2a'}`, padding: '0 4px', minWidth: '36px' },
      '.cm-activeLineGutter': { background: isLight ? '#ececee' : '#161616' },
    }),
  ]

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      const view = ref.current?.view
      if (view) {
        const formatted = formatDart(view.state.doc.toString())
        const cursor = view.state.selection.main.head
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: formatted },
          selection: { anchor: Math.min(cursor, formatted.length) },
          userEvent: 'format',
        })
      }
      const el = e.currentTarget as HTMLElement
      el.style.borderColor = 'var(--accent)'
      setTimeout(() => { el.style.borderColor = '' }, 300)
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      onSubmit?.()
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
      e.preventDefault()
      onHint?.()
    }
  }, [onSubmit, onHint])

  // When filling a flex container use height (fixed) so CodeMirror scrolls internally.
  // When given a pixel value use minHeight so the editor grows with content.
  const isFill = minHeight === '100%'

  return (
    <div
      onKeyDown={handleKeyDown}
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12, overflow: 'hidden',
        ...(isFill ? { height: '100%' } : { minHeight }),
        transition: 'border-color 0.3s ease',
      }}
    >
      <CodeMirror
        ref={ref}
        value={value}
        onChange={onChange}
        extensions={extensions}
        theme={resolvedTheme}
        basicSetup={{
          lineNumbers: true, foldGutter: false, dropCursor: false,
          allowMultipleSelections: false, indentOnInput: true, closeBrackets: true,
          autocompletion: false, highlightActiveLine: true, highlightSelectionMatches: true,
          tabSize: 2,
        }}
        style={isFill ? { height: '100%' } : { minHeight }}
        placeholder="// Напиши решение на Dart"
        indentWithTab={false}
      />
    </div>
  )
}
