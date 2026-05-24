"use client";

import { useEffect } from "react";

/**
 * Rejestruje service worker /sw.js — wymagane przez Chrome żeby
 * strona kwalifikowała się do installability (beforeinstallprompt).
 *
 * Wpięte w root layout. Bez tego nasz SubscriptionStatusButtons nie pokaże
 * buttona instalacji aplikacji.
 */
export default function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () =>
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => console.error("[PWA] SW register failed:", err));

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
