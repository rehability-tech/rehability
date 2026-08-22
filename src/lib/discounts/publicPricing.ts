import type { CheckoutPricing } from "./resolveCheckoutPricing";
import type { PriceLine } from "./types";

/**
 * Wycena w postaci nadającej się do przekazania z komponentu serwerowego
 * do klienckiego (same liczby i stringi, bez Decimali i dat).
 *
 * Świadomie NIE zawiera niczego o piaskownicy poza flagą — nazwy promocji
 * testowych i tak nie trafiają tu dla zwykłego użytkownika, bo filtruje je
 * zapytanie do bazy.
 */
export type PublicPricing = {
  baseAmount: number;
  finalAmount: number;
  totalDiscount: number;
  lines: PriceLine[];
  depositGrosze: number;
  remainderGrosze: number;
  /** Kod, który realnie wszedł do wyceny (null = brak). */
  appliedCode: string | null;
  couponOutranked: boolean;
  isSandbox: boolean;
};

export function toPublicPricing(pricing: CheckoutPricing): PublicPricing {
  return {
    baseAmount: pricing.price.baseAmount,
    finalAmount: pricing.price.finalAmount,
    totalDiscount: pricing.price.totalDiscount,
    lines: pricing.price.lines,
    depositGrosze: pricing.depositGrosze,
    remainderGrosze: pricing.remainderGrosze,
    appliedCode: pricing.codeStatus.ok ? pricing.codeStatus.code : null,
    couponOutranked: pricing.price.couponOutranked,
    isSandbox: pricing.isSandbox,
  };
}

/**
 * Odcisk wyceny. Formularz porównuje go z odciskiem zapisanym w chwili
 * tworzenia PaymentIntenta — kwoty PI nie da się zmienić, więc każda zmiana
 * ceny musi unieważnić koszyk.
 */
export function pricingFingerprint(pricing: PublicPricing): string {
  return `${pricing.appliedCode ?? ""}|${pricing.finalAmount}|${pricing.depositGrosze}`;
}
