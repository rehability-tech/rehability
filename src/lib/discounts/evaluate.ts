import { endOfTripDay } from "@/lib/trips/bookingWindow";
import { now } from "./clock";
import type { DiscountLifecycle, DiscountRejectionReason } from "./types";

/**
 * Bramka cyklu życia promocji — wspólna dla kodów, przecen i rabatów mailowych.
 *
 * To TUTAJ egzekwujemy terminy, przy każdym użyciu. Cron wyłączający
 * przeterminowane promocje służy wyłącznie porządkowi w panelu; gdyby nie
 * zadziałał, przeterminowany kod i tak nie przejdzie.
 *
 * `validUntil` obowiązuje WŁĄCZNIE, do 23:59:59.999 czasu polskiego — kalendarz
 * w adminie zapisuje samą datę (północ), więc bez tej normalizacji „kod do
 * 31.08" gasłby o 00:00 31 sierpnia i cały ostatni dzień by przepadał.
 * Reużywamy `endOfTripDay`, bo okno zapisów rozwiązało już dokładnie ten sam
 * problem strefy czasowej.
 */
export function evaluateDiscount(
  discount: DiscountLifecycle,
  at: Date = now(),
): { eligible: boolean; reason: DiscountRejectionReason | null } {
  if (!discount.isActive) return { eligible: false, reason: "inactive" };

  if (discount.validFrom && at < discount.validFrom) {
    return { eligible: false, reason: "not_started" };
  }

  if (discount.validUntil && at > endOfTripDay(discount.validUntil)) {
    return { eligible: false, reason: "expired" };
  }

  if (discount.usageLimit !== null && discount.usedCount >= discount.usageLimit) {
    return { eligible: false, reason: "exhausted" };
  }

  return { eligible: true, reason: null };
}
