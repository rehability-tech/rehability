"use client";

import { useEffect } from "react";

// Nabija wyświetlenie wpisu po stronie klienta (strona wpisu jest ISR/statyczna).
// Dedup właściwy (1x/dzień na visitora) robi serwer; tu tylko ograniczamy spam
// przy nawigacji w obrębie sesji.
export function BlogViewBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    if (!slug) return;
    const key = `bvseen:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage niedostępny — i tak nabijemy raz.
    }

    const ctrl = new AbortController();
    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
      signal: ctrl.signal,
    }).catch(() => {});

    return () => ctrl.abort();
  }, [slug]);

  return null;
}
