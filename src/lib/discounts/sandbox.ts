/**
 * ─────────────────────────────────────────────────────────────────────────
 *  PIASKOWNICA RABATÓW
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Semantyka: tryb NIE wyłącza trwających promocji. Izoluje tylko to, co
 * w nim POWSTANIE — każdy zapis przy włączonej piaskownicy (łącznie ze
 * zwykłym przełącznikiem `isActive`) dostaje `isSandbox = true` i widzi to
 * wyłącznie admin.
 *
 * Filtrowanie odbywa się ZAWSZE w zapytaniu do bazy (`sandboxFilter`), nigdy
 * w widoku. Dzięki temu kod z piaskownicy zwraca klientowi `not_found`
 * zamiast wyciekać testową nazwą.
 *
 * Piaskownica jest PER WYDARZENIE: przełącznik i cena testowa siedzą na
 * modelu Trip. Globalny przełącznik oznaczałby flagą zapisy w wydarzeniu B
 * podczas testowania wydarzenia A.
 */

export type SandboxViewer = {
  role?: string | null;
  email?: string | null;
  /** Dostęp nadany per konto (User.sandboxAccess), niezależnie od roli. */
  sandboxAccess?: boolean | null;
} | null;

export type SandboxTrip = {
  discountSandbox: boolean;
  price: unknown;
  deposit: unknown;
  sandboxPrice?: unknown;
  sandboxDeposit?: unknown;
};

/**
 * Czy ta osoba w ogóle może widzieć piaskownicę.
 *
 * Trzy drogi, w tej kolejności:
 *   1. rola ADMIN — administrator ma dostęp ZAWSZE, z definicji,
 *   2. `User.sandboxAccess` — dostęp nadany per konto komuś, kto adminem nie
 *      jest (np. osoba testująca promocje przed publikacją),
 *   3. poza produkcją także konta @local.dev (mock-login z DEV-owej karty).
 */
export function viewerCanUseSandbox(viewer: SandboxViewer): boolean {
  if (!viewer) return false;
  if (viewer.role === "ADMIN") return true;
  if (viewer.sandboxAccess) return true;

  return (
    process.env.NODE_ENV !== "production" &&
    !!viewer.email?.toLowerCase().endsWith("@local.dev")
  );
}

/** Czy dla TEJ osoby i TEGO wydarzenia piaskownica jest realnie aktywna. */
export function isSandboxActiveFor(
  trip: { discountSandbox: boolean },
  viewer: SandboxViewer,
): boolean {
  return trip.discountSandbox && viewerCanUseSandbox(viewer);
}

/**
 * Filtr doklejany do KAŻDEGO zapytania o promocje.
 * Poza piaskownicą wykluczamy rekordy testowe już na poziomie WHERE.
 */
export function sandboxFilter(includeSandbox: boolean): { isSandbox?: boolean } {
  return includeSandbox ? {} : { isSandbox: false };
}

/**
 * Cena bazowa i zadatek w GROSZACH — z uwzględnieniem nadpisania testowego.
 * `Trip.price`/`Trip.deposit` to Decimal w złotówkach, więc konwersja
 * jest taka sama jak w reszcie kodu: Math.round(Number(x) * 100).
 */
export function resolveBasePrice(
  trip: SandboxTrip,
  inSandbox: boolean,
): { priceGrosze: number; depositGrosze: number } {
  const price =
    inSandbox && trip.sandboxPrice != null ? trip.sandboxPrice : trip.price;
  const deposit =
    inSandbox && trip.sandboxDeposit != null ? trip.sandboxDeposit : trip.deposit;

  return {
    priceGrosze: Math.round(Number(price) * 100),
    depositGrosze: Math.round(Number(deposit) * 100),
  };
}
