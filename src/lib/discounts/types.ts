/**
 * ─────────────────────────────────────────────────────────────────────────
 *  SYSTEM RABATOWY — typy domenowe
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Warstwa CZYSTA: zero Prismy, zero sesji, zero `server-only`. Dzięki temu
 * dokładnie ten sam kod liczy cenę w podglądzie w panelu admina (komponent
 * kliencki) i przy tworzeniu PaymentIntenta na serwerze — podgląd i realne
 * obciążenie nie mogą się rozjechać.
 *
 * WSZYSTKIE kwoty są w GROSZACH (jak Booking.amountTotal). Waluta zawsze "pln".
 */

/** Minimalna kwota, jaką Stripe przyjmie w PLN: 2,00 zł. */
export const MIN_CHARGE_GROSZE = 200;

/** Waluta jest zaszyta na sztywno — nie sprzedajemy w innych walutach. */
export const CURRENCY = "pln";

/** Trzy niezależne źródła obniżki. */
export type DiscountKind = "CODE" | "SALE" | "EMAIL";

/**
 * "percent"      — obniżka procentowa (1–95%)
 * "amount"       — obniżka kwotowa w groszach
 * "fixed_price"  — CENA DOCELOWA w groszach (nie kwota rabatu!); tylko przeceny
 */
export type DiscountValueType = "percent" | "amount" | "fixed_price";

/**
 * Promocja przygotowana do wyceny — już po sprawdzeniu cyklu życia
 * (`evaluateDiscount`). Pola wartości odpowiadają 1:1 kolumnom w bazie
 * i wykluczają się wzajemnie zgodnie z `valueType`.
 */
export type DiscountCandidate = {
  kind: DiscountKind;
  id: string;
  /** Nazwa przeceny/rabatu mailowego albo sam kod — do etykiety w koszyku. */
  name: string;
  /** Tylko dla kind === "CODE". */
  code?: string;
  valueType: DiscountValueType;
  percent?: number | null;
  amountGrosze?: number | null;
  targetPriceGrosze?: number | null;
  /** Tylko dla kind === "CODE": czy kod dokłada się do przeceny. */
  stackableWithSale?: boolean;
};

/** Jedna pozycja rabatu na paragonie. Nigdy nie ma pozycji o amount === 0. */
export type PriceLine = {
  kind: DiscountKind;
  id: string;
  /** Gotowa etykieta, np. `Kod LATO10 (−10%)`. */
  label: string;
  /** Ile groszy odjęto. Zawsze > 0. */
  amount: number;
};

/**
 * Wynik wyceny. Niezmienniki gwarantowane przez konstrukcję
 * (poza przypadkiem błędnej konfiguracji, patrz `clamped` niżej):
 *
 *   Σ lines[].amount === totalDiscount
 *   baseAmount − totalDiscount === finalAmount
 *   finalAmount >= MIN_CHARGE_GROSZE
 */
export type PriceResult = {
  baseAmount: number;
  totalDiscount: number;
  finalAmount: number;
  lines: PriceLine[];
  /**
   * Wpisany kod przegrał (lub zremisował) z obniżką automatyczną. Koszyk
   * pokazuje wtedy wyjaśnienie, zamiast po cichu zignorować kod.
   */
  couponOutranked: boolean;
  /**
   * Rabat został przycięty do progu Stripe. Ustawiane także wtedy, gdy sama
   * cena bazowa jest poniżej progu — to błąd konfiguracji wydarzenia i jedyna
   * sytuacja, w której `finalAmount` może być mniejsze niż MIN_CHARGE_GROSZE.
   */
  clamped: boolean;
  /** Które promocje realnie weszły do wyceny (do zapisania w snapshocie). */
  applied: {
    code: DiscountCandidate | null;
    sale: DiscountCandidate | null;
    email: DiscountCandidate | null;
  };
};

/**
 * Snapshot zapisywany na rezerwacji. WARTOŚCI, nie referencje — świadomie bez
 * kluczy obcych, żeby skasowanie promocji nie psuło historii zamówień.
 * Kształt odpowiada 1:1 kolumnom modelu Booking, więc wchodzi do
 * `prisma.booking.create({ data: { ...snapshot } })` bez mapowania.
 */
export type BookingDiscountSnapshot = {
  originalAmount: number;
  totalDiscountAmount: number;
  discountCodeId: string | null;
  discountCode: string | null;
  discountCodeAmount: number | null;
  saleId: string | null;
  saleName: string | null;
  saleAmount: number | null;
  emailDiscountId: string | null;
  emailDiscountName: string | null;
  emailDiscountAmount: number | null;
  isSandbox: boolean;
};

/**
 * Dlaczego kod nie zadziałał. `not_found` celowo pokrywa też kod z piaskownicy
 * i kod z innego wydarzenia — nie zdradzamy klientowi, że taki kod istnieje.
 */
export type DiscountRejectionReason =
  | "not_found"
  | "inactive"
  | "not_started"
  | "expired"
  | "exhausted"
  | "outranked";

/** Wspólny cykl życia wszystkich trzech typów promocji. */
export type DiscountLifecycle = {
  isActive: boolean;
  validFrom: Date | null;
  validUntil: Date | null;
  usageLimit: number | null;
  usedCount: number;
};
