# Przewodnik: przyspieszenie indeksacji rehabilityprudnik.pl

> Stan wyjściowy (08.06.2026): 1 strona zindeksowana, 12 niezindeksowanych,
> z czego 10 w statusie „Strona wykryta – obecnie niezindeksowana".
> **WAŻNE (znalezione 14.06):** był konflikt domen — hosting serwuje treść na
> `www`, a kod (canonical/og:url/sitemap) wskazywał na wersję **bez www**, która
> przekierowuje (307) na www. Google widział sprzeczność → stąd statusy
> „przekierowanie" i „wykryta, niezindeksowana". **Naprawione w kodzie** (`PROD_URL`
> → www). Po wdrożeniu adresy kanoniczne to teraz wersje **z www**.
>
> Poza tym konfiguracja techniczna jest poprawna. Po deployu trzeba ponownie
> zgłosić sitemapę i poprosić o indeksację adresów **z www**.

---

## Jak czytać statusy w Google Search Console

| Status GSC | Co znaczy | Czy to problem? |
|---|---|---|
| **Strona wykryta – obecnie niezindeksowana** | Google zna URL z sitemapy, ale jeszcze go nie odwiedził/nie zindeksował | Nie — typowe dla nowej domeny. Trzeba „popchnąć" |
| **Strona zindeksowana, lecz nie przesłana w mapie** | OK, jest w indeksie | Nie |
| **Strona zawiera przekierowanie** | URL przekierowuje gdzie indziej, Google indeksuje cel | Sprawdź, czy przekierowanie jest zamierzone |
| **Alternatywna strona z prawidłowym tagiem kanonicznym** | Duplikat poprawnie wskazuje na oryginał | Nie — to działa jak należy |
| **Zindeksowano i przesłano w mapie** | Cel docelowy ✅ | Nie |

---

## CZĘŚĆ A — Działania na dziś (ok. 30 min)

### A1. Potwierdź, że sitemapa jest zatwierdzona
1. Wejdź na https://search.google.com/search-console → wybierz `rehabilityprudnik.pl`.
2. Menu boczne → **Mapy witryny** (Sitemaps).
3. Jeśli `sitemap.xml` nie ma na liście — wpisz `sitemap.xml` w polu i kliknij **Prześlij**.
4. Status musi być **Sukces** (Success) i pokazywać ~18 wykrytych adresów.
   - Jeśli widzisz błąd → napisz mi, sprawdzimy.

### A2. Ręcznie poproś o indeksację kluczowych stron
To najszybsza dźwignia. Rób **pojedynczo**, w tej kolejności (najważniejsze pierwsze):

1. `https://www.rehabilityprudnik.pl/`
2. `https://www.rehabilityprudnik.pl/gabinet`
3. `https://www.rehabilityprudnik.pl/wydarzenia`
4. `https://www.rehabilityprudnik.pl/o-nas`
5. Po kolei 4 wpisy blogowe (`https://www.rehabilityprudnik.pl/blog/...`)
6. Po kolei strony wydarzeń (`https://www.rehabilityprudnik.pl/wydarzenia/...`)

Dla każdego URL-a:
- Wklej adres w górny pasek **„Sprawdź dowolny URL"** w GSC.
- Poczekaj na test → kliknij **„Poproś o zindeksowanie"** (Request indexing).
- Limit ok. 10–12 zgłoszeń dziennie — jak się skończy, dokończ jutro.

> ⚠️ Nie zgłaszaj w kółko tej samej strony „na siłę" — Google to ignoruje.
> Jedno zgłoszenie na stronę wystarczy. Efekt: od kilku godzin do kilku dni.

### A3. Zidentyfikuj stronę z przekierowaniem
1. GSC → **Indeksowanie stron** → kliknij wiersz **„Strona zawiera przekierowanie"**.
2. Zobacz, który to URL i dokąd przekierowuje.
   - Jeśli to wariant techniczny (np. `www`→bez `www`, ukośnik na końcu) → **zostaw, jest OK**.
   - Jeśli to ważna strona przekierowująca w złe miejsce → napisz mi, poprawimy w kodzie.

---

## CZĘŚĆ B — Lokalne SEO (NAJWIĘKSZA dźwignia dla gabinetu)

Dla biznesu lokalnego („fizjoterapia Prudnik", „masaż Kobido Prudnik") to ma
większy wpływ na ruch niż cokolwiek innego — i przyspiesza indeksację strony.

### B1. Wizytówka Google (Google Business Profile)
1. Wejdź na https://business.google.com → utwórz/przejmij wizytówkę „Rehability Prudnik".
2. Uzupełnij dane spójnie ze stroną (są w `src/lib/seo/site.ts`):
   - **Nazwa:** Rehability Prudnik
   - **Adres:** ul. Piastowska 30, 48-200 Prudnik
   - **Telefon:** +48 693 537 543
   - **Kategoria:** Fizjoterapeuta + dodatkowe (Gabinet masażu, Dietetyk)
   - **Strona WWW:** https://www.rehabilityprudnik.pl
3. Przejdź weryfikację (kod pocztą / telefon / wideo).
4. Dodaj zdjęcia gabinetu, godziny otwarcia, opis usług.
5. Poproś pierwszych klientów o **opinie Google** (opinie = ranking lokalny + zaufanie).

> Link ze zweryfikowanej wizytówki GBP to jeden z najsilniejszych sygnałów
> dla świeżej domeny lokalnej. Często indeksuje stronę w kilka dni.

### B2. Linki z profili, które już istnieją
Upewnij się, że w każdym profilu jest klikalny link do `www.rehabilityprudnik.pl`:
- **Booksy** — link w opisie profilu.
- **Facebook** — pole „Strona internetowa" + post z linkiem.
- **Instagram** — link w bio (`@rehabilityprudnik`).

(Wszystkie 3 profile są już w konfiguracji strony — chodzi o odwrotny kierunek:
żeby one linkowały do strony.)

---

## CZĘŚĆ C — Budowanie sygnałów (działania ciągłe)

### C1. Treść blogowa = paliwo do indeksacji
- Masz 4 wpisy. Cel: **1 nowy wpis co 1–2 tygodnie**.
- Każdy wpis: min. 600–800 słów, unikalny, na frazę lokalną/problemową
  (np. „ból kręgosłupa Prudnik", „masaż Kobido efekty").
- Po publikacji → od razu zgłoś URL przez „Poproś o zindeksowanie" (jak w A2).
- Częste publikacje uczą Googlebota wracać częściej → szybciej łapie też resztę stron.

### C2. Linkowanie wewnętrzne
- Z każdego wpisu blogowego linkuj do `/gabinet` i `/wydarzenia` (anchor opisowy,
  np. „umów wizytę w gabinecie w Prudniku").
- Ze strony głównej musi być widoczny link do każdej ważnej podstrony
  (to już zwykle jest w nawigacji — warto potwierdzić, że żadna strona nie jest „sierotą").

### C3. Linki zewnętrzne (backlinki)
- Katalogi lokalne: Panorama Firm, Aleo, mapy lokalne, lokalne grupy FB.
- Współpraca/wymiana linków z lokalnymi biznesami (salon, dietetyk, klub fitness).
- Jakość > ilość. Unikaj spamerskich katalogów.

---

## CZĘŚĆ D — Monitoring (co tydzień, 5 min)

1. GSC → **Indeksowanie stron**: liczba „Zindeksowane" powinna rosnąć,
   „Strona wykryta – niezindeksowana" maleć.
2. GSC → **Skuteczność** (Performance): obserwuj wyświetlenia i kliknięcia
   (8 czerwca: 10 wyświetleń — to dobry start).
3. Co 1–2 tygodnie zgłaszaj ręcznie strony, które wciąż wiszą jako „wykryte".

---

## Checklista

- [ ] Sitemapa zatwierdzona w GSC (status: Sukces, ~18 URL)
- [ ] Poproszono o indeksację: `/`, `/gabinet`, `/wydarzenia`, `/o-nas`
- [ ] Poproszono o indeksację: 4 wpisy blog + strony wydarzeń
- [ ] Sprawdzono stronę „z przekierowaniem" (zamierzone czy nie)
- [ ] Wizytówka Google utworzona i zweryfikowana
- [ ] Link do strony dodany w Booksy / FB / IG
- [ ] Pierwsze opinie Google zbierane
- [ ] Plan: 1 wpis blogowy co 1–2 tygodnie
- [ ] Linkowanie wewnętrzne blog → /gabinet, /wydarzenia
- [ ] Cotygodniowy przegląd GSC

---

## Czego się spodziewać (realny timeline)

| Czas | Spodziewany efekt |
|---|---|
| 1–3 dni | Strony zgłoszone ręcznie zaczynają się indeksować |
| 1–2 tyg. | Większość 13 znanych stron w indeksie |
| 2–4 tyg. | Pierwsze stabilne wyświetlenia na frazy lokalne |
| 1–3 mies. | Wizytówka Google + opinie = realny ruch lokalny |

**Najważniejsze:** to nie jest awaria. Strona jest skonfigurowana dobrze —
potrzebuje czasu i sygnałów zaufania. Punkty A2 + B1 dają największe przyspieszenie.

---

## Automatyzacja powiadamiania wyszukiwarek (wdrożone w kodzie)

Po publikacji wpisu nie trzeba nic robić ręcznie dla większości wyszukiwarek:

- **Sitemap** jest dynamiczny — każdy opublikowany wpis pojawia się w `sitemap.xml`
  automatycznie. To standardowa droga dla **Google** (Google nie wspiera „pingów").
- **IndexNow** (standard wspierany przez Bing, Yandex, Seznam, DuckDuckGo…) odpala
  się automatycznie przy publikacji **wpisu i wydarzenia** — zarówno ręcznej (admin),
  jak i z harmonogramu (cron). Kod: `src/lib/seo/indexing.ts`, wpięty w
  `api/admin/blog/status`, `api/cron/blog/publish` oraz `api/admin/wydarzenia/status`
  (wydarzenia z `noIndex` są pomijane, spójnie z sitemap).
  - Klucz weryfikacyjny: `public/72c3a4e845c3dcd7e6269c73fbeb8a2b.txt`
    (dostępny pod `https://www.rehabilityprudnik.pl/72c3a4e845c3dcd7e6269c73fbeb8a2b.txt`).
  - Działa tylko na produkcji (na dev jest wyłączony).

**Czego to NIE robi:** nie powiadamia Google natychmiast — Google celowo nie
uczestniczy w IndexNow. Dla Google liczy się sitemap + linkowanie + czas.
Ręczne „Poproś o zindeksowanie" w GSC ma sens tylko teraz (świeża domena) lub dla
wyjątkowo ważnych stron — nie dla każdego wpisu.
