/**
 * Logika segmentów — czyste helpery (bez storage).
 */
import type { SegmentFilter } from "./types";

/** Normalizuje filtr: domyślny status SUBSCRIBED, puste tablice → undefined. */
export function normalizeSegment(filter: SegmentFilter): SegmentFilter {
  return {
    sources: filter.sources?.length ? filter.sources : undefined,
    tags: filter.tags?.length ? filter.tags : undefined,
    status: filter.status ?? "SUBSCRIBED",
  };
}

/** Czytelny opis segmentu do UI / logów. */
export function describeSegment(filter: SegmentFilter): string {
  const parts: string[] = [];
  if (filter.sources?.length) parts.push(`źródła: ${filter.sources.join(", ")}`);
  if (filter.tags?.length) parts.push(`tagi: ${filter.tags.join(", ")}`);
  parts.push(`status: ${filter.status ?? "SUBSCRIBED"}`);
  return parts.join(" · ");
}
