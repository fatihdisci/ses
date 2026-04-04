import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { FootReading, SessionStatus } from '@/types'

interface StoredSession {
  sessionId: string
  status: SessionStatus
  createdAt: string
  paidAt?: string
  teaser: FootReading['teaser']
  full: NonNullable<FootReading['full']>
  paymentLink: string
}

type SessionStore = Record<string, StoredSession>

const DATA_DIR = path.join(process.cwd(), '.data')
const STORE_FILE = path.join(DATA_DIR, 'sessions.json')
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL?.trim()
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()

const useUpstash = Boolean(UPSTASH_URL && UPSTASH_TOKEN)

function getSessionKey(sessionId: string): string {
  return `session:${sessionId}`
}

async function upstashCommand<T = unknown>(...command: string[]): Promise<T> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    throw new Error('Upstash environment variables are missing')
  }

  const response = await fetch(UPSTASH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
    cache: 'no-store',
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`Upstash request failed (${response.status}): ${bodyText}`)
  }

  const payload = (await response.json()) as { result?: T; error?: string }
  if (payload.error) {
    throw new Error(`Upstash command error: ${payload.error}`)
  }

  return payload.result as T
}

async function readStore(): Promise<SessionStore> {
  try {
    const raw = await readFile(STORE_FILE, 'utf8')
    return JSON.parse(raw) as SessionStore
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {}
    }
    throw error
  }
}

async function writeStore(store: SessionStore): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  const tempFile = `${STORE_FILE}.tmp`
  await writeFile(tempFile, JSON.stringify(store, null, 2), 'utf8')
  await rename(tempFile, STORE_FILE)
}

export async function createSession(input: {
  sessionId: string
  teaser: FootReading['teaser']
  full: NonNullable<FootReading['full']>
  paymentLink: string
}): Promise<void> {
  const session: StoredSession = {
    sessionId: input.sessionId,
    status: 'free',
    createdAt: new Date().toISOString(),
    teaser: input.teaser,
    full: input.full,
    paymentLink: input.paymentLink,
  }

  if (useUpstash) {
    await upstashCommand(
      'SET',
      getSessionKey(input.sessionId),
      JSON.stringify(session),
      'EX',
      String(SESSION_TTL_SECONDS)
    )
    return
  }

  const store = await readStore()
  store[input.sessionId] = session
  await writeStore(store)
}

export async function markSessionPaid(sessionId: string): Promise<boolean> {
  if (useUpstash) {
    const key = getSessionKey(sessionId)
    const raw = await upstashCommand<string | null>('GET', key)
    if (!raw) {
      return false
    }

    const existing = JSON.parse(raw) as StoredSession
    if (existing.status === 'paid') {
      return true
    }

    existing.status = 'paid'
    existing.paidAt = new Date().toISOString()
    await upstashCommand('SET', key, JSON.stringify(existing), 'EX', String(SESSION_TTL_SECONDS))
    return true
  }

  const store = await readStore()
  const existing = store[sessionId]

  if (!existing) {
    return false
  }

  if (existing.status === 'paid') {
    return true
  }

  existing.status = 'paid'
  existing.paidAt = new Date().toISOString()
  await writeStore(store)
  return true
}

export async function getSessionSnapshot(sessionId: string): Promise<{
  sessionId: string
  status: SessionStatus
  teaser: FootReading['teaser']
  paymentLink: string
  full?: NonNullable<FootReading['full']>
  createdAt: string
  paidAt?: string
} | null> {
  if (useUpstash) {
    const raw = await upstashCommand<string | null>('GET', getSessionKey(sessionId))
    if (!raw) {
      return null
    }

    const session = JSON.parse(raw) as StoredSession
    return {
      sessionId: session.sessionId,
      status: session.status,
      teaser: session.teaser,
      paymentLink: session.paymentLink,
      full: session.status === 'paid' ? session.full : undefined,
      createdAt: session.createdAt,
      paidAt: session.paidAt,
    }
  }

  const store = await readStore()
  const session = store[sessionId]

  if (!session) {
    return null
  }

  return {
    sessionId: session.sessionId,
    status: session.status,
    teaser: session.teaser,
    paymentLink: session.paymentLink,
    full: session.status === 'paid' ? session.full : undefined,
    createdAt: session.createdAt,
    paidAt: session.paidAt,
  }
}
