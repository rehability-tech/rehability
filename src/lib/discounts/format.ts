import type { DiscountCandidate, DiscountRejectionReason } from "./types";

const PLN = new Intl.NumberFormat("pl-PL", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Grosze → czytelna kwota, np. `1 440 zł` albo `1 439,50 zł`.
 * Końcówki „,00" nie pokazujemy — ceny wyjazdów są zwykle okrągłe, a rabat
 * potrafi zrobić z nich grosze i wtedy chcemy je widzieć.
 */
export function formatGrosze(grosze: number): string {
  return `${PLN.format(grosze / 100)} zł`;
}

/** Krótki opis wartości promocji: `−10%`, `−150 zł`, `cena 1 200 zł`. */
export function discountValueLabel(candidate: DiscountCandidate): string {
  switch (candidate.valueType) {
    case "percent":
      return `−${candidate.percent ?? 0}%`;
    case "amount":
      return `−${formatGrosze(candidate.amountGrosze ?? 0)}`;
    case "fixed_price":
      return `cena ${formatGrosze(candidate.targetPriceGrosze ?? 0)}`;
    default:
      return "";
  }
}

/** Etykieta pozycji na paragonie, np. `Kod LATO10 (−10%)`. */
export function discountLabel(candidate: DiscountCandidate): string {
  const value = discountValueLabel(candidate);

  switch (candidate.kind) {
    case "CODE":
      return `Kod ${candidate.code ?? candidate.name} (${value})`;
    case "SALE":
      return `Przecena ${candidate.name} (${value})`;
    case "EMAIL":
      return `Rabat ${candidate.name} (${value})`;
    default:
      return candidate.name;
  }
}

/**
 * Komunikat dla osoby wpisującej kod. Forma neutralna płciowo.
 *
 * `not_found` celowo brzmi tak samo dla kodu nieistniejącego, kodu z innego
 * wydarzenia i kodu z piaskownicy — nie potwierdzamy, że taki kod istnieje.
 */
export function rejectionMessage(reason: DiscountRejectionReason): string {
  switch (reason) {
    case "not_found":
      return "Nie znamy takiego kodu.";
    case "inactive":
      return "Ten kod jest nieaktywny.";
    case "not_started":
      return "Ten kod jeszcze nie obowiązuje.";
    case "expired":
      return "Ten kod już wygasł.";
    case "exhausted":
      return "Pula tego kodu została wyczerpana.";
    case "outranked":
      return "Aktualna promocja jest korzystniejsza — zostawiamy niższą cenę.";
    default:
      return "Nie udało się zastosować kodu.";
  }
}
