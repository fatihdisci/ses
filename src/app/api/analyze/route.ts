import { randomUUID } from 'node:crypto'

import { NextResponse } from 'next/server'

import { analyzeFootPhotos } from '@/lib/ai-vision'
import { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE_BYTES, PHOTO_SLOTS, type PhotoSlot } from '@/lib/constants'
import type { FootReading } from '@/types'

function isFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File
}

function toBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString('base64')
}

export async function POST(request: Request) {
  const steps = [] as Array<{ step: string; status: 'ok' | 'error'; message: string }>

  try {
    const formData = await request.formData()

    const filesBySlot: Array<{ slot: PhotoSlot; file: FormDataEntryValue | null }> = PHOTO_SLOTS.map((slot) => ({
      slot,
      file: formData.get(slot),
    }))

    const missingSlot = filesBySlot.find(({ file }) => !isFile(file))
    if (missingSlot) {
      return NextResponse.json(
        {
          error: `Missing image for slot: ${missingSlot.slot}`,
          steps: [...steps, { step: 'validation', status: 'error', message: 'Missing required file' }],
        },
        { status: 400 }
      )
    }

    const validatedFiles: Array<{ slot: PhotoSlot; file: File }> = filesBySlot.map(({ slot, file }) => ({
      slot,
      file: file as File,
    }))

    for (const { slot, file } of validatedFiles) {
      if (!ACCEPTED_MIME_TYPES.includes(file.type as (typeof ACCEPTED_MIME_TYPES)[number])) {
        return NextResponse.json(
          {
            error: `Invalid file type for ${slot}: ${file.type}`,
            steps: [...steps, { step: 'validation', status: 'error', message: 'Invalid mime type' }],
          },
          { status: 400 }
        )
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          {
            error: `File too large for ${slot}. Max size is ${MAX_FILE_SIZE_BYTES} bytes.`,
            steps: [...steps, { step: 'validation', status: 'error', message: 'File size limit exceeded' }],
          },
          { status: 400 }
        )
      }
    }

    steps.push({
      step: 'validation',
      status: 'ok',
      message: 'Both photos validated successfully',
    })

    const images = await Promise.all(
      validatedFiles.map(async ({ slot, file }) => {
        const arrayBuffer = await file.arrayBuffer()
        return {
          label: slot,
          mimeType: file.type,
          base64: toBase64(arrayBuffer),
        }
      })
    )

    const { reading, trace } = await analyzeFootPhotos(images)

    const response: FootReading & { trace: { steps: typeof steps; providers: typeof trace.providerTried } } = {
      sessionId: randomUUID(),
      status: 'free',
      teaser: reading.teaser,
      full: reading.full,
      trace: {
        steps: [...steps, ...trace.steps],
        providers: trace.providerTried,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected analysis error'
    return NextResponse.json(
      {
        error: message,
        steps: [...steps, { step: 'analysis', status: 'error', message }],
      },
      { status: 500 }
    )
  }
}
