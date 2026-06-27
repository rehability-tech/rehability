# Brief: Blokowy edytor treści + publikacja bloga (do przeniesienia na inny projekt)

> Cel dokumentu: opisać **pełną funkcjonalność** modułu bloga z tego projektu (Rehability)
> tak, by dało się ją odtworzyć w innym projekcie. To **nie jest** brief wizualny —
> kopiujemy logikę, architekturę danych i przepływy, a nie wygląd (kolory/typografię
> bierzemy z docelowego projektu). Wszystkie ścieżki odnoszą się do tego repo i służą
> jako wzorzec referencyjny.

---

## 1. Czym jest ten moduł (w jednym akapicie)

Redakcyjny system publikacji artykułów oparty o **bloki treści** (a nie jeden duży
WYSIWYG). Redaktor buduje artykuł, układając bloki (nagłówek, akapit, lista, FAQ,
tabela, obraz, wyróżnienie, wideo…), z inline rich-textem (TipTap) wewnątrz bloków.
Treść trzymana jest jako **JSON (tablica bloków)** w polu `Post.content`. Doklejone są:
3-krokowy kreator (Dane → Edytor treści → SEO), **autozapis**, **generowanie AI
blok-po-bloku** (Gemini) w dwóch trybach (ręczny modal + automatyczny agent z
harmonogramu), **picker zdjęć z Pexels**, oraz **kalendarz redakcyjny (harmonogram)**
sterujący całym pipeline'em. Stan publikacji to maszyna `DRAFT → PUBLISHED` (+ pole
`lastStage` zapamiętujące, na którym kroku kreatora skończył redaktor).

---

## 2. Mapa tras i plików (wzorzec referencyjny)

### Panel admina (kreator 3-krokowy)
- `/admin/blog` — dashboard listy ([page.tsx](src/app/admin/blog/page.tsx), [lista/page.tsx](src/app/admin/blog/lista/page.tsx))
- `/admin/blog/dodaj/dane-podstawowe` — krok 1: tytuł, kategoria, excerpt, okładka, tagi ([page.tsx](src/app/admin/blog/dodaj/dane-podstawowe/page.tsx))
- `/admin/blog/dodaj/edytor-tresci` — **krok 2: blokowy edytor treści** ([page.tsx](src/app/admin/blog/dodaj/edytor-tresci/page.tsx)) ← serce modułu
- `/admin/blog/dodaj/seo` — krok 3: SEO + publikacja ([page.tsx](src/app/admin/blog/dodaj/seo/page.tsx))
- `/admin/blog/harmonogram` — kalendarz redakcyjny (planowanie tematów) ([page.tsx](src/app/admin/blog/harmonogram/page.tsx))
- Stepper / layout kreatora: [BlogCreatorStepper.tsx](src/app/admin/blog/dodaj/_components/BlogCreatorStepper.tsx), [dodaj/layout.tsx](src/app/admin/blog/dodaj/layout.tsx)

### Edytor treści — komponenty
- Builder (lista + reorder + dodawanie): [BlogBlockBuilder.tsx](src/app/admin/blog/dodaj/edytor-tresci/_components/lib/BlogBlockBuilder.tsx)
- Karta pojedynczego bloku (router typów → render): [BlogBlockEditorCard.tsx](src/app/admin/blog/dodaj/edytor-tresci/_components/lib/BlogBlockEditorCard.tsx)
- Menu „dodaj blok": [BlogBlockAdder.tsx](src/app/admin/blog/dodaj/edytor-tresci/_components/lib/BlogBlockAdder.tsx)
- Inline rich-text (TipTap + bubble menu): [RichTextInput.tsx](src/app/admin/wyjazdy/dodaj/edytor-tresci/_components/lib/RichTextInput.tsx) *(współdzielony z modułem wyjazdów)*
- Bloki specyficzne dla bloga: [BlogInlineImageBlock.tsx](src/app/admin/blog/dodaj/edytor-tresci/_components/blocks/BlogInlineImageBlock.tsx), [BlogTableBlock.tsx](src/app/admin/blog/dodaj/edytor-tresci/_components/blocks/BlogTableBlock.tsx)
- Pozostałe bloki reużyte z wyjazdów: [wyjazdy/.../blocks/](src/app/admin/wyjazdy/dodaj/edytor-tresci/_components/blocks/) (Heading, Paragraph, Highlight, BulletList, Faq, FeaturesGrid, Spacer, VideoEmbed)

### Hooki (logika edytora)
- Pobranie + zapis + autozapis treści: [useBlogContent.ts](src/app/admin/blog/dodaj/edytor-tresci/_components/hooks/useBlogContent.ts)
- Generowanie AI (ręczny modal): [useBlogAiGenerator.ts](src/app/admin/blog/dodaj/edytor-tresci/_components/hooks/useBlogAiGenerator.ts)
- Picker zdjęć Pexels (kolejka): [useInlineImagePicker.ts](src/app/admin/blog/dodaj/edytor-tresci/_components/hooks/useInlineImagePicker.ts)
- Upload własnego zdjęcia: [useBlogUploadImage.ts](src/app/admin/blog/dodaj/edytor-tresci/_components/lib/useBlogUploadImage.ts)
- SEO: [useBlogSeoForm.ts](src/app/admin/blog/dodaj/seo/_components/useBlogSeoForm.ts), publikacja: [PublishControl.tsx](src/app/admin/blog/dodaj/seo/_components/PublishControl.tsx)

### API
- `GET/PATCH/DELETE /api/admin/blog/[id]` — pobierz / zapisz (action: `content` | `seo`) / usuń ([route.ts](src/app/api/admin/blog/[id]/route.ts))
- `POST /api/admin/blog` / `POST /api/admin/blog/save` — utworzenie/zapis kroku 1 ([route.ts](src/app/api/admin/blog/route.ts), [save/route.ts](src/app/api/admin/blog/save/route.ts))
- `POST /api/admin/blog/status` — zmiana statusu (publikacja/draft) ([route.ts](src/app/api/admin/blog/status/route.ts))
- `POST /api/admin/blog/upload` + `POST /api/admin/blog/import-image` — zdjęcia (własny upload / import z URL Pexels do naszego storage) ([upload](src/app/api/admin/blog/upload/route.ts), [import-image](src/app/api/admin/blog/import-image/route.ts))
- `GET/POST /api/admin/blog/schedule` + `/[id]` + `/upcoming` — harmonogram ([schedule/route.ts](src/app/api/admin/blog/schedule/route.ts))
- `POST /api/admin/gemini` — **wszystkie akcje AI** (jeden router, persony) ([route.ts](src/app/api/admin/gemini/route.ts))

---

## 3. Model danych (Prisma)

Sercem jest **jeden** model `Post` z treścią jako `Json` + osobny model harmonogramu.
Wzorzec z [schema.prisma](prisma/schema.prisma):

```prisma
model Post {
  id              String    @id @default(cuid())
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  title           String
  slug            String    @unique
  excerpt         String?   @db.Text
  coverImage      String?
  category        String    @default("Ogólne")
  tags            String[]
  author          String    @default("...")
  readTime        Int?

  content         Json?     @default("[]")   // ← TABLICA BLOKÓW (cały edytor)

  // SEO
  metaTitle       String?
  metaDescription String?   @db.Text
  focusKeyword    String?
  ogImage         String?
  canonicalUrl    String?
  noIndex         Boolean   @default(false)

  status          String    @default("DRAFT") // DRAFT | PUBLISHED
  publishedAt     DateTime?
  lastStage       String    @default("dane-podstawowe") // dokąd doszedł kreator

  views           Int       @default(0)
  pageViews       PostView[]
}

model PostView {           // dzienna deduplikacja odsłon po hashu odwiedzającego
  id String @id @default(cuid())
  postId String
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  visitorHash String
  day DateTime @db.Date
  createdAt DateTime @default(now())
  @@unique([postId, visitorHash, day])
}

model BlogScheduleEntry {  // kalendarz redakcyjny — planowanie tematów
  id String @id @default(cuid())
  createdAt DateTime @default(now())
  scheduledDate DateTime?
  title String
  topic String @db.Text
  category String
  keywords String[]        // keywords[0] = focus keyword dla AI
  status String @default("PLANNED") // PLANNED | IN_PROGRESS | PUBLISHED | SKIPPED
  postId String?           // wiązanie z utworzonym Post
}
```

**Kluczowe decyzje projektowe:**
- Treść = **JSON tablicy bloków**, nie HTML i nie relacyjne bloki. Tani zapis, łatwy
  reorder, render po stronie publicznej iteruje po tablicy i mapuje `type` → komponent.
- Rich text **wewnątrz** bloku jest HTML-em (z TipTap), trzymany w polu bloku (`text`).
- `lastStage` pozwala wznowić kreator tam, gdzie redaktor skończył.
- `BlogScheduleEntry.postId` luźno wiąże plan z artykułem; przy usunięciu artykułu slot
  wraca do `PLANNED` (patrz DELETE w [route.ts](src/app/api/admin/blog/[id]/route.ts#L105)).

---

## 4. Blokowy edytor treści (rdzeń)

### 4.1 Model bloku
Z [useBlogAiGenerator.ts](src/app/admin/blog/dodaj/edytor-tresci/_components/hooks/useBlogAiGenerator.ts#L11):

```ts
type BlogBlockType =
  | "heading" | "paragraph" | "highlight" | "spacer"
  | "bulletList" | "faq" | "featuresGrid"
  | "inlineImage" | "videoEmbed" | "table";

interface BlogBlock {
  id: string;            // safeUuid() — stabilny klucz Reacta i reorderu
  type: BlogBlockType;
  content: any;          // kształt zależny od typu (patrz niżej)
  isGenerating?: boolean; // shimmer podczas generacji AI
}
```

Kształty `content` per typ (z [BlogBlockBuilder.tsx](src/app/admin/blog/dodaj/edytor-tresci/_components/lib/BlogBlockBuilder.tsx#L18) — defaulty przy dodaniu):

| typ | content |
|---|---|
| `heading` / `paragraph` / `highlight` | `{ text: string }` (HTML z TipTap) |
| `spacer` | `{}` |
| `bulletList` | `{ items: [{ id, text }] }` |
| `faq` | `{ items: [{ id, question, answer }] }` |
| `featuresGrid` | `{ items: [{ id, icon, text }] }` |
| `inlineImage` | `{ url, alt }` |
| `videoEmbed` | `{ url }` |
| `table` | `{ caption, headers: string[], rows: string[][] }` |

### 4.2 Builder — dodawanie, usuwanie, reorder
Wzorzec z [BlogBlockBuilder.tsx](src/app/admin/blog/dodaj/edytor-tresci/_components/lib/BlogBlockBuilder.tsx):
- **Reorder** przez `framer-motion` `Reorder.Group` z `values={blocks}` i `onReorder={onChange}`.
  Ważna pułapka (opisana w komentarzu w pliku): `Reorder.Group` musi czytać i zapisywać
  **ten sam** stan rodzica — lokalny mirror rozjeżdża kolejność.
- Dodanie bloku → `safeUuid()` + `focusBlockById(newId)` (auto-scroll/focus do nowego).
- `key` karty zawiera flagę `isGenerating` (`${id}-${loading|ready}`) — wymusza remount po
  zakończeniu generacji AI.
- `BlogBlockEditorCard` jest „routerem": na podstawie `block.type` renderuje właściwy
  komponent bloku i przekazuje `onUpdate`/`onDelete`.

### 4.3 Inline rich-text (TipTap)
Wzorzec z [RichTextInput.tsx](src/app/admin/wyjazdy/dodaj/edytor-tresci/_components/lib/RichTextInput.tsx):
- TipTap `useEditor` z `StarterKit + TextStyle + Color + Placeholder`.
- `onUpdate` → `onChange(editor.getHTML())` — blok trzyma HTML.
- **BubbleMenu** (zaznaczenie tekstu): bold + kilka kolorów brandowych + reset koloru.
  AI używa kolorowych `<span style="color:…">` zamiast `<strong>` — render po stronie
  publicznej musi wspierać inline style.
- `immediatelyRender: false` (wymóg SSR Next.js).
- `handleKeyDown`: opcjonalny `onEnter` — w listach Enter (bez Shift) tworzy kolejny punkt
  zamiast nowej linii; Shift+Enter = miękki łamacz.
- `transformPastedHTML/Text`: czyszczenie `&nbsp;`, pustych akapitów, nadmiarowych spacji
  (źródło „nieusuwalnego" whitespace po wklejaniu z Worda/web).

### 4.4 Render po stronie publicznej
Front iteruje po `Post.content` (tablicy) i mapuje `type` → komponent prezentacyjny;
pola `text` renderowane przez `dangerouslySetInnerHTML` (HTML z TipTap). Bloki
prezentacyjne są oddzielne od edycyjnych — przy przenoszeniu trzeba dorobić render
publiczny pasujący do kształtów z 4.1.

---

## 5. Persistencja i autozapis

Wzorzec z [useBlogContent.ts](src/app/admin/blog/dodaj/edytor-tresci/_components/hooks/useBlogContent.ts):
- **Pobranie**: `GET /api/admin/blog/{id}` → `content` (tablica) ląduje w stanie.
  Brak `id` → toast + redirect do kroku 1. (Każdy artykuł ma `id` już po kroku 1.)
- **Zapis**: `PATCH /api/admin/blog/{id}` z `{ action: "content", content: blocks }`.
- **Autozapis**: `setTimeout(30s)` resetowany przy każdej zmianie `contentData`
  (debounce). Źródła zapisu rozróżnione: `auto | toolbar | bottom` (różne UI feedbacki).
- **Obsługa 404**: jeśli post zniknął (reset bazy / usunięcie) — twardy toast nawet przy
  autozapisie, by nie edytować „w próżnię".
- **Zapis kroku → następny krok**: `handleSaveAndNext` zapisuje i przechodzi do `/seo`.

API ([/api/admin/blog/[id]/route.ts](src/app/api/admin/blog/[id]/route.ts)):
- PATCH waliduje union Zod: `{action:"content"} | {action:"seo"}` (osobne schematy w
  `@/lib/zod/blogValidators`). Przy zapisie treści ustawia też `lastStage: "seo"`.
- Mapuje Prisma `P2025` → **404** (czytelny komunikat zamiast opaque 500).
- DELETE: najpierw zwalnia slot harmonogramu (`postId=null, status=PLANNED`), potem
  kasuje post; `P2025` traktuje jako sukces (idempotencja przy double-click).

---

## 6. Generowanie AI (Gemini) — trzy tryby

Wszystko idzie przez **jeden** router [/api/admin/gemini/route.ts](src/app/api/admin/gemini/route.ts),
sterowany polem `action`. Klient zawsze woła przez wrapper `geminiFetch` z
[clientRateLimiter.ts](src/lib/gemini/clientRateLimiter.ts), który obsługuje rate-limit
(odliczanie, auto-wznowienie, callback `onStatus` → UI „Wznawiam za Ns ☕").

### Akcje (persony) dla bloga
- `generateBlogBlueprint` — **Architekt**: z briefu/kontekstu zwraca `blueprint`:
  `[{ type: BlogBlockType, topic: string }]` (plan układu artykułu).
- `generateBlogSingleBlock` — **Copywriter**: dla pojedynczego kroku planu zwraca
  `content` danego typu bloku.
- `generateBlogSeo` — **SEO**: generuje `metaTitle`/`metaDescription`/`focusKeyword`/
  `ogImage` z twardymi regułami (focus 4-7 słów, 100% PL, pokrycie tokenów w meta —
  walidatory C1–C7/W4–W5 w [gemini/route.ts](src/app/api/admin/gemini/route.ts#L303)).

### Wzorzec „blok po bloku" (kluczowa pętla)
To samo serce w obu trybach ([useBlogAiGenerator.ts](src/app/admin/blog/dodaj/edytor-tresci/_components/hooks/useBlogAiGenerator.ts#L131) i
[edytor-tresci/page.tsx](src/app/admin/blog/dodaj/edytor-tresci/page.tsx#L234)):

1. Pobierz `blueprint` (Architekt). **Odfiltruj `videoEmbed`** — AI nie wstawia filmów.
2. Dla każdego kroku planu:
   - wstaw od razu pusty blok `{ isGenerating: true }` (widoczny shimmer) → `updateField`,
   - zawołaj `generateBlogSingleBlock` (Copywriter) z `blockType` + `topic` + `overallContext`,
   - **znormalizuj odpowiedź** (rozpakuj zagnieżdżenia `content`/`[type]`, dosyp brakujące
     `items`, dopełnij/przytnij wiersze tabeli do liczby kolumn, fallback `text` przy pustce),
   - optimistic update tego bloku (`isGenerating:false`),
   - **inline obraz**: AI nigdy nie zwraca prawdziwego URL — czyść `url`, a jeśli pusty,
     **od razu** otwórz picker Pexels (z `alt` jako podpowiedzią) i wznów dopiero po wyborze.
   - drobne `sleep()` między blokami (UI ma rytm, nie „wybucha" całością naraz).

### Tryb A — ręczny modal
`AiGeneratorModal` zbiera prompt → `handleGenerateBlogContent`. Modal pokazuje „Budowanie
struktury…", po blueprintcie zamyka się, a postęp przejmuje pływający pasek
(`aiProgress`: `blueprint | generating | ratelimit | images | done | error` + licznik
`currentBlock/totalBlocks`).

### Tryb B — agent automatyczny (z harmonogramu)
Wejście z `?autogenerate=true&scheduleId=…` ([edytor-tresci/page.tsx](src/app/admin/blog/dodaj/edytor-tresci/page.tsx#L394)):
- Pobiera artykuł + wpis harmonogramu, składa `overallContext` (tytuł, kategoria, excerpt,
  temat, `keywords[0]` = focus keyword).
- Steruje **panelem `NeonAiPanel`** z krokami (kontekst → blueprint → bloki → zdjęcia →
  zapis) + **pauza / wznów / zamknij** (flagi `pausedRef`/`cancelledRef` czytane na granicy
  każdego bloku — `waitWhilePaused()`).
- Po zakończeniu: `PATCH content` i `router.push` do SEO z `autogenerate=true` (łańcuch
  ciągnie się dalej w kroku SEO).
- Po starcie **czyści query** z URL (`router.replace`), by refresh nie odtworzył flow.

---

## 7. Zdjęcia (Pexels + własny upload)

- **Picker kolejkowy**: [useInlineImagePicker.ts](src/app/admin/blog/dodaj/edytor-tresci/_components/hooks/useInlineImagePicker.ts) +
  [BlogCoverPicker.tsx](src/app/admin/blog/dodaj/_components/BlogCoverPicker.tsx). `pickImagesFor(blocks, onUpdate, onlyBlockId?)`
  przechodzi po blokach `inlineImage` bez URL i prosi o wybór (Pexels lub własny upload),
  pokazując `index/total`. `pickerKey` wymusza świeże wyszukiwanie dla kolejnego zdjęcia.
- **Import z Pexels do naszego storage**: `POST /api/admin/blog/import-image` (nie linkujemy
  hotlinków — kopiujemy do własnego bloba). Własny upload: `POST /api/admin/blog/upload`.
- `isUsableImageUrl()` ([@/lib/utils](src/lib/utils.ts)) odrzuca placeholdery i zmyślone domeny,
  żeby agent zawsze zatrzymał się i poprosił o realne zdjęcie.

---

## 8. Harmonogram (kalendarz redakcyjny) — opcjonalna nadbudowa

[/admin/blog/harmonogram](src/app/admin/blog/harmonogram/page.tsx) + `BlogScheduleEntry`:
planujesz temat (data, tytuł, `topic`, `category`, `keywords`). Z wpisu uruchamiasz
**agenta AI** (Tryb B), który tworzy `Post`, wypełnia treść blok-po-bloku i przeprowadza
przez SEO aż do publikacji. `keywords[0]` zostaje focus keyword. Status wpisu:
`PLANNED → IN_PROGRESS → PUBLISHED` (lub `SKIPPED`). To warstwa „produkcyjna" — przy
przenoszeniu można pominąć w MVP i dodać później.

---

## 9. Zależności (package.json)

```
@tiptap/react, @tiptap/starter-kit, @tiptap/extension-text-style,
@tiptap/extension-color, @tiptap/extensions (Placeholder)   // edytor inline
framer-motion            // Reorder bloków + animacje paneli AI
@google/generative-ai    // Gemini (server-side w /api/admin/gemini)
zod                      // walidacja body API (blogValidators)
sonner                   // toasty
@phosphor-icons/react    // ikony (dist/ssr)
```
Plus: auth admina (`requireAdmin`), Prisma + Postgres, storage na zdjęcia (blob/S3-like),
klucze: `GEMINI_API_KEY`, `PEXELS_API_KEY`, dane storage.

---

## 10. Plan wdrożenia w nowym projekcie (kolejność)

1. **Model danych**: dodaj `Post` (+ `PostView`, opcjonalnie `BlogScheduleEntry`) wg §3.
   `content` jako `Json`. `prisma db push`.
2. **API CRUD**: `POST /api/admin/blog` (krok 1 → tworzy Post, zwraca `id`),
   `GET/PATCH/DELETE /api/admin/blog/[id]` (PATCH union `content|seo`, mapuj `P2025`→404),
   `POST /api/admin/blog/status` (publikacja). Walidatory Zod (`blogValidators`).
3. **Inline rich-text**: przenieś `RichTextInput` (TipTap + BubbleMenu + paste-clean).
   To samodzielny, domenowo neutralny komponent.
4. **Bloki + builder**: zdefiniuj `BlogBlock`/`BlogBlockType`, `BlogBlockBuilder`
   (Reorder + add/delete/focus), `BlogBlockEditorCard` (router typów), komponenty per typ.
   Dorób **render publiczny** dla tych samych kształtów (§4.4).
5. **Edytor (krok 2)**: hook `useBlogContent` (fetch + autozapis 30s + save sources + 404).
6. **AI**: router `/api/admin/gemini` z akcjami `generateBlogBlueprint` /
   `generateBlogSingleBlock` / `generateBlogSeo` + persony (system instructions).
   Klient: `geminiFetch`/`clientRateLimiter` + pętla „blok po bloku" (`useBlogAiGenerator`).
7. **Zdjęcia**: `useInlineImagePicker` + `import-image`/`upload` + integracja Pexels.
8. **SEO (krok 3)** + publikacja (`status`, `publishedAt`, `lastStage`).
9. **(Opcjonalnie) Harmonogram**: `BlogScheduleEntry` + agent automatyczny (`NeonAiPanel`,
   pauza/wznów, `?autogenerate`).

### Co przenosi się 1:1 (domenowo neutralne)
`RichTextInput`, `BlogBlockBuilder`/`BlogBlockEditorCard` + bloki, `useBlogContent`
(autozapis), `clientRateLimiter`/`geminiFetch`, pętla „blok po bloku", `useInlineImagePicker`.

### Co wymaga dostosowania
Persony Gemini (ton/branża/język), reguły SEO (focus keyword, lista zakazanych słów),
walidatory Zod, render publiczny bloków (wygląd docelowego projektu), nazwy kategorii/autora.

---

## 11. Pułapki / lekcje z tego wdrożenia

- **Reorder**: `Reorder.Group` musi czytać i zapisywać ten sam stan rodzica — żadnego
  lokalnego mirrora (rozjeżdża kolejność).
- **TipTap SSR**: `immediatelyRender: false`, komponent `"use client"`.
- **Paste cleanup**: bez `transformPastedHTML/Text` zbierasz „nieusuwalny" whitespace.
- **AI i obrazy**: model nigdy nie zwraca realnego URL — czyść i wymuszaj picker.
- **AI i wideo**: filtruj `videoEmbed` z blueprintu (film wstawia człowiek).
- **Normalizacja odpowiedzi**: model bywa zagnieżdża `content`/`[type]`, gubi `items`,
  zwraca string zamiast `{text}` — miej warstwę normalizującą per typ.
- **404 przy autozapisie**: ostrzegaj zawsze, nie edytuj „w próżnię".
- **Rate limit**: jeden wrapper (`geminiFetch`) z odliczaniem i auto-wznowieniem, spięty z UI.
- **Pauza agenta**: czytaj flagi przez `ref` (bez re-renderu) i sprawdzaj na granicy bloku.
```
