const DEFAULT_APP_URL = 'http://localhost:3000'

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || DEFAULT_APP_URL
}

export function buildCheckoutUrl(sessionId: string): string {
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID?.trim()
  const appUrl = getAppUrl()
  const successUrl = `${appUrl}/reading/${sessionId}?unlocked=1`

  // Local-dev fallback: keeps flow testable even without Lemon Squeezy config.
  if (!variantId) {
    return `${successUrl}&demoPayment=1`
  }

  const base = `https://checkout.lemonsqueezy.com/buy/${variantId}`
  const params = new URLSearchParams({
    'checkout[custom][sessionId]': sessionId,
    'checkout[success_url]': successUrl,
    'checkout[cancel_url]': `${appUrl}/reading/${sessionId}`,
    'checkout[embed]': '1',
  })

  return `${base}?${params.toString()}`
}

