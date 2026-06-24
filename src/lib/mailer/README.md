# Moduł mailingowy (`src/lib/mailer`)

Samodzielny, **przenośny** silnik kampanii e-mail. Zaprojektowany tak, by można go
było wyjąć do innego projektu / produktu SaaS bez przepisywania logiki domenowej.

## Architektura (porty i adaptery)

```
                 ┌──────────────── RDZEŃ (przenośny 1:1) ───────────────┐
                 │  types.ts        — kontrakty (porty)                  │
                 │  campaigns.ts    — orkiestracja wysyłki (kolejka)     │
                 │  segments.ts     — logika segmentów                   │
                 │  unsubscribe.ts  — tokeny / podstawianie zmiennych    │
                 │  webhook.ts      — weryfikacja podpisu + parsing      │
                 └───────────────────────────────────────────────────────┘
                      ▲ MailRepository   ▲ MailProvider   ▲ RenderCampaign
   ┌──────────────────┴──────┐ ┌─────────┴───────┐ ┌──────┴──────────────┐
   │ repository/prisma.ts    │ │ provider/resend │ │ render.ts           │  ← ADAPTERY
   │ (storage)               │ │ (wysyłka)       │ │ (HTML z edytora)    │     (wymienne)
   └─────────────────────────┘ └─────────────────┘ └─────────────────────┘
                 config.ts (env) ─────────── index.ts (composition root)
```

**Rdzeń** zna wyłącznie abstrakcje z `types.ts`. Konkretne technologie (Prisma, Resend,
edytor maili) są wstrzykiwane jako adaptery. To pozwala podmienić storage/providera
bez dotykania logiki kampanii.

## Przeniesienie do innego projektu

Skopiuj cały folder `src/lib/mailer` i podmień **cztery** adaptery:

1. `repository/prisma.ts` — implementacja `MailRepository` na docelowej bazie.
2. `provider/resend.ts` — provider wysyłki (lub zostaw Resend).
3. `render.ts` — funkcja `RenderCampaign` (tu woła edytor maili Rehability).
4. `config.ts` / `index.ts` — źródło configu i sklejenie zależności.

Pliki `types.ts`, `campaigns.ts`, `segments.ts`, `unsubscribe.ts`, `webhook.ts`
przenoszą się bez zmian.

## Model wysyłki: kolejka + drainer

1. `enqueue(campaignId)` — materializuje odbiorców (`PENDING`) dla segmentu, status → `SENDING`.
2. `drain(campaignId, limit)` — wysyła jedną paczkę (Resend batch ≤100), wołane z API
   i z crona `/api/cron/mailer-drain`, aż 0 `PENDING` → `SENT`.

Dzięki temu duże listy nie biją w limit czasu funkcji serverless. Wszystko idempotentne.

## Zmienne środowiskowe

| Zmienna | Rola |
| --- | --- |
| `RESEND_API_KEY` | Klucz API Resend. Brak = wysyłka jako no-op (best-effort). |
| `EMAIL_FROM` | Nagłówek nadawcy, np. `Rehability <kontakt@domena.pl>` (zweryfikowana domena!). |
| `NEXT_PUBLIC_APP_URL` | Bazowy URL — linki wypisania i CTA. |
| `RESEND_WEBHOOK_SECRET` | Sekret webhooka (`whsec_…`) do weryfikacji podpisu Svix. Brak = webhook odrzuca żądania. |

## Integracja w tym projekcie

- Adapter źródeł kontaktów: [`src/lib/crm/contactSync.ts`](../crm/contactSync.ts)
  (Newsletter / Wyjazdy / VOD → tabela `Contact`).
- Webhook: `POST /api/webhooks/resend` (skonfiguruj URL w panelu Resend).
- Drainer: `GET|POST /api/cron/mailer-drain` (chroniony `CRON_SECRET`).
- Wypisanie: `/wypisz/[token]` (link w stopce każdej kampanii + nagłówek `List-Unsubscribe`).
- UI: `/admin/klienci/kampanie`.
