import {
  MIN_CHARGE_GROSZE,
  type DiscountCandidate,
  type PriceLine,
  type PriceResult,
} from "./types";
import { discountLabel } from "./format";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  SILNIK WYCENY — jedyne miejsce w projekcie z arytmetyką rabatów
 * ─────────────────────────────────────────────────────────────────────────
 *
 * REGUŁY NAKŁADANIA
 *
 *  1. Obniżki AUTOMATYCZNE nie sumują się. Przecena i rabat mailowy (a także
 *     dwie przeceny naraz) KONKURUJĄ — wygrywa najniższa cena końcowa.
 *     Remis rozstrzyga kolejność listy `automatic`, którą warstwa serwerowa
 *     podaje deterministycznie: najpierw przeceny, potem rabaty mailowe,
 *     każde po createdAt rosnąco.
 *
 *  2. Kod ze `stackableWithSale` nakłada się SEKWENCYJNIE na wynik pkt 1 —
 *     liczy się od kwoty już obniżonej.
 *
 *  3. Kod bez zgody na łączenie KONKURUJE z automatem; wygrywa korzystniejszy.
 *     Warunek jest ostry (`soloFinal < automaticFinal`), więc przy REMISIE
 *     kod przegrywa. Przy przegranej wynik dostaje `couponOutranked = true`,
 *     żeby koszyk mógł to wytłumaczyć zamiast po cichu zignorować kod.
 *
 *  4. Rabat nigdy nie zbija ceny poniżej progu Stripe. Przy przestrzeleniu
 *     przycinamy pozycje WSTECZ, tak żeby suma nadal się zgadzała.
 */
export function calculatePrice(input: {
  baseAmount: number;
  /** Kod już przewalidowany przez `evaluateDiscount` (albo null). */
  code?: DiscountCandidate | null;
  /** Przeceny + rabaty mailowe. Kolejność = deterministyczny tie-break. */
  automatic?: DiscountCandidate[];
}): PriceResult {
  const base = Math.max(0, Math.round(input.baseAmount));
  const code = input.code ?? null;
  const automatic = input.automatic ?? [];

  // Wydarzenie tańsze niż minimum Stripe to błąd konfiguracji, nie okazja.
  // Nie rabatujemy — API i tak odrzuci taką wycenę, a my nie chcemy tu
  // produkować ujemnych kwot.
  if (base < MIN_CHARGE_GROSZE) {
    return {
      baseAmount: base,
      totalDiscount: 0,
      finalAmount: base,
      lines: [],
      couponOutranked: false,
      clamped: true,
      applied: { code: null, sale: null, email: null },
    };
  }

  // ── 1. AUTOMAT: konkurencja, nie suma ─────────────────────────────────
  let autoWinner: DiscountCandidate | null = null;
  let autoAmount = 0;
  for (const candidate of automatic) {
    const amount = discountAmountFor(base, candidate);
    // Ostre „>" ⇒ przy remisie zostaje pierwszy z listy.
    if (amount > autoAmount) {
      autoAmount = amount;
      autoWinner = candidate;
    }
  }
  const autoFinal = base - autoAmount;

  // ── 2. KOD ────────────────────────────────────────────────────────────
  let lines: PriceLine[] = [];
  let couponOutranked = false;
  let appliedCode: DiscountCandidate | null = null;
  let appliedAuto: DiscountCandidate | null = null;

  if (!code) {
    if (autoWinner) {
      lines = [toLine(autoWinner, autoAmount)];
      appliedAuto = autoWinner;
    }
  } else if (code.stackableWithSale) {
    // Kod działa NA WYNIKU automatu — procent liczy się od kwoty już obniżonej.
    if (autoWinner) {
      lines.push(toLine(autoWinner, autoAmount));
      appliedAuto = autoWinner;
    }
    lines.push(toLine(code, discountAmountFor(autoFinal, code)));
    appliedCode = code;
  } else {
    const codeSolo = discountAmountFor(base, code);
    if (base - codeSolo < autoFinal) {
      lines = [toLine(code, codeSolo)];
      appliedCode = code;
    } else {
      if (autoWinner) {
        lines = [toLine(autoWinner, autoAmount)];
        appliedAuto = autoWinner;
      }
      couponOutranked = true;
    }
  }

  // ── 3. CLAMP do progu Stripe ──────────────────────────────────────────
  // Rozdzielamy budżet po kolei (najpierw automat, potem kod), więc suma
  // pozycji zawsze równa się realnie udzielonemu rabatowi.
  let clamped = false;
  const maxDiscount = base - MIN_CHARGE_GROSZE;
  if (lines.reduce(sumAmount, 0) > maxDiscount) {
    clamped = true;
    let budget = maxDiscount;
    for (const line of lines) {
      const give = Math.min(line.amount, budget);
      line.amount = give;
      budget -= give;
    }
  }

  // ── 4. NIEZMIENNIKI przez konstrukcję ─────────────────────────────────
  lines = lines.filter((line) => line.amount > 0);
  const totalDiscount = lines.reduce(sumAmount, 0);

  // Pozycja mogła zostać przycięta do zera — wtedy ta promocja realnie nie
  // weszła do wyceny i nie może trafić do snapshotu ani zjeść limitu użyć.
  const survived = (candidate: DiscountCandidate | null) =>
    candidate && lines.some((line) => line.id === candidate.id)
      ? candidate
      : null;

  return {
    baseAmount: base,
    totalDiscount,
    finalAmount: base - totalDiscount,
    lines,
    couponOutranked,
    clamped,
    applied: {
      code: survived(appliedCode),
      sale: appliedAuto?.kind === "SALE" ? survived(appliedAuto) : null,
      email: appliedAuto?.kind === "EMAIL" ? survived(appliedAuto) : null,
    },
  };
}

/**
 * Ile groszy odejmuje dana promocja od podanej kwoty. Nigdy poniżej zera
 * i nigdy więcej niż cała kwota — clamp do progu Stripe robimy dopiero
 * na sumie, bo tylko tam znamy pełny obraz.
 */
function discountAmountFor(base: number, candidate: DiscountCandidate): number {
  switch (candidate.valueType) {
    case "percent": {
      const percent = candidate.percent ?? 0;
      return clampToBase(Math.round((base * percent) / 100), base);
    }
    case "amount":
      return clampToBase(candidate.amountGrosze ?? 0, base);
    case "fixed_price": {
      // Wartością jest CENA DOCELOWA, nie kwota rabatu. Cel wyższy niż
      // aktualna kwota = brak obniżki (nie podwyżka).
      const target = candidate.targetPriceGrosze ?? 0;
      return clampToBase(base - Math.max(0, target), base);
    }
    default:
      return 0;
  }
}

function clampToBase(amount: number, base: number): number {
  return Math.min(Math.max(0, Math.round(amount)), base);
}

function toLine(candidate: DiscountCandidate, amount: number): PriceLine {
  return {
    kind: candidate.kind,
    id: candidate.id,
    label: discountLabel(candidate),
    amount,
  };
}

function sumAmount(total: number, line: PriceLine): number {
  return total + line.amount;
}
