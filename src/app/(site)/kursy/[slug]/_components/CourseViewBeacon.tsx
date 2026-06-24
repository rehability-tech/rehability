"use client";

import { useEffect } from "react";

// Nabija wyświetlenie kursu po stronie klienta (strona kursu jest ISR/statyczna).
// Dedup właściwy (1x/dzień na visitora) robi serwer; tu ograniczamy spam w sesji.
export function CourseViewBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    if (!slug) return;
    const key = `cvseen:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage niedostępny — i tak nabijemy raz.
    }

    const ctrl = new AbortController();
    fetch("/api/kursy/view", {
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
