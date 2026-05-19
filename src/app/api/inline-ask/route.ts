import { NextRequest } from 'next/server'

const AGENT_ACCESS_ID = '88a6bef7-95cd-4b42-9900-5bebde58b7fc'
const API_URL = `https://api.timeweb.cloud/api/v1/cloud-ai/agents/${AGENT_ACCESS_ID}/call`

const PROMPT = `Ты — наставник на алгоритмическом собесе.

Задача: {task_name}

Код кандидата:
\`\`\`dart
{code}
\`\`\`

Курсор стоит на строке:
\`{cursor_line}\`

Вопрос кандидата: {question}

Ответь коротко и по делу — 2-4 предложения. Учитывай контекст строки где стоит курсор.
Правила:
- Не давай готовый код целиком
- Говори конкретно, без воды
- Язык: русский

Верни ТОЛЬКО JSON: {"answer": "текст"}`

export async function POST(req: NextRequest) {
  const token = process.env.TIMEWEB_TOKEN
  if (!token) return new Response('no token', { status: 500 })

  const body = await req.json()
  const message = PROMPT
    .replace('{task_name}', body.taskName ?? '')
    .replace('{code}', (body.code ?? '').slice(0, 2000))
    .replace('{cursor_line}', (body.cursorLine ?? '').trim().slice(0, 200))
    .replace('{question}', (body.question ?? '').slice(0, 500))

  let answer = 'Не удалось получить ответ.'

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
        if (typeof j.answer === 'string' && j.answer) answer = j.answer
      } catch {
        if (raw.length > 0) answer = raw
      }
    }
  } catch {}

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      for (const ch of answer) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(ch)}\n\n`))
        await new Promise(r => setTimeout(r, 14))
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
