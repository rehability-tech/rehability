import type { PriceLine } from "@/lib/discounts/types";

/** Kształt danych zwracanych przez GET /api/admin/wydarzenia/[id]/rabaty. */

export type PromoKind = "CODE" | "SALE" | "EMAIL";

export type PromoStats = {
  uses: number;
  discountGrosze: number;
};

/** Pola wspólne dla wszystkich trzech typów promocji. */
type PromoBase = {
  id: string;
  note: string | null;
  valueType: string;
  percent: number | null;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
  usageLimit: number | null;
  usedCount: number;
  exhaustedNotifiedAt: string | null;
  isSandbox: boolean;
  createdAt: string;
  stats: PromoStats;
  /** Czy promocja przechodzi dziś bramkę cyklu życia (daty + limit). */
  eligible: boolean;
};

export type CodeRow = PromoBase & {
  code: string;
  amountGrosze: number | null;
  stackableWithSale: boolean;
};

export type SaleRow = PromoBase & {
  name: string;
  targetPriceGrosze: number | null;
};

export type EmailDiscountRow = PromoBase & {
  name: string;
  amountGrosze: number | null;
  members: { id: string; email: string }[];
  memberCount: number;
};

export type DiscountPanelPayload = {
  trip: {
    id: string;
    title: string;
    priceGrosze: number;
    depositGrosze: number;
    sandboxEnabled: boolean;
    sandboxSince: string | null;
    sandboxPriceGrosze: number | null;
    sandboxDepositGrosze: number | null;
  };
  codes: CodeRow[];
  sales: SaleRow[];
  emailDiscounts: EmailDiscountRow[];
  preview: {
    baseAmount: number;
    finalAmount: number;
    totalDiscount: number;
    lines: PriceLine[];
    depositGrosze: number;
    competingSales: number;
    winningSaleId: string | null;
  };
  summary: {
    activePromotions: number;
    totalUses: number;
    totalDiscountGrosze: number;
    averageDiscountGrosze: number;
    sandboxDrafts: number;
  };
  /** Promocje skasowane z bazy, ale obecne w historii zamówień. */
  orphans: ({ id: string; kind: PromoKind; name: string } & PromoStats)[];
};

/** Ciało wysyłane przy tworzeniu/edycji promocji. */
export type PromoFormValues = {
  code: string;
  name: string;
  note: string;
  valueType: string;
  percent: string;
  /** Złotówki — na grosze przeliczamy dopiero przy wysyłce. */
  amountZl: string;
  targetPriceZl: string;
  stackableWithSale: boolean;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  usageLimit: string;
};

export const EMPTY_FORM: PromoFormValues = {
  code: "",
  name: "",
  note: "",
  valueType: "percent",
  percent: "10",
  amountZl: "",
  targetPriceZl: "",
  stackableWithSale: false,
  isActive: true,
  validFrom: "",
  validUntil: "",
  usageLimit: "",
};
