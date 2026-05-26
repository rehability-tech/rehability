// Minimalny Service Worker spełniający kryteria PWA installability w Chrome.
// Chrome wymaga zarejestrowanego SW z handlerem 'fetch', żeby wyemitować
// 'beforeinstallprompt' i pokazać button instalacji.
//
// Strategia: network-only passthrough (zero cache).
// Jeśli kiedyś będziemy chcieli offline mode — tu jest miejsce na rozbudowę
// (Workbox, cache-first dla statycznych assetów itd.).

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Passthrough — nie chcemy interferować ze streamami Next.js (RSC, server actions).
  // Brak respondWith() = przeglądarka leci normalnie do sieci.
});
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
