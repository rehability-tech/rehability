export type Status =
  | "PLANNED"
  | "IN_PROGRESS"
  | "SCHEDULED"
  | "PUBLISHED"
  | "SKIPPED";

export interface ScheduleEntry {
  id: string;
  scheduledDate: string;
  title: string;
  topic: string;
  category: string;
  keywords: string[];
  status: Status;
  postId?: string | null;
}

export const POLISH_MONTHS = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

export const POLISH_DAYS = ["Pon", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

export const STATUS_LABELS: Record<Status, string> = {
  PLANNED:     "Zaplanowany",
  IN_PROGRESS: "W trakcie",
  SCHEDULED:   "Zaplanowana publikacja",
  PUBLISHED:   "Opublikowany",
  SKIPPED:     "Pominięty",
};

export const STATUS_DOT: Record<Status, string> = {
  PLANNED:     "bg-brand-primary",
  IN_PROGRESS: "bg-blue-500",
  SCHEDULED:   "bg-amber-500",
  PUBLISHED:   "bg-green-500",
  SKIPPED:     "bg-gray-300",
};

export const STATUS_CARD: Record<Status, string> = {
  PLANNED:     "border-brand-primary/30 bg-brand-primary/5",
  IN_PROGRESS: "border-blue-200 bg-blue-50/50",
  SCHEDULED:   "border-amber-200 bg-amber-50/50",
  PUBLISHED:   "border-green-200 bg-green-50/50",
  SKIPPED:     "border-gray-200 bg-gray-50/50",
};

export function formatDisplayDate(isoString: string): string {
  const [y, m, d] = isoString.split("T")[0].split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getDayOfMonth(isoString: string): number {
  return parseInt(isoString.split("T")[0].split("-")[2], 10);
}

/** Rozbija ISO na części potrzebne do mobilnej agendy (dzień, skrót dnia tygodnia). */
export function getDateParts(isoString: string): {
  day: number;
  weekday: string;
} {
  const [y, m, d] = isoString.split("T")[0].split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    day: d,
    weekday: date.toLocaleDateString("pl-PL", { weekday: "short" }),
  };
}
