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

importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
