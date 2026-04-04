'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Lock, ShieldCheck, Sparkles } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

import { PRICE_DISPLAY } from '@/lib/constants'

interface PaywallCTAProps {
  paymentLink: string
  sessionId: string
  onUnlock: () => void
}

interface LemonSetupEvent {
  event?: string
}

interface LemonSqueezyApi {
  Setup: (options: { eventHandler?: (event: LemonSetupEvent) => void }) => void
  Url?: {
    Open?: (url: string) => void
  }
}

declare global {
  interface Window {
    LemonSqueezy?: LemonSqueezyApi
    createLemonSqueezy?: () => void
  }
}

function isDemoPaymentLink(link: string): boolean {
  try {
    const url = new URL(link)
    return url.searchParams.get('demoPayment') === '1'
  } catch {
    return false
  }
}

export function PaywallCTA({ paymentLink, sessionId, onUnlock }: PaywallCTAProps) {
  const [isLoading, setIsLoading] = useState(false)
  const demoMode = useMemo(() => isDemoPaymentLink(paymentLink), [paymentLink])
  const setupDoneRef = useRef(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (demoMode) {
      return
    }

    const setupLemon = () => {
      if (setupDoneRef.current) {
        return
      }

      window.createLemonSqueezy?.()
      if (!window.LemonSqueezy) {
        return
      }

      window.LemonSqueezy.Setup({
        eventHandler: (event) => {
          if (event.event === 'Checkout.Success') {
            onUnlock()
          }
        },
      })
      setupDoneRef.current = true
    }

    setupLemon()
    if (setupDoneRef.current) {
      return
    }

    const scriptId = 'lemonsqueezy-js'
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null

    if (existingScript) {
      existingScript.addEventListener('load', setupLemon, { once: true })
      return () => {
        existingScript.removeEventListener('load', setupLemon)
      }
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = 'https://app.lemonsqueezy.com/js/lemon.js'
    script.async = true
    script.addEventListener('load', setupLemon, { once: true })
    document.body.appendChild(script)

    return () => {
      script.removeEventListener('load', setupLemon)
    }
  }, [demoMode, onUnlock])

  const handleUnlock = useCallback(async () => {
    if (!demoMode) {
      window.createLemonSqueezy?.()

      if (window.LemonSqueezy?.Url?.Open) {
        window.LemonSqueezy.Url.Open(paymentLink)
      } else {
        window.open(paymentLink, '_blank', 'noopener,noreferrer')
      }
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`/api/session/${sessionId}/unlock-demo`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Demo unlock failed')
      }

      onUnlock()
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [demoMode, onUnlock, paymentLink, sessionId])

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={reduceMotion ? undefined : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card relative overflow-hidden rounded-2xl border border-gold-300/35 p-5 md:p-7"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gold-300/10 blur-3xl" />

      <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold-300/30 bg-gold-300/10 px-3 py-1 text-xs font-semibold tracking-wide text-gold-200">
        <Lock className="h-3.5 w-3.5" />
        PREMIUM INSIGHT
      </p>

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="font-display text-2xl text-silver-100 md:text-3xl">Unlock your full destiny reading</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-silver-200 md:text-base">
            Get complete mystical interpretation, trait map, and 30-day care plan in a single checkout.
          </p>
        </div>
        <p className="font-display text-3xl text-gold-200 md:text-4xl">{PRICE_DISPLAY}</p>
      </div>

      <ul className="mt-5 grid gap-2 text-sm text-silver-200 md:grid-cols-3">
        <li className="rounded-lg border border-silver-200/10 bg-cosmic-900/55 px-3 py-2">Full narrative + forecast</li>
        <li className="rounded-lg border border-silver-200/10 bg-cosmic-900/55 px-3 py-2">Personal care recommendations</li>
        <li className="rounded-lg border border-silver-200/10 bg-cosmic-900/55 px-3 py-2">Instant unlock after success</li>
      </ul>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleUnlock}
          disabled={isLoading}
          aria-label={`Unlock full report for ${PRICE_DISPLAY}`}
          aria-busy={isLoading}
          className="hidden min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-500 to-gold-300 px-6 py-3 font-semibold text-cosmic-950 shadow-gold-glow transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-200 disabled:cursor-not-allowed disabled:opacity-60 md:inline-flex"
        >
          <Sparkles className="h-4 w-4" />
          {isLoading ? 'Unlocking...' : `Unlock ${PRICE_DISPLAY}`}
        </button>

        <span className="inline-flex items-center gap-1.5 text-xs text-silver-300">
          <ShieldCheck className="h-3.5 w-3.5" />
          Secure checkout • Instant access • No subscription
        </span>
      </div>
      <div className="fixed inset-x-4 bottom-4 z-30 md:hidden">
        <button
          type="button"
          onClick={handleUnlock}
          disabled={isLoading}
          aria-label={`Quick unlock for ${PRICE_DISPLAY}`}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-500 to-gold-300 px-5 py-3 font-semibold text-cosmic-950 shadow-gold-glow transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4" />
          {isLoading ? 'Unlocking...' : `Unlock ${PRICE_DISPLAY}`}
        </button>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {isLoading ? 'Opening secure checkout.' : ''}
      </p>
    </motion.div>
  )
}
