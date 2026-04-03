import { NextResponse } from 'next/server'

// Phase 3/4: Receives Lemon Squeezy / Stripe payment success webhook
// Marks the session as 'paid' so the full reading is unlocked
export async function POST() {
  return NextResponse.json(
    { error: 'Payment webhook not yet implemented' },
    { status: 501 }
  )
}
