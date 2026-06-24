"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// Wspólny stan „Zapisane/Ulubione" kursy dla całej aplikacji:
//  • gość → localStorage (`kursy:polubione`),
//  • zalogowany → baza (CourseFavorite); po zalogowaniu localStorage jest
//    migrowany do bazy (sync) i czyszczony.
const FAV_KEY = "kursy:polubione";

type FavoritesCtx = {
  ready: boolean;
  isFavorite: (courseId: string) => boolean;
  toggle: (courseId: string) => void;
};

const Ctx = createContext<FavoritesCtx | null>(null);

function readLocal(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
function writeLocal(ids: string[]) {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(ids));
  } catch {
    /* localStorage niedostępny */
  }
}

export function FavoritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const loggedInRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = readLocal();
      try {
        const res = await fetch("/api/panel/ulubione", { cache: "no-store" });
        if (res.ok) {
          // Zalogowany. Gdy w localStorage coś jest → zmigruj do bazy i wyczyść.
          loggedInRef.current = true;
          let serverIds: string[] = [];
          if (local.length) {
            const sync = await fetch("/api/panel/ulubione/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ids: local }),
            });
            const data = (await sync.json().catch(() => ({}))) as {
              ids?: string[];
            };
            serverIds = Array.isArray(data.ids) ? data.ids : [];
            writeLocal([]);
          } else {
            const data = (await res.json().catch(() => ({}))) as {
              ids?: string[];
            };
            serverIds = Array.isArray(data.ids) ? data.ids : [];
          }
          if (!cancelled) setIds(new Set(serverIds));
        } else {
          // Gość (401) — działamy na localStorage.
          if (!cancelled) setIds(new Set(local));
        }
      } catch {
        if (!cancelled) setIds(new Set(local));
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isFavorite = useCallback((id: string) => ids.has(id), [ids]);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = new Set(prev);
      const willSave = !next.has(id);
      if (willSave) next.add(id);
      else next.delete(id);

      if (loggedInRef.current) {
        // Zalogowany → baza (optymistycznie; UI już zaktualizowane).
        fetch("/api/panel/ulubione", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId: id, saved: willSave }),
        }).catch(() => {});
      } else {
        writeLocal(Array.from(next));
      }
      return next;
    });
  }, []);

  return (
    <Ctx.Provider value={{ ready, isFavorite, toggle }}>
      {children}
    </Ctx.Provider>
  );
}

export function useFavorites(): FavoritesCtx {
  const ctx = useContext(Ctx);
  // Bezpieczny fallback poza providerem — nigdy nie wywala renderu.
  if (!ctx) return { ready: false, isFavorite: () => false, toggle: () => {} };
  return ctx;
}
