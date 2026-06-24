// Service Worker dla PWA + push OneSignal (jeden plik, współdzielony — patrz
// OneSignalProvider: serviceWorkerPath: "sw.js").
//
// Strategia: brak własnej obsługi 'fetch'. Pusty handler 'fetch' został usunięty —
// współczesny Chrome (≥89) NIE wymaga go już do instalowalności PWA (wystarczy
// zarejestrowany SW + manifest), a pusty no-op tylko dokładał narzut i ostrzeżenie
// "no-op fetch handler" przy każdej nawigacji.
//
// WAŻNE: powiadomienia push działają niezależnie od tego pliku — wszystkie handlery
// (push, notificationclick, message, pushsubscriptionchange) dostarcza SDK OneSignal
// ładowane przez importScripts poniżej. Dlatego usunięcie 'fetch' nie rusza OneSignal.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Ładowanie SDK OneSignal owinięte w try/catch: gdy zostanie zablokowane
// (ad-blocker / tarcza prywatności → ERR_BLOCKED_BY_CLIENT) albo CDN nie
// odpowie, NIE może to wywalić ewaluacji całego Service Workera. Inaczej padała
// rejestracja SW i cała PWA (instalowalność) — choć push to funkcja opcjonalna.
// Tracąc OneSignal tracimy tylko powiadomienia push u tego użytkownika.
try {
  importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
} catch (err) {
  console.warn("[sw] Nie udało się załadować SDK OneSignal (push wyłączony):", err);
}
