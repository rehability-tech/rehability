"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Renderuje dzieci do <body>, poza drzewem layoutu (sidebar/topbar).
 * Dzięki temu modale/overlaye nie są uwięzione w lokalnym kontekście
 * stackingu (np. przez backdrop-blur / transform) i wyświetlają się
 * NAD bocznym menu na desktopie.
 *
 * Kontekst <AnimatePresence> z rodzica propaguje się przez portal,
 * więc animacje wejścia/wyjścia framer-motion działają bez zmian.
 */
export default function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
