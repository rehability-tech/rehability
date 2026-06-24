"use client";

import { useCallback } from "react";
import useSWR from "swr";

const KEY = "/api/notifications/chat-unread";
const EMPTY: Set<string> = new Set();

async function fetcher(url: string): Promise<Set<string>> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("chat-unread fetch failed");
  const data = (await res.json()) as { links: string[] };
  return new Set(data.links);
}

/**
 * Deep-linki nieprzeczytanych powiadomień czatu, by paski nawigacji mogły
 * podświetlić zakładkę "Czat". Oparte o SWR ze WSPÓLNYM kluczem — wszystkie
 * zamontowane paski (sidebar + mobile nav, desktop i mobile naraz) współdzielą
 * JEDNO zapytanie i jeden timer pollingu zamiast każdy własny. SWR domyślnie
 * nie pollinguje przy nieaktywnej karcie i odświeża się po powrocie na zakładkę.
 *
 * Zwraca `links` (zbiór deep-linków) oraz `refresh` do natychmiastowego
 * odświeżenia (np. po zmianie ścieżki).
 */
export function useChatUnreadLinks(pollMs = 30_000) {
  const { data, mutate } = useSWR<Set<string>>(KEY, fetcher, {
    refreshInterval: pollMs,
    revalidateOnFocus: true,
    // Zwija burst natychmiastowych fetchy z wielu zamontowanych instancji w jeden.
    dedupingInterval: 10_000,
    keepPreviousData: true,
  });

  const refresh = useCallback(() => mutate(), [mutate]);

  return { links: data ?? EMPTY, refresh };
}
