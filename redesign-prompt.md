You are an expert senior product designer and frontend engineer. Your task is to redesign the UI of a premium AI foot reading (podomancy) application. The current design has fundamental problems that make it look like AI-generated prototype slop — developer jargon left in the UI, weak copy hierarchy, and generic layout patterns. You must fix all of this.

---

## CONTEXT

This is a mystical/wellness product that charges users $1.99 for a premium AI reading. The brand should feel like a high-end boutique wellness app — think Goop meets Arc Browser meets Linear. Dark, refined, intentional. Every word should feel handcrafted.

Tech stack: Next.js (App Router), Tailwind CSS v4, Framer Motion, TypeScript. Do NOT change any API routes, backend logic, or TypeScript types. Only touch UI files.

---

## FILES TO MODIFY

- `src/app/page.tsx` — Home/upload page
- `src/app/globals.css` — Design tokens and utilities
- `src/components/reading/ReadingExperience.tsx` — Reading page component
- `src/components/reading/PaywallCTA.tsx` — Payment CTA component
- `src/app/layout.tsx` — Root layout (metadata only)

---

## CRITICAL PROBLEMS TO FIX

### 1. Remove ALL developer/internal copy from the UI

These strings must never appear in a production UI. Delete or completely rewrite them:

- `"Upload Panel"` → rename to `"Begin Your Reading"`
- `"Pipeline Trace"` → this entire sidebar section must be completely removed from the UI. End users do not care about AI provider fallback traces. Delete the trace sidebar panel entirely from `page.tsx`, including all state variables that only served it (`traceExpanded`, `providerExpanded`, `copiedTrace`) and their handlers.
- `"Provider fallback trace"` feature chip → remove
- `"Instant reading page handoff"` feature chip → remove
- `"How this feels now"` glass card with bullets (`"Cleaner upload hierarchy"`, `"Clear states for selected/missing files"`, `"Trace feedback that reads like an audit log"`) → DELETE THIS ENTIRE CARD. It is a developer self-note, not user-facing content.
- `"2 photos required"` feature chip → rewrite to `"Two angles capture your full energy map"`
- `"Run analysis to see validation and model steps."` → delete with the trace section
- `"Add both images to unlock the analysis button."` → rewrite to `"Two photos reveal the full picture — top and sole."`

### 2. Rewrite all hero copy

Current copy reads like a developer brief, not a product:

> "Your foot reading should feel mystical, not messy."
> "Upload top and sole photos to get a teaser instantly, inspect AI trace transparency, then continue to a premium unlock screen with clean transitions."

Replace with premium, evocative copy that speaks to the user's desire for insight:

- H1: `"Ancient wisdom reads what modern medicine overlooks."`
- Subhead: `"Your feet carry the imprint of your life's journey. Upload two photos — top and sole — to receive a personalized reading grounded in reflexology and AI precision."`
- Three feature chips (rewrite the grid of three small boxes):
  - `"Reflexology-informed AI analysis"`
  - `"Mapped to your unique foot signature"`
  - `"Private reading, yours to keep"`

### 3. Redesign the home page layout after trace removal

After removing the trace sidebar, the layout shifts from 2-column to a single-column centered layout. Implement:

- Remove the `lg:grid-cols-[1.08fr,0.92fr]` two-column grid — the form should be the full focal point, centered, `max-w-2xl mx-auto`
- Increase the preview image height from `h-36` to `h-52`
- In the empty state placeholder (currently just a dashed border div with "No image selected"), replace with a centered column layout containing an `UploadCloud` icon (`h-8 w-8 text-silver-300/50`) above the text `"No image selected"` — more visual, less empty
- The submit button: increase vertical padding to `py-4`, keep full width
- Keep all `photoMap`, `upsertPhoto`, `handleSubmit`, `handleResetForm`, `isSubmitting`, `error`, `result`, `messageIndex` state and logic — these are functional, not cosmetic
- The teaser result section that appears after analysis: keep it, but increase its visual weight. Make the `"TEASER RESULT"` label use `.section-label` class (defined below). Make the headline larger: `text-4xl md:text-5xl`.

### 4. Redesign PaywallCTA

Current problems:
- Feature list items are plain unstyled text in a basic grid
- Price is crammed next to the description text
- No icons on feature items

New design requirements:

- Add `<CheckCircle2 className="h-4 w-4 text-gold-300 shrink-0" />` icon before each `<li>` — change the `<li>` to `flex items-start gap-2`
- Move the price display to its own prominent row below the description, before the feature list. Style it: `font-display text-5xl text-gold-200 tracking-tight` with a small `"one-time"` label below in `text-xs text-silver-300`
- Rewrite the three feature items to be benefit-led:
  - `"Deep mystical narrative & energy forecast"`
  - `"30-day reflexology care plan"`
  - `"Immediate access — no wait, no subscription"`
- Add a thin horizontal rule (`<hr className="border-silver-200/10 my-5" />`) between the description block and the feature list
- The trust badge line at the bottom: change text to `"256-bit encrypted checkout · Instant delivery · Cancel anytime"` and keep the `ShieldCheck` icon

### 5. Improve ReadingExperience copy and hierarchy

- The pill nav links at the top (`Teaser` / `Full Reading` / `Care Plan`): add `font-medium` and increase padding to `px-3 py-1.5`
- The `"SESSION #xxxxxxxx"` label: change to `"SESSION · ${data.sessionId.slice(0, 8).toUpperCase()}"` and apply `.section-label` class
- The locked content status label `"Waiting for payment confirmation..."` → change to `"Your full reading is one step away"`
- The unlocked status label `"Premium content unlocked"` → change to `"Full reading unlocked"`
- The 30-Day Care Plan `<h3>`: upgrade to `text-2xl md:text-3xl`
- The trait grid items: add `font-medium text-silver-100` to the trait text

### 6. Update globals.css — add utility classes

Add the following two utility classes to the `@layer utilities` block. Do NOT remove or change any existing tokens or utilities:

```css
/* Small uppercase section label */
.section-label {
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-gold-300);
}

/* Feature card with left accent border */
.feature-card {
  border-left: 2px solid color-mix(in srgb, var(--color-gold-400) 60%, transparent);
  padding: 0.5rem 0.875rem;
  background: color-mix(in srgb, var(--color-cosmic-900) 80%, transparent);
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  color: var(--color-silver-200);
  line-height: 1.5;
}
```

Use `.feature-card` for the three feature chips in the hero section (replacing the current `rounded-xl border` divs).

### 7. Update layout.tsx metadata

Change only the metadata object:
- `title`: `"SES · AI Foot Reading"`
- `description`: `"Discover what your feet reveal. An AI-powered reflexology reading grounded in ancient podomancy."`

Do not change fonts, Toaster, or HTML structure.

---

## DESIGN PRINCIPLES

1. **Remove, don't add.** Every element must earn its place. When in doubt, cut it.
2. **Premium copy is short and confident.** No filler, no developer language, no "feel free to".
3. **Breathing room.** Increase padding on key sections — a premium product never feels cramped.
4. **No placeholder copy.** Every string in the final output must be production-ready.
5. **Keep all existing animations.** Framer Motion variants are good — do not remove or change them.
6. **Keep all existing color tokens.** The cosmic + gold palette is correct. Do not change color values in globals.css.
7. **Keep all accessibility attributes** — aria-*, role, aria-live, aria-busy, aria-label. Only change visual design, not semantics.
8. **Do NOT touch any file in `src/app/api/`, `src/lib/`, `src/styles/animations.ts`, `src/types/`, or any test files.**

---

## IMPORTANT: Next.js version note

Before writing any Next.js-specific code, read `node_modules/next/dist/docs/` — this project uses a version with breaking API changes from standard Next.js. Follow the exact patterns already present in the codebase.

---

## DELIVERABLE

1. Read each file fully before editing it
2. Make all changes described above
3. After editing, run `git diff --stat` to confirm only the five allowed UI files were touched
4. Commit with a clear descriptive message
5. Push to GitHub
