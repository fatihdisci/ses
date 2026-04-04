import { NextResponse } from 'next/server'

import { getSessionSnapshot } from '@/lib/session-store'

export async function GET(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await context.params
  const snapshot = await getSessionSnapshot(sessionId)

  if (!snapshot) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  return NextResponse.json(snapshot)
}

