import { NextResponse } from 'next/server'

// Phase 4: Receives foot photos, calls Claude Vision API, returns reading
export async function POST() {
  return NextResponse.json(
    { error: 'AI analysis not yet implemented' },
    { status: 501 }
  )
}
