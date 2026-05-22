import { geminiRequestSchema } from "@/lib/zod/geminiValidators";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { parseModelJson, ModelJsonParseError } from "@/lib/gemini/parseModelJson";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

function clampToCharLimit(text: string, maxLen: number): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= maxLen) return trimmed;
  const slice = trimmed.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(" ");
  const base =
    lastSpace > maxLen * 0.6 ? slice.slice(0, lastSpace) : slice;
  return base.replace(/[\s.,;:!?-]+$/, "").trimEnd();
}

export async function POST(req: Request) {
  try {
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    const body = await req.json();
    const parsed = geminiRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Nieprawidłowe dane wejściowe",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const {
      prompt,
      action,
      model: requestedModel,
      blockType,
      topic,
      overallContext,
    } = parsed.data;

    const activeModel = requestedModel || "gemini-3.1-flash-lite";
    const model = genAI.getGenerativeModel({ model: activeModel });

    let systemInstruction = "";

    switch (action) {
      // =======================================================================
      // AGENT: ARCHITEKT (Dynamiczny planista układów strony)
      // =======================================================================
      case "generateBlueprint":
        systemInstruction = `Jesteś Dyrektorem Kreatwnym i Ekspertem ds. Sprzedaży. 
        Planujesz idealną stronę sprzedażową, która ma angażować i konwertować.
        
        ZASADA ZŁOTEJ KANAPKI: 
        Nigdy nie zostawiaj nagłówka (heading) "gołego" przed listami. Zawsze przed głównym elementem wyliczeniowym (featuresGrid, bulletList, pricingList, faq, map) musisz dodać krótki "paragraph", który miękko wprowadza w listę lub sekcję. 
        Sekwencja to ZAWSZE: heading -> paragraph (wprowadzenie) -> element.

        ZASADA ODDECHU (SPACING):
        Każda nowa sekcja rozpoczynająca się od nagłówka (heading) MUSI być poprzedzona blokiem "spacer" (wyjątkiem jest tylko sytuacja, gdy heading jest absolutnie pierwszym blokiem na stronie). Daje to stronie wizualny oddech.

        ZASADA MAPY (NOWOŚĆ):
        Zawsze dodawaj sekcję z mapą na końcu każdego szablonu (przed lub po FAQ), używając typu "map". Musi być poprzedzona przez "heading" (np. "Gdzie się spotkamy?") i "paragraph".

        Aby uniknąć monotonii, DOPASUJ UKŁAD do charakteru wyjazdu:

        SZABLON A: "Odnowa i Relaks"
        1. highlight (mocny hook)
        2. spacer -> heading -> paragraph (bolączki klienta)
        3. inlineImage
        4. spacer -> heading -> paragraph (krótki wstęp do atrakcji) -> featuresGrid (MAX 20 SŁÓW)
        5. spacer -> heading -> paragraph (wstęp do korzyści) -> bulletList
        6. spacer -> heading -> paragraph (wstęp do cennika) -> pricingList
        7. spacer -> heading -> paragraph (organizacja)
        8. spacer -> heading -> paragraph (wstęp do pytań) -> faq
        9. spacer -> heading -> paragraph (gdzie się spotkamy) -> map

        SZABLON B: "Akcja i Sport"
        1. heading -> paragraph (energiczne otwarcie - bez spacera na początku!)
        2. spacer -> heading -> paragraph (wstęp do planu) -> featuresGrid (MAX 20 SŁÓW)
        3. highlight
        4. spacer -> heading -> paragraph (wstęp do szczegółów) -> bulletList
        5. inlineImage
        6. spacer -> heading -> paragraph (co zabrać) -> bulletList
        7. spacer -> heading -> paragraph (rezerwacja)
        8. spacer -> heading -> paragraph -> faq
        9. spacer -> heading -> paragraph (nasza baza) -> map

        SZABLON C: "Kreatywność i Warsztaty"
        1. highlight
        2. inlineImage
        3. spacer -> heading -> paragraph (opowieść o pasji)
        4. spacer -> heading -> paragraph (wstęp do warsztatów) -> bulletList
        5. spacer -> heading -> paragraph (wstęp dlaczego warto) -> featuresGrid (MAX 20 SŁÓW)
        6. spacer -> heading -> paragraph (organizacja)
        7. spacer -> heading -> paragraph (jak dojechać) -> map
        8. spacer -> heading -> paragraph -> faq

        Zwróć DOKŁADNIE taki format JSON:
        {
          "meta": {
            "subtitle": "Krótkie, angażujące wezwanie (max 60 znaków).",
            "tags": ["tag1", "tag2", "tag3","tag4","tag5"]
          },
          "blueprint": [
            { "type": "...", "topic": "Szczegółowa instrukcja dla copywritera." }
          ]
        }`;
        break;

      // =======================================================================
      // AGENT: COPYWRITER (KOLOROWANE WYRÓŻNIENIA I PUSTE ZDJĘCIA Z PODPOWIEDZIĄ)
      // =======================================================================
      case "generateSingleBlock":
        systemInstruction = `Jesteś Elitarnym Copywriterem w branży turystyki premium, retreatów i campów. 
        Piszesz niesamowicie angażująco (engaging), budząc emocje, zmysły i pragnienie ucieczki od codzienności.
        
        Kontekst całego wyjazdu: "${overallContext}"
        Twoje zadanie: Napisz zawartość TYLKO DLA JEDNEGO bloku o typie: "${blockType}".
        Instrukcja dla tego bloku: "${topic}"

        BARDZO WAŻNE - ZASADA WYRÓŻNIEŃ (KOLOR ZAMIAST POGRUBIENIA):
        Kategorycznie zabraniam Ci używania znaczników <strong>, <b> czy <em>! 
        Aby wyróżnić najważniejsze frazy lub słowa, ZAWSZE używaj znacznika span z odpowiednim kolorem, dokładnie w tym formacie: <span style="color: #287D88;">wyróżnione słowo</span>.

        WYTYCZNE DLA TYPÓW (PRZESTRZEGAJ BEZWZGLĘDNIE):
        - "heading": Krótki, zachęcający nagłówek. Użyj <span style="color: #287D88;"> na 1-2 kluczowych słowach.
        - "paragraph": Pisz obrazowo, używaj języka korzyści. Max 4-5 rozbudowanych zdań. Zastosuj <span style="color: #287D88;"> do wyróżnienia najważniejszych korzyści.
        - "highlight": Jedno mocne, inspirujące zdanie wyrwane z kontekstu.
        - "bulletList": Generuj min. 4 punkty. Pisz zwięźle.
        - "featuresGrid": Generuj min. 3 karty (ikonki: Heartbeat, Leaf, Sun, Person, Sparkle, Mountains, Tree, Bed, Campfire). UWAGA: OPIS KAŻDEJ KARTY MUSI BYĆ BARDZO KRÓTKI (MAX 20 SŁÓW!).
        - "pricingList": Generuj cennik.
        - "faq": Odpowiedzi muszą być empatyczne i zrzucać presję z uczestnika.
        - "map": Interaktywna mapa wyświetli się automatycznie na podstawie danych z bazy. Nic nie musisz tu pisać.

        BARDZO WAŻNE - FORMAT ZWRACANEGO JSON:
        Zwróć BEZPOŚREDNIO płaski obiekt JSON. 
        ZABRONIONE JEST używanie nadrzędnych kluczy typu "content" czy "data".
        ZABRONIONE JEST używanie nazwy bloku jako klucza (np. "featuresGrid", "bulletList").
        
        TYLKO te pola są dozwolone:
        - Dla "heading", "paragraph", "highlight": zwróć { "text": "Twój HTML" }
        - Dla "inlineImage": ZAWSZE zostawiaj pole url całkowicie puste ("url": ""). W polu "alt" stwórz dokładny opis zdjęcia (rekomendację). Zwróć { "url": "", "alt": "Twój opis" }
        - Dla "spacer" oraz "map": zwróć ZAWSZE {}
        - Dla "bulletList": zwróć { "items": [{ "id": "1", "text": "Twój HTML" }] }
        - Dla "featuresGrid": zwróć { "items": [{ "id": "1", "icon": "Sun", "text": "Krótki tekst max 20 słów" }] }
        - Dla "pricingList": zwróć { "items": [{ "id": "1", "name": "Nazwa zabiegu", "price": "150", "duration": "60" }] }
        - Dla "faq": zwróć { "items": [{ "id": "1", "question": "...", "answer": "..." }] }`;
        break;

      // =======================================================================
      // INNE (Podstawowe Info itp.)
      case "generateBasicInfo":
        systemInstruction = `Jesteś asystentem AI. Na podstawie opisu wygeneruj DOKŁADNY obiekt JSON:
        {
          "title": "Krótki tytuł (max 4 słowa)",
          "description": "Angażujący, krótki opis wyjazdu (2-4 zdania, max 400 znaków). Napisz językiem korzyści, budząc emocje i ciekawość.",
          "locationName": "Nazwa obiektu / hotelu (np. Holiday Sky Park, Willa Janina)",
          "locationCity": "Sama miejscowość (np. Jarnołtówek, Zakopane)",
          "capacity": "Liczba miejsc (string)",
          "price": "Cena całkowita (string, tylko cyfry)",
          "deposit": "Zadatek (string, tylko cyfry)",
          "startDate": "YYYY-MM-DD",
          "endDate": "YYYY-MM-DD",
          "allowBringFriend": boolean (ustaw na true, TYLKO jeśli w tekście jest wzmianka o zabraniu przyjaciółki, osoby towarzyszącej, rezerwacji dla 2 osób itp. W przeciwnym razie false)
        }`;
        break;

      // =======================================================================
      // AGENT: PODSTAWOWE DANE BLOGA
      // =======================================================================
      // =======================================================================
      // AGENT: PEŁNA TREŚĆ ARTYKUŁU BLOGOWEGO
      // =======================================================================
      // =======================================================================
      // AGENT: ARCHITEKT BLOGA (Planista struktury artykułu)
      // =======================================================================
      case "generateBlogBlueprint":
        systemInstruction = `Jesteś doświadczonym redaktorem bloga wellness i fizjoterapii dla kobiet.
        Zaplanuj idealną strukturę artykułu blogowego, który angażuje czytelniczkę i dostarcza wartości.

        DOSTĘPNE TYPY BLOKÓW (używaj TYLKO tych):
        - heading: Nagłówek sekcji (H2/H3)
        - paragraph: Akapit tekstu
        - highlight: Wyróżniony cytat / mocna myśl
        - bulletList: Lista punktowana (zalety, wskazówki, lista kroków)
        - featuresGrid: Karty zalet z ikonkami (max 4-5 kart, krótkie opisy)
        - inlineImage: Zdjęcie w treści (zostaw puste - redaktor doda sam)
        - faq: Sekcja pytań i odpowiedzi
        - spacer: Pusty odstęp między sekcjami
        - videoEmbed: Osadzony film YouTube

        ZASADY BUDOWY ARTYKUŁU:
        1. Zacznij od angażującego akapitu bez nagłówka (paragraph)
        2. Używaj "spacer" przed każdym nowym nagłówkiem (oprócz pierwszego)
        3. Nie zostawiaj "gołego" nagłówka bez akapitu - zawsze heading -> paragraph -> opcjonalnie inny element
        4. Minimum 5-8 bloków dla artykułu z wartością
        5. Zakończ podsumowaniem lub wezwaniem do działania (paragraph lub highlight)

        Zwróć DOKŁADNIE taki format JSON:
        {
          "blueprint": [
            { "type": "...", "topic": "Szczegółowa instrukcja dla copywritera co ma napisać w tym bloku." }
          ]
        }`;
        break;

      case "generateBlogContent":
        systemInstruction = `Jesteś doświadczonym copywriterem bloga wellness i fizjoterapii dla kobiet.
        Napisz kompletny, angażujący artykuł blogowy w języku polskim.

        WYMAGANIA:
        1. Minimum 800 słów
        2. Format HTML z tagami: <h2>, <h3>, <p>, <ul>, <li>, <strong>
        3. Zacznij od wciągającego wstępu (akapit <p>, bez nagłówka na początku)
        4. Co najmniej 3 sekcje z nagłówkami <h2>
        5. Pisz językiem korzyści, bezpośrednio do czytelniczki (forma „ty")
        6. Naturalnie wplataj słowa kluczowe (nie na siłę)
        7. Zakończ inspirującym podsumowaniem lub wezwaniem do działania
        8. NIE używaj tagów <html>, <head>, <body>, <article>

        Zwróć TYLKO czysty HTML — żadnych dodatkowych komentarzy ani markdown.`;
        break;

      // =======================================================================
      // AGENT: METADANE SEO ARTYKUŁU
      // =======================================================================
      case "generateBlogSeo":
        systemInstruction = `Jesteś ekspertem SEO specjalizującym się w blogach wellness.

        TWARDE LIMITY ZNAKÓW (liczone razem ze spacjami — przekroczenie jest BŁĘDEM):
        - metaTitle: BEZWZGLĘDNIE max 60 znaków. Cel: 50-58 znaków. Jeżeli wersja brzmi naturalnie przy 45 znakach, zostaw 45.
        - metaDescription: BEZWZGLĘDNIE max 155 znaków. Cel: 130-150 znaków.

        Przed zwróceniem JSON-a policz znaki w obu polach (każdy znak, łącznie ze spacjami i znakami diakrytycznymi). Jeśli któreś pole przekracza limit, SKRÓĆ je tak, by zmieściło się w limicie — nie zwracaj zbyt długiej wersji.

        Na podstawie danych artykułu wygeneruj DOKŁADNY obiekt JSON:
        {
          "metaTitle": "Optymalny tytuł SEO. MAX 60 znaków (najlepiej 50-58). Zawiera główne słowo kluczowe.",
          "metaDescription": "Zachęcający opis. MAX 155 znaków (najlepiej 130-150). Zawiera słowo kluczowe i call-to-action.",
          "focusKeyword": "Główna fraza kluczowa (2-4 słowa po polsku)"
        }`;
        break;

      // =======================================================================
      // AGENT: METADANE SEO WYJAZDU (CAMP)
      // =======================================================================
      case "generateCampSeo":
        systemInstruction = `Jesteś ekspertem SEO specjalizującym się w turystyce premium, retreatach i wyjazdach wellness dla kobiet.

        TWARDE LIMITY ZNAKÓW (liczone razem ze spacjami — przekroczenie jest BŁĘDEM):
        - metaTitle: BEZWZGLĘDNIE max 60 znaków. Cel: 50-58 znaków. Jeżeli wersja brzmi naturalnie przy 45 znakach, zostaw 45.
        - metaDescription: BEZWZGLĘDNIE max 155 znaków. Cel: 130-150 znaków.

        Przed zwróceniem JSON-a policz znaki w obu polach (każdy znak, łącznie ze spacjami i znakami diakrytycznymi). Jeśli któreś pole przekracza limit, SKRÓĆ je tak, by zmieściło się w limicie — nie zwracaj zbyt długiej wersji.

        WSKAZÓWKI MERYTORYCZNE:
        - Wpleć lokalizację (miasto / region) i tematykę wyjazdu w metaTitle, jeśli to tylko możliwe — to długi ogon SEO, który konwertuje.
        - Wpleć datę / sezon w metaDescription jako element pilności (np. "Lato 2026", "Wrzesień 2026").
        - Skup się na korzyści emocjonalnej dla uczestniczki (reset, energia, czas dla siebie), a nie na suchych faktach.
        - Focus keyword to fraza, którą realna kobieta wpisuje w Google ("retreat wellness Tatry", "obozy fizjoterapeutyczne morze").

        Na podstawie danych wyjazdu wygeneruj DOKŁADNY obiekt JSON:
        {
          "metaTitle": "Optymalny tytuł SEO. MAX 60 znaków (najlepiej 50-58). Zawiera główne słowo kluczowe + lokalizację.",
          "metaDescription": "Zachęcający opis. MAX 155 znaków (najlepiej 130-150). Korzyść + sezon + call-to-action.",
          "focusKeyword": "Główna fraza kluczowa (2-4 słowa po polsku)"
        }`;
        break;

      case "generateBlogBasicData":
        systemInstruction = `Jesteś doświadczonym redaktorem bloga z branży zdrowia, fizjoterapii i wellness.
        Na podstawie opisu artykułu wygeneruj DOKŁADNY obiekt JSON:
        {
          "title": "Chwytliwy tytuł artykułu (max 10 słów)",
          "excerpt": "Krótki, zachęcający opis artykułu (2-3 zdania, max 300 znaków). Użyj języka korzyści.",
          "categorySuggestions": ["Kategoria1", "Kategoria2"],
          "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
        }

        Dla pola "categorySuggestions" sugeruj 1-3 kategorie WYŁĄCZNIE z tej listy: ["Fizjoterapia", "Mindfulness", "Żywienie", "Ruch", "Camp Stories", "Terapia", "Ogólne"]. Nie wymyślaj własnych kategorii.
        Dla pola "tags" generuj 4-6 krótkich słów kluczowych po polsku, małymi literami, bez spacji (używaj myślnika zamiast spacji).`;
        break;

      default:
        return NextResponse.json(
          { error: "Nieznana akcja AI" },
          { status: 400 },
        );
    }

    const finalUserText =
      action === "generateSingleBlock"
        ? `Wykonaj zadanie dla bloku typu ${blockType}. Instrukcja: ${topic}`
        : `Opis od użytkownika:\n${prompt}`;

    const fullPrompt = `${systemInstruction}\n\n${finalUserText}`;

    const isHtmlAction = action === "generateBlogContent";

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig: {
        responseMimeType: isHtmlAction ? "text/plain" : "application/json",
      },
    });

    const responseText = result.response.text();

    if (isHtmlAction) {
      return NextResponse.json({ content: responseText });
    }

    try {
      const parsed = parseModelJson<Record<string, unknown>>(responseText);

      if (
        (action === "generateBlogSeo" || action === "generateCampSeo") &&
        parsed &&
        typeof parsed === "object"
      ) {
        const seo = parsed as {
          metaTitle?: string;
          metaDescription?: string;
          focusKeyword?: string;
        };
        if (typeof seo.metaTitle === "string") {
          seo.metaTitle = clampToCharLimit(seo.metaTitle, 60);
        }
        if (typeof seo.metaDescription === "string") {
          seo.metaDescription = clampToCharLimit(seo.metaDescription, 155);
        }
      }

      return NextResponse.json(parsed);
    } catch (parseErr) {
      if (parseErr instanceof ModelJsonParseError) {
        console.error(
          "Gemini returned malformed JSON for action",
          action,
          "—",
          parseErr.message,
          "\n--- raw (first 500 chars) ---\n",
          parseErr.raw.slice(0, 500),
        );
        return NextResponse.json(
          {
            error:
              "Model zwrócił niepoprawny JSON. Spróbuję ponownie automatycznie.",
            kind: "MALFORMED_JSON",
          },
          { status: 502 },
        );
      }
      throw parseErr;
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);

    const isQuotaError =
      /\b429\b/.test(msg) ||
      /Too Many Requests/i.test(msg) ||
      /RESOURCE_EXHAUSTED/i.test(msg) ||
      /exceeded your current quota/i.test(msg);

    if (isQuotaError) {
      const retryMatch = msg.match(/retry in ([\d.]+)s/i);
      const retryDelaySec = retryMatch
        ? Math.max(1, Math.ceil(parseFloat(retryMatch[1])))
        : 30;
      console.warn(
        `Gemini quota exceeded; instructing client to retry in ${retryDelaySec}s`,
      );
      return NextResponse.json(
        {
          error: "Przekroczono limit zapytań Gemini. Wznowię automatycznie.",
          retryDelaySec,
        },
        { status: 429 },
      );
    }

    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas komunikacji z AI." },
      { status: 500 },
    );
  }
}
