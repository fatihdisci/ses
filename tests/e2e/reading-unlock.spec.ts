import { expect, test } from '@playwright/test'

const MOCK_SESSION_ID = 'ses_e2e_12345'

function createPngBuffer(): Buffer {
  // 1x1 transparent PNG
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn7lM0AAAAASUVORK5CYII=',
    'base64'
  )
}

test('user can complete analyze to unlock flow', async ({ page }) => {
  let isPaid = false

  await page.route('**/api/analyze', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue()
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        sessionId: MOCK_SESSION_ID,
        status: 'free',
        teaser: {
          headline: 'A Soul Marked by Curiosity',
          observation: 'Your toe alignment suggests adaptable and determined energy.',
        },
        paymentLink: `http://localhost:3000/reading/${MOCK_SESSION_ID}?unlocked=1&demoPayment=1`,
        trace: {
          steps: [
            { step: 'validation', status: 'ok', message: 'Both photos validated successfully' },
            { step: 'provider_selection', status: 'ok', message: 'Provider mode: auto' },
          ],
          providers: [{ provider: 'google', model: 'gemini-2.5-flash', ok: true }],
        },
      }),
    })
  })

  await page.route(`**/api/session/${MOCK_SESSION_ID}/status`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        sessionId: MOCK_SESSION_ID,
        status: isPaid ? 'paid' : 'free',
        teaser: {
          headline: 'A Soul Marked by Curiosity',
          observation: 'Your toe alignment suggests adaptable and determined energy.',
        },
        paymentLink: `http://localhost:3000/reading/${MOCK_SESSION_ID}?unlocked=1&demoPayment=1`,
        full: isPaid
          ? {
              mystical: {
                headline: 'The Hidden Path Revealed',
                narrative: 'You move with bold calm.\nYou grow through challenges.',
                traits: ['Resilience', 'Adaptability', 'Intuition', 'Courage'],
                forecast: 'A practical breakthrough appears soon.',
              },
              careAdvice: {
                summary: 'Balance activity with recovery over the next month.',
                recommendations: [
                  { title: 'Stretch Daily', description: 'Do gentle sole stretches for 10 minutes.', priority: 'medium' },
                ],
              },
            }
          : undefined,
        createdAt: '2026-04-03T00:00:00.000Z',
      }),
    })
  })

  await page.route(`**/api/session/${MOCK_SESSION_ID}/unlock-demo`, async (route) => {
    isPaid = true
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, sessionId: MOCK_SESSION_ID, status: 'paid' }),
    })
  })

  await page.goto('/')

  const inputFiles = [
    {
      name: 'photo.png',
      mimeType: 'image/png',
      buffer: createPngBuffer(),
    },
  ]

  await page.locator('input[type="file"]').nth(0).setInputFiles(inputFiles)
  await page.locator('input[type="file"]').nth(1).setInputFiles(inputFiles)
  await page.getByRole('button', { name: 'Start reading' }).click()

  await expect(page.getByText('A Soul Marked by Curiosity')).toBeVisible()
  await page.getByRole('link', { name: 'Open reading page' }).click()

  await expect(page.getByText(`SESSION #${MOCK_SESSION_ID.slice(0, 8)}`)).toBeVisible()
  await expect(page.getByText('Waiting for payment confirmation...')).toBeVisible()

  await page.getByRole('button', { name: /unlock full report/i }).click()
  await expect(page.getByText('Premium content unlocked')).toBeVisible()
  await expect(page.getByText('The Hidden Path Revealed')).toBeVisible()
})
