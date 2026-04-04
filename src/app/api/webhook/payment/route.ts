import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'node:crypto'

import { markSessionPaid } from '@/lib/session-store'

interface LemonWebhookPayload {
  meta?: {
    event_name?: string
    custom_data?: {
      sessionId?: string
    }
  }
  data?: {
    attributes?: {
      status?: string
    }
  }
}

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  const signatureBuffer = Buffer.from(signature, 'utf8')
  const expectedBuffer = Buffer.from(expected, 'utf8')

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false
  }

  return timingSafeEqual(signatureBuffer, expectedBuffer)
}

export async function POST(request: Request) {
  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET?.trim()
  const signature = request.headers.get('X-Signature')?.trim()
  const rawBody = await request.text()

  if (!webhookSecret) {
    return NextResponse.json({ error: 'LEMONSQUEEZY_WEBHOOK_SECRET is not configured' }, { status: 500 })
  }

  if (!signature || !verifySignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
  }

  let payload: LemonWebhookPayload
  try {
    payload = JSON.parse(rawBody) as LemonWebhookPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const eventName = payload.meta?.event_name
  if (eventName !== 'order_created') {
    return NextResponse.json({ ok: true, ignored: true, reason: `Unhandled event: ${eventName ?? 'unknown'}` })
  }

  const sessionId = payload.meta?.custom_data?.sessionId
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing custom_data.sessionId' }, { status: 400 })
  }

  const updated = await markSessionPaid(sessionId)
  if (!updated) {
    return NextResponse.json({ error: 'Unknown sessionId' }, { status: 404 })
  }

  return NextResponse.json({
    ok: true,
    sessionId,
    paymentStatus: payload.data?.attributes?.status ?? 'unknown',
  })
}
