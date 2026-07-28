# Konfiguracja SEO – Rehability Prudnik

Poniżej znajduje się lista informacji potrzebnych do zbudowania pełnego kontekstu dla AI i stworzenia idealnej konfiguracji SEO (Metadata, OpenGraph, LocalBusiness JSON-LD) w Next.js.

## 1. Kontekst Biznesowy i Marka (Wizytówka)

- **Główna działalność:** Czym dokładnie zajmuje się Rehability Prudnik? (np. organizacja wydarzeń SPA dla kobiet, turnusy rehabilitacyjne, fizjoterapia stacjonarna).
  - > **Odpowiedź:** **Rehability Prudnik (Rehability Piotr Siemaszko)** to nowoczesne centrum zdrowia i regeneracji, którego działalność opiera się na trzech silnych filarach:
  - >
  - > 1. **Usługi stacjonarne (Gabinet w Prudniku):** Specjalistyczna fizjoterapia, terapia manualna, diagnostyka USG (USG-RUSI), rehabilitacja przed- i pooperacyjna oraz dietetyka. Świadczymy również szeroki wachlarz masaży leczniczych i relaksacyjnych (m.in. MTG, masaż sportowy, japoński masaż twarzy Kobido, masaż ajurwedyjski, praca bańką chińską i gorącymi kamieniami).
  - > 2. **Wydarzenia i wydarzenia holistyczne (Campy):** Organizacja zorganizowanych wydarzeń typu SPA/Wellness, łączących fizjoterapię, aktywność fizyczną i medytację, ukierunkowanych na głęboką regenerację i poprawę dobrostanu uczestników.
  - > 3. **Edukacja i produkty cyfrowe (Sklep/VOD):** Sprzedaż materiałów edukacyjnych (np. autorski e-book "Guidebook Podstaw Treningu Siłowego") oraz prowadzenie szkoleń z zakresu fizjoterapii i treningu. Ten segment docelowo zostanie przekształcony w pełnoprawną platformę VOD z kursami online.

* **Grupa docelowa (Persona):** Do kogo kierujemy stronę?
  - > **Odpowiedź:** Ze względu na zróżnicowany profil działalności, naszą grupę docelową dzielimy na trzy główne segmenty (persony):
  - >
  - > 1. **Pacjenci lokalni (Gabinet stacjonarny):** Osoby z Prudnika, okolic oraz całego woj. opolskiego. Z jednej strony są to pacjenci bólowi, ortopedyczni i pourazowi szukający skutecznej fizjoterapii medycznej. Z drugiej – osoby dbające o profilaktykę, zdrowie i urodę (np. masaż Kobido, masaże relaksacyjne), a także sportowcy potrzebujący szybkiej regeneracji.
  - > 2. **Uczestnicy wydarzeń (Campy holistyczne):** Zarówno kobiety, jak i mężczyźni (najczęściej w wieku 25-55 lat) z całej Polski (ze szczególnym uwzględnieniem dużych aglomeracji oraz woj. opolskiego, śląskiego i dolnośląskiego). Choć organizujemy edycje tematyczne (np. dedykowane tylko kobietom), główna oferta wydarzeń skierowana jest do wszystkich osób przebodźcowanych, zmęczonych codziennym pędem, które szukają kompleksowego „resetu”, redukcji stresu oraz zadbania o ciało i umysł pod okiem profesjonalistów.
  - > 3. **Osoby aktywne i początkujące w treningu (Edukacja/VOD):** Kobiety i mężczyźni z całej Polski, którzy chcą mądrze i bezpiecznie rozpocząć przygodę z aktywnością fizyczną (odbiorcy "Guidebooka Podstaw Treningu Siłowego") lub poszerzyć swoją wiedzę. Szukają sprawdzonych metod treningowych stworzonych przez doświadczonego fizjoterapeutę, aby uniknąć błędów i kontuzji.

* **Unikalna Propozycja Wartości (USP):** Co wyróżnia Was na tle konkurencji?
  - > **Odpowiedź:** Naszą największą przewagą jest **medyczny fundament w świecie wellness i treningu** oraz **holistyczne podejście 360 stopni do zdrowia**.
  - >
  - > 1. **Bezpieczeństwo i profesjonalizm:** W przeciwieństwie do ofert zwykłych ośrodków SPA, trenerów personalnych czy influencerów, wszystkie nasze usługi (wydarzenia, e-booki treningowe, VOD) są projektowane przez wykwalifikowanych fizjoterapeutów. Daje to klientom gwarancję, że pracują z ciałem mądrze i bezpiecznie.
  - > 2. **Kompleksowość (360 stopni):** Nie jesteśmy tylko gabinetem, który "naprawia ból i mówi do widzenia". Prowadzimy pacjenta przez pełen proces: od precyzyjnej diagnostyki (np. nowoczesne USG-RUSI w gabinecie), przez naukę bezpiecznego ruchu (edukacja i materiały VOD), aż po głęboką regenerację układu nerwowego i redukcję stresu (wydarzenia holistyczne).
  - > 3. **Zacieranie granic między leczeniem a relaksem:** Udowadniamy, że profesjonalna fizjoterapia może iść w parze z luksusową odnową biologiczną (masaż Kobido, gorące kamienie, relaks na campach).

* **Zasięg:** Działacie tylko lokalnie w Prudniku i okolicach, czy celujecie w klientów z całej Polski?
  - > **Odpowiedź:** Nasz zasięg działania jest dwutorowy i zależy od konkretnego filaru biznesu:
  - >
  - > 1. **Zasięg lokalny (Local SEO):** Usługi stacjonarne gabinetu (fizjoterapia, diagnostyka USG, masaże lecznicze i relaksacyjne) kierujemy do mieszkańców Prudnika, okolicznych miejscowości oraz szerzej – do pacjentów z całego województwa opolskiego.
  - > 2. **Zasięg ogólnopolski:** Organizacja wydarzeń holistycznych (Campów) oraz segment edukacyjny (sprzedaż e-booków, platforma VOD, szkolenia) są skierowane do klientów z całej Polski. W tym przypadku zależy nam na widoczności w wynikach ogólnokrajowych, budowaniu społeczności online oraz docieraniu do osób poszukujących turystyki wellness i rzetelnej wiedzy treningowo-fizjoterapeutycznej, niezależnie od ich miejsca zamieszkania.

---

## 2. Mapa Strony (Struktura Aplikacji)

Mapa wygenerowana automatycznie z routów w `src/app/(site)/`. Obejmuje **wyłącznie publiczne, indeksowalne strony frontowe** — pominięto `admin/*`, `panel/*` (chronione sesją), `api/*`, `/logowanie` (auth) oraz `/w-budowie` (placeholder, `noindex`).

### Strony statyczne (główne)

- [x] `/` - Strona główna
- [x] `/o-nas` - Informacje o zespole, misja, wartości
- [x] `/gabinet` - Oferta gabinetu w Prudniku (fizjoterapia, masaże, dietetyka)

### Sekcja: Wydarzenia / Campy

- [x] `/wydarzenia` - Lista wszystkich opublikowanych wydarzeń (paginacja)
- [x] `/wydarzenia/[slug]` - Dynamiczna strona konkretnego wydarzenia (jeden URL per wydarzenie ze statusem `PUBLISHED`)

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

- **Statyczne URL-e** (`/`, `/o-nas`, `/gabinet`, `/wydarzenia`, `/blog`, `/polityka-prywatnosci`, `/regulamin`) — wygenerować jednorazowo, `changefreq: monthly`.
- **Dynamiczne URL-e** (`/wydarzenia/[slug]`, `/blog/[blogSlug]`) — generować runtime przez `generateSitemaps()` w Next.js z DB (filtr `status: "PUBLISHED"`), `changefreq: weekly` dla bloga / `monthly` dla wydarzeń.
- W `robots.txt` jawnie zablokować `/admin/`, `/panel/`, `/api/`, `/logowanie`, `/w-budowie`.

---

## 3. Słowa Kluczowe (Keywords)

- **Główne frazy (3-5 najważniejszych):** Po wpisaniu jakich słów w Google klient ma Was znaleźć?
  1. Fizjoterapia Prudnik
  2. Masaż Kobido Prudnik
  3. Wydarzenia holistyczne
  4. Trening siłowy dla kobiet w domu
  5. Masaż tkanek głębokich Nysa

- **Długie ogony (Long-tail keywords) na bloga:** Czego mogą szukać w Google Wasi klienci?
  - > **Odpowiedź:** "Ćwiczenia na ból lędźwi w domu", "Masaż kobido co to jest i jakie daje efekty?", "Ile kosztuje wydarzenie holistyczne do SPA?", "Czy trening siłowy jest bezpieczny w ciąży?", "Rwa kulszowa leczenie i ćwiczenia".

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

Oto kompletny, wysokopoziomowy plan architektury platformy VOD, wolny od "rzeźbienia" w infrastrukturze (co zniechęciło Cię w Bunny.net), zorientowany na maksymalną wydajność, bezpieczeństwo i niski koszt utrzymania.
