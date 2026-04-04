# 06 - Monetization & Paywall

**STATUS: IN PROGRESS - core implementation completed, provider setup pending (April 3, 2026)**

---

## Current Implementation State

Implemented in code:

- `src/lib/payments.ts` checkout URL builder with local demo fallback
- `src/lib/session-store.ts` Upstash Redis support with local file fallback (`.data/sessions.json`)
- `POST /api/analyze` now creates session and returns `paymentLink`
- `GET /api/session/[sessionId]/status` polling endpoint
- `POST /api/webhook/payment` signature verification + paid unlock
- `src/components/reading/PaywallCTA.tsx` UI component implemented
- Lemon Squeezy `Checkout.Success` event hook wired in Paywall CTA
- `unlockReveal` integrated on reading premium section

Not yet completed:

- Real Lemon Squeezy account/product/variant configuration
- `.env.local` production-like values
- Webhook QA with provider test tooling
- Production Upstash environment provisioning and validation

---

## Environment Variables (Required for real provider flow)

```bash
LEMONSQUEEZY_VARIANT_ID=
LEMONSQUEEZY_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=
```

Optional (recommended for full provider management use-cases):

```bash
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_PRODUCT_ID=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## Phase 3 Checklist (Updated)

- [ ] Lemon Squeezy account + product/variant created
- [ ] `.env.local` variables configured
- [x] `src/lib/payments.ts` checkout URL builder
- [x] `src/lib/session-store.ts` session persistence adapter (Upstash-ready + local fallback)
- [x] `GET /api/session/[sessionId]/status` polling endpoint
- [x] `POST /api/webhook/payment` signature verification + unlock logic
- [x] `src/components/reading/PaywallCTA.tsx` UI component
- [x] Lemon Squeezy JS overlay integration (`Checkout.Success` event)
- [x] `unlockReveal` wired on reading premium content
- [ ] Webhook scenario testing with real provider payload/signature
- [ ] Provision and verify Upstash in deployment environment

---

## Recommended Next Implementation Order

1. Configure `.env.local` and verify real checkout link generation.
2. Set Upstash env vars and verify Redis-backed session writes/reads.
3. Run webhook and E2E tests, then close Phase 3.
