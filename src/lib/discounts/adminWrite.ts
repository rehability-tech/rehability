import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { courseOwner, tripOwner, type DiscountOwner } from "./owner";

/**
 * Wspólna obsługa zapisów w panelu rabatów.
 *
 * Kluczowa reguła piaskownicy: KAŻDY zapis przy włączonym trybie oznacza
 * rekord jako testowy — łącznie ze zwykłym przełącznikiem `isActive`.
 * Trzymamy to w jednym helperze, żeby nie dało się o tym zapomnieć przy
 * dopisywaniu kolejnej trasy.
 */

export type DiscountModel = "discountCode" | "sale" | "emailDiscount";

type OwnerLoad =
  | { ok: true; sandbox: boolean; title: string; owner: DiscountOwner; response: null }
  | { ok: false; sandbox: false; title: null; owner: null; response: NextResponse };

/**
 * Sprawdza, czy wydarzenie istnieje, i zwraca stan piaskownicy.
 * `response` jest ustawione, gdy trzeba przerwać obsługę żądania.
 */
export async function loadTripForDiscounts(tripId: string): Promise<OwnerLoad> {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { discountSandbox: true, title: true },
  });

  if (!trip) {
    return {
      ok: false,
      sandbox: false,
      title: null,
      owner: null,
      response: NextResponse.json(
        { error: "Wydarzenie nie istnieje." },
        { status: 404 },
      ),
    };
  }

  return {
    ok: true,
    sandbox: trip.discountSandbox,
    title: trip.title,
    owner: tripOwner(tripId),
    response: null,
  };
}

/**
 * To samo dla kursu.
 *
 * Przyjmujemy SLUG ALBO ID. Panel adresuje kurs slugiem, ale segment trasy
 * musi się nazywać `[id]` — Next.js nie pozwala na dwie różne nazwy parametru
 * w tej samej ścieżce, a `/api/admin/kursy/[id]` istniało wcześniej.
 * Same promocje wiążemy zawsze po ID: slug może się zmienić.
 */
export async function loadCourseForDiscounts(
  slugOrId: string,
): Promise<OwnerLoad> {
  const course = await prisma.course.findFirst({
    where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
    select: { id: true, discountSandbox: true, title: true },
  });

  if (!course) {
    return {
      ok: false,
      sandbox: false,
      title: null,
      owner: null,
      response: NextResponse.json(
        { error: "Kurs nie istnieje." },
        { status: 404 },
      ),
    };
  }

  return {
    ok: true,
    sandbox: course.discountSandbox,
    title: course.title,
    owner: courseOwner(course.id),
    response: null,
  };
}

/** Dokleja znacznik piaskownicy do danych zapisu. */
export function withSandboxFlag<T extends object>(
  data: T,
  sandbox: boolean,
): T & { isSandbox: boolean } {
  return { ...data, isSandbox: sandbox };
}

/**
 * Podniesienie limitu ponad dotychczasowe zużycie „odblokowuje" ponowne
 * powiadomienie o wyczerpaniu — inaczej admin dostałby je tylko raz w życiu
 * promocji, mimo że pula została zwiększona.
 */
export function resetExhaustionMarker(
  usageLimit: number | null | undefined,
  usedCount: number,
): { exhaustedNotifiedAt?: null } {
  if (usageLimit == null || usageLimit > usedCount) {
    return { exhaustedNotifiedAt: null };
  }
  return {};
}

/**
 * Promocji z historią nie kasujemy — snapshot na rezerwacji przetrwałby, ale
 * admin straciłby możliwość zobaczenia jej w panelu. Zamiast tego prosimy
 * o dezaktywację.
 */
export function blockDeleteIfUsed(usedCount: number): NextResponse | null {
  if (usedCount > 0) {
    return NextResponse.json(
      {
        error: `Ta promocja ma już ${usedCount} ${
          usedCount === 1 ? "użycie" : "użyć"
        } — możesz ją tylko dezaktywować.`,
      },
      { status: 409 },
    );
  }
  return null;
}

/** Jednolita odpowiedź na błąd walidacji Zod (wzorzec z tras admina). */
export function validationError(issues: { message: string }[]): NextResponse {
  return NextResponse.json(
    { error: issues[0]?.message ?? "Nieprawidłowe dane." },
    { status: 400 },
  );
}

type ZodLike<T> = {
  safeParse: (
    input: unknown,
  ) => { success: true; data: T } | { success: false; error: { issues: { message: string }[] } };
};

/**
 * Ciało PATCH-a w panelu rabatów ma dwa warianty:
 *   - `{ isActive: boolean }` — sam przełącznik z karty (nie wymaga
 *     odsyłania całego formularza),
 *   - pełny formularz edycji — przepuszczany przez schemat Zod.
 *
 * Wspólne dla wszystkich trzech typów promocji, więc trzymamy to raz.
 */
export function parseDiscountPatch<T>(
  body: unknown,
  schema: ZodLike<T>,
): { data: T | { isActive: boolean }; response: null } | { data: null; response: NextResponse } {
  const isToggleOnly =
    typeof body === "object" &&
    body !== null &&
    Object.keys(body).length === 1 &&
    typeof (body as { isActive?: unknown }).isActive === "boolean";

  if (isToggleOnly) {
    return {
      data: { isActive: (body as { isActive: boolean }).isActive },
      response: null,
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { data: null, response: validationError(parsed.error.issues) };
  }

  return { data: parsed.data, response: null };
}

export const DISCOUNT_MODELS: Record<DiscountModel, string> = {
  discountCode: "Kod rabatowy",
  sale: "Przecena",
  emailDiscount: "Rabat mailowy",
};
