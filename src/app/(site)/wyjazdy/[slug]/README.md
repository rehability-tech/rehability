# `(site)/wyjazdy/[slug]` — Trip detail page & booking flow

Public-facing single trip page. Renders the trip content (saved by the admin
editor as a JSON block array) and hosts the booking flow.

## File map

```
[slug]/
├── page.tsx                       ← server entry; fetches trip, wires providers
├── README.md                      ← you are here
└── _components/
    ├── CampDetailHero.tsx         ← hero band (title, image, dates, seats)
    ├── CampBlockRenderer.tsx      ← renders trip.blocks JSON into UI
    ├── BookingOptionsCard.tsx     ← in-content card with Solo / Duo CTAs
    ├── CampBookingSidebar.tsx     ← sticky right-rail price + CTA
    ├── BookingContext.tsx         ← React context shared by all CTAs
    ├── BookingFlowSheet.tsx       ← modal/bottom-sheet checkout (2 steps)
    └── … (legacy: SingleTripHero, CampTabs, SingleCampForm, TripPageClient)
```

> The "legacy" components (older tab-style page) are still on disk but are
> **not** wired by `page.tsx`. Safe to delete once we're sure no other route
> imports them.

## Data flow

1. `page.tsx` fetches the trip from Prisma (`Trip` model, `blocks` JSON column).
2. It increments `views` and short-circuits with `notFound()` if the trip is
   not `PUBLISHED`.
3. The whole tree is wrapped in `<BookingProvider allowDuo={trip.allowBringFriend}>`.
4. **Content (`CampBlockRenderer`)** + **Sidebar (`CampBookingSidebar`)** are
   rendered side-by-side. Both can open the booking sheet.
5. **`<BookingFlowSheet />`** lives once at the page level — it reads
   `isOpen` / `mode` from the booking context.

## Block format (what the editor saves)

The admin editor at `/admin/wyjazdy/dodaj/edytor-tresci` saves each block as:

```ts
{ id: string; type: BlockType; content: { ... } }
```

Block types currently supported by `CampBlockRenderer`:

| `type`           | `content` shape                                           |
| ---------------- | --------------------------------------------------------- |
| `heading`        | `{ text: string /* HTML */ }`                             |
| `paragraph`      | `{ text: string /* HTML */ }`                             |
| `highlight`      | `{ text: string /* HTML */ }`                             |
| `spacer`         | `{}` — purely vertical breathing room                     |
| `bulletList`     | `{ items: { id, text }[] }`                               |
| `featuresGrid`   | `{ items: { id, icon, text }[] }`                         |
| `pricingList`    | `{ items: { id, name, price, duration }[] }`              |
| `faq`            | `{ items: { id, question, answer }[] }`                   |
| `inlineImage`    | `{ url, alt }`                                            |
| `videoEmbed`     | `{ url }` — YouTube watch / youtu.be / embed URLs         |
| `map`            | `{}` — uses `trip.mapUrl` from the row, not the block     |
| `bookingOptions` | `{ title, standardTitle, standardText, duoTitle, duoText }` |

If we add a new block type in the editor, add a `case` in
`CampBlockRenderer.tsx → BlockSwitch`.

## Booking flow

We have **two entry points** that both end up in the same modal:

1. **In-content card** (`BookingOptionsCard`) — only rendered if the editor
   inserted a `bookingOptions` block. Has two prominent CTAs: "Wybieram Solo"
   and "Zabieram przyjaciółkę".
2. **Sticky sidebar** (`CampBookingSidebar`) — always rendered. Shows price,
   dates, free seats, and a single "Zarezerwuj miejsce" CTA.

Click flow (either entry):

```
        ┌──────────────────────────┐
        │  openSheet(mode)         │  ← from card or sidebar
        └────────────┬─────────────┘
                     │
                     ▼
        ┌──────────────────────────┐
        │  Step 1 — Twoje dane      │
        │  name / email / phone     │
        │  (+ friend email if Duo)  │
        └────────────┬─────────────┘
                     │ "Dalej"
                     ▼
        ┌──────────────────────────┐
        │  Step 2 — Podsumowanie    │
        │  package, dates, price,   │
        │  deposit, terms checkbox  │
        └────────────┬─────────────┘
                     │ "Przejdź do płatności"
                     ▼
        ┌──────────────────────────┐
        │  Stripe Checkout         │  ← createCheckoutSession() (server action)
        └────────────┬─────────────┘
                     │ success
                     ▼
        ┌──────────────────────────┐
        │  /wyjazdy/sukces            │
        └──────────────────────────┘
```

### Why two-step instead of one big form

- **Reduces form anxiety**: only 3-4 inputs visible at once.
- **Lets the user audit before paying**: the summary step makes price,
  deposit and remaining balance crystal clear before Stripe takes over.
- **Easy to extend**: we can drop in additional steps (room preference,
  dietary needs, friend invite, etc.) without redesigning anything else.

### Why a modal sheet instead of inline

The previous design had `SingleCampForm` rendered inline below the sidebar
when the user clicked "Zarezerwuj". Two problems:

1. The form lived in the right rail — narrow column, awkward on mobile.
2. The user lost the content context: scroll position jumped, they couldn't
   re-check program/pricing while filling the form.

A modal sheet (centered on desktop, bottom-up on mobile) keeps the trip page
intact behind the form and feels familiar from other booking apps.

### Solo vs Duo state

`BookingContext` holds `mode` (`"solo" | "duo"`) globally. Wherever the user
clicks — card CTA, sidebar Solo/Duo toggle, sidebar button — the same value
flows into the sheet. The mode picker also lives inside the sheet so the
user can switch without closing it.

`allowDuo` is driven by `trip.allowBringFriend`. If the trip is solo-only,
the duo path is hidden everywhere (sidebar toggle, card column, sheet
switcher) and the context locks `mode = "solo"`.

## Open follow-ups

- `createCheckoutSession` (in `src/app/actions/stripe.ts`) currently accepts
  only `{ name, email, phone, tripId }`. It needs a `mode` / `friendEmail`
  argument to actually charge for two seats and email the friend an
  invitation link in duo mode. The sheet already collects `friendEmail` — we
  just need to pass it through.
- The legacy components (`SingleTripHero`, `CampTabs`,
  `SingleCampBlockNoteRenderer`, `TripPageClient`, `SingleCampForm`) are not
  wired anymore. Sweep them once we confirm no other route imports them.
- The `map` block reads `trip.mapUrl` from the row — make sure the editor
  saves a proper Google Maps `embed` URL there, otherwise we render a
  placeholder card.
