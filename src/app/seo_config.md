# Konfiguracja SEO – Rehability Prudnik

Poniżej znajduje się lista informacji potrzebnych do zbudowania pełnego kontekstu dla AI i stworzenia idealnej konfiguracji SEO (Metadata, OpenGraph, LocalBusiness JSON-LD) w Next.js.

## 1. Kontekst Biznesowy i Marka (Wizytówka)

- **Główna działalność:** Czym dokładnie zajmuje się Rehability Prudnik? (np. organizacja wyjazdów SPA dla kobiet, turnusy rehabilitacyjne, fizjoterapia stacjonarna).
  - > **Odpowiedź:** **Rehability Prudnik (Rehability Piotr Siemaszko)** to nowoczesne centrum zdrowia i regeneracji, którego działalność opiera się na trzech silnych filarach:
  - >
  - > 1. **Usługi stacjonarne (Gabinet w Prudniku):** Specjalistyczna fizjoterapia, terapia manualna, diagnostyka USG (USG-RUSI), rehabilitacja przed- i pooperacyjna oraz dietetyka. Świadczymy również szeroki wachlarz masaży leczniczych i relaksacyjnych (m.in. MTG, masaż sportowy, japoński masaż twarzy Kobido, masaż ajurwedyjski, praca bańką chińską i gorącymi kamieniami).
  - > 2. **Wydarzenia i wyjazdy holistyczne (Campy):** Organizacja zorganizowanych wyjazdów typu SPA/Wellness, łączących fizjoterapię, aktywność fizyczną i medytację, ukierunkowanych na głęboką regenerację i poprawę dobrostanu uczestników.
  - > 3. **Edukacja i produkty cyfrowe (Sklep/VOD):** Sprzedaż materiałów edukacyjnych (np. autorski e-book "Guidebook Podstaw Treningu Siłowego") oraz prowadzenie szkoleń z zakresu fizjoterapii i treningu. Ten segment docelowo zostanie przekształcony w pełnoprawną platformę VOD z kursami online.

* **Grupa docelowa (Persona):** Do kogo kierujemy stronę?
  - > **Odpowiedź:** Ze względu na zróżnicowany profil działalności, naszą grupę docelową dzielimy na trzy główne segmenty (persony):
  - >
  - > 1. **Pacjenci lokalni (Gabinet stacjonarny):** Osoby z Prudnika, okolic oraz całego woj. opolskiego. Z jednej strony są to pacjenci bólowi, ortopedyczni i pourazowi szukający skutecznej fizjoterapii medycznej. Z drugiej – osoby dbające o profilaktykę, zdrowie i urodę (np. masaż Kobido, masaże relaksacyjne), a także sportowcy potrzebujący szybkiej regeneracji.
  - > 2. **Uczestnicy wyjazdów (Campy holistyczne):** Zarówno kobiety, jak i mężczyźni (najczęściej w wieku 25-55 lat) z całej Polski (ze szczególnym uwzględnieniem dużych aglomeracji oraz woj. opolskiego, śląskiego i dolnośląskiego). Choć organizujemy edycje tematyczne (np. dedykowane tylko kobietom), główna oferta wyjazdów skierowana jest do wszystkich osób przebodźcowanych, zmęczonych codziennym pędem, które szukają kompleksowego „resetu”, redukcji stresu oraz zadbania o ciało i umysł pod okiem profesjonalistów.
  - > 3. **Osoby aktywne i początkujące w treningu (Edukacja/VOD):** Kobiety i mężczyźni z całej Polski, którzy chcą mądrze i bezpiecznie rozpocząć przygodę z aktywnością fizyczną (odbiorcy "Guidebooka Podstaw Treningu Siłowego") lub poszerzyć swoją wiedzę. Szukają sprawdzonych metod treningowych stworzonych przez doświadczonego fizjoterapeutę, aby uniknąć błędów i kontuzji.

* **Unikalna Propozycja Wartości (USP):** Co wyróżnia Was na tle konkurencji?
  - > **Odpowiedź:** Naszą największą przewagą jest **medyczny fundament w świecie wellness i treningu** oraz **holistyczne podejście 360 stopni do zdrowia**.
  - >
  - > 1. **Bezpieczeństwo i profesjonalizm:** W przeciwieństwie do ofert zwykłych ośrodków SPA, trenerów personalnych czy influencerów, wszystkie nasze usługi (wyjazdy, e-booki treningowe, VOD) są projektowane przez wykwalifikowanych fizjoterapeutów. Daje to klientom gwarancję, że pracują z ciałem mądrze i bezpiecznie.
  - > 2. **Kompleksowość (360 stopni):** Nie jesteśmy tylko gabinetem, który "naprawia ból i mówi do widzenia". Prowadzimy pacjenta przez pełen proces: od precyzyjnej diagnostyki (np. nowoczesne USG-RUSI w gabinecie), przez naukę bezpiecznego ruchu (edukacja i materiały VOD), aż po głęboką regenerację układu nerwowego i redukcję stresu (wyjazdy holistyczne).
  - > 3. **Zacieranie granic między leczeniem a relaksem:** Udowadniamy, że profesjonalna fizjoterapia może iść w parze z luksusową odnową biologiczną (masaż Kobido, gorące kamienie, relaks na campach).

* **Zasięg:** Działacie tylko lokalnie w Prudniku i okolicach, czy celujecie w klientów z całej Polski?
  - > **Odpowiedź:** Nasz zasięg działania jest dwutorowy i zależy od konkretnego filaru biznesu:
  - >
  - > 1. **Zasięg lokalny (Local SEO):** Usługi stacjonarne gabinetu (fizjoterapia, diagnostyka USG, masaże lecznicze i relaksacyjne) kierujemy do mieszkańców Prudnika, okolicznych miejscowości oraz szerzej – do pacjentów z całego województwa opolskiego.
  - > 2. **Zasięg ogólnopolski:** Organizacja wyjazdów holistycznych (Campów) oraz segment edukacyjny (sprzedaż e-booków, platforma VOD, szkolenia) są skierowane do klientów z całej Polski. W tym przypadku zależy nam na widoczności w wynikach ogólnokrajowych, budowaniu społeczności online oraz docieraniu do osób poszukujących turystyki wellness i rzetelnej wiedzy treningowo-fizjoterapeutycznej, niezależnie od ich miejsca zamieszkania.

---

## 2. Mapa Strony (Struktura Aplikacji)

Mapa wygenerowana automatycznie z routów w `src/app/(site)/`. Obejmuje **wyłącznie publiczne, indeksowalne strony frontowe** — pominięto `admin/*`, `panel/*` (chronione sesją), `api/*`, `/logowanie` (auth) oraz `/w-budowie` (placeholder, `noindex`).

### Strony statyczne (główne)

- [x] `/` - Strona główna
- [x] `/o-nas` - Informacje o zespole, misja, wartości
- [x] `/gabinet` - Oferta gabinetu w Prudniku (fizjoterapia, masaże, dietetyka)

### Sekcja: Wyjazdy / Campy

- [x] `/wyjazdy` - Lista wszystkich opublikowanych wyjazdów (paginacja)
- [x] `/wyjazdy/[slug]` - Dynamiczna strona konkretnego wyjazdu (jeden URL per wyjazd ze statusem `PUBLISHED`)

### Sekcja: Blog

- [x] `/blog` - Lista artykułów
- [x] `/blog/[blogSlug]` - Pojedynczy artykuł (jeden URL per post ze statusem `PUBLISHED`)

### Strony prawne (zwykle z `noindex` lub niskim priorytetem w sitemap)

- [x] `/polityka-prywatnosci` - Polityka prywatności
- [x] `/regulamin` - Regulamin serwisu

### Brakuje (do utworzenia, gdy będzie content)

- [ ] `/kontakt` - Dane kontaktowe i formularz (obecnie brak strony — kontakt dostępny tylko w stopce / na `/o-nas`?)

### Pominięte celowo (niewidoczne dla Google)

| Ścieżka      | Powód                                                  |
| ------------ | ------------------------------------------------------ |
| `/logowanie` | Strona autoryzacji — `noindex`, brak wartości SEO      |
| `/w-budowie` | Placeholder dla niegotowych funkcji — `noindex`        |
| `/admin/*`   | Panel administratora — chroniony rolą ADMIN, `noindex` |
| `/panel/*`   | Panel uczestniczki PWA — chroniony sesją, `noindex`    |
| `/api/*`     | Endpointy REST — nie strony HTML, nie indeksuje się    |

### Wnioski dla sitemap.xml

- **Statyczne URL-e** (`/`, `/o-nas`, `/gabinet`, `/wyjazdy`, `/blog`, `/polityka-prywatnosci`, `/regulamin`) — wygenerować jednorazowo, `changefreq: monthly`.
- **Dynamiczne URL-e** (`/wyjazdy/[slug]`, `/blog/[blogSlug]`) — generować runtime przez `generateSitemaps()` w Next.js z DB (filtr `status: "PUBLISHED"`), `changefreq: weekly` dla bloga / `monthly` dla wyjazdów.
- W `robots.txt` jawnie zablokować `/admin/`, `/panel/`, `/api/`, `/logowanie`, `/w-budowie`.

---

## 3. Słowa Kluczowe (Keywords)

- **Główne frazy (3-5 najważniejszych):** Po wpisaniu jakich słów w Google klient ma Was znaleźć?
  1. Fizjoterapia Prudnik
  2. Masaż Kobido Prudnik
  3. Wyjazdy holistyczne
  4. Trening siłowy dla kobiet w domu
  5. Masaż tkanek głębokich Nysa

- **Długie ogony (Long-tail keywords) na bloga:** Czego mogą szukać w Google Wasi klienci?
  - > **Odpowiedź:** "Ćwiczenia na ból lędźwi w domu", "Masaż kobido co to jest i jakie daje efekty?", "Ile kosztuje wyjazd holistyczny do SPA?", "Czy trening siłowy jest bezpieczny w ciąży?", "Rwa kulszowa leczenie i ćwiczenia".

---

## 4. Techniczne detale dla Next.js

- **Nazwa aplikacji (Sufix Tytułu):** Krótka nazwa do doklejania w zakładce przeglądarki.
  - > **Odpowiedź:** " | Rehability Prudnik" (lub opcjonalnie " | Rehability Piotr Siemaszko")

- **Domyślne zdjęcie OpenGraph:** Czy masz link do domyślnego zdjęcia, które będzie się wyświetlać, gdy ktoś udostępni link?
  - > **Odpowiedź:** W Next.js ustawimy to jako plik lokalny, np. `/images/og-default.jpg`. Najlepiej przygotować zdjęcie w proporcjach 1200x630 pikseli (idealne będzie np. to ładne, jasne zdjęcie profilowe Piotra ze zrzutu z Booksy, albo grupowe zdjęcie całego zespołu w gabinecie).

- **Social Media:** Linki do Waszych profili społecznościowych (wykorzystamy je do ustrukturyzowanych danych JSON-LD).
  - **Facebook:** https://www.facebook.com/profile.php?id=61555623812761
  - **Instagram:** https://www.instagram.com/rehabilityprudnik
  - **Booksy:** https://booksy.com/pl-pl/293064_rehability-piotr-siemaszko_fizjoterapia_13658_prudnik

- **Dane firmy (Local SEO):** Niezbędne do wygenerowania tagów LocalBusiness, które windują stronę w Google Maps.
  - **Pełny adres:** ul. Piastowska 30, 48-200 Prudnik
  - **NIP:** 7551941564
  - **Telefon:** +48 693 537 543
  - **Adres e-mail:** piotrsiemaszko.fizjo@gmail.com

[ ] Utworzyć profil klienta (Karta 360°): Zaimplementować widok src/app/admin/klienci/[id]/page.tsx w celu wyeliminowania błędu 404 po kliknięciu "szczegóły" w tabeli CRM.

[ ] Ujednolicić routing uczestników: Zaktualizować plik TripParticipantsList.tsx (linia 355). Zmienić ścieżkę z niedziałającego .../rezerwacja/${id} na poprawny endpoint .../uczestnicy/${id}.

[ ] Wdrożyć konfigurację SEO: Wykorzystać dane z seo_config.md do utworzenia dynamicznych generacji Metadata (OpenGraph), pliku sitemap.ts oraz wstrzyknięcia struktury JSON-LD (LocalBusiness)

Oto kompletny, wysokopoziomowy plan architektury platformy VOD, wolny od "rzeźbienia" w infrastrukturze (co zniechęciło Cię w Bunny.net), zorientowany na maksymalną wydajność, bezpieczeństwo i niski koszt utrzymania.

1. Architektura Wideo (Ingest & Transcoding)
   Problem z Bunny/S3: Konieczność ręcznego transkodowania plików, zarządzania webhookami i tworzenia własnego potoku HLS (HTTP Live Streaming).

Rozwiązanie: Używamy wyspecjalizowanego API wideo (np. Mux.com lub AWS IVS).

Flow:

Admin pobiera z naszego serwera Direct Upload URL.

Wideo leci z przeglądarki Admina bezpośrednio do dostawcy wideo (omija nasz serwer Next.js = brak limitów payloadu).

Dostawca automatycznie optymalizuje wideo do HLS (Adaptive Bitrate - jakość dostosowuje się do internetu klienta).

Webhook dostawcy puka do naszego endpointu /api/webhooks/video z informacją "Ready", a my zapisujemy w bazie playbackId.

2. Zabezpieczenie Treści (Anti-Piracy & Auth)
   Surowe pliki .mp4 to proszenie się o piractwo.

Streaming HLS: Dzieli wideo na 10-sekundowe segmenty (.ts) i podaje je przez plik manifestu (.m3u8).

Signed URLs (Tokeny JWT):

Użytkownik wchodzi na lekcję.

Next.js weryfikuje sesję i relację Purchase w bazie.

Zamiast publicznego ID wideo, serwer generuje krótkoterminowy token JWT (np. ważny 12 godzin) podpisany kluczem prywatnym.

Frontend podaje ten token do odtwarzacza. Bez tokena serwer wideo odrzuca żądanie.

Zabezpieczenia domeny (CORS): Konfiguracja po stronie dostawcy wideo wymuszająca renderowanie odtwarzacza wyłącznie na Twojej domenie (np. rehability.pl).

3. Logika Biznesowa (Backend Next.js & Prisma)
   Platforma VOD opiera się na 3 filarach w bazie danych:

Struktura (Hierarchy): Course -> Chapter -> Lesson (z polem playbackId).

Uprawnienia (Access Control): Tabela Purchase łącząca User i Course. Logika "Gatekeepera" na każdym endpoincie uderzającym po klucz do wideo.

Telemetria (Progress Tracking): Tabela UserProgress (z polami watchTime i isCompleted).

Optymalizacja: Zamiast uderzać do bazy w czasie rzeczywistym, gdy klient ogląda wideo, na froncie zbieramy interwały (np. co 15 sekund) i wysyłamy zbuforowany update (debounced fetch) do bazy.

4. Player na Froncie (UX)
   Komponent: Gotowy wrapper Reactowy dostawcy (np. @mux/mux-player-react), który "pod maską" ogarnia skomplikowaną logikę buforowania, zmiany rozdzielczości i zmiany prędkości odtwarzania.

Eventy: Podpięcie do hooków playera:

onTimeUpdate -> aktualizacja lokalnego stanu i rzadszy zrzut do bazy (funkcja resume watching).

onEnded -> oznaczenie lekcji jako zaliczonej, odpalenie konfetti (Framer Motion) i auto-play kolejnego wideo.

5. Strategia kosztowa
   Własny VOD na AWS S3 + MediaConvert jest tani w storage'u, ale drogi we wdrożeniu i w transferze CDN. Platformy typu Mux kosztują dosłownie grosze za minutę przetworzonego i dostarczonego wideo. Twój zarobek na jednym kursie VOD z nawiązką pokrywa roczne koszty hostingu tysięcy minut dla tego usera.

Daj znać, kiedy będziesz gotowy przejść z tej logiki na kod – zaczniemy od modeli bazy i Gatekeeper API.

Co dokładnie się wydarzyło:
Odporna architektura (Fallback): Wdrożył system, który w przypadku blokady ze strony Google Trends (częsty problem) płynnie przechodzi na zapisane na sztywno, zapasowe tematy (Evergreen). Cron zawsze wykona zadanie.

Zero-Config (Działa od razu): Ustawił domyślny tryb na "mock" (symulację). Dzięki temu aplikacja uruchomi się i przetestuje logikę bazodanową od ręki, bez wymuszania na Tobie natychmiastowej konfiguracji kluczy API.

Uniknięcie migracji bazy (Hack optymalizacyjny): Zauważył, że w modelu BlogScheduleEntry brakuje pola focusKeyword. Zamiast pisać migrację bazy danych, wstrzyknął tę frazę po prostu jako pierwszy element tablicy keywords[0].

Wykrycie martwego kodu: Analizując pliki, znalazł stary, zduplikowany endpoint crona (api/cron/blog-schedule/route.ts), który korzystał z poprzedniej wersji (Gemini).

Co powinieneś teraz zrobić (Decyzje):
Usuń martwy kod: Zleć usunięcie pliku api/cron/blog-schedule/route.ts (Zasada DRY – nie trzymamy dwóch endpointów robiących to samo).

Model Danych: Zdecyduj, czy akceptujesz focusKeyword trzymane w keywords[0] (KISS – polecam zostawić, jeśli na froncie jest to łatwe do odczytu), czy wolisz jednak zmodyfikować schema.prisma i pociągnąć migrację.

Jeśli akceptujesz jego podejście, wystarczy wysłać do niego:
"Usuń stary route api/cron/blog-schedule/route.ts. Akceptuję trzymanie focusKeyword w keywords[0]. Przechodzimy do kolejnego zadania: budowy profilu klienta w CRM."
