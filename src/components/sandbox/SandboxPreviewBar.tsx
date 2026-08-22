"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Flask, EyeSlash, CircleNotch } from "@phosphor-icons/react/dist/ssr";
import {
  SANDBOX_COOKIE,
  SANDBOX_COOKIE_ON,
  SANDBOX_PREVIEW_EVENT,
} from "@/lib/sandbox/constants";

// Pasek widoczny na KAŻDEJ stronie, gdy podgląd piaskownicy jest włączony.
// Bez niego łatwo o najgorszy scenariusz: ktoś ogląda katalog z treściami
// testowymi i uznaje, że dokładnie tak samo widzą go klienci.
//
// Stan czytamy z ciasteczka po stronie klienta (jest jawne — patrz
// SANDBOX_COOKIE). Gdyby robił to serwer w głównym layoucie, każda strona
// serwisu stałaby się dynamiczna i straciłaby ISR.

function readPreviewCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split("; ")
    .some((c) => c === `${SANDBOX_COOKIE}=${SANDBOX_COOKIE_ON}`);
}

export default function SandboxPreviewBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const sync = useCallback(() => setVisible(readPreviewCookie()), []);

  // Odczyt przy montowaniu i po każdej nawigacji (ciasteczko mógł zmienić
  // serwer w odpowiedzi na inny request).
  useEffect(() => {
    sync();
  }, [sync, pathname]);

  // Przełącznik w /admin/sandbox emituje to zdarzenie — pasek reaguje od razu,
  // bez czekania na nawigację.
  useEffect(() => {
    window.addEventListener(SANDBOX_PREVIEW_EVENT, sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener(SANDBOX_PREVIEW_EVENT, sync);
      window.removeEventListener("focus", sync);
    };
  }, [sync]);

  async function disablePreview() {
    setLeaving(true);
    try {
      const res = await fetch("/api/sandbox/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: false }),
      });
      // 403 = ktoś ustawił ciasteczko ręcznie, bez uprawnień. Chowamy pasek
      // lokalnie, żeby nie zostawiać go w martwym stanie.
      if (!res.ok) {
        setVisible(false);
        return;
      }
      setVisible(false);
      window.dispatchEvent(new Event(SANDBOX_PREVIEW_EVENT));
      router.refresh();
    } finally {
      setLeaving(false);
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          // Ponad topbarem admina (z-[100]), żeby pasek nigdy się pod nim nie chował.
          className="fixed top-0 inset-x-0 z-[200] flex items-center justify-center gap-3 px-4 h-9 bg-brand-yellow text-brand-secondary shadow-[0_4px_20px_-6px_rgba(3,63,99,0.35)]"
          role="status"
        >
          <span className="inline-flex items-center gap-1.5 font-montserrat text-[12px] font-bold tracking-wide">
            <Flask size={14} weight="fill" />
            <span className="hidden xs:inline sm:inline">
              Tryb sandbox — widzisz treści testowe
            </span>
            <span className="sm:hidden">Tryb sandbox</span>
          </span>

          <Link
            href="/admin/sandbox"
            className="hidden sm:inline font-montserrat text-[11.5px] font-semibold underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity"
          >
            Zarządzaj
          </Link>

          <button
            type="button"
            onClick={disablePreview}
            disabled={leaving}
            className="inline-flex items-center gap-1 px-2.5 h-6 rounded-full bg-brand-secondary/10 hover:bg-brand-secondary/20 font-montserrat text-[11.5px] font-bold transition-colors disabled:opacity-60 cursor-pointer"
          >
            {leaving ? (
              <CircleNotch size={12} weight="bold" className="animate-spin" />
            ) : (
              <EyeSlash size={12} weight="bold" />
            )}
            Wyłącz
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
