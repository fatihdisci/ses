import { createHmac } from 'node:crypto'

import { expect, test } from '@playwright/test'

const WEBHOOK_SECRET = 'test_webhook_secret'

function signPayload(rawBody: string): string {
  return createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex')
}

test.describe('payment webhook signature', () => {
  test('rejects invalid signature with 401', async ({ request, baseURL }) => {
    const payload = JSON.stringify({
      meta: {
        event_name: 'order_created',
        custom_data: {
          sessionId: 'ses_unknown_for_signature_test',
        },
      },
      data: {
        attributes: {
          status: 'paid',
        },
      },
    })

    const response = await request.post(`${baseURL}/api/webhook/payment`, {
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': 'invalid-signature',
      },
    })

    const status = response.status()
    const json = (await response.json()) as { error?: string }

    if (status === 500) {
      expect(json.error).toContain('LEMONSQUEEZY_WEBHOOK_SECRET')
      return
    }

    expect(status).toBe(401)
    expect(json).toMatchObject({
      error: 'Invalid webhook signature',
    })
  })

  test('accepts valid signature and reaches session check', async ({ request, baseURL }) => {
    const payload = JSON.stringify({
      meta: {
        event_name: 'order_created',
        custom_data: {
          sessionId: 'ses_unknown_but_signed',
        },
      },
      data: {
        attributes: {
          status: 'paid',
        },
      },
    })

    const response = await request.post(`${baseURL}/api/webhook/payment`, {
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signPayload(payload),
      },
    })

    const status = response.status()
    const json = (await response.json()) as { error?: string }

    if (status === 500) {
      expect(json.error).toContain('LEMONSQUEEZY_WEBHOOK_SECRET')
      return
    }

    // Signature is valid, route proceeds to business logic and fails on unknown session.
    expect(status).toBe(404)
    expect(json).toMatchObject({
      error: 'Unknown sessionId',
    })
  })
})
