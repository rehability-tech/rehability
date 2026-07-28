// Słowniki i helpery współdzielone przez komponenty profilu uczestnika

export const DIET_LABELS: Record<string, string> = {
  OMNIVORE: "Wszystkożerna",
  VEGETARIAN: "Wegetariańska",
  VEGAN: "Wegańska",
  OTHER: "Inna",
};

export const STATUS_LABELS: Record<
  string,
  { label: string; className: string }
> = {
  FULLY_PAID: {
    label: "Opłacone w całości",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  DEPOSIT_PAID: {
    label: "Zadatek opłacony",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  PENDING_INVITATION: {
    label: "Zaproszenie (24h)",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  PENDING: {
    label: "Oczekuje",
    className: "bg-slate-50 text-slate-600 border-slate-200",
  },
  EXPIRED: {
    label: "Wygasłe",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
  CANCELLED: {
    label: "Anulowane",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PAID: "Opłacone",
  PENDING: "Oczekuje na płatność",
  CANCELLED: "Anulowane",
};

export const formatZl = (grosze: number) =>
  ((grosze || 0) / 100).toLocaleString("pl-PL", { minimumFractionDigits: 2 });

export const formatTime = (iso?: string | null) => {
  if (!iso) return null;
  return new Date(iso).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
