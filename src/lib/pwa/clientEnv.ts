// Detekcja środowiska po stronie klienta (PWA / mobile / iOS).
// Wszystkie funkcje są bezpieczne dla SSR (zwracają false poza przeglądarką).

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Czy aplikacja działa jako zainstalowane PWA (standalone). */
export function isStandalone(): boolean {
  if (!isBrowser()) return false;
  const mql = window.matchMedia?.("(display-mode: standalone)").matches;
  // iOS Safari wystawia własną flagę navigator.standalone
  const iosStandalone = (window.navigator as { standalone?: boolean })
    .standalone;
  return Boolean(mql || iosStandalone);
}

/** Czy to iPhone/iPad/iPod (także iPadOS udający desktop). */
export function isIOS(): boolean {
  if (!isBrowser()) return false;
  const ua = window.navigator.userAgent;
  const iOSDevice = /iphone|ipad|ipod/i.test(ua);
  // iPadOS 13+ podaje się jako Mac — wykrywamy po dotyku
  const iPadOS =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOSDevice || iPadOS;
}

/** Czy urządzenie mobilne (dotyk + wąski ekran). */
export function isMobileDevice(): boolean {
  if (!isBrowser()) return false;
  const coarse = window.matchMedia?.("(pointer: coarse)").matches;
  const narrow = window.matchMedia?.("(max-width: 768px)").matches;
  return Boolean(coarse && narrow) || isIOS();
}
