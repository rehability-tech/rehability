// ==========================================
// SANDBOX — STAŁE WSPÓŁDZIELONE
// ==========================================
// Moduł jest CZYSTY (zero importów server/edge), więc wolno go importować
// w komponentach klienckich, route'ach API i w proxy (middleware).
// Logika serwerowa siedzi w `./context` (czyta sesję i ciasteczka).

/**
 * Ciasteczko włączające podgląd piaskownicy w bieżącej przeglądarce.
 *
 * Świadomie NIE jest `httpOnly` — nie niesie żadnych uprawnień, tylko
 * preferencję widoku. Serwer zawsze liczy `showSandbox = canUseSandbox &&
 * previewEnabled`, więc ręczne ustawienie ciasteczka nie daje dostępu do
 * niczego. Dzięki temu pasek ostrzegawczy może odczytać stan po stronie
 * klienta i nie musimy czytać ciasteczek w głównym layoucie (co zabiłoby
 * ISR na stronie głównej i blogu).
 */
export const SANDBOX_COOKIE = "rehability_sandbox";

/** Jedyna wartość ciasteczka traktowana jak „podgląd włączony". */
export const SANDBOX_COOKIE_ON = "1";

/** Czas życia ciasteczka podglądu — 12 h, czyli mniej więcej dzień pracy. */
export const SANDBOX_COOKIE_MAX_AGE = 60 * 60 * 12;

/** Zdarzenie okna — pozwala paskowi zareagować na przełącznik bez przeładowania. */
export const SANDBOX_PREVIEW_EVENT = "rehability:sandbox-preview";

/** Typy treści objęte piaskownicą. */
export const SANDBOX_ENTITIES = ["trip", "course"] as const;
export type SandboxEntity = (typeof SANDBOX_ENTITIES)[number];

export const SANDBOX_ENTITY_LABEL: Record<SandboxEntity, string> = {
  trip: "Wydarzenie",
  course: "Kurs",
};

/** Czy string z requestu jest obsługiwanym typem treści. */
export function isSandboxEntity(value: unknown): value is SandboxEntity {
  return (
    typeof value === "string" &&
    (SANDBOX_ENTITIES as readonly string[]).includes(value)
  );
}
