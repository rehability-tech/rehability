import { z } from "zod";

export const campSchema = z.object({
  title: z.string().min(3, "Tytuł musi mieć co najmniej 3 znaki"),
  location: z.string().optional().default(""),

  // W z.coerce używamy po prostu 'message'
  startDate: z.coerce.date({
    message: "Podaj prawidłową datę rozpoczęcia",
  }),

  endDate: z.coerce.date({
    message: "Podaj prawidłową datę zakończenia",
  }),

  // Dodałem 'message' też do liczb, w razie gdyby użytkownik wpisał tekst zamiast cyfr
  capacity: z.coerce
    .number({
      message: "Podaj prawidłową liczbę miejsc",
    })
    .int("Liczba miejsc musi być całkowita")
    .min(1, "Musi być co najmniej 1 miejsce"),

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

  lastAiPrompt: z.string().optional(),
});
