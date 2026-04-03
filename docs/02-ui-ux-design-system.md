# 02 — UI/UX Design System

**STATUS: IN PROGRESS — Phase 2 initiated (April 3, 2026)**

---

## 1) Design Principles

- **Clarity first:** Every screen should communicate one primary action at a glance.
- **Progressive disclosure:** Advanced details (trace, provider steps, raw metadata) stay hidden until requested.
- **Trust through transparency:** Upload, analysis, and paywall boundaries are explicit and non-surprising.
- **Mobile-first delivery:** Layouts and controls are optimized for small screens before desktop expansion.

---

## 2) Information Architecture (UI-Level)

Primary flow:

1. **Landing / Capture**
   - User sees value proposition and upload entry point.
2. **File Selection + Validation**
   - Clear inline feedback for unsupported file types/sizes.
3. **Analysis Progress**
   - Non-blocking progress states with deterministic labels.
4. **Reading Result (Preview + Locked Sections)**
   - Core summary visible, premium insights blurred/locked.
5. **Paywall / Unlock**
   - Benefits list + single primary CTA.
6. **Unlocked Full Reading**
   - Full interpretation + optional trace inspection.

---

## 3) Component Anatomy

### 3.1 Upload Card
- **Header:** concise title + trust microcopy.
- **Dropzone/Button:** prominent primary interaction area.
- **Validation zone:** inline errors/warnings under control.
- **Helper text:** accepted formats and privacy statement.

### 3.2 Analysis Status Panel
- **Stage badge:** current pipeline stage label.
- **Animated progress row:** deterministic step markers.
- **Fallback indicator:** optional note when provider fallback occurs.
- **Retry CTA:** appears only on recoverable errors.

### 3.3 Reading Sections
- **Visible free section(s):** short but meaningful value.
- **Locked premium section(s):** blurred content preview.
- **Unlock strip:** sticky mobile CTA + desktop inline CTA.

### 3.4 Paywall Block
- **Headline:** benefit-focused and specific.
- **Feature bullets:** 3–5 concise outcomes.
- **Price line:** simple, no hidden conditions.
- **Primary button:** high-contrast action.
- **Secondary action:** subtle dismiss/continue later.

---

## 4) Spacing, Radius, and Layout Scale

- **Spacing scale:** 4, 8, 12, 16, 24, 32 px.
- **Container width:**
  - Mobile: full bleed with 16 px side padding.
  - Tablet/Desktop: centered container with max width 720–960 px (context dependent).
- **Corner radius:**
  - Inputs/cards: 12 px.
  - Primary CTA: 9999 px pill or 12 px rounded rectangle (choose one pattern and keep consistent).
- **Vertical rhythm:** minimum 16 px between semantic blocks.

---

## 5) Interactive States

### Buttons
- **Default:** high contrast, clear label.
- **Hover:** subtle elevation or brightness shift.
- **Active:** reduced elevation + tighter shadow.
- **Disabled:** lower contrast, no hover animation.
- **Loading:** spinner + retained width to avoid layout shift.

### Inputs / Dropzone
- **Idle:** neutral border.
- **Hover/Focus:** accent border + soft ring.
- **Error:** critical color border + concise message.
- **Success:** optional success outline after valid selection.

### Links / Inline actions
- Underline on hover/focus for discoverability.
- Focus-visible ring required for keyboard users.

---

## 6) Motion Principles

- **Duration:** 120–240 ms for micro-interactions.
- **Easing:** standard ease-out for entry, ease-in for exit.
- **Purposeful only:** animation must communicate state change.
- **Reduced motion support:** respect `prefers-reduced-motion`; fallback to opacity-only transitions.

Suggested usage:
- Upload success pulse (subtle).
- Step progression fade/slide.
- Paywall reveal with short upward motion + opacity.

---

## 7) Paywall Reveal UX Pattern

- Show meaningful partial value before lock.
- Transition to lock boundary with clear divider label (`Premium Insight`).
- Preserve scroll context; avoid hard redirects if possible.
- On unlock success, reveal content in-place and keep user's scroll position.
- Clearly communicate refund/support/privacy links near payment CTA.

---

## 8) Breakpoint Strategy (Mobile-First)

- **Base (mobile):** single column, sticky bottom CTA for unlock.
- **md+:** expand cards and move secondary metadata into side rail when available.
- **lg+:** increase whitespace, maintain readable line length, avoid over-wide text blocks.

Guidelines:
- Minimum tap targets: 44×44 px.
- Avoid hover-only affordances.
- Ensure all critical actions remain reachable without precision input.

---

## 9) Accessibility Baseline

- Contrast target: WCAG AA minimum.
- Keyboard accessibility for upload, payment, and expand/collapse controls.
- ARIA/live region messaging for analysis progress updates.
- Error messaging must be specific and programmatically associated with fields.

---

## 10) Exit Criteria for Phase 2

- [x] Core design principles documented.
- [x] Component anatomy defined for upload, progress, result, and paywall blocks.
- [x] Spacing/state/motion rules drafted.
- [x] Mobile-first breakpoint strategy established.
- [ ] Token-level mapping finalized in code (colors/typography semantic tokens).
- [ ] Accessibility checks executed against implemented UI.

---

## Next Handoff (Phase 3)

Phase 3 can now implement components directly against this contract:
- Build/adjust UI primitives and composite blocks to match anatomy.
- Wire live progress and trace rendering into the status panel.
- Implement paywall reveal states and unlock transition behavior.
