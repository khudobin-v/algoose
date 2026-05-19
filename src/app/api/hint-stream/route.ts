import { NextRequest } from 'next/server'

const AGENT_ACCESS_ID = '88a6bef7-95cd-4b42-9900-5bebde58b7fc'
const API_URL = `https://api.timeweb.cloud/api/v1/cloud-ai/agents/${AGENT_ACCESS_ID}/call`

const HINT_PROMPT = `Ты — наставник на алгоритмическом собесе. Твоя роль — подтолкнуть вперёд, не раскрывая решение.

Задача: {task_name}
Описание: {task_description}

Текущий код кандидата:
\`\`\`dart
{code}
\`\`\`

Скажи кандидату ЧТО ДЕЛАТЬ ДАЛЬШЕ — 1-2 конкретных следующих шага.
Правила:
- Говори в форме "следующий шаг — ...", "теперь тебе нужно ...", "попробуй ..."
- Если код пустой или почти пустой — скажи с чего начать (какую структуру данных взять, какой первый шаг)
- Не критикуй и не указывай на ошибки — только направляй вперёд
- Не давай готовый код и не раскрывай алгоритм целиком
- 2-3 коротких предложения, без эмодзи
- Язык: русский

Верни ТОЛЬКО JSON: {"hint": "текст"}`

export async function POST(req: NextRequest) {
  const token = process.env.TIMEWEB_TOKEN
  if (!token) return new Response('no token', { status: 500 })

  const body = await req.json()
  const message = HINT_PROMPT
    .replace('{task_name}', body.taskName ?? '')
    .replace('{task_description}', (body.description ?? '').slice(0, 500))
    .replace('{code}', (body.code ?? '').slice(0, 1500))

  let hint = 'Попробуй набросать общую структуру решения — с чего начнёшь?'

  try {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ message }),
      signal: AbortSignal.timeout(30_000),
    })
    if (resp.ok) {
      const data = await resp.json()
      const raw = (data.message ?? '').trim()
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()
      try {
        const j = JSON.parse(cleaned)
        if (typeof j.hint === 'string' && j.hint) hint = j.hint
      } catch {}
    }
  } catch {}

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      for (const ch of hint) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(ch)}\n\n`))
        await new Promise(r => setTimeout(r, 16))
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
