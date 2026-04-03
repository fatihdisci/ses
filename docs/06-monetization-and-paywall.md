# 06 — Monetisation & Paywall

**STATUS: PENDING — aktif geliştirme (Phase 3)**

---

## Genel Bakış

Foot Reading uygulaması **freemium mikro-işlem** modeli üzerine kuruludur.

| Katman | Detay |
|---|---|
| **Ücretsiz Teaser** | 1 cümle Podomancy başlığı + 1 temel ayak gözlemi — her zaman gösterilir |
| **Ücretli İçerik** | Tam 3 sayfalık Podomancy Kader Raporu + 30 Günlük Kişisel Bakım Planı |
| **Fiyat** | **$1.99** (sabit — `PRICE_USD` sabiti, `src/lib/constants.ts`) |
| **Ödeme Altyapısı** | Lemon Squeezy (tercih edilen) veya Stripe Payment Links |
| **UX Deseni** | Kilitli içerik CSS blur (`content-locked`) arkasında görünür; ödeme sonrası `unlockReveal` animasyonu ile açılır |

---

## Ödeme Sağlayıcı: Lemon Squeezy (Önerilen)

### Neden Lemon Squeezy

- Merchant of Record (MoR) — vergi/KDV yönetimini tamamen üstlenir, geliştiriciden sorumluluğu kaldırır
- Drop-in checkout modalı — ayrı sayfa yönlendirmesi gerekmez
- Webhook imzalama built-in (`X-Signature` header)
- `$1.99` gibi küçük miktarlarda Stripe'a kıyasla daha sade kurulum

### Gerekli Environment Variables

```bash
# .env.local — asla commit edilmez
LEMONSQUEEZY_API_KEY=           # LS Dashboard > API Keys
LEMONSQUEEZY_STORE_ID=          # LS Dashboard > Store
LEMONSQUEEZY_PRODUCT_ID=        # Reading unlock ürününün ID'si
LEMONSQUEEZY_VARIANT_ID=        # $1.99 varyantın ID'si
LEMONSQUEEZY_WEBHOOK_SECRET=    # Webhook imza doğrulama için

NEXT_PUBLIC_APP_URL=            # Canonical URL (örn: https://footreading.app)
```

---

## Veri Modeli

`src/types/index.ts` içinde tanımlı:

```typescript
export type SessionStatus = 'free' | 'paid'

export interface FootReading {
  sessionId: string
  status: SessionStatus

  // Her zaman döner — ödeme duvarı öncesi gösterilir
  teaser: {
    headline: string      // "A Soul Born to Wander"
    observation: string   // "İkinci parmağınız büyük parmaktan belirgin şekilde uzun..."
  }

  // Yalnızca status === 'paid' olduğunda döner
  full?: {
    mystical: MysticalReading
    careAdvice: CareAdvice
  }

  paymentLink?: string    // Lemon Squeezy checkout URL
}
```

### SessionStatus Geçiş Diyagramı

```
Kullanıcı fotoğraf yükler
        ↓
POST /api/analyze
        ↓
  status: 'free'
  teaser: { headline, observation }
  full: undefined
  paymentLink: "https://checkout.lemonsqueezy.com/..."
        ↓
  [UI: teaser görünür, full içerik blurlu]
        ↓
  Kullanıcı "Unlock $1.99" CTA'ya basar
        ↓
  Lemon Squeezy Checkout Modal açılır
        ↓
  Ödeme başarılı → LS webhook tetiklenir
        ↓
POST /api/webhook/payment
        ↓
  Sunucu: session status → 'paid'
        ↓
  Client: polling veya SSE ile durumu alır
        ↓
  status: 'paid' → unlockReveal animasyonu
        ↓
  [UI: blur kalkar, tam rapor açılır]
```

---

## API Route'ları

### `POST /api/analyze` — `src/app/api/analyze/route.ts`

AI analizi tamamlanınca şu yapıyı döner:

```typescript
// Başarılı yanıt (her zaman)
{
  sessionId: "ses_abc123",
  status: "free",
  teaser: {
    headline: "A Soul Marked by Deep Curiosity",
    observation: "The pronounced arch of your left foot suggests a strong independent streak..."
  },
  paymentLink: "https://checkout.lemonsqueezy.com/buy/VARIANT_ID?checkout[custom][sessionId]=ses_abc123"
}
```

**Önemli:** `checkout[custom][sessionId]` parametresi, webhook geldiğinde hangi session'ın açılacağını bilmek için zorunludur.

### `POST /api/webhook/payment` — `src/app/api/webhook/payment/route.ts`

Lemon Squeezy'nin `order_created` event'ini işler.

```typescript
// Gelen webhook body (Lemon Squeezy order_created)
{
  meta: {
    event_name: "order_created",
    custom_data: {
      sessionId: "ses_abc123"   // analyze route'da eklenen custom param
    }
  },
  data: {
    attributes: {
      status: "paid"
    }
  }
}
```

**İmza Doğrulama (zorunlu):**

```typescript
import { createHmac } from 'crypto'

function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const hash = createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex')
  return hash === signature
}
```

**Route akışı:**
1. `X-Signature` header'ı doğrula → 401 döndür (geçersizse)
2. `event_name === 'order_created'` kontrolü
3. `custom_data.sessionId` al
4. Session'ı `status: 'paid'` olarak işaretle (Phase 3'te KV store seçilecek)
5. `200 OK` döndür

---

## Session Kalıcılığı

Ödeme sonrası session durumunu tutmak için bir KV store gerekir.

### Seçenekler (Phase 3'te kararlaştırılacak)

| Seçenek | Avantaj | Dezavantaj |
|---|---|---|
| **Vercel KV (Upstash Redis)** | Next.js ile native entegrasyon, Vercel dashboard'da yönetim | Vercel'e bağımlılık |
| **Upstash Redis (direct)** | Platform bağımsız, ücretsiz tier | Ekstra konfigürasyon |
| **Planetscale / Neon (SQL)** | İlişkisel veri, raporlama | Over-engineering — $1.99 unlock için fazla |
| **Vercel Edge Config** | En hızlı okuma | Yazma API'si daha kısıtlı |

**Öneri: Upstash Redis** — `sessionId → SessionStatus` key-value çifti için yeterli. TTL: 30 gün.

### KV Şeması

```
Key:   session:{sessionId}
Value: { status: 'free' | 'paid', createdAt: ISO8601, paidAt?: ISO8601 }
TTL:   2592000 (30 gün)
```

---

## Client-Side Unlock Mekanizması

Ödeme tamamlandıktan sonra client'ın durumu öğrenmesi için iki yöntem:

### Yöntem 1 — Polling (Basit, Phase 3 başlangıcı)

```typescript
// useReadingSession.ts içinde
const pollForUnlock = async (sessionId: string) => {
  const interval = setInterval(async () => {
    const res = await fetch(`/api/session/${sessionId}/status`)
    const { status } = await res.json()
    if (status === 'paid') {
      clearInterval(interval)
      setSessionStatus('paid')  // unlockReveal animasyonu tetiklenir
    }
  }, 2000) // Her 2 saniyede bir kontrol
  
  // 5 dakika sonra timeout
  setTimeout(() => clearInterval(interval), 300000)
}
```

### Yöntem 2 — Lemon Squeezy Checkout Event (Daha İyi UX)

Lemon Squeezy'nin overlay checkout'u kapandığında bir event fırlatır. Bu event'i dinleyerek anında unlock yapılabilir:

```typescript
// PaywallCTA.tsx içinde
window.createLemonSqueezy()
window.LemonSqueezy.Setup({
  eventHandler: (event) => {
    if (event.event === 'Checkout.Success') {
      // Ödeme tamamlandı — webhook'u beklemeden optimistic unlock
      setSessionStatus('paid')
    }
  }
})
```

**Öneri:** İkisi birlikte kullanılacak — `Checkout.Success` anında UI'ı unlock eder, webhook arka planda KV'yi günceller.

---

## Framer Motion — Unlock Animasyonu

`src/styles/animations.ts` içinde tanımlı `unlockReveal` varyantı:

```typescript
export const unlockReveal: Variants = {
  locked: { filter: 'blur(6px)', opacity: 0.4 },
  unlocked: {
    filter: 'blur(0px)',
    opacity: 1,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
}
```

Kullanım — `src/components/reading/ReadingCard.tsx` içinde:

```tsx
<motion.div
  variants={unlockReveal}
  animate={sessionStatus === 'paid' ? 'unlocked' : 'locked'}
>
  {/* Tam Podomancy raporu */}
</motion.div>
```

---

## PaywallCTA Bileşeni (Phase 3)

`src/components/reading/PaywallCTA.tsx` olarak implemente edilecek.

**Görsel tasarım:**
- Kilitli içeriğin üzerine glassmorphism overlay
- Altın rengi gradient CTA butonu (pulse-gold animasyonu)
- Teaser içerik görünür, altında blur gradient
- Fiyat prominently gösterilir: **$1.99**
- Güven ifadeleri: "Secure checkout · Instant access · No subscription"

**Bileşen prop API'si:**

```typescript
interface PaywallCTAProps {
  paymentLink: string
  sessionId: string
  onUnlock: () => void   // status 'paid' olunca çağrılır
}
```

---

## Güvenlik Notları

1. **Webhook imza doğrulaması zorunlu** — `LEMONSQUEEZY_WEBHOOK_SECRET` olmadan hiçbir session unlock edilmez
2. **`full` içerik asla client'a `free` modda gönderilmez** — `/api/analyze` route'u `status` kontrolü yapar, sunucu tarafında filtreler
3. **SessionId tahmin edilemez olmalı** — `crypto.randomUUID()` veya `nanoid()` kullanılacak
4. **Webhook endpoint'i rate limit altında** — aynı sessionId için tekrarlayan webhook'lar idempotent işlenir

---

## Checkout URL Oluşturma

```typescript
// src/lib/payments.ts (Phase 3'te oluşturulacak)
export function buildCheckoutUrl(sessionId: string): string {
  const base = `https://checkout.lemonsqueezy.com/buy/${process.env.LEMONSQUEEZY_VARIANT_ID}`
  const params = new URLSearchParams({
    'checkout[custom][sessionId]': sessionId,
    'checkout[success_url]': `${process.env.NEXT_PUBLIC_APP_URL}/reading/${sessionId}?unlocked=1`,
  })
  return `${base}?${params.toString()}`
}
```

---

## Phase 3 Yapılacaklar Listesi

- [ ] Lemon Squeezy hesabı + ürün/varyant oluştur
- [ ] `.env.local` ortam değişkenlerini tanımla
- [ ] `src/lib/payments.ts` — checkout URL builder
- [ ] `src/lib/session-store.ts` — Upstash Redis KV adaptörü
- [ ] `GET /api/session/[sessionId]/status` — polling endpoint
- [ ] `POST /api/webhook/payment` — imza doğrulama + unlock mantığı implemente et
- [ ] `src/components/reading/PaywallCTA.tsx` — UI bileşeni
- [ ] Lemon Squeezy JS overlay entegrasyonu (`Checkout.Success` event)
- [ ] `unlockReveal` animasyonunu ReadingCard'a bağla
- [ ] Webhook test senaryosu (LS CLI ile lokal test)

---

## Stripe Alternatifi

Lemon Squeezy yerine Stripe kullanılmak istenirse:

| Değişen Şey | Lemon Squeezy | Stripe |
|---|---|---|
| Webhook header | `X-Signature` | `Stripe-Signature` |
| İmza kütüphanesi | `crypto.createHmac` | `stripe.webhooks.constructEvent()` |
| Checkout | `lemonsqueezy.com/buy/VARIANT` | Stripe Payment Link veya `stripe.checkout.sessions.create()` |
| Vergi yönetimi | Otomatik (MoR) | Manuel (`stripe-tax`) |
| Custom data | `checkout[custom][...]` | `metadata: { sessionId }` |

Temel akış değişmez — yalnızca provider-spesifik adaptör katmanı (`src/lib/payments.ts`) güncellenir.
