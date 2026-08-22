# System rabatowy (wyjazdy i kursy)

Rabaty na wydarzenia **oraz kursy VOD**: kody wpisywane w koszyku, przeceny
działające automatycznie i rabaty mailowe dla wskazanych adresów.

Promocja należy do **dokładnie jednego produktu** — wydarzenia (`Trip`) albo
kursu (`Course`) — i kasuje się razem z nim. Ten sam kod na wyjeździe i na
kursie to dwa osobne rekordy z osobnymi pulami użyć.

## 0. Co różni oba produkty

| | Wydarzenie | Kurs |
| --- | --- | --- |
| Płatność | zadatek + dopłata reszty | jednorazowa |
| Cena bazowa | `Trip.price` (`Decimal`, zł) | `Course.price` (`Int`, zł) |
| Zadatek | `Trip.deposit` | brak → `deriveDeposit` zwraca całość |
| Cennik testowy w piaskownicy | `sandboxPrice`/`sandboxDeposit` | brak — tryb izoluje tylko promocje |
| Snapshot | `Booking` | `CoursePurchase` |
| Panel | `/admin/wydarzenia/[id]/rabaty` | `/admin/kursy/[slug]/rabaty` |

Cała reszta — reguły nakładania, cykl życia, limity, piaskownica, statystyki,
komponenty panelu — jest **wspólna**. Trasy API obu produktów to cienkie
opakowania na `src/lib/discounts/adminHandlers.ts`, a panel to jeden komponent
`DiscountsPanel` sparametryzowany bazą tras.

> Uwaga o trasach: API kursu żyje pod `/api/admin/kursy/[id]/rabaty/...`,
> mimo że adresujemy kurs **slugiem**. Next.js nie pozwala na dwie różne nazwy
> parametru w tej samej ścieżce, a `/api/admin/kursy/[id]` istniało wcześniej.
> Dlatego `loadCourseForDiscounts` przyjmuje slug ALBO id.

## 1. Zasada architektoniczna

**Cena powstaje wyłącznie na serwerze.** Front dostaje gotowy obiekt i go
renderuje. Kod rabatowy przysłany z przeglądarki jest traktowany jako
**sugestia** — przy tworzeniu płatności cała wycena liczona jest od nowa z bazy
([create-payment-intent/route.ts](../src/app/api/bookings/create-payment-intent/route.ts)).

**Jedno wejście do wyceny:** `resolveCheckoutPricing`. Wołają je trzy ścieżki —
strona wydarzenia, podgląd kodu i tworzenie PaymentIntenta — więc podgląd
i realne obciążenie nie mogą się rozjechać.

| Warstwa | Pliki | Charakter |
| --- | --- | --- |
| Domena (czysta, bez Prismy) | `types.ts`, `calculatePrice.ts`, `deposit.ts`, `evaluate.ts`, `normalizeCode.ts`, `format.ts`, `clock.ts` | używalne też w komponentach klienckich |
| Serwer | `resolveCheckoutPricing.ts`, `sandbox.ts`, `registerDiscountUsage.ts`, `publishSandbox.ts`, `adminQueries.ts`, `adminWrite.ts` | Prisma + sesja |
| API | `bookings/validate-discount`, `bookings/create-payment-intent`, `webhooks/stripe`, `cron/rabaty/deactivate-expired`, `admin/wydarzenia/[id]/rabaty/*` | cienkie handlery |
| Panel | `src/app/admin/wydarzenia/[id]/rabaty/` | 4 zakładki, REST + `requireAdmin()` |

Wszystkie kwoty w **groszach**, waluta `pln` na sztywno.

> Uwaga na jednostki: `Trip.price` / `Trip.deposit` to `Decimal` w **złotówkach**,
> a `Booking.amountTotal` / `amountPaid` / `amountDeposit` to `Int` w **groszach**.
> Konwersja dzieje się w `resolveBasePrice` i nigdzie indziej.

## 2. Model danych

Trzy niezależne źródła obniżki, wszystkie o tym samym cyklu życia (`isActive`,
`validFrom`/`validUntil`, `usageLimit`/`usedCount`, `exhaustedNotifiedAt`,
`isSandbox`) i wszystkie z `tripId` (cascade):

| Model | Wyzwalacz | Typy wartości |
| --- | --- | --- |
| `DiscountCode` | wpisanie kodu w koszyku | `percent` / `amount` + flaga `stackableWithSale` |
| `Sale` | globalnie, automatycznie | `percent` / `fixed_price` (cena docelowa) |
| `EmailDiscount` + `EmailDiscountMember` | e-mail zalogowanej osoby na liście | `percent` / `amount` |

Piaskownica żyje na `Trip`: `sandbox`, `sandboxEnabledAt`, `sandboxPrice`,
`sandboxDeposit`. **Nie ma globalnego singletonu** — panel jest per-wydarzenie,
więc globalny przełącznik oznaczałby flagą zapisy w wydarzeniu B podczas
testowania wydarzenia A.

Dostęp do trybu nadaje się per konto przez `User.sandboxAccess`
(+ `sandboxGrantedAt`). Administrator ma dostęp **zawsze**, z racji roli —
ta flaga służy nadaniu go komuś, kto adminem nie jest.

Limity walidacji ([discountValidators.ts](../src/lib/zod/discountValidators.ts)):
kod 3–32 znaki `[A-Z0-9_-]` (normalizowany do UPPERCASE), procent 1–95%, kwota
1–1000 zł, cena docelowa ≥ 2 zł, limit użyć 1–100 000. Pola wartości wykluczają
się wzajemnie — przy zmianie typu nieużywane jest zerowane, żeby nie została
„sierota".

## 3. Reguły nakładania — `calculatePrice`

1. **Obniżki automatyczne nie sumują się.** Przecena i rabat mailowy (a także
   dwie przeceny naraz) **konkurują** — wygrywa najniższa cena końcowa. Remis
   rozstrzyga kolejność listy, którą serwer podaje deterministycznie:
   `[...przeceny, ...rabaty mailowe]`, każde po `createdAt` rosnąco.
2. Kod ze `stackableWithSale` nakłada się **sekwencyjnie** na wynik pkt 1 —
   liczy się od kwoty już obniżonej.
3. Kod bez zgody na łączenie **konkuruje** z wariantem automatycznym; wygrywa
   korzystniejszy. Warunek jest ostry (`soloFinal < automaticFinal`), więc przy
   **remisie kod przegrywa**. Wynik dostaje wtedy `couponOutranked = true`
   i koszyk pokazuje wyjaśnienie zamiast cicho ignorować kod.

**Niezmienniki każdego wyniku:** `Σ lines[].amount === totalDiscount`,
`baseAmount − totalDiscount === finalAmount`, `finalAmount ≥ 200 gr`. Przy zbyt
dużym rabacie kwota jest przycinana do progu Stripe, a rabat przeliczany wstecz.
Pozycje o zerowej wartości są odfiltrowane z `lines` — i **nie trafiają do
snapshotu**, więc przycięta do zera promocja nie zjada limitu użyć.

```
baza 109,00 zł, przecena −20%
kod −10%, stackable=false  →  87,20 zł   (wygrywa przecena, couponOutranked)
kod −30%, stackable=false  →  76,30 zł   (wygrywa kod)
kod −10%, stackable=true   →  78,48 zł   (87,20 − 10%)
```

## 4. Zadatek — proporcjonalnie

Płatność za wyjazd jest dwuetapowa. **Rabat obniża i cenę całkowitą, i zadatek
pobierany od razu** — inaczej „kod rabatowy", po którym kwota do zapłaty się nie
zmienia, wygląda jak zepsuty.

```
deposit = round(baseDeposit × finalTotal / baseTotal)
        → przycięty do finalTotal
        → podniesiony do 200 gr (minimum Stripe)
        → jeśli reszta wyszłaby 1–199 gr, pobieramy CAŁOŚĆ jedną wpłatą
```

Ostatnia reguła jest istotna: bez niej rezerwacja utknęłaby na zawsze
w `DEPOSIT_PAID` z dopłatą, której Stripe nie przyjmie. Webhook wykrywa taką
wpłatę (`paidNow >= amountTotal`) i od razu ustawia `FULLY_PAID`.

Przykład (cena 2 000 zł, zadatek 500 zł, przecena −20%, kod −10% stackowalny):
`finalAmount = 1 440 zł`, zadatek `360 zł` zamiast 500 zł.

## 5. Przepływ

```
Trip.price (+ sandboxPrice dla admina w piaskownicy)
     ↓ baseAmount (grosze)
resolveCheckoutPricing:  czynne Sale (isActive w SQL + evaluateDiscount w kodzie),
                         EmailDiscount dopasowane po members.email, kod z koszyka
     ↓
calculatePrice → PriceResult { baseAmount, lines[], totalDiscount, finalAmount, couponOutranked }
     ↓ deriveDeposit
/wydarzenia/[id]  ·  /api/bookings/validate-discount  ·  /api/bookings/create-payment-intent
     ↓
Stripe PaymentIntent (zadatek) + snapshot na Booking
```

**Uwaga UX:** PaymentIntent powstaje przy przejściu z podsumowania do płatności,
a jego kwoty nie da się zmienić. Dlatego każda zmiana kodu czyści `clientSecret`
i cofa na podsumowanie ([TripBookingForm.tsx](../src/app/\(site\)/wydarzenia/[slug]/_components/TripBookingForm.tsx)).
To zabezpieczenie jest wyłącznie UX-owe — serwer i tak przelicza wycenę.

## 6. Piaskownica

Przełącznik per wydarzenie (`Trip.sandbox`). Dostęp (`viewerCanUseSandbox`),
w tej kolejności:

1. rola `ADMIN` — zawsze,
2. `User.sandboxAccess` — dostęp nadany per konto komuś spoza adminów,
3. poza produkcją także konta `@local.dev` (mock-login z DEV-owej karty).

Flaga jest czytana z bazy przy każdym żądaniu (callback `jwt` w
[auth.ts](../src/lib/auth/auth.ts)), więc odebranie dostępu działa od razu —
nie czeka na wygaśnięcie tokena.

**Semantyka:** nie wyłącza trwających promocji, tylko izoluje to, co w niej
powstanie. Każdy zapis przy włączonym trybie — łącznie z samym przełącznikiem
aktywności — ustawia `isSandbox = true` (pilnuje tego `withSandboxFlag`).
Filtrowanie odbywa się **w zapytaniu do bazy** (`sandboxFilter`), nie w widoku;
kod z piaskownicy zwraca klientowi `not_found`, żeby testowa nazwa nie wyciekła.

Dwa wyjścia:

- **„Opublikuj i wyłącz"** — jedna transakcja: zdejmuje `isSandbox` z trzech
  tabel i przepisuje cenę testową na cennik (czyszcząc pola testowe).
- **„Wyłącz bez publikacji"** — gasi sam przełącznik; promocje zostają szkicami.

Rezerwacje z `Booking.isSandbox`: nie liczą się do statystyk i nie konsumują
limitów.

## 7. Limity użyć

`usedCount` rośnie dopiero po `payment_intent.succeeded`, przez wspólne
`registerDiscountUsage` dla wszystkich trzech typów. Porzucone koszyki nie
zjadają puli.

Powiadomienie o wyczerpaniu idzie **dokładnie raz** — prawo do wysyłki rezerwuje
atomowy `updateMany` po `exhaustedNotifiedAt: null`. Podniesienie limitu kasuje
ten znacznik.

Limit jest **miękki**: przy 19/20 dwie równoległe płatności obie przejdą
i licznik dobije 21. Świadomy kompromis — twardy limit wymagałby rezerwacji
miejsca na czas checkoutu. Panel pokazuje `21 / 20` bez przycinania liczby.

## 8. Snapshot i statystyki

`Booking` zapisuje stan z momentu zakupu, nie referencję: `originalAmount`,
`totalDiscountAmount`, `discountCode`/`discountCodeAmount`/`discountCodeId`,
`saleName`/`saleAmount`/`saleId`, `emailDiscountName`/`emailDiscountAmount`/`emailDiscountId`.
Bez kluczy obcych — usunięcie promocji nie narusza historii.

Dodatkowo `amountDeposit` trzyma **zadatek po rabacie**. Bez tego pola
`resume-payment` policzyłby zadatek na nowo z `trip.deposit` i obciążył pełną
kwotą, kasując udzielony rabat.

Statystyki w panelu wiążą **wszystko po ID** (nie po nazwie), więc zmiana nazwy
przeceny nie resetuje jej statystyki. Promocje skasowane, ale obecne w historii,
renderują się z nazwy ze snapshotu z plakietką „usunięta".

## 9. Cron

`GET|POST /api/cron/rabaty/deactivate-expired`, `Authorization: Bearer <CRON_SECRET>`,
sugerowane `45 3 * * *`. Wyłącza przeterminowane kody, przeceny i rabaty mailowe.

To **wyłącznie porządek w panelu** — egzekwowanie terminu dzieje się przy każdym
użyciu w `evaluateDiscount`. `validUntil` obowiązuje włącznie, do 23:59:59.999
czasu polskiego (`endOfTripDay`), więc cron nie gasi promocji rankiem jej
ostatniego dnia.

## 10. Bezpieczeństwo

- Wszystkie akcje panelu przez `requireAdmin()` (rola z sesji NextAuth).
- `/api/bookings/validate-discount` wymaga zalogowania + rate limit 10/min/konto —
  endpoint jest wprost narzędziem do zgadywania kodów. Limiter jest w pamięci
  procesu, więc na serverless działa per instancja
  ([rate-limit.ts](../src/lib/rate-limit.ts)).
- Każde chybienie kodu zwraca jednolite `not_found` — nie rozróżniamy kodu
  nieistniejącego, z innego wydarzenia i z piaskownicy.
- Webhook weryfikuje podpis Stripe i **loguje głośno** rozjazd kwot
  (`paidNow !== expected`), ale nie blokuje — pieniądze wpłynęły, trzeba je
  zaksięgować.
- Idempotencja webhooka po statusie rezerwacji; `registerDiscountUsage` woła się
  przez `.catch`, żeby błąd powiadomienia nie wywołał redeliverki Stripe.
- Usunięcie promocji z historią → 409; zostaje sama dezaktywacja.
- Cały czas domeny rabatów przez `now()` z [clock.ts](../src/lib/discounts/clock.ts),
  nigdy `new Date()`. `NEXT_PUBLIC_DEV_TODAY` przesuwa samą datę, tylko poza produkcją.

## 11. Testy

`npm test` (vitest). Pięć plików, 80 przypadków:

- `discounts.calculatePrice.test.ts` — reguły nakładania, remisy, clamp do progu
  Stripe, trzy przykłady referencyjne. Helper `expectInvariants` sprawdza trzy
  niezmienniki na **każdym** wyniku.
- `discounts.deposit.test.ts` — proporcja, próg, scalanie nieściągalnej reszty.
- `discounts.evaluate.test.ts` — cykl życia, granica `validUntil` po obu stronach
  północy.
- `discounts.resolveCheckoutPricing.test.ts` — filtr piaskownicy w zapytaniu,
  normalizacja kodu, mapowanie snapshotu (Prisma mockowana).
- `discounts.registerDiscountUsage.test.ts` — naliczanie limitów, jednorazowe
  powiadomienie, pomijanie piaskownicy. Pilnuje też, że `select` pasuje do
  modelu (`code` vs `name`) — pomyłka tutaj wywraca cały `update`, więc licznik
  cicho przestałby rosnąć.

## 12. Znane ograniczenia

| # | Rzecz | Status |
| --- | --- | --- |
| 1 | Miękki limit użyć — przekroczenie o 1–2 przy równoległych płatnościach. Warto pamiętać przy promocji „pierwsze 10 osób". | z założenia |
| 2 | Rate limiter w pamięci procesu — na serverless limit jest per instancja. Twardy wymaga Redisa. | świadomy kompromis |
| 3 | Kod stosuje się tylko do osoby, która go wpisała. Rezerwacja osoby towarzyszącej (`PENDING_INVITATION`) dostaje wyłącznie promocje automatyczne i jest przewyceniana przy przejęciu zaproszenia. | z założenia |
| 4 | Historia migracji w `prisma/migrations/` jest niekompletna (init tworzy tylko `Review`; reszta schematu powstała przez `db push`). Migracja `20260807120000_add_discount_system` jest poprawna, ale na tym repo praktyczną ścieżką jest `npm run db:push`. | dług sprzed tej zmiany |
| 5 | `Course.sandbox` istnieje w schemacie i bazie, ale VOD go nie używa — czeka na analogiczny tryb testowy po stronie kursów. System rabatowy korzysta wyłącznie z `Trip.sandbox`. | świadomie zostawione |
| 6 | Nadanie `User.sandboxAccess` wymaga na razie ręcznej zmiany w bazie — nie ma jeszcze przełącznika w panelu admina. | do dorobienia |
| 7 | Snapshot rabatu kursu przechodzi przez **metadata PaymentIntenta** (`CoursePurchase` powstaje dopiero w webhooku). Stripe ma limit 50 kluczy, więc zapisujemy tylko pola realnie użyte. Przy rozbudowie snapshotu trzeba pamiętać o tym limicie. | z założenia |
| 8 | Kopiowanie promocji (`/kopiuj`) działa na razie tylko między wydarzeniami — modal pobiera listę z `/api/admin/wydarzenia`. Dla kursów przycisk jest widoczny, ale lista celów będzie pusta. | do dorobienia |

## 13. Kurs testowy (dev)

W bazie jest kurs `kurs-dev-testowy` („[DEV] Kurs testowy — rabaty", 200 zł,
PUBLISHED) z gotowymi promocjami do klikania:

| Promocja | Wartość | Uwaga |
| --- | --- | --- |
| `DEV50` | −50% | nie łączy się z przeceną — wygrywa z nią (100 zł) |
| `DEVSTACK10` | −10% | **łączy się** z przeceną → 200 → 160 → 144 zł |
| `[DEV] Przecena -20%` | −20% | automatyczna, bez kodu → 160 zł |

Zweryfikowane na prawdziwej bazie: 160 / 100 / 144 zł, reszta do dopłaty zawsze
0 (płatność jednorazowa), zły kod → `not_found`.
