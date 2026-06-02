// Ręczne wyzwalanie promptów (z menu profilu) — przez zdarzenia window,
// żeby zamontowane gdzie indziej komponenty promptów mogły zareagować
// z pominięciem kadencji/limitów.

export const PWA_INSTALL_EVENT = "pwa:install-request";
export const NOTIF_PROMPT_EVENT = "pwa:notif-request";

export function triggerInstallPrompt(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PWA_INSTALL_EVENT));
  }
}

export function triggerNotificationPrompt(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIF_PROMPT_EVENT));
  }
}
