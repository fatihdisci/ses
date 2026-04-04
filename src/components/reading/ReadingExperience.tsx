'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Copy, LoaderCircle, Lock } from 'lucide-react'

import { PaywallCTA } from '@/components/reading/PaywallCTA'
import { fadeInUp, staggerContainer, unlockReveal } from '@/styles/animations'
import type { FootReading } from '@/types'

interface SessionResponse {
  sessionId: string
  status: 'free' | 'paid'
  teaser: FootReading['teaser']
  paymentLink: string
  full?: NonNullable<FootReading['full']>
  createdAt: string
  paidAt?: string
}

export function ReadingExperience({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<SessionResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [copiedSummary, setCopiedSummary] = useState(false)
  const reduceMotion = useReducedMotion()

  const fetchStatus = useCallback(async () => {
    const response = await fetch(`/api/session/${sessionId}/status`, {
      method: 'GET',
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error('Could not load session status')
    }

    const payload = (await response.json()) as SessionResponse
    setData(payload)
    return payload
  }, [sessionId])

  useEffect(() => {
    let mounted = true

    const run = async () => {
      try {
        const payload = await fetchStatus()
        if (!mounted) {
          return
        }
        setError(null)
        if (payload.status === 'free') {
          setIsPolling(true)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load session')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void run()

    return () => {
      mounted = false
    }
  }, [fetchStatus])

  useEffect(() => {
    if (!isPolling || data?.status === 'paid') {
      return
    }

    const intervalId = window.setInterval(async () => {
      try {
        const payload = await fetchStatus()
        if (payload.status === 'paid') {
          setIsPolling(false)
        }
      } catch {
        // Keep polling for transient failures.
      }
    }, 2500)

    const timeoutId = window.setTimeout(() => {
      setIsPolling(false)
    }, 300000)

    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
    }
  }, [data?.status, fetchStatus, isPolling])

  const narrativeParagraphs = useMemo(() => {
    return data?.full?.mystical.narrative
      ? data.full.mystical.narrative.split('\n').filter((chunk) => chunk.trim().length > 0)
      : []
  }, [data?.full?.mystical.narrative])

  const copyPayload = useMemo(() => {
    if (!data) {
      return ''
    }

    const lines = [
      `Session: ${data.sessionId}`,
      `Teaser Headline: ${data.teaser.headline}`,
      `Teaser Observation: ${data.teaser.observation}`,
    ]

    if (data.full) {
      lines.push(`Full Headline: ${data.full.mystical.headline}`)
      lines.push(`Forecast: ${data.full.mystical.forecast}`)
      lines.push(`Care Summary: ${data.full.careAdvice.summary}`)
    }

    return lines.join('\n')
  }, [data])

  const handleCopySummary = async () => {
    if (!copyPayload) {
      return
    }

    try {
      await navigator.clipboard.writeText(copyPayload)
      setCopiedSummary(true)
      window.setTimeout(() => setCopiedSummary(false), 1800)
    } catch {
      // Ignore clipboard failures on restricted environments.
    }
  }

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6 text-silver-100" aria-busy="true">
        <p className="inline-flex items-center gap-2" role="status" aria-live="polite">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading session...
        </p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="glass-card rounded-2xl border border-red-300/30 p-6 text-red-100">
        <p className="inline-flex items-center gap-2" role="alert" aria-live="assertive">
          <AlertCircle className="h-4 w-4" />
          {error ?? 'Session not found'}
        </p>
      </div>
    )
  }

  const isPaid = data.status === 'paid'

  return (
    <motion.div
      variants={reduceMotion ? undefined : staggerContainer}
      initial={reduceMotion ? false : 'hidden'}
      animate={reduceMotion ? undefined : 'visible'}
      className={`space-y-6 ${isPaid ? '' : 'pb-24 md:pb-0'}`}
    >
      <motion.section variants={reduceMotion ? undefined : fadeInUp} className="glass-card relative overflow-hidden rounded-2xl p-5 md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gold-300/10 blur-3xl" />
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <a
            href="#reading-teaser"
            className="rounded-full border border-silver-200/20 px-2.5 py-1 text-xs text-silver-200 transition hover:bg-silver-200/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-silver-100"
          >
            Teaser
          </a>
          <a
            href="#reading-full"
            className="rounded-full border border-silver-200/20 px-2.5 py-1 text-xs text-silver-200 transition hover:bg-silver-200/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-silver-100"
          >
            Full Reading
          </a>
          <a
            href="#reading-care"
            className="rounded-full border border-silver-200/20 px-2.5 py-1 text-xs text-silver-200 transition hover:bg-silver-200/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-silver-100"
          >
            Care Plan
          </a>
          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1 rounded-full border border-gold-300/30 px-2.5 py-1 text-xs font-semibold text-gold-200 transition hover:bg-gold-300/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-200"
          >
            <Copy className="h-3.5 w-3.5" />
            {copiedSummary ? 'Copied' : 'Copy summary'}
          </button>
        </div>
        <p className="sr-only" aria-live="polite">
          {copiedSummary ? 'Session summary copied to clipboard.' : ''}
        </p>
        <p className="text-xs tracking-wide text-gold-200">SESSION #{data.sessionId.slice(0, 8)}</p>
        <h1 id="reading-teaser" className="mt-3 max-w-3xl font-display text-3xl leading-[1.08] tracking-tight text-silver-100 md:text-6xl">
          {data.teaser.headline}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-silver-200 md:text-xl">{data.teaser.observation}</p>
      </motion.section>

      {!isPaid ? (
        <PaywallCTA
          paymentLink={data.paymentLink}
          sessionId={data.sessionId}
          onUnlock={() => {
            setIsPolling(true)
            void fetchStatus()
          }}
        />
      ) : null}

      <motion.section
        variants={unlockReveal}
        initial={false}
        animate={isPaid ? 'unlocked' : 'locked'}
        aria-live="polite"
        aria-busy={!isPaid}
        className="glass-card relative overflow-hidden rounded-2xl p-5 md:p-8"
      >
        {!isPaid ? <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cosmic-950/35 to-cosmic-950/65" /> : null}

        <div className="relative z-10">
          <div className="mb-5 flex items-center gap-2 text-sm">
            {isPaid ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span className="text-emerald-200">Premium content unlocked</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 text-gold-300" />
                <span className="text-gold-200">Waiting for payment confirmation...</span>
              </>
            )}
          </div>

          <h2 id="reading-full" className="font-display text-2xl leading-tight text-silver-100 md:text-5xl">
            {data.full?.mystical.headline ?? 'Full reading locked'}
          </h2>

          <div className={`mt-4 max-w-3xl space-y-3 text-silver-200 md:text-lg ${isPaid ? '' : 'content-locked'}`}>
            {narrativeParagraphs.length > 0 ? (
              narrativeParagraphs.map((paragraph, index) => <p key={`${paragraph.slice(0, 20)}-${index}`}>{paragraph}</p>)
            ) : (
              <>
                <p>Beyond the visible signs lies a broader narrative about your energy, direction, and emotional rhythm.</p>
                <p>Unlock to reveal trait analysis, future outlook, and care recommendations designed for your session.</p>
              </>
            )}
          </div>

          <div className={`mt-6 grid gap-3 md:grid-cols-2 ${isPaid ? '' : 'content-locked'}`}>
            {(data.full?.mystical.traits ?? ['Inner resilience', 'Restless curiosity', 'Grounded intuition', 'Bold independence']).map(
              (trait) => (
                <div key={trait} className="rounded-xl border border-gold-300/20 bg-cosmic-900/50 px-4 py-3 text-sm text-silver-200">
                  {trait}
                </div>
              )
            )}
          </div>

          <div id="reading-care" className={`mt-8 rounded-xl border border-silver-200/20 bg-cosmic-900/60 p-5 ${isPaid ? '' : 'content-locked'}`}>
            <h3 className="font-display text-xl text-silver-100 md:text-2xl">30-Day Care Plan</h3>
            <p className="mt-2 text-silver-200">{data.full?.careAdvice.summary ?? 'Premium care recommendations appear here after unlock.'}</p>
            <ul className="mt-4 space-y-2 text-sm text-silver-200">
              {(data.full?.careAdvice.recommendations ?? []).map((item) => (
                <li key={item.title} className="rounded-lg border border-silver-200/10 bg-cosmic-950/50 p-3">
                  <p className="font-semibold text-silver-100">{item.title}</p>
                  <p className="mt-1">{item.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.section>
    </motion.div>
  )
}
