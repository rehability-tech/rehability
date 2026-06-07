"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Polluje deep-linki nieprzeczytanych powiadomień czatu, by paski nawigacji
 * mogły podświetlić zakładkę "Czat". Zwraca `links` (zbiór deep-linków) oraz
 * `refresh` do natychmiastowego odświeżenia (np. po zmianie ścieżki).
 */
export function useChatUnreadLinks(pollMs = 30_000) {
  const [links, setLinks] = useState<Set<string>>(() => new Set());

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/chat-unread", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { links: string[] };
      setLinks(new Set(data.links));
    } catch {
      // milcz — odświeży się przy następnym pollingu
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, pollMs);
    return () => clearInterval(t);
  }, [refresh, pollMs]);

  return { links, refresh };
}
