# 05 - Testing & Refinement

**STATUS: IN PROGRESS - Playwright E2E baseline added (April 3, 2026)**

---

## Test Plan

### 1) API and Contract Tests

- `POST /api/analyze` success response contract
- Validation failure cases for missing/invalid files
- Provider fallback behavior visibility in trace payload
- `POST /api/webhook/payment` signature validation (valid/invalid)
- `GET /api/session/[sessionId]/status` free and paid states

### 2) End-to-End (Playwright)

- Upload top+bottom photo -> receive teaser + trace
- Navigate to reading page -> locked premium section visible
- Trigger unlock path -> status eventually changes to `paid`
- Verify premium content reveals and blur is removed

Implemented baseline:
- `tests/e2e/reading-unlock.spec.ts` covers analyze -> reading -> unlock reveal flow with deterministic API mocks.
- `tests/e2e/webhook-signature.spec.ts` validates webhook signature rejection/acceptance path.
- `playwright.config.ts` and npm scripts added: `test:e2e`, `test:e2e:install`, `test:e2e:headed`.
- `.github/workflows/e2e.yml` runs Playwright on push/PR in CI.

### 3) Accessibility

- Keyboard navigation for upload, submit, unlock CTA
- Focus visibility on all interactive controls
- Contrast checks for core text and buttons (WCAG AA)
- Progress and error messaging announced correctly

### 4) Performance and Reliability

- Basic Lighthouse pass on landing and reading pages
- Verify polling timeout behavior and error resilience
- Verify no client crashes when session is missing/expired

---

## Exit Checklist

- [x] Playwright baseline test implemented and passing locally
- [x] Playwright tests wired into CI
- [x] Webhook signature tests implemented
- [ ] Accessibility checks completed and documented
- [ ] Production smoke test with real payment sandbox completed
