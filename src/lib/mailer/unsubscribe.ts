/**
 * Pomocniki wypisania (unsubscribe) — czyste, bez zależności.
 */
import type { MailContact } from "./types";

/** Buduje publiczny link wypisania z tokenu kontaktu. */
export function buildUnsubscribeUrl(appUrl: string, token: string): string {
  return `${appUrl.replace(/\/$/, "")}/wypisz/${token}`;
}

/** Podstawia zmienne kontaktu w szablonie tekstu (np. temat: "Cześć {name}"). */
export function substituteContactVars(
  template: string,
  contact: Pick<MailContact, "name" | "email">,
): string {
  const map: Record<string, string> = {
    name: contact.name ?? "",
    email: contact.email,
  };
  return template.replace(/\{(\w+)\}/g, (_, key) => map[key] ?? `{${key}}`);
}
