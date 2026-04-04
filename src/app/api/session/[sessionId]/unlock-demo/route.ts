import { NextResponse } from 'next/server'

import { markSessionPaid } from '@/lib/session-store'

export async function POST(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Demo unlock is disabled in production' }, { status: 403 })
  }

  const { sessionId } = await context.params
  const updated = await markSessionPaid(sessionId)

  if (!updated) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, sessionId, status: 'paid' })
}

