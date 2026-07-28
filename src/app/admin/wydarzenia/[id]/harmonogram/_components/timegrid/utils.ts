import type { SerializedEvent } from "./types";
import { HOUR_HEIGHT } from "./constants";

export const DAY_NAMES = [
  "Niedz.",
  "Pon.",
  "Wt.",
  "Śr.",
  "Czw.",
  "Pt.",
  "Sob.",
];

export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function buildDayList(startIso: string, endIso: string): Date[] {
  const start = new Date(startIso);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endIso);
  // Jeśli endDate nie jest podane, domyślnie pokazujemy chociaż 1 dzień (startowy)
  if (!endIso) {
    return [start];
  }

  end.setHours(0, 0, 0, 0);

  const days: Date[] = [];
  let current = new Date(start);

  // Zabezpieczenie: jeśli ktoś przez pomyłkę dał end < start, zwracamy chociaż start
  if (end < start) {
    return [start];
  }

  // Pętla dodaje dni, dopóki current nie przekroczy daty końcowej
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface EventLayout {
  col: number; // indeks kolumny (0-based)
  total: number; // ile kolumn w klastrze nakładających się eventów
}

// Rozkłada nakładające się eventy na kolumny obok siebie (algorytm tipu Google Calendar).
// Każdy event dostaje (col, total): col/total = pozycja, 1/total = szerokość.
export function layoutOverlappingEvents(
  events: SerializedEvent[],
): Map<string, EventLayout> {
  const items = events.map((e) => {
    const start = new Date(e.startTime).getTime();
    const endRaw = e.endTime ? new Date(e.endTime).getTime() : start + 3600_000;
    return {
      id: e.id,
      start,
      end: endRaw > start ? endRaw : start + 3600_000,
    };
  });
  // Sort: start ASC, longer first dla stabilności.
  items.sort((a, b) => a.start - b.start || b.end - a.end);

  // Greedy packing do kolumn — w której jest miejsce (poprzedni event w kolumnie skończył się przed nowym).
  const cols: { id: string; start: number; end: number }[][] = [];
  const colOf = new Map<string, number>();
  for (const it of items) {
    let placed = false;
    for (let i = 0; i < cols.length; i++) {
      const last = cols[i][cols[i].length - 1];
      if (last.end <= it.start) {
        cols[i].push(it);
        colOf.set(it.id, i);
        placed = true;
        break;
      }
    }
    if (!placed) {
      cols.push([it]);
      colOf.set(it.id, cols.length - 1);
    }
  }

  // Dla każdego eventu liczymy ile kolumn jest "aktywnych" w jego przedziale czasu.
  const layout = new Map<string, EventLayout>();
  for (const it of items) {
    let usedCols = 0;
    for (let i = 0; i < cols.length; i++) {
      const overlapsThis = cols[i].some(
        (o) => o.start < it.end && o.end > it.start,
      );
      if (overlapsThis) usedCols = i + 1;
    }
    layout.set(it.id, {
      col: colOf.get(it.id) ?? 0,
      total: Math.max(1, usedCols),
    });
  }
  return layout;
}

export function getEventPosition(ev: SerializedEvent) {
  const start = new Date(ev.startTime);
  const startMinutes = start.getHours() * 60 + start.getMinutes();

  let endMinutes = startMinutes + 60; // Domyślnie 1h
  if (ev.endTime) {
    const end = new Date(ev.endTime);
    endMinutes = end.getHours() * 60 + end.getMinutes();
    if (endMinutes <= startMinutes) endMinutes = 1440; // Obsługa przejścia przez północ
  }

  const durationMinutes = endMinutes - startMinutes;
  const top = (startMinutes / 60) * HOUR_HEIGHT;
  const height = (durationMinutes / 60) * HOUR_HEIGHT;

  return { top, height: Math.max(height, 28) }; // Minimalna wysokość bloku
}
