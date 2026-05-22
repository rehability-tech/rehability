import { z } from "zod";

export const campSchema = z.object({
  title: z.string().min(3, "Tytuł musi mieć co najmniej 3 znaki"),

  // Oczekujemy stringa, ale dodajemy .refine(), żeby upewnić się, że to poprawny JSON z wymaganymi kluczami
  location: z.string().refine((val) => {
    try {
      const parsed = JSON.parse(val);
      // Sprawdzamy czy zdekodowany obiekt ma klucze name i city
      return typeof parsed.name === "string" && typeof parsed.city === "string";
    } catch {
      return false;
    }
  }, "Lokalizacja musi zawierać nazwę obiektu i miasto"),

  // Dodane pole na URL mapy
  mapUrl: z.string().optional().default(""),

  startDate: z.coerce.date({
    message: "Podaj prawidłową datę rozpoczęcia",
  }),

  endDate: z.coerce.date({
    message: "Podaj prawidłową datę zakończenia",
  }),

  capacity: z.coerce
    .number({
      message: "Podaj prawidłową liczbę miejsc",
    })
    .int("Liczba miejsc musi być całkowita")
    .min(1, "Musi być co najmniej 1 miejsce"),
  // DODAJ TĘ LINIĘ:
  allowBringFriend: z.boolean().optional().default(false),
  price: z.coerce
    .number({
      message: "Podaj prawidłową cenę wyjazdu",
    })
    .min(0, "Cena nie może być ujemna"),

  deposit: z.coerce
    .number({
      message: "Podaj prawidłową kwotę zadatku",
    })
    .min(0, "Zadatek nie może być ujemny"),

  description: z.string().nullable().optional(),

  lastAiPrompt: z.string().optional(),

  // Dodane opcjonalne pole na zapisywanie aktualnego kroku kreatora
  lastStage: z.string().optional(),
});

// ==========================================
// SCHEMAT SEO (mirror blogSeoSchema)
// ==========================================
export const campSeoSchema = z.object({
  metaTitle: z
    .string()
    .max(70, "Meta tytuł nie może przekraczać 70 znaków")
    .optional(),
  metaDescription: z
    .string()
    .max(165, "Meta opis nie może przekraczać 165 znaków")
    .optional(),
  focusKeyword: z.string().optional(),
  ogImage: z.string().optional(),
  canonicalUrl: z.string().optional(),
  noIndex: z.boolean().optional().default(false),
});
