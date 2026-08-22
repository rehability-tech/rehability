# Baza testowa (branch Neona)

Projekt korzysta z Neona. Dotąd `npm run dev` i `prisma db push` celowały
w **bazę główną** — tę samą, na której stoi produkcja. Ten dokument opisuje,
jak pracować na osobnym branchu, żeby pomyłka schematu albo dane śmieciowe
nie dotknęły prawdziwych rezerwacji.

## Dlaczego nie wystarczy piaskownica

Piaskownica rabatów (`Trip.sandbox` / `Course.sandbox`) izoluje **tylko
promocje** i tylko przed oczami klienta. Nie chroni przed:

- pomyłką w schemacie (`db push` potrafi zaproponować skasowanie kolumn),
- danymi śmieciowymi — testowy wyjazd czy kurs to **prawdziwy rekord**,
- resetem bazy i testami automatycznymi,
- tym, że zakup w piaskownicy tworzy realny `Booking`/`CoursePurchase`
  i normalny PaymentIntent (blokady nie ma; ratują nas klucze `sk_test`).

Piaskownica i branch się uzupełniają: piaskownica = „przetestuj promocję na
żywym produkcie", branch = „możesz wszystko zepsuć".

## Jednorazowa konfiguracja

1. **Utwórz branch w Neonie** — panel → projekt → *Branches* → *New branch*.
   Nazwij np. `test`. Branch jest kopią schematu i danych, powstaje w sekundy
   i nie liczy się do limitu storage tak jak osobny projekt.

2. **Skopiuj connection string** — w widoku brancha *Connection string* →
   preset **Prisma**. Dopisz parametry puli, tak jak w `.env`
   (`&pgbouncer=true&connect_timeout=15&pool_timeout=15`), inaczej cold start
   Neona potrafi rzucić „Can't reach database server".

3. **Utwórz plik lokalny:**

   ```
   cp .env.neon-test.example .env.neon-test
   ```

   Wklej URL do `DATABASE_URL`. Plik jest w `.gitignore` — szablon
   (`.example`) jest w repo, sam plik z hasłem nie.

## Codzienna praca

| Komenda | Baza |
| --- | --- |
| `npm run dev` | **główna** (Neon, `.env`) |
| `npm run db:push` | **główna** |
| `npm run db:studio` | **główna** |
| `npm run dev:test` | branch testowy |
| `npm run db:test:push` | branch testowy |
| `npm run db:test:studio` | branch testowy |
| `npm run db:test:seed` | branch testowy — dane do klikania rabatów |
| `npm run db:test:reset` | branch testowy — **kasuje wszystko** i odtwarza schemat |

Rozdział jest **jawny**: komendy `:test` przechodzą przez
`scripts/with-env.mjs`, który nadpisuje środowisko plikiem `.env.neon-test`
i wypisuje, do czego się łączy. Nie ma tu żadnego automatycznego
nadpisywania — dlatego plik nazywa się `.env.neon-test`, a nie `.env.local`:
Next.js podnosiłby `.env.local` sam, z wyższym priorytetem niż `.env`, i wtedy
aplikacja gadałaby z branchem, a `prisma db push` z bazą główną.

Dodatkowo `src/lib/prisma.ts` wypisuje poza produkcją jedną linię:

```
[prisma] baza: ep-round-wildflower-....neon.tech/neondb
```

Jeśli szukasz danych, których „nie ma", zacznij od sprawdzenia tej linii.

### W pliku wystarczy DATABASE_URL

Sprawdzone empirycznie: `@next/env` **nie nadpisuje** zmiennych, które już są
w `process.env`. Wrapper wstrzykuje `DATABASE_URL` przed startem Nexta, więc
to on wygrywa, a wszystkie pozostałe sekrety (Stripe, NextAuth, Bunny…) Next
dociąga normalnie z `.env`.

Czyli w `.env.neon-test` trzymasz **wyłącznie** `DATABASE_URL`. Jeśli dopiszesz
tam coś jeszcze, to nadpisze wartość z `.env` — bywa przydatne (np. własny
`CRON_SECRET` do testów), ale nie jest wymagane.

## Dane testowe

`npm run db:test:seed` tworzy kurs `kurs-dev-testowy` (200 zł, **DRAFT**, więc
nie trafia do publicznego katalogu) i trzy promocje pokrywające wszystkie
reguły nakładania:

| Promocja | Efekt na 200 zł |
| --- | --- |
| `[DEV] Przecena -20%` (automat) | 160 zł |
| `DEV50` (−50%, nie łączy się) | 100 zł — wygrywa z przeceną |
| `DEVSTACK10` (−10%, łączy się) | 144 zł — 200 → 160 → 144 |

Skrypt jest idempotentny i **odmawia pracy**, gdy `DATABASE_URL` nie wygląda
na bazę testową. Obejście (świadome): `SEED_ALLOW_MAIN=1`.

## Migracje

Historia w `prisma/migrations/` jest niekompletna — `init` tworzy tylko
`Review`, resztę schematu zbudowano przez `db push`. Dlatego praktyczną
ścieżką jest `db push`, a nie `migrate deploy`. Pliki migracji trzymamy jako
przejrzany zapis zmian.

Kolejność przy zmianie schematu:

1. `npm run db:test:push` — sprawdź na branchu, przeczytaj ostrzeżenia,
2. przeklikaj aplikację na `npm run dev:test`,
3. dopiero potem `npm run db:push` na bazę główną.
