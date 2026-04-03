import type { FootReading } from '@/types'

interface VisionInputImage {
  base64: string
  mimeType: string
  label: 'top' | 'bottom'
}

export type AiVisionProvider = 'google' | 'openai' | 'auto'

export interface AnalysisStep {
  step: 'validation' | 'provider_selection' | 'provider_call' | 'response_parse'
  status: 'ok' | 'error'
  message: string
  provider?: 'google' | 'openai'
  model?: string
  durationMs?: number
}

export interface AnalysisTrace {
  providerTried: Array<{ provider: 'google' | 'openai'; model: string; ok: boolean; error?: string }>
  steps: AnalysisStep[]
}

const SYSTEM_PROMPT = `You are an expert in podomancy-inspired storytelling and practical foot care guidance.
Return ONLY valid JSON using this exact shape:
{
  "teaser": { "headline": string, "observation": string },
  "full": {
    "mystical": {
      "headline": string,
      "narrative": string,
      "traits": string[],
      "forecast": string
    },
    "careAdvice": {
      "summary": string,
      "recommendations": [
        { "title": string, "description": string, "priority": "high" | "medium" | "low" }
      ]
    }
  }
}
Rules:
- Keep tone mystical but safe and non-medical.
- Mention visual cues from both images.
- narrative should be 2 short paragraphs.
- traits should contain 4-6 items.
- recommendations should contain 4 items.
- Do not include markdown.`

function parseJsonFromModelText(rawText: string): Omit<FootReading, 'sessionId' | 'status'> {
  const cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/```$/, '')
  return JSON.parse(cleaned) as Omit<FootReading, 'sessionId' | 'status'>
}

async function callGoogleVision(
  images: VisionInputImage[],
  trace: AnalysisTrace
): Promise<Omit<FootReading, 'sessionId' | 'status'>> {
  const apiKey = process.env.GOOGLE_API_KEY
  const model = process.env.GOOGLE_VISION_MODEL ?? 'gemini-2.5-flash'

  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is missing')
  }

  const startedAt = Date.now()

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT },
              ...images.map((image) => ({
                text: `Image label: ${image.label}`,
              })),
              ...images.map((image) => ({
                inline_data: {
                  mime_type: image.mimeType,
                  data: image.base64,
                },
              })),
            ],
          },
        ],
        generationConfig: {
          temperature: 0.5,
        },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Google API error (${response.status}): ${errorText}`)
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }

  const text =
    payload.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === 'string')?.text ?? ''

  trace.steps.push({
    step: 'provider_call',
    status: 'ok',
    message: 'Google Vision response received',
    provider: 'google',
    model,
    durationMs: Date.now() - startedAt,
  })

  return parseJsonFromModelText(text)
}

async function callOpenAiVision(
  images: VisionInputImage[],
  trace: AnalysisTrace
): Promise<Omit<FootReading, 'sessionId' | 'status'>> {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_VISION_MODEL ?? 'gpt-4.1-mini'

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is missing')
  }

  const startedAt = Date.now()

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: SYSTEM_PROMPT },
            ...images.map((image) => ({
              type: 'input_text',
              text: `Image label: ${image.label}`,
            })),
            ...images.map((image) => ({
              type: 'input_image',
              image_url: `data:${image.mimeType};base64,${image.base64}`,
            })),
          ],
        },
      ],
      temperature: 0.5,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`)
  }

  const payload = (await response.json()) as {
    output_text?: string
  }

  trace.steps.push({
    step: 'provider_call',
    status: 'ok',
    message: 'OpenAI Vision response received',
    provider: 'openai',
    model,
    durationMs: Date.now() - startedAt,
  })

  return parseJsonFromModelText(payload.output_text ?? '')
}

export async function analyzeFootPhotos(
  images: VisionInputImage[]
): Promise<{ reading: Omit<FootReading, 'sessionId' | 'status'>; trace: AnalysisTrace }> {
  const preferredProvider = (process.env.AI_VISION_PROVIDER ?? 'auto') as AiVisionProvider
  const trace: AnalysisTrace = {
    providerTried: [],
    steps: [
      {
        step: 'provider_selection',
        status: 'ok',
        message: `Provider mode: ${preferredProvider}`,
      },
    ],
  }

  const providerSequence: Array<'google' | 'openai'> =
    preferredProvider === 'google'
      ? ['google', 'openai']
      : preferredProvider === 'openai'
        ? ['openai', 'google']
        : ['google', 'openai']

  for (const provider of providerSequence) {
    try {
      const reading =
        provider === 'google'
          ? await callGoogleVision(images, trace)
          : await callOpenAiVision(images, trace)

      trace.providerTried.push({
        provider,
        model:
          provider === 'google'
            ? process.env.GOOGLE_VISION_MODEL ?? 'gemini-2.5-flash'
            : process.env.OPENAI_VISION_MODEL ?? 'gpt-4.1-mini',
        ok: true,
      })

      trace.steps.push({
        step: 'response_parse',
        status: 'ok',
        message: `Response parsed successfully from ${provider}`,
        provider,
      })

      return { reading, trace }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown provider error'
      trace.providerTried.push({
        provider,
        model:
          provider === 'google'
            ? process.env.GOOGLE_VISION_MODEL ?? 'gemini-2.5-flash'
            : process.env.OPENAI_VISION_MODEL ?? 'gpt-4.1-mini',
        ok: false,
        error: message,
      })
      trace.steps.push({
        step: 'provider_call',
        status: 'error',
        message,
        provider,
      })
    }
  }

  throw new Error('All AI vision providers failed. Configure GOOGLE_API_KEY and/or OPENAI_API_KEY.')
}
