# 04 — AI Vision Integration

**STATUS: COMPLETED ✓**

---

## Provider Strategy (Quality + Cost Efficiency)

The AI vision layer now supports **Google + OpenAI** with automatic fallback.

- **Primary default:** `google` using `gemini-2.5-flash`
- **Fallback:** `openai` using `gpt-4.1-mini`
- **Mode:** `AI_VISION_PROVIDER=auto` (tries Google first, then OpenAI)

This setup optimizes for low latency / lower cost while keeping a reliable second provider if quota/rate/errors occur.

---

## API Contract — `POST /api/analyze`

The route accepts multipart form-data with required file slots:

- `top` (top of foot image)
- `bottom` (sole image)

Validation:

- MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/heic`
- Max per file: 10MB

Response now includes both reading data and full stage tracking (`trace`) for observability.

---

## Traceability (Single-View Stages)

To make every step visible in one place, each analysis response includes:

- `trace.steps`: validation/provider/parse stage outcomes
- `trace.providers`: provider attempts, model used, success/failure, error detail

This allows ops/debug teams to inspect pipeline health at a glance without losing modular docs/code structure.

---

## Environment Variables

```bash
# provider selection: auto | google | openai
AI_VISION_PROVIDER=auto

# Google (primary)
GOOGLE_API_KEY=
GOOGLE_VISION_MODEL=gemini-2.5-flash

# OpenAI (fallback)
OPENAI_API_KEY=
OPENAI_VISION_MODEL=gpt-4.1-mini
```
