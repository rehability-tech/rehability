"use client";

import { useEffect, useState } from "react";
import { isStandalone } from "@/lib/pwa/clientEnv";

/**
 * Pokazuje dzieci WYŁĄCZNIE, gdy aplikacja działa jako zainstalowane PWA
 * (standalone). Odwrotność [[HideInStandalone]].
 *
 * Podwójne zabezpieczenie, bez migotania:
 *  - CSS `[@media(display-mode:standalone)]` pokazuje od razu (Android/desktop/iOS 16.4+),
 *  - JS `isStandalone()` łapie też starsze iOS (navigator.standalone) po montażu.
 */
export default function ShowInStandalone({
  children,
}: {
  children: React.ReactNode;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    setShown(isStandalone());
  }, []);

  if (shown) return <>{children}</>;

  return (
    <div className="hidden [@media(display-mode:standalone)]:contents">
      {children}
    </div>
  );
}
