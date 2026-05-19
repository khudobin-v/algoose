import { NextResponse } from 'next/server'

export async function GET() {
  const token = process.env.TIMEWEB_ACCOUNT_TOKEN
  if (!token) return NextResponse.json({ error: 'TIMEWEB_ACCOUNT_TOKEN not set' }, { status: 500 })

  try {
    const res = await fetch('https://api.timeweb.cloud/api/v1/account/finances', {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8_000),
    })
    if (!res.ok) return NextResponse.json({ error: 'Ошибка Timeweb' }, { status: 502 })
    const data = await res.json()
    const f = data.finances
    return NextResponse.json({
      balance: f.balance as number,
      currency: f.currency as string,
      hoursLeft: f.hours_left as number,
      hourlyCost: f.hourly_cost as number,
    })
  } catch {
    return NextResponse.json({ error: 'Недоступно' }, { status: 502 })
  }
}
