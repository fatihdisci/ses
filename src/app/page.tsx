'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { AlertCircle, CheckCircle2, CircleDashed, LoaderCircle, Sparkles, UploadCloud } from 'lucide-react'

import { LOADING_MESSAGES, PHOTO_SLOT_LABELS, PHOTO_SLOTS } from '@/lib/constants'
import { fadeInUp, staggerContainer } from '@/styles/animations'
import type { AnalysisProviderAttempt, AnalysisTraceStep, FootReading, UploadedPhoto } from '@/types'

interface AnalyzeResponse extends Omit<FootReading, 'full'> {
  trace?: {
    steps: AnalysisTraceStep[]
    providers: AnalysisProviderAttempt[]
  }
}

export default function Home() {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messageIndex, setMessageIndex] = useState(0)
  const [traceExpanded, setTraceExpanded] = useState(false)
  const [providerExpanded, setProviderExpanded] = useState(false)
  const [copiedTrace, setCopiedTrace] = useState(false)

  useEffect(() => {
    if (!isSubmitting) {
      return
    }

    const id = window.setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length)
    }, 1600)

    return () => window.clearInterval(id)
  }, [isSubmitting])

  useEffect(() => {
    return () => {
      for (const photo of photos) {
        URL.revokeObjectURL(photo.previewUrl)
      }
    }
  }, [photos])

  const photoMap = useMemo(() => {
    return {
      top: photos.find((item) => item.slot === 'top'),
      bottom: photos.find((item) => item.slot === 'bottom'),
    }
  }, [photos])

  const canSubmit = Boolean(photoMap.top?.file && photoMap.bottom?.file && !isSubmitting)
  const reduceMotion = useReducedMotion()

  const upsertPhoto = (slot: 'top' | 'bottom', file: File | null) => {
    setError(null)
    setResult(null)

    setPhotos((prev) => {
      const next = prev.filter((item) => item.slot !== slot)
      if (!file) {
        return next
      }

      return [
        ...next,
        {
          slot,
          file,
          previewUrl: URL.createObjectURL(file),
        },
      ]
    })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!photoMap.top?.file || !photoMap.bottom?.file) {
      setError('Please upload both required photos before starting analysis.')
      return
    }

    const formData = new FormData()
    formData.append('top', photoMap.top.file)
    formData.append('bottom', photoMap.bottom.file)

    try {
      setIsSubmitting(true)
      setError(null)
      setResult(null)
      setMessageIndex(0)
      setTraceExpanded(false)

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      const payload = (await response.json()) as AnalyzeResponse & { error?: string }

      if (!response.ok) {
        throw new Error(payload.error ?? 'Analysis failed')
      }

      setResult(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error during analysis')
    } finally {
      setIsSubmitting(false)
    }
  }

  const traceSteps = result?.trace?.steps ?? []
  const providers = result?.trace?.providers ?? []
  const visibleTraceSteps = traceExpanded ? traceSteps : traceSteps.slice(0, 3)

  const handleResetForm = () => {
    setPhotos([])
    setResult(null)
    setError(null)
    setMessageIndex(0)
    setTraceExpanded(false)
    setProviderExpanded(false)
  }

  const handleCopyTraceJson = async () => {
    if (!result?.trace) {
      return
    }

    const traceJson = JSON.stringify(result.trace, null, 2)
    try {
      await navigator.clipboard.writeText(traceJson)
      setCopiedTrace(true)
      window.setTimeout(() => setCopiedTrace(false), 1800)
    } catch {
      // Clipboard may be unavailable in some contexts.
    }
  }

  return (
    <motion.main
      variants={reduceMotion ? undefined : staggerContainer}
      initial={reduceMotion ? false : 'hidden'}
      animate={reduceMotion ? undefined : 'visible'}
      className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 md:px-8 md:pt-12"
    >
      <motion.section
        variants={reduceMotion ? undefined : fadeInUp}
        className="bg-cosmic-gradient relative overflow-hidden rounded-3xl border border-gold-300/25 px-5 py-9 md:px-10 md:py-14"
      >
        <div className="pointer-events-none absolute -left-12 top-10 h-40 w-40 rounded-full bg-gold-300/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -top-12 h-56 w-56 rounded-full bg-cosmic-600/20 blur-3xl" />

        <p className="inline-flex items-center gap-2 rounded-full border border-gold-300/35 bg-cosmic-900/70 px-3 py-1 text-xs tracking-wide text-gold-200">
          <Sparkles className="h-3.5 w-3.5" />
          AI Podomancy Session
        </p>

        <h1 className="mt-4 max-w-4xl font-display text-4xl leading-[1.06] tracking-tight text-silver-100 md:text-7xl">
          Your foot reading should feel mystical, not messy.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-silver-200 md:text-xl">
          Upload top and sole photos to get a teaser instantly, inspect AI trace transparency, then continue to a premium unlock
          screen with clean transitions.
        </p>

        <div className="mt-7 grid gap-3 text-xs text-silver-200 sm:grid-cols-3">
          <div className="rounded-xl border border-silver-200/15 bg-cosmic-900/60 px-3 py-2">2 photos required</div>
          <div className="rounded-xl border border-silver-200/15 bg-cosmic-900/60 px-3 py-2">Provider fallback trace</div>
          <div className="rounded-xl border border-silver-200/15 bg-cosmic-900/60 px-3 py-2">Instant reading page handoff</div>
        </div>
      </motion.section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.08fr,0.92fr]">
        <motion.form
          variants={reduceMotion ? undefined : fadeInUp}
          onSubmit={handleSubmit}
          className="glass-card rounded-2xl p-5 md:p-8"
          aria-busy={isSubmitting}
        >
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-silver-100 md:text-3xl">Upload Panel</h2>
              <p id="upload-help" className="mt-1 text-sm text-silver-200">
                Add both images to unlock the analysis button.
              </p>
            </div>
            <span className="text-xs text-silver-300">JPG • PNG • WEBP • HEIC</span>
          </div>

          <fieldset className="mt-6 grid gap-4 sm:grid-cols-2">
            <legend className="sr-only">Required foot photos</legend>
            {PHOTO_SLOTS.map((slot) => {
              const selected = photoMap[slot]
              return (
                <label
                  key={slot}
                  className={`group relative overflow-hidden rounded-xl border p-4 transition ${
                    selected
                      ? 'border-emerald-300/45 bg-emerald-500/10'
                      : 'border-silver-200/20 bg-cosmic-900/60 hover:border-gold-300/40'
                  }`}
                >
                  <span className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-silver-100">
                    {selected ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <CircleDashed className="h-4 w-4" />}
                    {PHOTO_SLOT_LABELS[slot]}
                  </span>

                  <input
                    id={`photo-${slot}`}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic"
                    required
                    aria-required="true"
                    aria-describedby="upload-help"
                    onChange={(event) => upsertPhoto(slot, event.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-silver-200 file:mr-3 file:rounded-full file:border-0 file:bg-gold-300/20 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-gold-200 hover:file:bg-gold-300/30"
                  />

                  {selected?.previewUrl ? (
                    <Image
                      src={selected.previewUrl}
                      alt={`${slot} preview`}
                      width={520}
                      height={240}
                      unoptimized
                      className="mt-3 h-36 w-full rounded-lg object-cover ring-1 ring-silver-100/10"
                    />
                  ) : (
                    <div className="mt-3 flex h-36 w-full items-center justify-center rounded-lg border border-dashed border-silver-200/20 text-xs text-silver-300">
                      No image selected
                    </div>
                  )}
                </label>
              )
            })}
          </fieldset>

          <button
            type="submit"
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-500 to-gold-300 px-6 py-3 font-semibold text-cosmic-950 shadow-gold-glow transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {isSubmitting ? 'Analyzing...' : 'Start reading'}
          </button>

          <div className="mt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetForm}
              className="rounded-full border border-silver-200/25 px-3 py-1.5 text-xs font-semibold text-silver-200 transition hover:bg-silver-200/10"
            >
              Reset inputs
            </button>
            {error ? (
              <button
                type="submit"
                className="rounded-full border border-gold-300/35 px-3 py-1.5 text-xs font-semibold text-gold-200 transition hover:bg-gold-300/10"
              >
                Retry analysis
              </button>
            ) : null}
          </div>

          {isSubmitting ? (
            <div className="mt-4" role="status" aria-live="polite">
              <p className="text-sm text-gold-200">{LOADING_MESSAGES[messageIndex]}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-silver-200/10">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-gold-300" />
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-red-200" role="alert" aria-live="assertive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          ) : null}
        </motion.form>

        <motion.aside variants={reduceMotion ? undefined : fadeInUp} className="space-y-6">
          <div className="glass-card rounded-2xl p-5 md:p-8">
            <h2 className="font-display text-2xl text-silver-100">Pipeline Trace</h2>
            <p className="mt-2 text-sm text-silver-200">Each analysis stage and provider fallback appears here transparently.</p>

            {!result ? (
              <div className="mt-5 rounded-xl border border-dashed border-silver-200/20 px-4 py-5 text-sm text-silver-300">
                Run analysis to see validation and model steps.
              </div>
            ) : (
              <>
                <div id="trace-panel" className="mt-5 space-y-3" aria-live="polite" role="list" aria-label="Analysis pipeline trace">
                  {visibleTraceSteps.map((step, index) => (
                    <div key={`${step.step}-${index}`} role="listitem" className="rounded-xl border border-silver-200/15 bg-cosmic-900/55 px-4 py-3">
                      <p className="text-sm font-semibold text-silver-100">
                        {step.step}
                        {step.status === 'ok' ? (
                          <CheckCircle2 className="ml-2 inline h-4 w-4 text-emerald-300" />
                        ) : (
                          <AlertCircle className="ml-2 inline h-4 w-4 text-red-300" />
                        )}
                      </p>
                      <p className="mt-1 text-xs text-silver-300">{step.message}</p>
                    </div>
                  ))}
                </div>

                {traceSteps.length > 3 ? (
                  <button
                    type="button"
                    onClick={() => setTraceExpanded((prev) => !prev)}
                    className="mt-3 rounded-full border border-gold-300/35 px-3 py-1.5 text-xs font-semibold text-gold-200 transition hover:bg-gold-300/15"
                    aria-expanded={traceExpanded}
                    aria-controls="trace-panel"
                  >
                    {traceExpanded ? 'Show compact trace' : `Show full trace (${traceSteps.length})`}
                  </button>
                ) : null}
              </>
            )}

            {result ? (
              <div className="mt-5 rounded-xl border border-gold-300/20 bg-cosmic-900/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gold-200">Provider attempts</p>
                  <button
                    type="button"
                    onClick={() => setProviderExpanded((prev) => !prev)}
                    className="rounded-full border border-gold-300/30 px-2.5 py-1 text-[11px] font-semibold text-gold-200 transition hover:bg-gold-300/10"
                    aria-expanded={providerExpanded}
                    aria-controls="provider-attempts"
                  >
                    {providerExpanded ? 'Compact' : 'Detail'}
                  </button>
                </div>

                <ul id="provider-attempts" className="mt-2 space-y-2 text-xs text-silver-200">
                  {(providerExpanded ? providers : providers.slice(0, 2)).map((provider, index) => (
                    <li
                      key={`${provider.provider}-${provider.model}-${index}`}
                      className="rounded-md border border-silver-200/10 bg-cosmic-950/45 px-2.5 py-2"
                    >
                      <span className="font-mono text-[11px] text-silver-300">{provider.provider}</span>{' '}
                      <span className="text-silver-100">{provider.model}</span>{' '}
                      <span className={provider.ok ? 'text-emerald-300' : 'text-red-300'}>
                        {provider.ok ? 'ok' : `failed (${provider.error ?? 'unknown'})`}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={handleCopyTraceJson}
                  className="mt-3 rounded-full border border-silver-200/25 px-3 py-1.5 text-xs font-semibold text-silver-200 transition hover:bg-silver-200/10"
                >
                  {copiedTrace ? 'Trace copied' : 'Copy trace JSON'}
                </button>
              </div>
            ) : null}
          </div>

          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-display text-xl text-silver-100">How this feels now</h3>
            <ul className="mt-3 space-y-2 text-sm text-silver-200">
              <li>Cleaner upload hierarchy</li>
              <li>Clear states for selected/missing files</li>
              <li>Trace feedback that reads like an audit log</li>
            </ul>
          </div>
        </motion.aside>
      </section>

      {result ? (
        <motion.section variants={reduceMotion ? undefined : fadeInUp} className="mt-8 grid gap-6 lg:grid-cols-[1fr,auto] lg:items-center">
          <div className="glass-card rounded-2xl p-6 md:p-8">
            <p className="text-xs tracking-wide text-gold-200">TEASER RESULT</p>
            <h3 className="mt-2 max-w-2xl font-display text-3xl leading-tight text-silver-100 md:text-4xl">{result.teaser.headline}</h3>
            <p className="mt-3 max-w-2xl leading-relaxed text-silver-200 md:text-lg">{result.teaser.observation}</p>
          </div>
          <Link
            href={`/reading/${result.sessionId}`}
            className="inline-flex items-center justify-center rounded-full border border-gold-300/50 bg-gold-300/20 px-6 py-3 text-sm font-semibold text-gold-100 transition hover:bg-gold-300/30"
          >
            Open reading page
          </Link>
        </motion.section>
      ) : null}
    </motion.main>
  )
}
