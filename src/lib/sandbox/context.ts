import "server-only";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { SANDBOX_COOKIE, SANDBOX_COOKIE_ON } from "./constants";

// ==========================================
// SANDBOX — KONTEKST SERWEROWY
// ==========================================
// Dwa NIEZALEŻNE pytania, których nie wolno mylić:
//
//  • `canUseSandbox` — czy ta osoba w ogóle ma prawo do piaskownicy
//    (admin z urzędu albo konto z `User.sandboxAccess`). Rządzi dostępem do
//    POJEDYNCZEJ treści: otwarcie strony kursu/wydarzenia, checkout, player.
//    Celowo NIE zależy od przełącznika — testerowi nie może „zniknąć" kurs
//    w połowie zakupu tylko dlatego, że wygasło ciasteczko podglądu.
//
//  • `showSandbox` — czy w TYM renderze doklejamy treści sandbox do LIST
//    (katalog wydarzeń, katalog kursów, biblioteka VOD). Wymaga włączonego
//    podglądu, żeby admin mógł jednym kliknięciem zobaczyć dokładnie to, co
//    widzi klient.

export type SandboxContext = {
  /** Rola ADMIN — może zarządzać piaskownicą i listą testerów. */
  isAdmin: boolean;
  /** Ma prawo oglądać treści sandbox (admin lub tester). */
  canUseSandbox: boolean;
  /** Ciasteczko podglądu ustawione w tej przeglądarce. */
  previewEnabled: boolean;
  /** Doklejać treści sandbox do list w tym renderze. */
  showSandbox: boolean;
};

const NO_ACCESS: SandboxContext = {
  isAdmin: false,
  canUseSandbox: false,
  previewEnabled: false,
  showSandbox: false,
};

/**
 * Kontekst piaskownicy dla bieżącego żądania.
 *
 * @param session Sesja, jeśli wywołujący już ją pobrał — oszczędza drugie
 *   uderzenie w bazę (callback `jwt` czyta użytkownika przy każdym wywołaniu).
 *   `undefined` = pobierz samodzielnie, `null` = jawnie brak sesji (gość).
 *
 * UWAGA: czyta ciasteczka, więc renderuje trasę dynamicznie. Nie wołaj tego
 * na stronach z `export const revalidate` (np. strona główna) — tam treści
 * sandbox są odfiltrowane na sztywno.
 */
export async function getSandboxContext(
  session?: Session | null,
): Promise<SandboxContext> {
  const [resolvedSession, cookieStore] = await Promise.all([
    session === undefined ? getServerSession(authOptions) : session,
    cookies(),
  ]);

  const user = resolvedSession?.user;
  if (!user) return NO_ACCESS;

  const isAdmin = user.role === "ADMIN";
  const canUseSandbox = isAdmin || user.sandboxAccess === true;
  // Ciasteczko bez uprawnień nic nie znaczy — sam podgląd nie daje dostępu.
  const previewEnabled =
    cookieStore.get(SANDBOX_COOKIE)?.value === SANDBOX_COOKIE_ON;

  return {
    isAdmin,
    canUseSandbox,
    previewEnabled,
    showSandbox: canUseSandbox && previewEnabled,
  };
}

/** Skrót: czy doklejać treści sandbox do list w tym renderze. */
export async function showSandboxContent(
  session?: Session | null,
): Promise<boolean> {
  const { showSandbox } = await getSandboxContext(session);
  return showSandbox;
}

/** Skrót: czy ta osoba może w ogóle otworzyć/kupić treść sandbox. */
export async function canUseSandbox(
  session?: Session | null,
): Promise<boolean> {
  const ctx = await getSandboxContext(session);
  return ctx.canUseSandbox;
}

/**
 * Fragment `where` do zapytań Prismy o treści z polem `sandbox`.
 * `showSandbox = true` → brak filtra (produkcja + piaskownica razem).
 * `showSandbox = false` → wyłącznie treści produkcyjne.
 */
export function sandboxFilter(showSandbox: boolean): { sandbox?: false } {
  return showSandbox ? {} : { sandbox: false };
}
