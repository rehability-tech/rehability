import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAdmin } from "@/lib/auth/requireAdmin";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// Pexels matchuje zdjęcia po ANGIELSKICH tagach — polska fraza zwraca śmieci
// albo pustkę. Jeśli wykryjemy polskie znaki, prosimy Gemini o 2–4 angielskie
// słowa kluczowe (to co widać na zdjęciu). Angielskie/krótkie frazy lecą as-is.
async function toPexelsQuery(raw: string): Promise<string> {
  const hasPolish = /[ąćęłńóśźż]/i.test(raw);
  if (!hasPolish) return raw;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
    const prompt = `Zamień poniższą polską frazę na 2-4 angielskie słowa kluczowe do wyszukiwania zdjęć stockowych. Zwróć WYŁĄCZNIE słowa oddzielone spacją, bez interpunkcji i cudzysłowów. Skup się na tym, co fizycznie widać na zdjęciu.\nFraza: "${raw}"`;
    const result = await model.generateContent(prompt);
    const text = result.response
      .text()
      .trim()
      .replace(/["'\n.,]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text || raw;
  } catch {
    return raw;
  }
}

// Lekki kształt zdjęcia zwracany do klienta — tylko to, czego potrzebuje picker.
export interface PexelsPhoto {
  id: number;
  thumb: string; // mała wersja do siatki
  preview: string; // średnia wersja do podglądu
  full: string; // duża wersja, którą zaciągamy do bloba
  alt: string;
  photographer: string;
  photographerUrl: string;
}

interface PexelsApiPhoto {
  id: number;
  alt: string;
  photographer: string;
  photographer_url: string;
  src: {
    tiny: string;
    medium: string;
    large: string;
    large2x: string;
    original: string;
  };
}

export async function GET(request: Request): Promise<NextResponse> {
  const { isAuthorized, response } = await requireAdmin();
  if (!isAuthorized) return response as NextResponse;

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Brak klucza PEXELS_API_KEY w konfiguracji serwera." },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const rawQuery = (searchParams.get("query") || "").trim();
  const page = searchParams.get("page") || "1";

  if (!rawQuery) {
    return NextResponse.json({ photos: [], totalResults: 0, query: "" });
  }

  // Tłumaczymy tylko przy pierwszej stronie — load-more dostaje już gotową,
  // angielską frazę z klienta, więc nie marnujemy wywołań Gemini.
  const query = page === "1" ? await toPexelsQuery(rawQuery) : rawQuery;

  try {
    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", query);
    url.searchParams.set("per_page", "24");
    url.searchParams.set("page", page);
    url.searchParams.set("orientation", "landscape");
    url.searchParams.set("locale", "pl-PL");

    const res = await fetch(url.toString(), {
      headers: { Authorization: apiKey },
      // Pexels rate-limit jest hojny; cache na chwilę żeby nie spamować.
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Pexels odpowiedział błędem (${res.status}).` },
        { status: 502 },
      );
    }

    const data = (await res.json()) as {
      photos: PexelsApiPhoto[];
      total_results: number;
    };

    const photos: PexelsPhoto[] = (data.photos || []).map((p) => ({
      id: p.id,
      thumb: p.src.medium,
      preview: p.src.large,
      full: p.src.large2x,
      alt: p.alt || query,
      photographer: p.photographer,
      photographerUrl: p.photographer_url,
    }));

    return NextResponse.json({
      photos,
      totalResults: data.total_results || 0,
      query, // zwracamy rozwiązaną (angielską) frazę dla load-more
    });
  } catch (error) {
    console.error("Błąd zapytania do Pexels:", error);
    return NextResponse.json(
      { error: "Nie udało się pobrać zdjęć z Pexels." },
      { status: 500 },
    );
  }
}
