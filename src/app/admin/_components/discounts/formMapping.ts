import { discountValueLabel } from "@/lib/discounts/format";
import type { DiscountCandidate } from "@/lib/discounts/types";

import {
  EMPTY_FORM,
  type CodeRow,
  type EmailDiscountRow,
  type PromoFormValues,
  type PromoKind,
  type SaleRow,
} from "./types";

/**
 * Tłumaczenie między wierszem z API a formularzem i z powrotem.
 *
 * Formularz operuje na ZŁOTÓWKACH (tak myśli admin), a baza na GROSZACH —
 * konwersja jest tutaj, w jednym miejscu, żeby nie rozjechała się między
 * tworzeniem a edycją.
 */

type AnyRow = CodeRow | SaleRow | EmailDiscountRow;

/** Data z bazy (ISO) → wartość dla <input type="date">. */
function toDateInput(value: string | null): string {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export function rowToForm(row: AnyRow): PromoFormValues {
  return {
    ...EMPTY_FORM,
    code: "code" in row ? row.code : "",
    name: "name" in row ? row.name : "",
    note: row.note ?? "",
    valueType: row.valueType,
    percent: row.percent != null ? String(row.percent) : "",
    amountZl:
      "amountGrosze" in row && row.amountGrosze != null
        ? String(row.amountGrosze / 100)
        : "",
    targetPriceZl:
      "targetPriceGrosze" in row && row.targetPriceGrosze != null
        ? String(row.targetPriceGrosze / 100)
        : "",
    stackableWithSale:
      "stackableWithSale" in row ? row.stackableWithSale : false,
    isActive: row.isActive,
    validFrom: toDateInput(row.validFrom),
    validUntil: toDateInput(row.validUntil),
    usageLimit: row.usageLimit != null ? String(row.usageLimit) : "",
  };
}

/** Formularz → ciało żądania POST/PATCH. */
export function formToPayload(
  kind: PromoKind,
  form: PromoFormValues,
): Record<string, unknown> {
  const lifecycle = {
    isActive: form.isActive,
    validFrom: form.validFrom || null,
    validUntil: form.validUntil || null,
    usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
    note: form.note.trim() || null,
    valueType: form.valueType,
    // Serwer i tak zeruje nieużywane pole przy zmianie typu — wysyłamy
    // tylko to, które ma sens dla wybranego wariantu.
    percent: form.valueType === "percent" ? Number(form.percent) : null,
  };

  if (kind === "SALE") {
    return {
      ...lifecycle,
      name: form.name.trim(),
      targetPriceGrosze:
        form.valueType === "fixed_price"
          ? Math.round(Number(form.targetPriceZl) * 100)
          : null,
    };
  }

  const amountGrosze =
    form.valueType === "amount" ? Math.round(Number(form.amountZl) * 100) : null;

  if (kind === "CODE") {
    return {
      ...lifecycle,
      code: form.code.trim(),
      amountGrosze,
      stackableWithSale: form.stackableWithSale,
    };
  }

  return { ...lifecycle, name: form.name.trim(), amountGrosze };
}

/** Etykieta wartości na karcie — korzysta z tej samej funkcji co koszyk. */
export function rowValueLabel(kind: PromoKind, row: AnyRow): string {
  const candidate: DiscountCandidate = {
    kind,
    id: row.id,
    name: "name" in row ? row.name : "code" in row ? row.code : "",
    valueType: row.valueType as DiscountCandidate["valueType"],
    percent: row.percent,
    amountGrosze: "amountGrosze" in row ? row.amountGrosze : null,
    targetPriceGrosze:
      "targetPriceGrosze" in row ? row.targetPriceGrosze : null,
  };

  return discountValueLabel(candidate);
}
