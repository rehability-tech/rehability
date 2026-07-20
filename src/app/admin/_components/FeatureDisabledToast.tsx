"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/* ===========================================================================
 *  Toast po odbiciu z wyłączonej sekcji panelu.
 *
 *  Proxy (src/proxy.ts) przekierowuje zablokowane trasy na /admin z parametrem
 *  ?niedostepne=<sekcja>. Ten komponent zamienia go na toast i NATYCHMIAST
 *  czyści URL, żeby komunikat nie wracał przy odświeżeniu strony.
 *
 *  Nowa sekcja = jeden wpis w MESSAGES + redirect z parametrem w proxy.
 * ========================================================================= */

const MESSAGES: Record<string, { title: string; description: string }> = {
  crm: {
    title: "Ta funkcja nie jest jeszcze dostępna",
    description: "Baza klientów (CRM) jest w przygotowaniu — wróć tu wkrótce.",
  },
};

export default function FeatureDisabledToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  // React w trybie Strict montuje efekty dwa razy — bez tej straży toast
  // pokazałby się podwójnie.
  const shownRef = useRef(false);

  const section = searchParams.get("niedostepne");

  useEffect(() => {
    if (!section || shownRef.current) return;
    const message = MESSAGES[section];
    if (!message) return;

    shownRef.current = true;
    toast.info(message.title, { description: message.description });

    // Zdejmij parametr, zostawiając resztę query stringa nietkniętą.
    const next = new URLSearchParams(searchParams.toString());
    next.delete("niedostepne");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [section, searchParams, router, pathname]);

  return null;
}
