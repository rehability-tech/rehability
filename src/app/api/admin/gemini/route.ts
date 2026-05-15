import { geminiRequestSchema } from "@/lib/zod/geminiValidators";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // --- 2. WALIDACJA ZOD ---
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

    // Wyciągamy bezpieczne, przefiltrowane dane
    const { prompt, action, model: requestedModel } = parsed.data;

    if (!prompt || !action) {
      return NextResponse.json(
        { error: "Brak promptu lub akcji" },
        { status: 400 },
      );
    }

    // Używamy modelu 2.5 Flash, żeby omijać błędy 503
    const activeModel = requestedModel || "gemini-3.1-flash-lite";
    const model = genAI.getGenerativeModel({ model: activeModel });

    let systemInstruction = "";
    let isJson = false;
    const currentYear = new Date().getFullYear();
    switch (action) {
      case "generateBasicInfo":
        systemInstruction = `Jesteś asystentem AI wspierającym organizację profesjonalnych campów.
        
        Na podstawie opisu wygeneruj DOKŁADNY obiekt JSON z danymi. Oczekiwany format:
        {
          "title": "Krótki, zwięzły tytuł (max 3 słowa, ok. 25 znaków np. 'Przełam Swoje Granice')",
          "location": "Adres/Obiekt wyłapany z tekstu (np. 'Spa Viking, Pawęzów'). Zwróć '' jeśli brak.",
          "capacity": "Liczba miejsc jako string (np. '20'). Zwróć '12' jeśli brak.",
          "price": "Cena wyjazdu (tylko cyfry jako string, np. '4000'). Zwróć '' jeśli brak.",
          "deposit": "Kwota zadatku (tylko cyfry jako string, np. '1680'). UWAGA: Jeśli użytkownik podał procenty (np. 'zaliczka to 42%'), a podał też pełną cenę, OBLICZ kwotę i podaj WYNIK liczbowy. Zwróć '' jeśli brak.",
          "startDate": "Data rozpoczęcia w formacie YYYY-MM-DD. UWAGA: Jeśli użytkownik pisze 'tego roku' lub podaje sam miesiąc, użyj aktualnego roku, czyli ${currentYear}. Zwróć null jeśli brak.",
          "endDate": "Data zakończenia w formacie YYYY-MM-DD. (Aktualny rok to ${currentYear}). Zwróć null jeśli brak."
        }`;
        isJson = true;
        break;

      case "generateDescription":
        systemInstruction = `Jesteś wybitnym copywriterem...`;
        isJson = false;
        break;

      case "generateBlog":
        systemInstruction = `Jesteś ekspertem SEO...`;
        isJson = false;
        break;

      default:
        return NextResponse.json(
          { error: "Nieznana akcja AI" },
          { status: 400 },
        );
    }

    const fullPrompt = `${systemInstruction}\n\nOpis od użytkownika:\n${prompt}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig: {
        responseMimeType: isJson ? "application/json" : "text/plain",
      },
    });

    const responseText = result.response.text();

    if (isJson) {
      return NextResponse.json(JSON.parse(responseText));
    } else {
      return NextResponse.json({ text: responseText });
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas komunikacji z AI." },
      { status: 500 },
    );
  }
}
