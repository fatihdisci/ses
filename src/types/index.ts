import type { PhotoSlot } from '@/lib/constants'

export interface UploadedPhoto {
  slot: PhotoSlot
  file: File
  previewUrl: string
}

// ─── Payment / Session ────────────────────────────────────────────────────────

export type SessionStatus = 'free' | 'paid'

export interface ReadingSession {
  id: string
  createdAt: string
  status: SessionStatus
  photos: {
    top: string   // base64 data URL or cloud storage URL
    bottom: string
  }
  paymentLink?: string   // Lemon Squeezy / Stripe checkout URL
}

// ─── Reading Results ──────────────────────────────────────────────────────────



export interface AnalysisTraceStep {
  step: string
  status: 'ok' | 'error'
  message: string
}

export interface AnalysisProviderAttempt {
  provider: 'google' | 'openai'
  model: string
  ok: boolean
  error?: string
}

export interface FootReading {
  sessionId: string
  status: SessionStatus
  /** Always returned — shown before paywall */
  teaser: {
    headline: string       // e.g. "A Soul Born to Wander"
    observation: string    // e.g. "Your second toe is noticeably longer than your big toe..."
  }
  /** Only returned after payment */
  full?: {
    mystical: MysticalReading
    careAdvice: CareAdvice
  }
  paymentLink?: string
  trace?: {
    steps: AnalysisTraceStep[]
    providers: AnalysisProviderAttempt[]
  }
}

export interface MysticalReading {
  headline: string
  narrative: string         // 2–3 paragraph podomancy interpretation
  traits: string[]          // character traits derived from foot analysis
  forecast: string          // future outlook / destiny paragraph
}

export interface CareAdvice {
  summary: string
  recommendations: CareRecommendation[]
}

export interface CareRecommendation {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
}
