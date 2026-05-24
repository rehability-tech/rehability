# Projekt: Rehability - Platforma Campów i VOD

## Rola AI

Jesteś ekspertem od Next.js (App Router), TypeScript, Tailwind CSS, Prisma oraz PWA. Budujemy Panel Uczestniczki Campa oraz panele administracyjne.

## 🎨 System Designu i Layout

1. **Kolorystyka:**
   - Tekst/Nagłówki: `var(--color-secondary)` lub `text-[#033f63]`.
   - Akcenty/Przyciski: `var(--color-primary)` lub `bg-[#287d88]`.
   - Żółty akcent: `var(--color-yellow)` / `#f2d967`.
2. **Znak Rozpoznawczy 1 (Efekty Premium & Glow):**
   - W panelach, nawigacjach i głównych UI stosujemy **jasny Glassmorphism** (np. `bg-white/20 backdrop-blur-2xl border-white/40`).
   - **Aktywne elementy (buttony, linki w menu):** Zawsze łączą morskie tło (`bg-brand-primary`) z czysto białymi ikonami/tekstem.
   - Koniecznie muszą posiadać **słoneczną, żółtą poświatę** (np. `shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)]` oraz subtelny `border-brand-yellow/30`).
   - Wewnątrz aktywnych komponentów często umieszczamy absolutnie pozycjonowaną, żółtą, rozmytą kulkę (np. `bg-brand-yellow/50 blur-[10px]`) w prawym dolnym rogu, aby wzmocnić blask.
3. **Znak Rozpoznawczy 2 (Kształt "Kropli"):**
   - Wszystkie główne karty/boksy na dashboardzie mają klasy: `rounded-3xl rounded-tr-none`.
4. **Architektura Layoutu (Responsive App Shell):**
   - **Desktop (`md:` / `lg:`):** Używamy bocznego menu (Sidebar) oraz Topbaru w stylu naszego panelu Admina.
   - **Mobile:** Używamy bardzo płynnego, przyklejonego do dołu paska nawigacji (Native-like Bottom Bar).
5. **Komponenty:** UI to zawsze `"use client"`. Używamy Phosphor Icons (`@phosphor-icons/react/dist/ssr`).

## 🗄️ Kontekst Bazy Danych (Prisma)

Znamy schemat bazy:

- `Booking` łączy się z `User` i ma pole `status` (np. `DEPOSIT_PAID`, `FULLY_PAID`).
- Karta Zdrowia: Model `HealthProfile` przypisany do `User` (1:1).
- Usługi SPA: Model `Camp` ma `services` (`CampService`). Użytkownik rezerwuje `ServiceSlot` tworząc `ServiceOrder`.

## 🚀 Cel: Panel Uczestniczki (PWA) -> `/panel/campy/[bookingId]`

Klientka trafia tutaj po opłaceniu zadatku na stronie publicznej z parametrem `?status=success`.

**Kolejność wdrożenia:**

1. Layout (Sidebar Desktop / Bottom Bar Mobile).
2. Dashboard (Odliczanie do wyjazdu, Moduł wpłaty reszty kwoty oparty o `Booking.amountPaid` i nową sesję Stripe).
3. Modale powitalne (Sukces wpłaty, instalacja PWA).
4. Karta Zdrowia (zapis do `HealthProfile`).
5. Moduł Usług SPA (pobieranie `CampService`, rezerwacja slotów w `ServiceOrder`).
