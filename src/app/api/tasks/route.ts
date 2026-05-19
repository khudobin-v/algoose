import { NextResponse } from 'next/server'
import { getAllTasks } from '@/lib/tasks'

export const dynamic = 'force-dynamic'

export function GET() {
  const tasks = getAllTasks()
  return NextResponse.json(tasks)
}
