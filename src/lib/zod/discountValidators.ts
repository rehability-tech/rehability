import { z } from "zod";

import { CODE_PATTERN, normalizeCode } from "@/lib/discounts/normalizeCode";
import { MIN_CHARGE_GROSZE } from "@/lib/discounts/types";

/**
 * Walidacja formularzy systemu rabatowego.
 *
 * Zasada, która przewija się przez wszystkie trzy schematy: pola wartości
 * WYKLUCZAJĄ SIĘ wzajemnie. Przy zmianie `valueType` zerujemy nieużywane,
 * żeby w bazie nie została „sierota" (np. procent po przełączeniu na kwotę),
 * która przy kolejnej edycji nagle wróciłaby do gry.
 */

const percentField = z.coerce
  .number()
  .int("Procent musi być liczbą całkowitą.")
  .min(1, "Rabat nie może być mniejszy niż 1%.")
  .max(95, "Rabat nie może przekraczać 95%.")
  .nullable()
  .optional();

const amountField = z.coerce
  .number()
  .int("Kwota musi być liczbą całkowitą groszy.")
  .min(100, "Rabat nie może być mniejszy niż 1 zł.")
  .max(100_000, "Rabat nie może przekraczać 1000 zł.")
  .nullable()
  .optional();

const noteField = z
  .string()
  .trim()
  .max(200, "Notatka może mieć maksymalnie 200 znaków.")
  .nullable()
  .optional();

/** Wspólny cykl życia: aktywność, okno dat, limit użyć. */
const lifecycleFields = {
  isActive: z.boolean().default(true),
  validFrom: z.coerce.date().nullable().optional(),
  validUntil: z.coerce.date().nullable().optional(),
  usageLimit: z.coerce
    .number()
    .int("Limit użyć musi być liczbą całkowitą.")
    .min(1, "Limit użyć musi wynosić co najmniej 1.")
    .max(100_000, "Limit użyć nie może przekraczać 100 000.")
    .nullable()
    .optional(),
};

/** Data końca nie może wypaść przed datą startu. */
const datesInOrder = <T extends { validFrom?: Date | null; validUntil?: Date | null }>(
  data: T,
) => !data.validFrom || !data.validUntil || data.validUntil >= data.validFrom;

const DATES_MESSAGE = {
  message: "Data zakończenia musi być późniejsza niż data rozpoczęcia.",
  path: ["validUntil"],
};

// ── KOD RABATOWY ───────────────────────────────────────────────────────────

export const discountCodeSchema = z
  .object({
    code: z
      .string()
      .trim()
      .transform(normalizeCode)
      .refine(
        (value) => CODE_PATTERN.test(value),
        "Kod musi mieć 3–32 znaki i składać się z liter A–Z, cyfr, _ oraz -.",
      ),
    note: noteField,
    valueType: z.enum(["percent", "amount"]),
    percent: percentField,
    amountGrosze: amountField,
    stackableWithSale: z.boolean().default(false),
    ...lifecycleFields,
  })
  .refine(
    (data) =>
      data.valueType === "percent"
        ? data.percent != null
        : data.amountGrosze != null,
    { message: "Podaj wartość rabatu.", path: ["percent"] },
  )
  .refine(datesInOrder, DATES_MESSAGE)
  // Zerowanie nieużywanego pola MUSI być po refine'ach, żeby walidacja
  // widziała jeszcze oryginalne wartości.
  .transform((data) =>
    data.valueType === "percent"
      ? { ...data, amountGrosze: null }
      : { ...data, percent: null },
  );

// ── PRZECENA ───────────────────────────────────────────────────────────────

export const saleSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nazwa musi mieć co najmniej 2 znaki.")
      .max(80, "Nazwa może mieć maksymalnie 80 znaków."),
    note: noteField,
    valueType: z.enum(["percent", "fixed_price"]),
    percent: percentField,
    targetPriceGrosze: z.coerce
      .number()
      .int("Cena docelowa musi być liczbą całkowitą groszy.")
      .min(MIN_CHARGE_GROSZE, "Cena docelowa nie może być niższa niż 2 zł.")
      .nullable()
      .optional(),
    ...lifecycleFields,
  })
  .refine(
    (data) =>
      data.valueType === "percent"
        ? data.percent != null
        : data.targetPriceGrosze != null,
    { message: "Podaj wartość przeceny.", path: ["percent"] },
  )
  .refine(datesInOrder, DATES_MESSAGE)
  .transform((data) =>
    data.valueType === "percent"
      ? { ...data, targetPriceGrosze: null }
      : { ...data, percent: null },
  );

// ── RABAT MAILOWY ──────────────────────────────────────────────────────────

export const emailDiscountSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nazwa musi mieć co najmniej 2 znaki.")
      .max(80, "Nazwa może mieć maksymalnie 80 znaków."),
    note: noteField,
    valueType: z.enum(["percent", "amount"]),
    percent: percentField,
    amountGrosze: amountField,
    ...lifecycleFields,
  })
  .refine(
    (data) =>
      data.valueType === "percent"
        ? data.percent != null
        : data.amountGrosze != null,
    { message: "Podaj wartość rabatu.", path: ["percent"] },
  )
  .refine(datesInOrder, DATES_MESSAGE)
  .transform((data) =>
    data.valueType === "percent"
      ? { ...data, amountGrosze: null }
      : { ...data, percent: null },
  );

/** Masowe wklejenie listy adresów — rozbijamy dopiero w route handlerze. */
export const emailMembersSchema = z.object({
  raw: z
    .string()
    .min(1, "Wklej co najmniej jeden adres e-mail.")
    .max(50_000, "Lista jest zbyt długa — podziel ją na mniejsze porcje."),
});

// ── PIASKOWNICA ────────────────────────────────────────────────────────────

export const sandboxActionSchema = z.object({
  // "prices" aktualizuje sam cennik testowy, nie ruszając przełącznika —
  // włączanie/wyłączanie trybu żyje w topbarze.
  action: z.enum(["enable", "publish", "disable", "prices"]),
  // Cena testowa w ZŁOTÓWKACH (jak Trip.price), nie w groszach.
  sandboxPrice: z.coerce
    .number()
    .min(0, "Cena testowa nie może być ujemna.")
    .nullable()
    .optional(),
  sandboxDeposit: z.coerce
    .number()
    .min(0, "Zadatek testowy nie może być ujemny.")
    .nullable()
    .optional(),
});

// ── KOPIOWANIE PROMOCJI DO INNYCH WYDARZEŃ ─────────────────────────────────

export const copyDiscountSchema = z.object({
  kind: z.enum(["CODE", "SALE", "EMAIL"]),
  id: z.string().min(1),
  targetTripIds: z
    .array(z.string().min(1))
    .min(1, "Wskaż co najmniej jedno wydarzenie.")
    .max(50, "Maksymalnie 50 wydarzeń naraz."),
});

// ── PODGLĄD KODU W KOSZYKU ─────────────────────────────────────────────────

export const validateDiscountSchema = z.object({
  tripId: z.string().min(1),
  code: z.string().trim().max(64).nullable().optional(),
});
