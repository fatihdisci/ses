# 01 — Architecture & Stack

**STATUS: COMPLETED ✓**

---

## Project Overview

**Foot Reading** is a premium B2C web application that uses AI Vision to deliver
mystical foot readings (Podomancy/Solistry) and practical foot care advice from
user-uploaded photographs. It monetises via a freemium micro-transaction model ($1.99 paywall).

---

## Core Technology Stack

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Framework | Next.js | 16.x | App Router — RSC for metadata/fonts, streaming for AI output, nested layouts |
| Language | TypeScript | 5.x | Strict mode; full type safety across API routes and components |
| Styling | Tailwind CSS | 4.x | Utility-first with `@theme` CSS tokens; zero runtime overhead |
| Animation | Framer Motion | 12.x | Gestures, drag, layout animations, exit transitions, paywall unlock reveal |
| Icons | Lucide React | latest | Tree-shakeable SVG icons; consistent stroke-width style |
| Toasts | Sonner | 2.x | Portal-based; promise API; stacking + swipe-to-dismiss on mobile |
| Class Utilities | clsx + tailwind-merge | latest | `cn()` helper for safe conditional class composition |
| AI Vision | Google Gemini + OpenAI | Phase 4 | Cost-efficient primary (`gemini-2.5-flash`) with OpenAI fallback (`gpt-4.1-mini`) |
| Payments | Lemon Squeezy / Stripe | Phase 3 | Drop-in checkout modal; no shopping cart; webhook for unlock |

---

## Monetisation Model (Freemium Micro-transaction)

| Layer | Detail |
|---|---|
| **Free Teaser** | 1-sentence Podomancy headline + 1 basic foot observation — always shown |
| **Paywall** | "Unlock Full 3-Page Podomancy Destiny Report & 30-Day Custom Care Plan — $1.99" |
| **Gateway** | Lemon Squeezy or Stripe Payment Links — drop-in checkout modal |
| **UX** | Locked content is CSS-blurred (`.content-locked`) behind the CTA; `unlockReveal` animation on payment success |

### Monetisation Data Flow

```
POST /api/analyze
  → returns { teaser, full: <blurred placeholder> }

Client renders:
  ✓ teaser (visible)
  ✗ full content (blurred with .content-locked)
  → "Unlock" CTA button

User clicks CTA
  → Opens Lemon Squeezy / Stripe modal
  → On success → POST /api/webhook/payment
    → Server marks session status = 'paid'
  → Client polls or receives event
  → unlockReveal animation lifts blur
  → Full reading revealed
```

---

## Next.js App Router Architecture

### Routing Map

```
/                             → Landing page + photo upload flow
/reading/[sessionId]          → Results: teaser + paywall + full reading (post-payment)
/api/analyze                  → POST — validates images, calls AI Vision, returns FootReading
/api/webhook/payment          → POST — Lemon Squeezy / Stripe success webhook
```

### Component Rendering Strategy

- All page chrome (header, footer, metadata) → **Server Components** (zero JS)
- Interactive islands (upload dropzone, animations, toast triggers, paywall CTA) → **Client Components** (`"use client"`)
- AI results stream → **Server-Sent Events** via streaming route handler

---

## Design System Tokens

Defined in `src/app/globals.css` via Tailwind v4 `@theme`:

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `cosmic-950` | `#0d0a1a` | Deepest background |
| `cosmic-900` | `#130e2e` | Primary surface |
| `cosmic-800` | `#1c1547` | Elevated cards |
| `cosmic-700` | `#2d2468` | Interactive elements |
| `cosmic-600` | `#4338a8` | Subtle borders |
| `gold-400` | `#f5c842` | Primary accent (Babylonian gold) |
| `gold-300` | `#f8d96a` | Hover state gold |
| `gold-200` | `#fae89c` | Muted gold text |
| `silver-100` | `#f0f2f8` | Primary text on dark |
| `silver-200` | `#d8dce8` | Secondary text |
| `silver-300` | `#b0b8cc` | Muted / disabled |
| `medical-white` | `#fafbff` | Card highlights, clinical sections |

### Typography

| Variable | Font | Usage |
|---|---|---|
| `--font-display` | Playfair Display | All headings, mystical labels |
| `--font-body` | Geist Sans | Body copy, UI labels |
| `--font-mono` | Geist Mono | Session IDs, code |

### Custom Utilities

| Class | Effect |
|---|---|
| `.text-gold-shimmer` | Animated shimmer gradient on text (headings) |
| `.glass-card` | Frosted glass — `backdrop-filter: blur(12px)` + gold border |
| `.bg-cosmic-gradient` | Radial gradient: cosmic-800 → cosmic-950 |
| `.content-locked` | `filter: blur(6px)` + `user-select: none` — for paywall |

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts           POST — AI Vision analysis (Phase 4)
│   │   └── webhook/payment/route.ts   POST — payment success webhook (Phase 3)
│   ├── reading/[sessionId]/page.tsx   Results page (Phase 3)
│   ├── globals.css                    @theme tokens + utilities
│   ├── layout.tsx                     Fonts, metadata, Sonner provider
│   └── page.tsx                       Landing page + upload flow (Phase 2)
├── components/
│   ├── ui/          Button, Card, Badge, Separator
│   ├── upload/      DropZone, ImagePreview, UploadProgress
│   ├── reading/     ReadingCard, MysticalSection, CareAdviceSection, PaywallCTA
│   └── layout/      Header, Footer, PageWrapper
├── hooks/
│   ├── useFileUpload.ts       Drag-and-drop state logic
│   └── useReadingSession.ts   Reading result + payment state (Phase 3)
├── lib/
│   ├── utils.ts               cn() helper
│   ├── constants.ts           MAX_FILE_SIZE, ACCEPTED_TYPES, LOADING_MESSAGES, PRICE_USD
│   └── validations.ts         Zod schemas (Phase 2)
├── styles/
│   └── animations.ts          Framer Motion variants (fadeInUp, scaleIn, unlockReveal…)
└── types/
    └── index.ts               UploadedPhoto, FootReading, SessionStatus, CareRecommendation
```

---

## File Upload Constraints

From `src/lib/constants.ts`:

```
MAX_FILE_SIZE_BYTES  = 10 MB
ACCEPTED_MIME_TYPES  = image/jpeg, image/png, image/webp, image/heic
PHOTO_SLOTS          = ['top', 'bottom']  — both required before submission
```

---

## Loading States (Mystical Copy)

Cycled during AI analysis — defined in `LOADING_MESSAGES` constant:

- "Consulting ancient Babylonian charts..."
- "Mapping reflexology zones..."
- "Analysing toe length ratios..."
- "Tracing the lines of your sole..."
- "Cross-referencing Eastern Podomancy scrolls..."
- "Decoding the arch of destiny..."

---

## Environment Variables

```bash
# .env.local — never committed
AI_VISION_PROVIDER=auto    # auto | google | openai
GOOGLE_API_KEY=           # Gemini API key (Phase 4)
GOOGLE_VISION_MODEL=gemini-2.5-flash
OPENAI_API_KEY=           # OpenAI API key (fallback)
OPENAI_VISION_MODEL=gpt-4.1-mini
LEMONSQUEEZY_API_KEY=     # Payment gateway (Phase 3)
LEMONSQUEEZY_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=      # Canonical URL for OG image
```

---

## Performance Targets

| Metric | Target |
|---|---|
| LCP | < 2.5s |
| INP | < 100ms |
| CLS | < 0.1 |
| JS Bundle (initial) | < 150 KB gzipped |

---

## Development Commands

```bash
npm run dev          # http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
```

---

## Phase Roadmap

| Phase | Scope |
|---|---|
| **1 — Foundation** ✓ | Scaffold, config, tokens, folder structure, docs |
| **2 — Upload UI** | Landing page, DropZone, ImagePreview, validation, Sonner toasts |
| **3 — Results UI** | ReadingCard, MysticalSection, CareAdvice, PaywallCTA, blur/unlock animation |
| **4 — AI Integration** | Google/OpenAI vision route, fallback strategy, prompt engineering |
| **5 — Polish & Testing** | Accessibility, error states, loading skeletons, E2E tests |
