import { NextRequest, NextResponse } from 'next/server'
import { getTaskDetail } from '@/lib/tasks'

export const dynamic = 'force-dynamic'

export function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return params.then(({ id }) => {
    const task = getTaskDetail(parseInt(id))
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(task)
  })
}
