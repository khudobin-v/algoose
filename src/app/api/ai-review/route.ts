import { NextRequest, NextResponse } from 'next/server'
import { getSolutionCode } from '@/lib/tasks'

const AGENT_ACCESS_ID = '88a6bef7-95cd-4b42-9900-5bebde58b7fc'
const API_URL = `https://api.timeweb.cloud/api/v1/cloud-ai/agents/${AGENT_ACCESS_ID}/call`

const REVIEW_PROMPT = `Ты — senior software engineer, проводишь код-ревью на алгоритмическом собесе.

Задача: {task_name}
Описание: {task_description}

Эталонное решение (для сверки, не показывай пользователю):
\`\`\`dart
{reference}
\`\`\`

Код кандидата (Dart):
\`\`\`dart
{submitted}
\`\`\`

Оценка сложности от кандидата:
- Время: {user_time}
- Память: {user_space}

Правила ответа:
- Стиль: код-ревью от тимлида. Сухо, точно, по делу. Никаких эмодзи, восклицательных знаков, похвал.
- Оцени корректность алгоритма и обработку граничных случаев.
- Сравни идею с эталоном — не показывай эталон, но укажи, если подход принципиально другой.
- Вычисли реальную временну́ю и пространственную сложность кода кандидата.
- Проверь, совпадает ли оценка кандидата с реальной (с точностью до константы).

Верни ТОЛЬКО валидный JSON без markdown-обёртки:
{
  "verdict": "pass" | "fail" | "rework",
  "summary": "1-2 предложения — суть оценки",
  "issues": ["конкретная проблема 1", "конкретная проблема 2"],
  "nextStep": "одно конкретное действие для улучшения",
  "timeComplexity": "O(...)",
  "timeReason": "краткое обоснование",
  "timeCorrect": true | false,
  "spaceComplexity": "O(...)",
  "spaceReason": "краткое обоснование",
  "spaceCorrect": true | false
}

Критерии verdict:
- "pass": алгоритм корректен, сложность приемлема, грубых ошибок нет.
- "rework": идея верная, но есть существенные недочёты или неверная сложность.
- "fail": решение не решает задачу, ломается на базовых кейсах или не компилируется.

Критерии timeCorrect/spaceCorrect:
- true: оценка кандидата совпадает с реальной (с точностью до константы, например O(2n) = O(n)).
- false: оценка кандидата неверна или не указана ("-").`

const COMPLEXITY_PROMPT = `Оцени временну́ю и пространственную сложность алгоритма.

Задача: {task_name}

Код (Dart):
\`\`\`dart
{code}
\`\`\`

Верни ТОЛЬКО валидный JSON без markdown-обёртки:
{
  "timeComplexity": "O(...)",
  "timeReason": "1-2 предложения почему именно такая",
  "spaceComplexity": "O(...)",
  "spaceReason": "1-2 предложения почему именно такая"
}`

const HINT_PROMPT = `Ты — алгоритмический ментор. Анализируй незаконченный код кандидата.

Задача: {task_name}
Описание: {task_description}

Текущий код:
\`\`\`dart
{code}
\`\`\`

Правила:
- Если код пустой, слишком короткий или ошибок нет — верни {"hint": null}.
- Если видишь одну конкретную проблему — дай краткую подсказку (1 предложение, без спойлеров алгоритма).
- Стиль: сухо, технично, без эмодзи. Язык: русский.

Верни ТОЛЬКО JSON: {"hint": "текст" | null}`

const VISUALIZE_PROMPT = `Ты — визуализатор алгоритмов. Трассируй выполнение алгоритма шаг за шагом на малом примере.

Задача: {task_name}
Описание: {task_description}
{code_section}

Выбери небольшой, но нетривиальный пример (5–8 элементов). Не более 14 шагов.

Верни ТОЛЬКО валидный JSON без markdown-обёртки:
{
  "title": "название алгоритма",
  "input": "входные данные примера",
  "steps": [
    {
      "description": "что происходит на этом шаге",
      "variables": { "имя": значение_примитив },
      "arrays": {
        "имя": {
          "values": [элементы],
          "active": [индексы_текущего_доступа],
          "done": [финализированные_индексы],
          "pointers": { "имя_указателя": индекс }
        }
      },
      "note": null
    }
  ]
}

Правила:
- Все тексты на русском
- Значения переменных — только число, строка, boolean или null (не объекты)
- active: индексы текущего чтения/записи (оранжевая подсветка)
- done: уже упорядоченные/найденные элементы (зелёная подсветка)
- pointers: именованные указатели, показываемые стрелками под массивом
- note: короткий акцент ("Найдено!", "Свап!") или null
- Опускай пустые поля (arrays, variables, note)
- Для сортировки: показывай массив меняющимся пошагово
- Для поиска: показывай сужение области через pointers
- Для строк: представляй строку как массив символов`

const EXPLAIN_CODE_PROMPT = `Ты — педагог по алгоритмам. Аннотируй код подробными построчными объяснениями на русском.

Задача: {task_name}

Код решения (Dart):
\`\`\`dart
{reference}
\`\`\`

Правила:
- Добавь комментарий // к каждой смысловой строке или блоку — прямо в коде
- Объясняй ЗАЧЕМ, не ЧТО: не "присваиваем i = 0", а "инициализируем левую границу поиска"
- Для сложных блоков — короткий комментарий-заголовок перед блоком
- Верни ТОЛЬКО код с комментариями, без markdown-обёртки, без \`\`\``

const EXPLAIN_PROMPT = `Ты — технический ментор по алгоритмам. Объясняешь подход к задаче инженерным языком.

Задача: {task_name}
Описание: {task_description}

Материал:
{hints}

Требования к ответу:
- Структурировано: заголовки ## для разделов, ### для подпунктов.
- Стиль: точный, инженерный, без воды. Никаких эмодзи, восклицательных знаков, фраз "отлично" / "молодец".
- Разделы: (1) Как думать о задаче, (2) Ключевая идея алгоритма, (3) Детали реализации, (4) Сложность (time + space с объяснением).
- Там, где уместно — короткие псевдокод-блоки или примеры в \`\`\`dart.
- Длина: достаточная для понимания, без повторений.
- Язык: русский.`

type Verdict = 'pass' | 'fail' | 'rework'

function extractJson(raw: string): string {
  let s = raw.trim()
    .replace(/^```json\s*/im, '').replace(/^```\s*/im, '').replace(/```\s*$/im, '').trim()
  if (!s.startsWith('{')) {
    const m = s.match(/\{[\s\S]*\}/)
    if (m) s = m[0]
  }
  return s
}

function robustJsonParse(raw: string): unknown {
  const s = extractJson(raw)
  // First attempt: direct parse
  try { return JSON.parse(s) } catch {}
  // Second attempt: fix unescaped newlines/tabs inside string values
  try {
    const fixed = s.replace(/"(?:[^"\\]|\\.)*"/g, m =>
      m.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')
    )
    return JSON.parse(fixed)
  } catch {}
  // Third attempt: strip trailing commas before } or ]
  try {
    const noTrailing = s.replace(/,\s*([}\]])/g, '$1')
    return JSON.parse(noTrailing)
  } catch {}
  throw new Error('unparseable JSON')
}

function parseReview(raw: string) {
  try {
    const p = robustJsonParse(raw) as Record<string, unknown>
    const verdict: Verdict = ['pass', 'fail', 'rework'].includes(String(p.verdict)) ? p.verdict as Verdict : 'rework'
    const issues = Array.isArray(p.issues)
      ? p.issues.map((x: unknown) => String(x)).filter(Boolean).slice(0, 5)
      : []
    return {
      verdict,
      summary: String(p.summary || 'AI-ревью готово.'),
      issues,
      nextStep: String(p.nextStep || ''),
      timeComplexity: String(p.timeComplexity || ''),
      timeReason: String(p.timeReason || ''),
      timeCorrect: p.timeCorrect === true ? true : p.timeCorrect === false ? false : null,
      spaceComplexity: String(p.spaceComplexity || ''),
      spaceReason: String(p.spaceReason || ''),
      spaceCorrect: p.spaceCorrect === true ? true : p.spaceCorrect === false ? false : null,
    }
  } catch {
    return {
      verdict: 'rework' as Verdict,
      summary: 'Не удалось разобрать ответ AI — попробуй отправить ещё раз.',
      issues: [] as string[],
      nextStep: '',
      timeComplexity: '', timeReason: '', spaceComplexity: '', spaceReason: '',
    }
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const token = process.env.TIMEWEB_TOKEN
  if (!token) return NextResponse.json({ error: 'TIMEWEB_TOKEN not set' }, { status: 500 })

  let message: string
  if (body.type === 'complexity') {
    message = COMPLEXITY_PROMPT
      .replace('{task_name}', body.taskName ?? '')
      .replace('{code}', (body.code ?? '').slice(0, 2000))
  } else if (body.type === 'hint') {
    message = HINT_PROMPT
      .replace('{task_name}', body.taskName)
      .replace('{task_description}', (body.description ?? '').slice(0, 400))
      .replace('{code}', (body.code ?? '').slice(0, 1500))
  } else if (body.type === 'explain') {
    message = EXPLAIN_PROMPT
      .replace('{task_name}', body.taskName)
      .replace('{task_description}', (body.description ?? '').slice(0, 600))
      .replace('{hints}', (body.hints ?? '').slice(0, 1500))
  } else if (body.type === 'explain-code') {
    const reference = body.code?.trim() || getSolutionCode(parseInt(body.taskId))
    message = EXPLAIN_CODE_PROMPT
      .replace('{task_name}', body.taskName)
      .replace('{reference}', reference.slice(0, 3000))
  } else if (body.type === 'visualize') {
    const codeSection = body.code?.trim()
      ? `\nКод решения (Dart):\n\`\`\`dart\n${(body.code as string).slice(0, 2000)}\n\`\`\``
      : '\n(Код не предоставлен — визуализируй типовое решение задачи.)'
    message = VISUALIZE_PROMPT
      .replace('{task_name}', body.taskName)
      .replace('{task_description}', (body.description ?? '').slice(0, 800))
      .replace('{code_section}', codeSection)
  } else {
    const reference = getSolutionCode(parseInt(body.taskId))
    message = REVIEW_PROMPT
      .replace('{task_name}', body.taskName)
      .replace('{task_description}', (body.description ?? '').slice(0, 600))
      .replace('{reference}', reference.slice(0, 3000))
      .replace('{submitted}', (body.code ?? '').slice(0, 2000))
      .replace('{user_time}', (body.userTimeComplexity as string | undefined)?.trim() || '-')
      .replace('{user_space}', (body.userSpaceComplexity as string | undefined)?.trim() || '-')
  }

  try {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ message }),
      signal: AbortSignal.timeout(45_000),
    })

    const data = await resp.json()

    if (!resp.ok) {
      const orig = data?.details?.original_message ?? ''
      if (orig.includes('funds') || orig.includes('402')) {
        return NextResponse.json({ error: 'AI недоступен: у провайдера недостаточно средств.' }, { status: 503 })
      }
      return NextResponse.json({ error: data?.message ?? 'Ошибка AI' }, { status: 503 })
    }

    const result = data.message?.trim() ?? ''
    if (body.type === 'complexity') {
      try {
        const j = robustJsonParse(result) as Record<string, unknown>
        return NextResponse.json({
          timeComplexity: String(j.timeComplexity || ''),
          timeReason: String(j.timeReason || ''),
          spaceComplexity: String(j.spaceComplexity || ''),
          spaceReason: String(j.spaceReason || ''),
        })
      } catch { return NextResponse.json({ timeComplexity: '', timeReason: '', spaceComplexity: '', spaceReason: '' }) }
    }
    if (body.type === 'hint') {
      try {
        const j = robustJsonParse(result) as Record<string, unknown>
        return NextResponse.json({ hint: j.hint ?? null })
      } catch { return NextResponse.json({ hint: null }) }
    }
    if (body.type === 'explain') return NextResponse.json({ result })
    if (body.type === 'explain-code') return NextResponse.json({ code: result })
    if (body.type === 'visualize') {
      try {
        const data = robustJsonParse(result)
        return NextResponse.json({ data })
      } catch {
        return NextResponse.json({ error: 'Не удалось разобрать JSON визуализации' }, { status: 500 })
      }
    }

    return NextResponse.json(parseReview(result))
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `AI ошибка: ${msg}` }, { status: 503 })
  }
}
