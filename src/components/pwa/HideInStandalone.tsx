"use client";

import { useEffect, useState } from "react";
import { isStandalone } from "@/lib/pwa/clientEnv";

/**
 * Ukrywa dzieci, gdy aplikacja działa jako zainstalowane PWA (standalone).
 *
 * Podwójne zabezpieczenie, bez migotania:
 *  - CSS `[@media(display-mode:standalone)]` chowa od razu (Android/desktop/iOS 16.4+),
 *  - JS `isStandalone()` łapie też starsze iOS (navigator.standalone) po montażu.
 */
export default function HideInStandalone({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(isStandalone());
  }, []);

  if (hidden) return null;

  return (
    <div className="contents [@media(display-mode:standalone)]:hidden">
      {children}
    </div>
  );
}
